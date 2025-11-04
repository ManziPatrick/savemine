import { useState, useEffect } from 'react';
import { XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { contactsAPI } from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import toast from 'react-hot-toast';

function BulkSMSForm({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [message, setMessage] = useState('');
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  // Load contacts on component mount
  useEffect(() => {
    const fetchContacts = async () => {
      setLoadingContacts(true);
      try {
        const response = await contactsAPI.getContacts({ limit: 100 });
        setContacts(response.data.data);
      } catch (error) {
        toast.error('Failed to load contacts');
      } finally {
        setLoadingContacts(false);
      }
    };

    fetchContacts();
  }, []);

  const handleContactToggle = (contactId) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleSelectAll = () => {
    if (selectedContacts.length === contacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(contacts.map(contact => contact._id));
    }
  };

  const handleSendBulkSMS = async () => {
    if (selectedContacts.length === 0) {
      toast.error('Please select at least one contact');
      return;
    }

    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setLoading(true);
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const contactId of selectedContacts) {
        try {
          const contact = contacts.find(c => c._id === contactId);
          if (contact && contact.phone) {
            // Here you would call your SMS API
            // For now, we'll simulate the API call
            await new Promise(resolve => setTimeout(resolve, 100));
            successCount++;
          }
        } catch (error) {
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`SMS sent to ${successCount} contacts`);
      }
      
      if (errorCount > 0) {
        toast.error(`Failed to send SMS to ${errorCount} contacts`);
      }

      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Failed to send bulk SMS');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Send Bulk SMS
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Message Input */}
          <div className="form-group">
            <label className="label">Message *</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="input"
              placeholder="Enter your message here..."
              maxLength={500}
            />
            <div className="text-sm text-gray-500 mt-1">
              {message.length}/500 characters
            </div>
          </div>

          {/* Contact Selection */}
          <div className="form-group">
            <div className="flex justify-between items-center mb-3">
              <label className="label mb-0">Select Contacts</label>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-sm text-primary-600 hover:text-primary-800"
              >
                {selectedContacts.length === contacts.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            
            {loadingContacts ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="md" />
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md">
                {contacts.map((contact) => (
                  <label
                    key={contact._id}
                    className="flex items-center p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={selectedContacts.includes(contact._id)}
                      onChange={() => handleContactToggle(contact._id)}
                      className="mr-3 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {contact.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {contact.phone} • {contact.type}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
            
            <div className="text-sm text-gray-500 mt-2">
              {selectedContacts.length} of {contacts.length} contacts selected
            </div>
          </div>

          {/* Preview */}
          {selectedContacts.length > 0 && message && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                Message Preview
              </h3>
              <div className="text-sm text-gray-700 bg-white p-3 rounded border">
                {message}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                This message will be sent to {selectedContacts.length} contact(s)
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
              onClick={handleSendBulkSMS}
              className="btn btn-primary"
              disabled={loading || selectedContacts.length === 0 || !message.trim()}
            >
              {loading ? (
                <div className="flex items-center">
                  <LoadingSpinner size="sm" className="mr-2" />
                  Sending...
                </div>
              ) : (
                <>
                  <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                  Send to {selectedContacts.length} Contacts
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BulkSMSForm;
