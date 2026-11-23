import { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { businessesAPI, expensesAPI, projectsAPI } from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import toast from 'react-hot-toast';
import CategoryPicker from '../CategoryPicker';
import LinkPicker from '../LinkPicker';
import SlideOver from '../SlideOver';
import { categoryLabel } from '../../utils/bookGroups';
import { fileExpenseCategory } from '../../utils/fileExpense';
import { formatMoney } from '../../utils/money';

function ProjectForm({ project, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    projectType: 'general',
    description: '',
    locationMode: 'place',
    location: '',
    businessId: '',
    partners: [],
    startDate: new Date().toISOString().split('T')[0],
    expectedEndDate: '',
    status: 'planning',
    plannedBudget: '',
    currency: 'FRW',
    notes: ''
  });

  const [newExpense, setNewExpense] = useState({ category: 'School fees', reason: '', amount: '', date: new Date().toISOString().split('T')[0], vendor: '' });
  const [expenses, setExpenses] = useState([]);

  const [newIncome, setNewIncome] = useState({ date: new Date().toISOString().split('T')[0], title: '', amount: '', quantity: '', unit: '', customer: '', category: 'income' });
  const [incomes, setIncomes] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [hasPartners, setHasPartners] = useState(false);
  const [partnerName, setPartnerName] = useState('');

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        projectType: project.projectType || 'general',
        description: project.description || '',
        locationMode: project.locationMode || (project.location === 'Online' ? 'online' : 'place'),
        location: project.location === 'Online' ? '' : (project.location || ''),
        businessId: project.businessId?._id || project.businessId || '',
        partners: project.partners || [],
        startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        expectedEndDate: project.expectedEndDate ? new Date(project.expectedEndDate).toISOString().split('T')[0] : '',
        status: project.status || 'planning',
        plannedBudget: project.plannedBudget || '',
        currency: project.currency || 'FRW',
        notes: project.notes || ''
      });
      setExpenses([...(project.expenses || []), ...(project.linkedExpenses || []).map((row) => ({
        _id: row._id,
        category: row.subcategory || row.category,
        reason: row.title,
        amount: row.amount,
        date: row.expenseDate,
        vendor: row.vendor || '',
        office: true,
      }))]);
      setIncomes(project.incomes || []);
      setHasPartners(Array.isArray(project.partners) && project.partners.length > 0);
      setPartnerName('');
    }
  }, [project]);

  useEffect(() => {
    businessesAPI.getBusinesses({ limit: 100 })
      .then((response) => setBusinesses(response.data.data || []))
      .catch(() => setBusinesses([]));
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addExpense = () => {
    if (!newExpense.reason || !newExpense.amount) {
      toast.error('Reason and amount are required for each expense');
      return;
    }
    setExpenses(prev => [...prev, { ...newExpense, amount: parseFloat(newExpense.amount) }]);
    setNewExpense({ category: 'School fees', reason: '', amount: '', date: new Date().toISOString().split('T')[0], vendor: '' });
  };

  const removeExpense = (index) => setExpenses(prev => prev.filter((_, i) => i !== index));

  const addIncome = () => {
    if (!newIncome.title || !newIncome.amount) {
      toast.error('Title and amount are required for each income');
      return;
    }
    setIncomes(prev => [...prev, { ...newIncome, amount: parseFloat(newIncome.amount), quantity: parseFloat(newIncome.quantity) || 0 }]);
    setNewIncome({ date: new Date().toISOString().split('T')[0], title: '', amount: '', quantity: '', unit: '', customer: '', category: 'income' });
  };

  const removeIncome = (index) => setIncomes(prev => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Project name is required');
      return;
    }
    setLoading(true);
    try {
      const data = {
        ...formData,
        plannedBudget: parseFloat(formData.plannedBudget) || 0,
        expectedEndDate: formData.expectedEndDate || null,
        locationMode: formData.locationMode,
        location: formData.locationMode === 'online' ? 'Online' : formData.location,
        businessId: formData.businessId || null,
        partners: hasPartners ? (formData.partners || []) : [],
        incomes,
        ...(project ? { expenses: expenses.filter((row) => row._id && !row.office) } : {})
      };

      const response = project
        ? await projectsAPI.updateProject(project._id, data)
        : await projectsAPI.createProject(data);
      const saved = response.data.data;
      const fresh = expenses.filter((row) => !row._id);
      await Promise.all(fresh.map((row) => expensesAPI.createExpense({
        title: row.reason,
        ...fileExpenseCategory(row.category, ''),
        amount: row.amount,
        expenseDate: row.date,
        vendor: row.vendor,
        projectId: saved._id,
        currency: formData.currency || 'FRW',
        source: { type: 'cash' },
      })));
      toast.success(project ? 'Project updated' : 'Project created');
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SlideOver title={project ? 'Edit project' : 'Create a project'} subtitle="Projects" onClose={onClose}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500" placeholder="e.g., My house construction, My shop, My farm..." required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Type</label>
                <input type="text" name="projectType" value={formData.projectType} onChange={handleInputChange} className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500" placeholder="e.g., construction, business, farming..." />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea name="description" value={formData.description} onChange={handleInputChange} rows={2} className="block w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Describe your project..." />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Business</label>
              <LinkPicker
                id="project-business"
                items={businesses.map((business) => ({ id: business._id, name: business.name }))}
                value={formData.businessId}
                onChange={(id) => setFormData((prev) => ({ ...prev, businessId: id }))}
                onCreate={async (name) => {
                  try {
                    const response = await businessesAPI.createBusiness({
                      name,
                      businessType: 'other',
                      locationMode: 'place',
                      location: '',
                      startDate: new Date().toISOString().slice(0, 10),
                      status: 'active',
                    });
                    const business = response.data.data;
                    setBusinesses((prev) => [...prev, business]);
                    return { id: business._id, name: business.name };
                  } catch (error) {
                    toast.error(error.response?.data?.message || 'Could not create that business');
                    throw error;
                  }
                }}
                emptyLabel="No business yet"
                placeholder="Search a business, or create one"
              />
              <p className="mt-1 text-sm text-ink/60">A business can hold several projects.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Where it happens</label>
                <div className="flex gap-2">
                  <button type="button" className={`btn ${formData.locationMode === 'online' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFormData((prev) => ({ ...prev, locationMode: 'online', location: '' }))}>Online</button>
                  <button type="button" className={`btn ${formData.locationMode === 'place' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFormData((prev) => ({ ...prev, locationMode: 'place' }))}>A place</button>
                </div>
                {formData.locationMode === 'place' && (
                  <input type="text" name="location" value={formData.location} onChange={handleInputChange} className="mt-2 block w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Kigali, the shop, a site" />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} className="block w-full px-3 py-2 border border-gray-300 rounded-md" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expected End Date</label>
                <input type="date" name="expectedEndDate" value={formData.expectedEndDate} onChange={handleInputChange} className="block w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Partners</label>
              <div className="flex gap-2">
                <button type="button" className={`btn ${hasPartners ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setHasPartners(true)}>Yes</button>
                <button type="button" className={`btn ${hasPartners ? 'btn-secondary' : 'btn-primary'}`} onClick={() => { setHasPartners(false); setFormData((prev) => ({ ...prev, partners: [] })); }}>No</button>
              </div>
              {hasPartners && (
                <div className="mt-3 space-y-2">
                  <div className="flex gap-2">
                    <input
                      className="input"
                      placeholder="Partner name"
                      value={partnerName}
                      onChange={(event) => setPartnerName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          const name = partnerName.trim();
                          if (!name) return;
                          setFormData((prev) => ({ ...prev, partners: [...(prev.partners || []), name] }));
                          setPartnerName('');
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        const name = partnerName.trim();
                        if (!name) return;
                        setFormData((prev) => ({ ...prev, partners: [...(prev.partners || []), name] }));
                        setPartnerName('');
                      }}
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(formData.partners || []).map((name, index) => (
                      <button
                        key={`${name}-${index}`}
                        type="button"
                        className="rounded-full bg-paper px-3 py-1 text-sm text-ink"
                        onClick={() => setFormData((prev) => ({ ...prev, partners: prev.partners.filter((item) => item !== name) }))}
                      >
                        {name} ×
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select name="status" value={formData.status} onChange={handleInputChange} className="block w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Planned Budget (FRW)</label>
                <input type="number" min="0" name="plannedBudget" value={formData.plannedBudget} onChange={handleInputChange} className="block w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                <select name="currency" value={formData.currency} onChange={handleInputChange} className="block w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="FRW">FRW</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>

            {/* Expenses */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">💸 Expenses (Money Spent) <span className="text-gray-400 font-normal">— each with a reason</span></h3>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <CategoryPicker value={newExpense.category} onChange={(name) => setNewExpense((prev) => ({ ...prev, category: name }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (FRW)</label>
                    <input type="number" min="0" value={newExpense.amount} onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))} className="block w-full px-3 py-2 border border-gray-300 rounded-md" />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason (why you spent this money) *</label>
                  <input type="text" value={newExpense.reason} onChange={(e) => setNewExpense(prev => ({ ...prev, reason: e.target.value }))} className="block w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="e.g., Bought materials, paid workers..." />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input type="date" value={newExpense.date} onChange={(e) => setNewExpense(prev => ({ ...prev, date: e.target.value }))} className="block w-full px-3 py-2 border border-gray-300 rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                    <input type="text" value={newExpense.vendor} onChange={(e) => setNewExpense(prev => ({ ...prev, vendor: e.target.value }))} className="block w-full px-3 py-2 border border-gray-300 rounded-md" />
                  </div>
                </div>
                <button type="button" onClick={addExpense} className="btn btn-primary btn-sm mt-3">
                  <PlusIcon className="h-4 w-4 mr-1" /> Add Expense
                </button>
              </div>
              {expenses.length > 0 && (
                <div className="space-y-2">
                  {expenses.map((expense, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {categoryLabel(expense.category)} — {formatMoney(expense.amount)}
                        </div>
                        <div className="text-sm text-gray-500 italic">"{expense.reason}" {expense.vendor && `• ${expense.vendor}`}</div>
                      </div>
                      {expense.office ? (
                        <span className="text-xs text-gray-400">Office</span>
                      ) : (
                        <button type="button" onClick={() => removeExpense(index)} className="text-red-600 hover:text-red-900">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Incomes */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">💵 Income / Outcomes (record your results)</h3>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <CategoryPicker value={newIncome.category} onChange={(name) => setNewIncome((prev) => ({ ...prev, category: name }))} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input type="text" value={newIncome.title} onChange={(e) => setNewIncome(prev => ({ ...prev, title: e.target.value }))} className="block w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="e.g., Sold harvest" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (FRW) *</label>
                    <input type="number" min="0" value={newIncome.amount} onChange={(e) => setNewIncome(prev => ({ ...prev, amount: e.target.value }))} className="block w-full px-3 py-2 border border-gray-300 rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <input type="number" min="0" value={newIncome.quantity} onChange={(e) => setNewIncome(prev => ({ ...prev, quantity: e.target.value }))} className="block w-full px-3 py-2 border border-gray-300 rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                    <input type="text" value={newIncome.unit} onChange={(e) => setNewIncome(prev => ({ ...prev, unit: e.target.value }))} className="block w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="kg, pieces, bags" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer/Buyer</label>
                    <input type="text" value={newIncome.customer} onChange={(e) => setNewIncome(prev => ({ ...prev, customer: e.target.value }))} className="block w-full px-3 py-2 border border-gray-300 rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input type="date" value={newIncome.date} onChange={(e) => setNewIncome(prev => ({ ...prev, date: e.target.value }))} className="block w-full px-3 py-2 border border-gray-300 rounded-md" />
                  </div>
                </div>
                <button type="button" onClick={addIncome} className="btn btn-primary btn-sm mt-3">
                  <PlusIcon className="h-4 w-4 mr-1" /> Add Income
                </button>
              </div>
              {incomes.length > 0 && (
                <div className="space-y-2">
                  {incomes.map((income, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {income.title} {income.quantity > 0 && `(${income.quantity} ${income.unit})`}
                        </div>
                        <div className="text-sm text-green-600">{categoryLabel(income.category || 'income')}: {formatMoney(income.amount)}</div>
                      </div>
                      <button type="button" onClick={() => removeIncome(index)} className="text-red-600 hover:text-red-900">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows={3} className="block w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Additional notes..." />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <div className="flex items-center"><LoadingSpinner size="sm" className="mr-2" />Saving...</div> : (project ? 'Update Project' : 'Create Project')}
              </button>
            </div>
          </form>
    </SlideOver>
  );
}

export default ProjectForm;
