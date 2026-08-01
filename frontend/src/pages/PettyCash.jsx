import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  PlusIcon, 
  MinusIcon, 
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { pettyCashAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

function PettyCash() {
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositDescription, setDepositDescription] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalDescription, setWithdrawalDescription] = useState('');
  const [withdrawalPurpose, setWithdrawalPurpose] = useState('');
  
  const queryClient = useQueryClient();

  const { data: pettyCash, isLoading } = useQuery(
    'pettyCash',
    pettyCashAPI.getPettyCash
  );

  const { data: pettyCashStats } = useQuery(
    'pettyCashStats',
    pettyCashAPI.getPettyCashStats
  );

  const { data: transactions } = useQuery(
    'pettyCashTransactions',
    () => pettyCashAPI.getTransactions({ limit: 10 })
  );

  const depositMutation = useMutation(pettyCashAPI.addDeposit, {
    onSuccess: () => {
      queryClient.invalidateQueries('pettyCash');
      queryClient.invalidateQueries('pettyCashStats');
      queryClient.invalidateQueries('pettyCashTransactions');
      toast.success('Deposit added successfully');
      setShowDepositForm(false);
      setDepositAmount('');
      setDepositDescription('');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add deposit');
    }
  });

  const withdrawalMutation = useMutation(pettyCashAPI.makeWithdrawal, {
    onSuccess: () => {
      queryClient.invalidateQueries('pettyCash');
      queryClient.invalidateQueries('pettyCashStats');
      queryClient.invalidateQueries('pettyCashTransactions');
      toast.success('Withdrawal made successfully');
      setShowWithdrawalForm(false);
      setWithdrawalAmount('');
      setWithdrawalDescription('');
      setWithdrawalPurpose('');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to make withdrawal');
    }
  });

  const handleDeposit = () => {
    if (!depositAmount || depositAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    depositMutation.mutate({
      amount: parseFloat(depositAmount),
      description: depositDescription,
      source: 'Manual Deposit'
    });
  };

  const handleWithdrawal = () => {
    if (!withdrawalAmount || withdrawalAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (parseFloat(withdrawalAmount) > pettyCash?.data?.currentBalance) {
      toast.error('Insufficient funds');
      return;
    }

    withdrawalMutation.mutate({
      amount: parseFloat(withdrawalAmount),
      description: withdrawalDescription,
      purpose: withdrawalPurpose
    });
  };

  const formatCurrency = (amount, currency = 'FRW') => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'deposit':
      case 'loan_repaid':
      case 'income':
        return <ArrowTrendingUpIcon className="h-5 w-5 text-green-500" />;
      case 'withdrawal':
      case 'loan_given':
      case 'expense':
        return <ArrowTrendingDownIcon className="h-5 w-5 text-red-500" />;
      default:
        return <CurrencyDollarIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'deposit':
      case 'loan_repaid':
      case 'income':
        return 'text-green-600';
      case 'withdrawal':
      case 'loan_given':
      case 'expense':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (isLoading) return <LoadingSpinner />;

  const pettyCashData = pettyCash?.data?.data;
  const stats = pettyCashStats?.data?.data;
  const transactionsList = transactions?.data?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Petty Cash</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your petty cash account and track transactions
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowWithdrawalForm(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <MinusIcon className="h-5 w-5 mr-2" />
            Withdraw
          </button>
          <button
            onClick={() => setShowDepositForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Deposit
          </button>
        </div>
      </div>

      {/* Low Balance Alert */}
      {pettyCashData?.currentBalance <= (pettyCashData?.settings?.lowBalanceThreshold || 10000) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                Low Balance Alert
              </h3>
              <p className="text-sm text-yellow-600">
                Your petty cash balance is below the threshold. Consider adding more funds.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Balance Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Current Balance</h2>
            <p className="text-3xl font-bold text-blue-600">
              {formatCurrency(pettyCashData?.currentBalance || 0)}
            </p>
            <p className="text-sm text-gray-500">
              {pettyCashData?.currency || 'FRW'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Account Name</div>
            <div className="text-lg font-medium text-gray-900">
              {pettyCashData?.name || 'Petty Cash'}
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <ArrowTrendingUpIcon className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Deposits</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(stats.overview?.totalDeposits || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <ArrowTrendingDownIcon className="h-5 w-5 text-red-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Withdrawals</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(stats.overview?.totalWithdrawals || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <CurrencyDollarIcon className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Transactions</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.overview?.transactionCount || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <CurrencyDollarIcon className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">This Month</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency((stats.monthly?.deposits || 0) - (stats.monthly?.withdrawals || 0))}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {transactionsList.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No transactions yet
            </div>
          ) : (
            transactionsList.map((transaction) => (
              <div key={transaction._id} className="p-6 flex items-center justify-between">
                <div className="flex items-center">
                  {getTransactionIcon(transaction.type)}
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">
                      {transaction.description}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(transaction.date).toLocaleDateString()} - {transaction.type}
                    </p>
                  </div>
                </div>
                <div className={`text-lg font-semibold ${getTransactionColor(transaction.type)}`}>
                  {transaction.type === 'deposit' || transaction.type === 'loan_repaid' || transaction.type === 'income' ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Deposit Form Modal */}
      {showDepositForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Add Deposit</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={depositDescription}
                  onChange={(e) => setDepositDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter description"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowDepositForm(false)}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeposit}
                disabled={depositMutation.isLoading}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {depositMutation.isLoading ? 'Adding...' : 'Add Deposit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdrawal Form Modal */}
      {showWithdrawalForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Make Withdrawal</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter amount"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Available: {formatCurrency(pettyCashData?.currentBalance || 0)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purpose
                </label>
                <input
                  type="text"
                  value={withdrawalPurpose}
                  onChange={(e) => setWithdrawalPurpose(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter purpose"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={withdrawalDescription}
                  onChange={(e) => setWithdrawalDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter description"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowWithdrawalForm(false)}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdrawal}
                disabled={withdrawalMutation.isLoading}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                {withdrawalMutation.isLoading ? 'Processing...' : 'Make Withdrawal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PettyCash;




