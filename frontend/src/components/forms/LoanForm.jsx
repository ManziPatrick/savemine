import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { loansAPI, contactsAPI } from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import toast from 'react-hot-toast';

function LoanForm({ loan, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [sources, setSources] = useState({});
  const [loadingSources, setLoadingSources] = useState(false);
  const [selectedSourceType, setSelectedSourceType] = useState('');
  const [selectedSource, setSelectedSource] = useState(null);
  const [sourceBalance, setSourceBalance] = useState(0);
  const isEditing = !!loan;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm({
    defaultValues: {
      contactId: '',
      amount: '',
      currency: 'FRW',
      givenDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      interestRate: 0,
      description: '',
      notes: ''
    }
  });

  const givenDate = watch('givenDate');

  useEffect(() => {
    if (loan) {
      setValue('contactId', loan.contactId?._id || '');
      setValue('amount', loan.amount || '');
      setValue('currency', loan.currency || 'FRW');
      setValue('givenDate', loan.givenDate ? new Date(loan.givenDate).toISOString().split('T')[0] : '');
      setValue('dueDate', loan.dueDate ? new Date(loan.dueDate).toISOString().split('T')[0] : '');
      setValue('interestRate', loan.interestRate || 0);
      setValue('description', loan.description || '');
      setValue('notes', loan.notes || '');
    }
  }, [loan, setValue]);

  useEffect(() => {
    const fetchContacts = async () => {
      setLoadingContacts(true);
      try {
        // Fetch all contacts with high limit
        const response = await contactsAPI.getContacts({ limit: 10000 });
        // Handle paginated response structure: { success: true, data: [...contacts], pagination: {...} }
        const contactsData = response.data?.data || [];
        setContacts(contactsData);
        setFilteredContacts(contactsData);
      } catch (error) {
        toast.error('Failed to load contacts');
      } finally {
        setLoadingContacts(false);
      }
    };

    const fetchSources = async () => {
      setLoadingSources(true);
      try {
        const response = await loansAPI.getLoanSources();
        console.log('Sources response:', response.data); // Debug log
        setSources(response.data.data || response.data);
      } catch (error) {
        console.error('Error fetching sources:', error);
        toast.error('Failed to load sources');
      } finally {
        setLoadingSources(false);
      }
    };

    fetchContacts();
    fetchSources();
  }, []);

  // Update source balance when selection changes
  useEffect(() => {
    const updateSourceBalance = () => {
      if (selectedSourceType && selectedSource) {
        // selectedSource is already the source object, so use it directly
        // Ensure balance is converted to number for proper arithmetic
        setSourceBalance(Number(selectedSource.balance) || 0);
      } else {
        setSourceBalance(0);
      }
    };
    
    updateSourceBalance();
  }, [selectedSourceType, selectedSource, sources]);

  // Server-side search with debouncing
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (contactSearch.trim().length >= 2) {
        // Use server-side search API for better performance (getContacts with search param)
        // This avoids the 20-result limit of the search endpoint
        setLoadingContacts(true);
        try {
          const response = await contactsAPI.getContacts({ 
            search: contactSearch.trim(),
            limit: 1000 // Get up to 1000 matching results
          });
          // Handle paginated response structure: { success: true, data: [...contacts], pagination: {...} }
          const searchResults = response.data?.data || [];
          setFilteredContacts(searchResults);
        } catch (error) {
          console.error('Search error:', error);
          // Fallback to client-side filtering if search fails
          const filtered = contacts.filter(contact => 
            contact.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
            contact.phone.includes(contactSearch) ||
            (contact.email && contact.email.toLowerCase().includes(contactSearch.toLowerCase()))
          );
          setFilteredContacts(filtered);
        } finally {
          setLoadingContacts(false);
        }
      } else if (contactSearch.trim().length === 0) {
        // Show all contacts when search is cleared
        setFilteredContacts(contacts);
      } else {
        // For single character, use client-side filtering
        const filtered = contacts.filter(contact => 
          contact.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
          contact.phone.includes(contactSearch) ||
          (contact.email && contact.email.toLowerCase().includes(contactSearch.toLowerCase()))
        );
        setFilteredContacts(filtered);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(searchTimeout);
  }, [contactSearch, contacts]);

  const handleContactSelect = (contact) => {
    setValue('contactId', contact._id);
    setContactSearch(contact.name);
    setShowContactDropdown(false);
  };

  const handleContactSearchChange = (e) => {
    const value = e.target.value;
    setContactSearch(value);
    setShowContactDropdown(true);
    
    // If user clears the search, clear the selected contact
    if (!value.trim()) {
      setValue('contactId', '');
    }
  };

  const onSubmit = async (data) => {
    if (!selectedSourceType) {
      toast.error('Please select a source type for the loan');
      return;
    }

    if (!selectedSource && selectedSourceType !== 'income' && selectedSourceType !== 'other') {
      toast.error('Please select a source for the loan');
      return;
    }

    // Check for insufficient funds
    if (selectedSource && parseFloat(data.amount) > sourceBalance) {
      toast.error(`Insufficient funds! Available: ${selectedSource.currency} ${sourceBalance.toLocaleString()}`);
      return;
    }

    setLoading(true);
    try {
      const loanData = {
        ...data,
        principalAmount: parseFloat(data.amount),
        source: {
          type: selectedSourceType,
          sourceId: selectedSource?.id || null,
          sourceName: selectedSource?.name || `${selectedSourceType.charAt(0).toUpperCase() + selectedSourceType.slice(1)} - General`,
          amount: parseFloat(data.amount),
          currency: data.currency
        }
      };

      if (isEditing) {
        await loansAPI.updateLoan(loan._id, loanData);
        toast.success('Loan updated successfully');
      } else {
        await loansAPI.createLoan(loanData);
        toast.success('Loan created successfully');
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save loan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Loan' : 'Add New Loan'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="form-group">
            <label className="label">Contact *</label>
            <div className="relative">
              <input
                type="text"
                value={contactSearch}
                onChange={handleContactSearchChange}
                onFocus={() => setShowContactDropdown(true)}
                className={`input ${errors.contactId ? 'input-error' : ''}`}
                placeholder="Search contacts by name, phone, or email..."
                disabled={loadingContacts}
              />
              {loadingContacts && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <LoadingSpinner size="sm" />
                </div>
              )}
              
              {showContactDropdown && filteredContacts.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredContacts.map((contact) => (
                    <div
                      key={contact._id}
                      onClick={() => handleContactSelect(contact)}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{contact.name}</div>
                      <div className="text-sm text-gray-500">
                        {contact.phone} • {contact.type}
                        {contact.email && ` • ${contact.email}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {showContactDropdown && filteredContacts.length === 0 && contactSearch.trim() && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-4 text-center text-gray-500">
                  No contacts found matching "{contactSearch}"
                </div>
              )}
            </div>
            {errors.contactId && (
              <p className="error-message">{errors.contactId.message}</p>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="label">Amount *</label>
              <input
                {...register('amount', {
                  required: 'Amount is required',
                  min: { value: 0, message: 'Amount must be positive' }
                })}
                type="number"
                step="0.01"
                className={`input ${errors.amount ? 'input-error' : ''}`}
                placeholder="0.00"
              />
              {errors.amount && (
                <p className="error-message">{errors.amount.message}</p>
              )}
            </div>

            <div className="form-group">
              <label className="label">Currency</label>
              <select
                {...register('currency')}
                className="input"
              >
                <option value="FRW">FRW</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>

          {/* Source Selection */}
          <div className="form-group">
            <label className="label">Source Type *</label>
              <select
                value={selectedSourceType}
                onChange={(e) => {
                  console.log('Source type changed:', e.target.value, 'Available sources:', sources); // Debug log
                  setSelectedSourceType(e.target.value);
                  setSelectedSource(null);
                }}
                className="input"
                disabled={loadingSources}
              >
              <option value="">Select source type...</option>
              <option value="petty_cash">Petty Cash</option>
              <option value="income">Income</option>
              <option value="savings">Savings</option>
              <option value="business">Business</option>
              <option value="other">Other</option>
            </select>
          </div>

          {selectedSourceType && (
            <div className="form-group">
              <label className="label">Source *</label>
              <select
                value={selectedSource?.id || ''}
                onChange={(e) => {
                  const sourceId = e.target.value;
                  const sourceList = sources[selectedSourceType] || [];
                  console.log('Source selection:', { sourceId, sourceList, selectedSourceType }); // Debug log
                  const source = sourceList.find(s => s.id === sourceId);
                  setSelectedSource(source);
                }}
                className="input"
                disabled={loadingSources}
              >
                <option value="">Select source...</option>
                {(sources[selectedSourceType] || []).map((source) => (
                  <option key={source.id || 'default'} value={source.id || ''}>
                    {source.name} - {(Number(source.balance) || 0).toLocaleString()} {source.currency}
                  </option>
                ))}
              </select>
              {selectedSource && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-blue-800">Available Balance:</span>
                    <span className="text-sm font-semibold text-blue-900">
                      {selectedSource.currency} {sourceBalance.toLocaleString()}
                    </span>
                  </div>
                  {watch('amount') && parseFloat(watch('amount')) > sourceBalance && (
                    <div className="mt-2 text-sm text-red-600 font-medium">
                      ⚠️ Insufficient funds! You need {selectedSource.currency} {(parseFloat(watch('amount')) - sourceBalance).toLocaleString()} more.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label className="label">Given Date *</label>
              <input
                {...register('givenDate', { required: 'Given date is required' })}
                type="date"
                className={`input ${errors.givenDate ? 'input-error' : ''}`}
              />
              {errors.givenDate && (
                <p className="error-message">{errors.givenDate.message}</p>
              )}
            </div>

            <div className="form-group">
              <label className="label">Due Date *</label>
              <input
                {...register('dueDate', { 
                  required: 'Due date is required',
                  validate: (value) => {
                    if (givenDate && value && new Date(value) <= new Date(givenDate)) {
                      return 'Due date must be after given date';
                    }
                    return true;
                  }
                })}
                type="date"
                className={`input ${errors.dueDate ? 'input-error' : ''}`}
              />
              {errors.dueDate && (
                <p className="error-message">{errors.dueDate.message}</p>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="label">Interest Rate (%)</label>
            <input
              {...register('interestRate', {
                min: { value: 0, message: 'Interest rate must be positive' },
                max: { value: 100, message: 'Interest rate cannot exceed 100%' }
              })}
              type="number"
              step="0.01"
              min="0"
              max="100"
              className={`input ${errors.interestRate ? 'input-error' : ''}`}
              placeholder="0"
            />
            {errors.interestRate && (
              <p className="error-message">{errors.interestRate.message}</p>
            )}
          </div>

          <div className="form-group">
            <label className="label">Description</label>
            <input
              {...register('description')}
              type="text"
              className="input"
              placeholder="Brief description of the loan"
            />
          </div>

          <div className="form-group">
            <label className="label">Notes</label>
            <textarea
              {...register('notes')}
              rows={3}
              className="input"
              placeholder="Additional notes about this loan"
            />
          </div>

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
                  {isEditing ? 'Updating...' : 'Creating...'}
                </div>
              ) : (
                isEditing ? 'Update Loan' : 'Create Loan'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoanForm;


