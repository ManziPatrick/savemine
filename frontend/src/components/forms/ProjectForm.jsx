import { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { projectsAPI } from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import toast from 'react-hot-toast';

const expenseCategories = {
  materials: '🧱 Materials', labor: '👷 Labor', equipment: '⚙️ Equipment',
  transport: '🚛 Transport', survey: '📐 Survey/Design', fees: '📄 Fees',
  utilities: '💡 Utilities', marketing: '📣 Marketing', rent: '🏠 Rent',
  maintenance: '🔧 Maintenance', other: '📦 Other'
};

function ProjectForm({ project, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    projectType: 'general',
    description: '',
    location: '',
    startDate: new Date().toISOString().split('T')[0],
    expectedEndDate: '',
    status: 'planning',
    plannedBudget: '',
    currency: 'FRW',
    notes: ''
  });

  const [newExpense, setNewExpense] = useState({ category: 'materials', reason: '', amount: '', date: new Date().toISOString().split('T')[0], vendor: '' });
  const [expenses, setExpenses] = useState([]);

  const [newIncome, setNewIncome] = useState({ date: new Date().toISOString().split('T')[0], title: '', amount: '', quantity: '', unit: '', customer: '' });
  const [incomes, setIncomes] = useState([]);

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        projectType: project.projectType || 'general',
        description: project.description || '',
        location: project.location || '',
        startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        expectedEndDate: project.expectedEndDate ? new Date(project.expectedEndDate).toISOString().split('T')[0] : '',
        status: project.status || 'planning',
        plannedBudget: project.plannedBudget || '',
        currency: project.currency || 'FRW',
        notes: project.notes || ''
      });
      setExpenses(project.expenses || []);
      setIncomes(project.incomes || []);
    }
  }, [project]);

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
    setNewExpense({ category: 'materials', reason: '', amount: '', date: new Date().toISOString().split('T')[0], vendor: '' });
  };

  const removeExpense = (index) => setExpenses(prev => prev.filter((_, i) => i !== index));

  const addIncome = () => {
    if (!newIncome.title || !newIncome.amount) {
      toast.error('Title and amount are required for each income');
      return;
    }
    setIncomes(prev => [...prev, { ...newIncome, amount: parseFloat(newIncome.amount), quantity: parseFloat(newIncome.quantity) || 0 }]);
    setNewIncome({ date: new Date().toISOString().split('T')[0], title: '', amount: '', quantity: '', unit: '', customer: '' });
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
        expenses,
        incomes
      };

      if (project) {
        await projectsAPI.updateProject(project._id, data);
        toast.success('Project updated');
      } else {
        await projectsAPI.createProject(data);
        toast.success('Project created');
      }
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <span className="text-2xl mr-2">📁</span>
              {project ? 'Edit Project' : 'Create New Project'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input type="text" name="location" value={formData.location} onChange={handleInputChange} className="block w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="e.g., Kigali, Rwanda" />
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
                    <select value={newExpense.category} onChange={(e) => setNewExpense(prev => ({ ...prev, category: e.target.value }))} className="block w-full px-3 py-2 border border-gray-300 rounded-md">
                      {Object.entries(expenseCategories).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
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
                          {expenseCategories[expense.category] || expense.category} — FRW {(expense.amount || 0).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500 italic">"{expense.reason}" {expense.vendor && `• ${expense.vendor}`}</div>
                      </div>
                      <button type="button" onClick={() => removeExpense(index)} className="text-red-600 hover:text-red-900">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Incomes */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">💵 Income / Outcomes (record your results)</h3>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
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
                        <div className="text-sm text-green-600">Income: FRW {(income.amount || 0).toLocaleString()}</div>
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
        </div>
      </div>
    </div>
  );
}

export default ProjectForm;
