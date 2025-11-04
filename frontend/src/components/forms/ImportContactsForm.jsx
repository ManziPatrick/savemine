import { useState } from 'react';
import { XMarkIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline';
import { contactsAPI } from '../../services/api';
import { formatRwandaPhone, validatePhone, cleanPhone } from '../../utils/phoneUtils';
import LoadingSpinner from '../LoadingSpinner';
import toast from 'react-hot-toast';

function ImportContactsForm({ onClose, onSuccess }) {
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
      
      // Check if this is a Google Contacts export
      const isGoogleContacts = headers.some(h => {
        const headerLower = h.toLowerCase();
        return headerLower.includes('first name') ||
               headerLower.includes('last name') ||
               headerLower.includes('middle name') ||
               headerLower.includes('middle nar') ||
               headerLower.includes('phonetic fi') ||
               headerLower.includes('phonetic m') ||
               headerLower.includes('phonetic la') ||
               headerLower.includes('name prefi') ||
               headerLower.includes('name suffi') ||
               headerLower.includes('nickname') ||
               headerLower.includes('group') ||
               headerLower.includes('category') ||
               headerLower.includes('phone') ||
               headerLower.includes('e-mail') ||
               headerLower.includes('organization') ||
               headerLower.includes('address') ||
               headerLower.includes('notes');
      });

      const contacts = [];
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

        const contact = {};

        if (isGoogleContacts) {
          // Handle Google Contacts format
          headers.forEach((header, index) => {
            const value = values[index] || '';

            const headerLower = header.toLowerCase();
            
            // Handle all name fields from Google Contacts
            if (headerLower.includes('first name')) {
              contact.firstName = value;
            } else if (headerLower.includes('middle name') || headerLower.includes('middle nar')) {
              contact.middleName = value;
            } else if (headerLower.includes('last name')) {
              contact.lastName = value;
            } else if (headerLower.includes('phonetic fi')) {
              contact.phoneticFirstName = value;
            } else if (headerLower.includes('phonetic m')) {
              contact.phoneticMiddleName = value;
            } else if (headerLower.includes('phonetic la')) {
              contact.phoneticLastName = value;
            } else if (headerLower.includes('name prefi')) {
              contact.namePrefix = value;
            } else if (headerLower.includes('name suffi')) {
              contact.nameSuffix = value;
            } else if (headerLower.includes('nickname')) {
              contact.nickname = value;
            } else if (headerLower.includes('name') && !contact.name && !contact.firstName && !contact.nickname) {
              contact.name = value;
            } else if (headerLower.includes('group') || headerLower.includes('category')) {
              // Handle group/category fields that might contain names
              contact.group = value;
            } else if (headerLower.includes('phone 1 - value') || (headerLower.includes('phone') && !contact.phone)) {
              contact.phone = value;
            } else if (headerLower.includes('e-mail 1 - value') || (headerLower.includes('e-mail') && !contact.email)) {
              contact.email = value;
            } else if (headerLower.includes('address 1 - formatted') || (headerLower.includes('address') && !contact.address)) {
              contact.address = value;
            } else if (headerLower.includes('notes')) {
              contact.notes = value;
            } else if (headerLower.includes('organization 1 - name')) {
              contact.organization = value;
            }
          });

          // Check if First Name is actually a phone number (starts with 0 or +)
          const isPhoneInName = contact.firstName && /^[0+]/.test(contact.firstName.trim());
          
          if (isPhoneInName) {
            // If First Name is actually a phone number, use it as phone and skip name
            if (!contact.phone) {
              contact.phone = contact.firstName.trim();
            }
            contact.firstName = '';
          }

          // Build name from all available name fields
          const nameParts = [];
          
          // Add name prefix (Mr., Ms., Dr., etc.)
          if (contact.namePrefix && contact.namePrefix.trim()) {
            nameParts.push(contact.namePrefix.trim());
          }
          
          // Add first name (if not a phone number)
          if (contact.firstName && contact.firstName.trim() && !isPhoneInName) {
            nameParts.push(contact.firstName.trim());
          }
          
          // Add middle name
          if (contact.middleName && contact.middleName.trim()) {
            nameParts.push(contact.middleName.trim());
          }
          
          // Add last name
          if (contact.lastName && contact.lastName.trim()) {
            nameParts.push(contact.lastName.trim());
          }
          
          // Add name suffix (Jr., Sr., III, etc.)
          if (contact.nameSuffix && contact.nameSuffix.trim()) {
            nameParts.push(contact.nameSuffix.trim());
          }
          
          // If we have name parts, join them
          if (nameParts.length > 0) {
            contact.name = nameParts.join(' ').trim();
          }
          
          // If still no name, try alternative name fields (including nickname)
          if (!contact.name) {
            const alternativeNames = [
              contact.nickname,              // Check nickname first
              contact.phoneticFirstName,     // Phonetic versions
              contact.phoneticMiddleName,
              contact.phoneticLastName,
              contact.organization           // Organization as last resort
            ].filter(name => name && name.trim() && !/^[0+]/.test(name.trim()));
            
            if (alternativeNames.length > 0) {
              contact.name = alternativeNames[0].trim();
            } else if (contact.phone) {
              // Use the phone number digits as the name when all name fields are empty
              const cleanPhone = contact.phone.replace(/\D/g, '');
              if (cleanPhone.length >= 9) {
                // Use the last 10 digits of the phone number as the name
                contact.name = cleanPhone.slice(-10);
              }
            }
          }
          
          // Special handling for contacts with only nickname or special characters
          if (contact.name && contact.name.includes('*')) {
            // Clean up names with asterisks (like "* myContacts")
            contact.name = contact.name.replace(/^\*\s*/, '').trim();
          }
          
          // If we still have a very short or unclear name, prefer nickname if available
          if (contact.name && contact.name.length < 3 && contact.nickname && contact.nickname.trim()) {
            contact.name = contact.nickname.trim();
          }
          
          // Final fallback: search all fields for any potential name
          if (!contact.name || contact.name.length < 2) {
            const allFields = [
              contact.firstName,
              contact.middleName,
              contact.lastName,
              contact.nickname,
              contact.phoneticFirstName,
              contact.phoneticMiddleName,
              contact.phoneticLastName,
              contact.namePrefix,
              contact.nameSuffix,
              contact.organization,
              contact.group
            ];
            
            // Find the first field that looks like a name (not a phone number)
            const potentialName = allFields.find(field => 
              field && 
              field.trim() && 
              field.trim().length >= 2 && 
              !/^[0+]/.test(field.trim()) &&
              !/^\d+$/.test(field.trim()) // Not just digits
            );
            
            if (potentialName) {
              contact.name = potentialName.trim();
            }
          }
        } else {
          // Handle our custom format
          headers.forEach((header, index) => {
            contact[header] = values[index] || '';
          });
        }

        // Process phone number
        if (contact.phone) {
          const cleanedPhone = cleanPhone(contact.phone);
          const formattedPhone = formatRwandaPhone(cleanedPhone);
          
          console.log(`Phone processing: "${contact.phone}" -> "${cleanedPhone}" -> "${formattedPhone}"`);
          
          if (!formattedPhone) {
            continue; // Skip invalid phone numbers silently
          }
          
          if (!validatePhone(formattedPhone)) {
            continue; // Skip invalid phone numbers silently
          }
          
          contact.phone = formattedPhone;
        }

        // Set default type if not provided
        if (!contact.type) {
          contact.type = 'debtor';
        }

        // Skip if no name or phone
        if (!contact.name || !contact.phone) {
          continue; // Skip silently
        }

        contacts.push(contact);
      }

      setPreview(contacts);
      setErrors(newErrors);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (preview.length === 0) {
      toast.error('No valid contacts to import');
      return;
    }

    setLoading(true);
    try {
      const response = await contactsAPI.bulkImportContacts(preview, replaceAll);
      const { imported, created, updated, deleted, failed, total, errors } = response.data.data;

      if (imported > 0) {
        let message = `Successfully processed ${imported} out of ${total} contacts`;
        if (replaceAll && deleted > 0) {
          message += ` (replaced ${deleted} existing contacts)`;
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
      toast.error('Failed to import contacts');
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
            <h2 className="text-xl font-semibold text-gray-900">Import Contacts</h2>
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
            <h3 className="text-sm font-medium text-blue-900 mb-2">Supported Formats:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Google Contacts CSV export (automatically detected)</li>
              <li>• Custom CSV with columns: Name, Phone, Type, Email, Address, Organization, Notes</li>
            </ul>
            <div className="mt-3 text-sm text-blue-800">
              <strong>Phone Number Formatting:</strong>
              <ul className="mt-1 space-y-1">
                <li>• Rwanda numbers: 0788123456 → +250788123456</li>
                <li>• International numbers: Preserved as-is</li>
                <li>• Invalid numbers: Silently skipped</li>
              </ul>
            </div>
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Preview ({preview.length} contacts)
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {preview.slice(0, 10).map((contact, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {contact.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {contact.phone}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`badge ${
                            contact.type === 'debtor' ? 'badge-danger' :
                            contact.type === 'creditor' ? 'badge-success' :
                            'badge-info'
                          }`}>
                            {contact.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {contact.email || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 10 && (
                  <p className="text-sm text-gray-500 mt-2">
                    Showing first 10 of {preview.length} contacts
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
                  <span className="font-medium">Replace all existing contacts</span>
                  <span className="text-gray-500 ml-1">
                    (This will delete all current contacts and import only the new ones)
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
                  {replaceAll ? 'Replace All & ' : ''}Import {preview.length} Contacts
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImportContactsForm;
