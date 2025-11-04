import { useState } from 'react';
import { XMarkIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline';
import { loansAPI } from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import toast from 'react-hot-toast';

function ImportLoansForm({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [errors, setErrors] = useState([]);
  const [replaceAll, setReplaceAll] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    parseCSV(selectedFile);
  };

  const parseCSV = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast.error('CSV file must have at least a header row and one data row');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim());
      
      const loans = [];
      const newErrors = [];

      for (let i = 1; i < lines.length; i++) {
        // Parse CSV line properly handling quoted fields
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let j = 0; j < lines[i].length; j++) {
          const char = lines[i][j];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim());

        const loan = {};

        headers.forEach((header, index) => {
          const value = values[index] || '';
          const headerLower = header.toLowerCase();

          if (headerLower.includes('contact') && headerLower.includes('id')) {
            loan.contactId = value;
          } else if (headerLower.includes('contact') && headerLower.includes('name')) {
            loan.contactName = value;
          } else if (headerLower.includes('loan') && headerLower.includes('type')) {
            loan.loanType = value.toLowerCase();
          } else if (headerLower.includes('principal') || (headerLower.includes('amount') && !headerLower.includes('total'))) {
            loan.principalAmount = parseFloat(value) || 0;
          } else if (headerLower.includes('interest') && headerLower.includes('rate')) {
            loan.interestRate = parseFloat(value) || 0;
          } else if (headerLower.includes('interest') && headerLower.includes('type')) {
            loan.interestType = value.toLowerCase();
          } else if (headerLower.includes('due') && headerLower.includes('date')) {
            loan.dueDate = value;
          } else if (headerLower.includes('payment') && headerLower.includes('frequency')) {
            loan.paymentFrequency = value.toLowerCase();
          } else if (headerLower.includes('installment') && headerLower.includes('amount')) {
            loan.installmentAmount = parseFloat(value) || 0;
          } else if (headerLower.includes('collateral')) {
            loan.collateralDescription = value;
          } else if (headerLower.includes('notes')) {
            loan.notes = value;
          } else if (headerLower.includes('tags')) {
            loan.tags = value.split(',').map(tag => tag.trim()).filter(tag => tag);
          }
        });

        // Validate required fields
        if (!loan.contactId && !loan.contactName) {
          newErrors.push(`Row ${i + 1}: Missing contact ID or contact name`);
          continue;
        }

        if (!loan.principalAmount || loan.principalAmount <= 0) {
          newErrors.push(`Row ${i + 1}: Missing or invalid principal amount`);
          continue;
        }

        if (!loan.dueDate) {
          newErrors.push(`Row ${i + 1}: Missing due date`);
          continue;
        }

        // Validate dates
        const dueDate = new Date(loan.dueDate);
        if (isNaN(dueDate.getTime())) {
          newErrors.push(`Row ${i + 1}: Invalid due date format`);
          continue;
        }

        // Validate loan type
        const validLoanTypes = ['personal', 'business', 'animal', 'emergency', 'investment'];
        if (loan.loanType && !validLoanTypes.includes(loan.loanType)) {
          loan.loanType = 'personal'; // Default to personal
        }

        // Validate interest type
        const validInterestTypes = ['simple', 'compound', 'none'];
        if (loan.interestType && !validInterestTypes.includes(loan.interestType)) {
          loan.interestType = 'simple'; // Default to simple
        }

        // Validate payment frequency
        const validPaymentFrequencies = ['one-time', 'weekly', 'monthly', 'quarterly', 'yearly'];
        if (loan.paymentFrequency && !validPaymentFrequencies.includes(loan.paymentFrequency)) {
          loan.paymentFrequency = 'one-time'; // Default to one-time
        }

        // Add collateral info if provided
        if (loan.collateralDescription) {
          loan.collateral = {
            description: loan.collateralDescription,
            type: 'other'
          };
        }

        loans.push(loan);
      }

      setPreview(loans);
      setErrors(newErrors);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (preview.length === 0) {
      toast.error('No valid loans to import');
      return;
    }

    setLoading(true);
    try {
      const response = await loansAPI.bulkImportLoans(preview, replaceAll);
      const { imported, created, updated, deleted, failed, total, errors } = response.data.data;

      if (imported > 0) {
        let message = `Successfully processed ${imported} out of ${total} loans`;
        if (replaceAll && deleted > 0) {
          message += ` (replaced ${deleted} existing loans)`;
        } else if (created > 0 && updated > 0) {
          message += ` (${created} created, ${updated} updated)`;
        } else if (created > 0) {
          message += ` (${created} created)`;
        } else if (updated > 0) {
          message += ` (${updated} updated)`;
        }
        toast.success(message);
        onSuccess();
        onClose();
      }

      if (failed > 0) {
        if (errors.length > 0) {
          console.error('Import errors:', errors);
          // Show first few errors in toast
          const errorPreview = errors.slice(0, 3).join('; ');
          toast.error(`Errors: ${errorPreview}${errors.length > 3 ? '...' : ''}`);
        }
      }
    } catch (error) {
      toast.error('Failed to import loans');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Import Loans</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select CSV File
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
              <DocumentArrowUpIcon className="h-8 w-8 text-gray-400" />
            </div>
          </div>

          {/* Instructions */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">CSV Format Requirements:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Required columns:</strong> Contact ID, Principal Amount, Due Date</li>
              <li>• <strong>Optional columns:</strong> Loan Type, Interest Rate, Interest Type, Payment Frequency, Installment Amount, Collateral, Notes, Tags</li>
              <li>• <strong>Date format:</strong> YYYY-MM-DD or MM/DD/YYYY</li>
              <li>• <strong>Loan types:</strong> personal, business, animal, emergency, investment</li>
              <li>• <strong>Interest types:</strong> simple, compound, none</li>
            </ul>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 rounded-lg">
              <h3 className="text-sm font-medium text-red-900 mb-2">
                Import Errors ({errors.length})
              </h3>
              <div className="text-sm text-red-800 space-y-1 max-h-32 overflow-y-auto">
                {errors.slice(0, 10).map((error, index) => (
                  <div key={index}>• {error}</div>
                ))}
                {errors.length > 10 && (
                  <div>• ... and {errors.length - 10} more errors</div>
                )}
              </div>
            </div>
          )}

          {/* Preview */}
          {preview.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Preview ({preview.length} loans)
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Interest
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Due Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {preview.slice(0, 10).map((loan, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {loan.contactName || loan.contactId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="badge badge-info">
                            {loan.loanType || 'personal'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(loan.principalAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {loan.interestRate > 0 ? `${loan.interestRate}% ${loan.interestType || 'simple'}` : 'No interest'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(loan.dueDate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 10 && (
                  <p className="text-sm text-gray-500 mt-2">
                    Showing first 10 of {preview.length} loans
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Import Options */}
          {preview.length > 0 && (
            <div className="border-t pt-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="replaceAll"
                  checked={replaceAll}
                  onChange={(e) => setReplaceAll(e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="replaceAll" className="text-sm text-gray-700">
                  <span className="font-medium">Replace all existing loans</span>
                  <span className="text-gray-500 ml-1">
                    (This will delete all current loans and import only the new ones)
                  </span>
                </label>
              </div>
            </div>
          )}

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
              onClick={handleImport}
              className={`btn ${replaceAll ? 'btn-danger' : 'btn-primary'}`}
              disabled={loading || preview.length === 0}
            >
              {loading ? (
                <div className="flex items-center">
                  <LoadingSpinner size="sm" className="mr-2" />
                  Importing...
                </div>
              ) : (
                <span>
                  {replaceAll ? 'Replace All & ' : ''}Import {preview.length} Loans
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImportLoansForm;
