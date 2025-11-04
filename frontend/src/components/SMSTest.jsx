import { useState } from 'react';
import { useMutation } from 'react-query';
import { PhoneIcon, PaperAirplaneIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { messagesAPI } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import toast from 'react-hot-toast';

function SMSTest({ onClose }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('Hello! This is a test message from SmartMoney FRW. Your SMS integration is working correctly! 📱✅');
  const [testResult, setTestResult] = useState(null);

  const testSMSMutation = useMutation(
    async (testData) => {
      const response = await messagesAPI.testSMS(testData.phone, testData.message);
      return response.data;
    },
    {
      onSuccess: (result) => {
        setTestResult(result.data || result);
        toast.success('SMS test completed successfully!');
      },
      onError: (error) => {
        setTestResult({
          success: false,
          error: error.response?.data?.message || error.message
        });
        toast.error('SMS test failed: ' + (error.response?.data?.message || error.message));
      }
    }
  );

  const handleTestSMS = (e) => {
    e.preventDefault();
    
    if (!phoneNumber.trim()) {
      toast.error('Please enter a phone number');
      return;
    }

    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    // Basic phone number validation
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length < 9 || cleanPhone.length > 13) {
      toast.error('Please enter a valid phone number');
      return;
    }

    testSMSMutation.mutate({
      phone: phoneNumber,
      message: message
    });
  };

  const formatPhoneNumber = (value) => {
    // Remove all non-digit characters
    const phoneNumber = value.replace(/\D/g, '');
    
    // Format based on length
    if (phoneNumber.length <= 3) {
      return phoneNumber;
    } else if (phoneNumber.length <= 6) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    } else if (phoneNumber.length <= 10) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6)}`;
    } else {
      return `+${phoneNumber.slice(0, 3)} ${phoneNumber.slice(3, 6)} ${phoneNumber.slice(6, 9)} ${phoneNumber.slice(9)}`;
    }
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <PhoneIcon className="h-6 w-6 mr-2 text-primary-600" />
              Test SMS Integration
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleTestSMS} className="space-y-4">
            {/* Phone Number */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                id="phone"
                value={phoneNumber}
                onChange={handlePhoneChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="+250 788 123 456"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter phone number in international format (e.g., +250788123456)
              </p>
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Test Message *
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter your test message..."
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                {message.length} characters
              </p>
            </div>

            {/* Test Result */}
            {testResult && (
              <div className={`p-4 rounded-lg ${
                testResult.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center">
                  {testResult.success ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                  ) : (
                    <XCircleIcon className="h-5 w-5 text-red-600 mr-2" />
                  )}
                  <div>
                    <h4 className={`font-medium ${
                      testResult.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {testResult.success ? 'SMS Test Successful!' : 'SMS Test Failed'}
                    </h4>
                    {testResult.success ? (
                      <div className="text-sm text-green-600 mt-1">
                        <p>Phone: {testResult.phone}</p>
                        {testResult.messageId && <p>Message ID: {testResult.messageId}</p>}
                        {testResult.status && <p>Status: {testResult.status}</p>}
                      </div>
                    ) : (
                      <p className="text-sm text-red-600 mt-1">
                        Error: {testResult.error || 'Unknown error'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                disabled={testSMSMutation.isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={testSMSMutation.isLoading}
              >
                {testSMSMutation.isLoading ? (
                  <div className="flex items-center">
                    <LoadingSpinner size="sm" className="mr-2" />
                    Testing...
                  </div>
                ) : (
                  <>
                    <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                    Send Test SMS
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 mb-2">About SMS Testing</h4>
            <ul className="text-xs text-blue-600 space-y-1">
              <li>• This will send a real SMS using the Mista API</li>
              <li>• Make sure you have sufficient credits in your account</li>
              <li>• Test messages are charged at normal rates</li>
              <li>• Use your own phone number for testing</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SMSTest;
