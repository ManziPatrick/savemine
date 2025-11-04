import { useState, useEffect } from 'react';
import { loansAPI } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import toast from 'react-hot-toast';

function LoanSourceManager() {
  const [sources, setSources] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState('');

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    setLoading(true);
    try {
      const response = await loansAPI.getLoanSources();
      setSources(response.data.data);
    } catch (error) {
      toast.error('Failed to load sources');
    } finally {
      setLoading(false);
    }
  };

  const getSourceTypeLabel = (type) => {
    const labels = {
      petty_cash: 'Petty Cash',
      income: 'Income',
      savings: 'Savings',
      business: 'Business',
      other: 'Other'
    };
    return labels[type] || type;
  };

  const formatCurrency = (amount, currency = 'FRW') => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Loan Sources</h2>
        <p className="text-sm text-gray-600">Manage available sources for loan creation</p>
      </div>

      <div className="p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Source Type
          </label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="input"
          >
            <option value="">All Types</option>
            <option value="petty_cash">Petty Cash</option>
            <option value="income">Income</option>
            <option value="savings">Savings</option>
            <option value="business">Business</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(sources)
            .filter(([type]) => !selectedType || type === selectedType)
            .map(([type, sourceList]) => (
              <div key={type} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    {getSourceTypeLabel(type)}
                  </h3>
                  <span className="text-sm text-gray-500">
                    {sourceList.length} source{sourceList.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="space-y-2">
                  {sourceList.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No sources available</p>
                  ) : (
                    sourceList.map((source) => (
                      <div
                        key={source.id || 'default'}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {source.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatCurrency(Number(source.balance) || 0, source.currency)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Available
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total Balance:</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(
                        sourceList.reduce((sum, source) => {
                          const balance = Number(source.balance) || 0;
                          return sum + balance;
                        }, 0),
                        sourceList[0]?.currency || 'FRW'
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                About Loan Sources
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Loan sources determine where the money for loans comes from. You can select from:
                </p>
                <ul className="mt-2 list-disc list-inside space-y-1">
                  <li><strong>Petty Cash:</strong> General cash on hand</li>
                  <li><strong>Income:</strong> Money from income sources</li>
                  <li><strong>Savings:</strong> Money from savings accounts</li>
                  <li><strong>Business:</strong> Money from business accounts</li>
                  <li><strong>Other:</strong> Custom sources</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoanSourceManager;
