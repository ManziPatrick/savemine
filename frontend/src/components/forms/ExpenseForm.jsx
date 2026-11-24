import { useState, useEffect } from 'react';
import { expensesAPI, projectsAPI, savingsAPI, assetsAPI } from '../../services/api';
import CategoryPicker from '../CategoryPicker';
import LinkPicker from '../LinkPicker';
import SlideOver from '../SlideOver';
import LoadingSpinner from '../LoadingSpinner';
import { fileExpenseCategory } from '../../utils/fileExpense';
import { farmFromForm } from '../../utils/farmMeasure';
import { stagesFor, showsFarmMeasure } from '../../utils/projectStages';
import FarmMeasure from './FarmMeasure';
import { uploadProof } from '../../utils/uploadProof';
import toast from 'react-hot-toast';

function ExpenseForm({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: 'Food',
    subcategory: '',
    title: '',
    description: '',
    amount: '',
    currency: 'FRW',
    quantity: 1,
    unitPrice: '',
    expenseDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash',
    location: '',
    vendor: '',
    tags: [],
    notes: '',
    receipt: '',
    photos: [],
    isBusinessExpense: false,
    isTaxDeductible: false,
    deductFrom: 'cash',
    savingsId: '',
    projectId: '',
    assetId: '',
    kilograms: '',
    farmSize: '',
    farmSizeUnit: '',
    farmDays: '',
    farmLevel: ''
  });

  const [receiptFile, setReceiptFile] = useState(null);
  const [savingsAccounts, setSavingsAccounts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [assets, setAssets] = useState([]);

  useEffect(() => {
    const fetchSavings = async () => {
      try {
        const [savingsResponse, projectResponse, assetResponse] = await Promise.all([
          savingsAPI.getSavings({ limit: 100 }),
          projectsAPI.getProjects({ limit: 100 }),
          assetsAPI.getAssets({ limit: 100 }),
        ]);
        setSavingsAccounts(savingsResponse.data.data || []);
        setProjects(projectResponse.data.data || []);
        setAssets(assetResponse.data.data || []);
      } catch (error) {
        // Non-blocking — the pickers stay empty
      }
    };
    fetchSavings();
  }, []);

  const selectedSaving = savingsAccounts.find((s) => s._id === formData.savingsId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.amount) {
      toast.error('Enter the amount');
      return;
    }

    if (formData.deductFrom === 'savings' && !selectedSaving) {
      toast.error('Please choose which savings account to deduct from');
      return;
    }

    setLoading(true);
    try {
      const amount = parseFloat(formData.amount);
      const { deductFrom, savingsId, projectId, assetId, category, kilograms, farmSize, farmSizeUnit, farmDays, farmLevel, ...rest } = formData;
      const filed = fileExpenseCategory(category, formData.subcategory);
      const title = formData.title.trim() || formData.subcategory || category || 'Expense';
      const receipt = await uploadProof(receiptFile, { title, relatedEntity: 'expense' });
      const expenseData = {
        ...rest,
        ...filed,
        title,
        receipt,
        amount,
        projectId: projectId || undefined,
        assetId: assetId || undefined,
        unitPrice: formData.unitPrice ? parseFloat(formData.unitPrice) : null,
        tags: formData.tags.filter(tag => tag.trim()),
        farm: showsFarmMeasure(category, projects.find((project) => project._id === projectId)?.projectType, projects.find((project) => project._id === projectId)?.name)
          || showsFarmMeasure(formData.subcategory, projects.find((project) => project._id === projectId)?.projectType, projects.find((project) => project._id === projectId)?.name)
          ? farmFromForm(formData)
          : undefined,
        source: formData.deductFrom === 'savings' && selectedSaving
          ? { type: 'savings', sourceId: selectedSaving._id, sourceName: selectedSaving.name, amount }
          : formData.deductFrom === 'salary'
            ? { type: 'salary', sourceName: 'Salary', amount }
            : { type: 'petty_cash', sourceName: 'Wallet', amount }
      };

      await expensesAPI.createExpense(expenseData);
      toast.success('Expense added successfully');
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const addTag = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      const newTag = e.target.value.trim();
      if (!formData.tags.includes(newTag)) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, newTag]
        }));
      }
      e.target.value = '';
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'food': return '🍽️';
      case 'transport': return '🚗';
      case 'housing': return '🏠';
      case 'utilities': return '⚡';
      case 'healthcare': return '🏥';
      case 'education': return '📚';
      case 'entertainment': return '🎬';
      case 'clothing': return '👕';
      case 'personal_care': return '💄';
      case 'business': return '💼';
      case 'animal_care': return '🐄';
      case 'agriculture': return '🌾';
      case 'investment': return '📈';
      case 'emergency': return '🚨';
      case 'gift': return '🎁';
      case 'donation': return '❤️';
      default: return '📝';
    }
  };

  const getCategoryName = (category) => {
    const categories = {
      food: 'Food & Dining',
      transport: 'Transportation',
      housing: 'Housing & Rent',
      utilities: 'Utilities',
      healthcare: 'Healthcare',
      education: 'Education',
      entertainment: 'Entertainment',
      clothing: 'Clothing',
      personal_care: 'Personal Care',
      business: 'Business',
      animal_care: 'Animal Care',
      agriculture: 'Agriculture',
      investment: 'Investment',
      emergency: 'Emergency',
      gift: 'Gifts',
      donation: 'Donations',
      other: 'Other'
    };
    return categories[category] || category;
  };

  const createProject = async (name) => {
    try {
      const response = await projectsAPI.createProject({
        name,
        projectType: 'general',
        status: 'active',
        currency: 'FRW',
      });
      const project = response.data.data;
      setProjects((prev) => [...prev, project]);
      return { id: project._id, name: project.name };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not create that project');
      throw error;
    }
  };

  const createAsset = async (name) => {
    try {
      const response = await assetsAPI.createAsset({
        name,
        value: 0,
        category: 'Equipment',
        currency: 'FRW',
        status: 'owned',
        projectId: formData.projectId || undefined,
      });
      const asset = response.data.data.asset;
      setAssets((prev) => [...prev, asset]);
      return { id: asset._id, name: asset.name };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not create that asset');
      throw error;
    }
  };

  return (
    <SlideOver title="Add an expense" subtitle="One record for the whole office" onClose={onClose}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <CategoryPicker
                  id="category"
                  value={formData.category}
                  onChange={(name) => setFormData((prev) => ({ ...prev, category: name }))}
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <label htmlFor="projectId" className="block text-sm font-medium text-gray-700 mb-2">
                  Project
                </label>
                <LinkPicker
                  id="projectId"
                  items={projects.map((project) => ({ id: project._id, name: project.name }))}
                  value={formData.projectId}
                  onChange={(id) => setFormData((prev) => ({ ...prev, projectId: id }))}
                  onCreate={createProject}
                  emptyLabel="General, no project"
                  placeholder="Search a project, or create one"
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <label htmlFor="assetId" className="block text-sm font-medium text-gray-700 mb-2">
                  Asset
                </label>
                <LinkPicker
                  id="assetId"
                  items={assets.map((asset) => ({ id: asset._id, name: asset.name }))}
                  value={formData.assetId}
                  onChange={(id) => setFormData((prev) => ({ ...prev, assetId: id }))}
                  onCreate={createAsset}
                  emptyLabel="No asset"
                  placeholder="Search an asset, or create one"
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory</label>
                <CategoryPicker
                  id="subcategory"
                  value={formData.subcategory}
                  preferred={stagesFor(
                    projects.find((project) => project._id === formData.projectId)?.projectType,
                    projects.find((project) => project._id === formData.projectId)?.name
                  )}
                  onChange={(name) => setFormData((prev) => ({ ...prev, subcategory: name }))}
                  placeholder={stagesFor(
                    projects.find((project) => project._id === formData.projectId)?.projectType,
                    projects.find((project) => project._id === formData.projectId)?.name
                  ).length ? 'Search a stage' : 'Search a detail already in the office'}
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <p className="mb-2 text-sm font-medium text-gray-700">Take the money from</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={`btn ${formData.deductFrom === 'cash' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFormData((prev) => ({ ...prev, deductFrom: 'cash', savingsId: '' }))}
                  >
                    Wallet
                  </button>
                  <button
                    type="button"
                    className={`btn ${formData.deductFrom === 'salary' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFormData((prev) => ({ ...prev, deductFrom: 'salary', savingsId: '' }))}
                  >
                    Salary
                  </button>
                  {savingsAccounts.map((saving) => (
                    <button
                      key={saving._id}
                      type="button"
                      className={`btn ${formData.savingsId === saving._id ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setFormData((prev) => ({ ...prev, deductFrom: 'savings', savingsId: saving._id }))}
                    >
                      {saving.name} · {Number(saving.amount || 0).toLocaleString()} {saving.currency}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">Amount *</label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="0"
                  min="0"
                  required
                />
              </div>
              <div>
                <label htmlFor="expenseDate" className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  id="expenseDate"
                  name="expenseDate"
                  value={formData.expenseDate}
                  onChange={handleInputChange}
                  className="input"
                />
              </div>
            </div>

            {looksLikeFarming(
              formData.category,
              formData.subcategory,
              projects.find((project) => project._id === formData.projectId)?.projectType,
              projects.find((project) => project._id === formData.projectId)?.name
            ) && (
              <FarmMeasure
                value={formData}
                onChange={(name, next) => setFormData((prev) => ({ ...prev, [name]: next }))}
              />
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="receipt-file">Receipt</label>
              <input
                id="receipt-file"
                type="file"
                accept="image/*,application/pdf,.pdf"
                className="input"
                onChange={(event) => setReceiptFile(event.target.files?.[0] || null)}
              />
              {receiptFile && <p className="mt-1 text-sm text-ink/60">{receiptFile.name}</p>}
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center">
                    <LoadingSpinner size="sm" className="mr-2" />
                    Saving...
                  </div>
                ) : (
                  'Add Expense'
                )}
              </button>
            </div>
          </form>
    </SlideOver>
  );
}

export default ExpenseForm;
