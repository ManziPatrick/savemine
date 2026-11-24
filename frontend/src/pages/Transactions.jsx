import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useSearchParams } from 'react-router-dom';
import { PlusIcon, PencilIcon, TrashIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import { savingsAPI, transactionsAPI } from '../services/api';
import ExportButtons from '../components/ExportButtons';
import { buildTransactionSections } from '../utils/exportSections';
import TransactionForm from '../components/forms/TransactionForm';
import PaySplit, { splitsPayload } from '../components/forms/PaySplit';
import SlideOver from '../components/SlideOver';
import { useConfirm } from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { syncBooks } from '../utils/syncBooks';
import FilterMenu from '../components/FilterMenu';
import { isSalaryRecord, salaryWaiting } from '../utils/salaryWaiting';

function isSalaryRow(row) {
  return row?.type === 'income' && isSalaryRecord(row);
}

function payIsDue(row) {
  return isSalaryRow(row) && salaryWaiting(row);
}

function splitText(row) {
  if (!row.splits?.length) return '';
  return row.splits.map((part) => `${Number(part.amount).toLocaleString()} ${part.name || 'Wallet'}`).join(' · ');
}

function SalaryReceive({ plan, onClose, onDone }) {
  const { data } = useQuery(['savings', 'salary-split'], () => savingsAPI.getSavings({ limit: 100 }));
  const jars = data?.data?.data || [];
  const [splits, setSplits] = useState(plan.splits?.length
    ? plan.splits.map((row, index) => ({
      key: index,
      place: row.place === 'savings' && row.savingsId ? row.savingsId : 'wallet',
      amount: row.amount,
    }))
    : [{
      key: 1,
      place: plan.depositTo === 'savings' && plan.savingsId ? plan.savingsId : 'wallet',
      amount: plan.amount,
    }]);
  const [saving, setSaving] = useState(false);

  const receive = async () => {
    const rows = splitsPayload(splits);
    const sum = rows.reduce((total, row) => total + row.amount, 0);
    if (Math.round(sum) !== Math.round(Number(plan.amount))) {
      toast.error(`The split is ${sum.toLocaleString()}. It needs to equal the pay.`);
      return;
    }
    setSaving(true);
    try {
      await transactionsAPI.receiveIncome(plan._id, rows);
      toast.success('Pay received. The wallet and savings are updated.');
      onDone();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not mark this pay received');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SlideOver title="Salary received" subtitle="Split the pay, then mark it received" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-ink/70">
          {Number(plan.amount).toLocaleString()} FRW. Each place updates by the amount you put on that line.
        </p>
        <PaySplit total={plan.amount} jars={jars} splits={splits} onChange={setSplits} />
        <button type="button" className="btn btn-primary w-full" onClick={receive} disabled={saving}>
          {saving ? 'Updating…' : 'Mark received'}
        </button>
      </div>
    </SlideOver>
  );
}

function Transactions() {
  const [showForm, setShowForm] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [salaryPlan, setSalaryPlan] = useState(null);
  const queryClient = useQueryClient();
  const { ask, dialog } = useConfirm();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('new') !== '1') return;
    setSelectedTransaction(null);
    setShowForm(true);
    const next = new URLSearchParams(searchParams);
    next.delete('new');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const { data: transactions, isLoading, error } = useQuery(
    ['transactions', filter, typeFilter, categoryFilter],
    () => transactionsAPI.getTransactions({ 
      status: filter === 'all' ? undefined : filter,
      type: typeFilter === 'all' ? undefined : typeFilter,
      category: categoryFilter || undefined,
      limit: 50
    }),
    { keepPreviousData: true }
  );

  const deleteMutation = useMutation(transactionsAPI.deleteTransaction, {
    onSuccess: () => {
      syncBooks(queryClient, 'transactions');
      toast.success('Transaction deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete transaction');
    }
  });

  const handleEdit = (transaction) => {
    setSelectedTransaction(transaction);
    setShowForm(true);
  };

  const handleDelete = async (transaction) => {
    ask({
      title: `Delete this ${transaction.type}?`,
      message: 'This transaction will be removed.',
      onConfirm: () => deleteMutation.mutate(transaction._id),
    });
  };

  const handleFormSuccess = () => {
    syncBooks(queryClient, 'transactions');
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedTransaction(null);
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading transactions: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {dialog}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Transactions</h1>
          <p className="mt-1 text-sm text-gray-500">
            Salary stays as income until you mark it received. The split then updates the wallet and each savings jar.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 self-start sm:self-auto">
          <ExportButtons
            filename="transactions"
            title="Transactions Report"
            sections={buildTransactionSections(transactions?.data?.data || [])}
          />
          <button 
            onClick={() => setShowForm(true)}
            className="btn btn-primary"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Transaction
          </button>
        </div>
      </div>

      <FilterMenu
        groups={[
          {
            label: 'Status',
            value: filter,
            onChange: setFilter,
            options: ['all', 'completed', 'pending', 'cancelled'].map((status) => ({
              value: status,
              label: status,
            })),
          },
          {
            label: 'Type',
            value: typeFilter,
            onChange: setTypeFilter,
            options: ['all', 'income', 'expense'].map((type) => ({
              value: type,
              label: type,
            })),
          },
        ]}
      >
        <input
          type="text"
          placeholder="Filter by category..."
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="input"
        />
      </FilterMenu>

      {/* Transactions List */}
      <div className="card">
        <div className="card-body">
          {transactions?.data?.data?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Type</th>
                    <th className="table-header-cell">Amount</th>
                    <th className="table-header-cell">Category</th>
                    <th className="table-header-cell">Date</th>
                    <th className="table-header-cell">Contact</th>
                    <th className="table-header-cell">Actions</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {transactions.data.data.map((transaction) => (
                    <tr key={transaction._id} className="table-row">
                      <td className="table-cell">
                        <div className="flex items-center">
                          <div className={`p-2 rounded-md mr-3 ${
                            transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            {transaction.type === 'income' ? (
                              <ArrowTrendingUpIcon className="h-4 w-4 text-green-600" />
                            ) : (
                              <ArrowTrendingDownIcon className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                          <span className={`badge ${
                            transaction.type === 'income' ? 'badge-success' : 'badge-danger'
                          }`}>
                            {transaction.type}
                          </span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className={`font-medium ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}
                          {transaction.currency} {transaction.amount.toLocaleString()}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div>
                          <div className="font-medium text-gray-900">
                            {transaction.category}
                          </div>
                          {transaction.subcategory && (
                            <div className="text-sm text-gray-500">
                              {transaction.subcategory}
                            </div>
                          )}
                          {splitText(transaction) && (
                            <div className="text-sm text-gray-500">{splitText(transaction)}</div>
                          )}
                          {isSalaryRow(transaction) && salaryWaiting(transaction) && (
                            <div className="text-xs text-gray-500">Pending. This month is still waiting.</div>
                          )}
                          {isSalaryRow(transaction) && transaction.nextIncomeAt && (
                            <div className="text-xs text-gray-500">
                              Next pay {new Date(transaction.nextIncomeAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="table-cell">
                        {new Date(transaction.date).toLocaleDateString()}
                      </td>
                      <td className="table-cell">
                        {transaction.contactId ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {transaction.contactId.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {transaction.contactId.phone}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="table-cell">
                        <div className="flex space-x-2">
                          {payIsDue(transaction) && (
                            <button
                              onClick={() => setSalaryPlan(transaction)}
                              className="text-sm font-medium text-green-700"
                            >
                              Received
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(transaction)}
                            className="text-primary-600 hover:text-primary-900"
                            title="Edit transaction"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(transaction)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete transaction"
                            disabled={deleteMutation.isLoading}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No transactions found</p>
              <button
                onClick={() => setShowForm(true)}
                className="btn btn-primary mt-4"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Your First Transaction
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Form Modal */}
      {showForm && (
        <TransactionForm
          transaction={selectedTransaction}
          onClose={handleCloseForm}
          onSuccess={handleFormSuccess}
        />
      )}
      {salaryPlan && (
        <SalaryReceive
          plan={salaryPlan}
          onClose={() => setSalaryPlan(null)}
          onDone={handleFormSuccess}
        />
      )}
    </div>
  );
}

export default Transactions;
