import { Alert } from 'react-native';

/**
 * Handle API errors with special handling for offline errors
 */
export const handleApiError = (error, defaultMessage = 'An error occurred. Please try again.') => {
  // Check if it's an offline error
  if (error.isOffline || error.name === 'OfflineError') {
    Alert.alert(
      'Offline Mode',
      error.message || 'Data saved locally and will sync when online.',
      [{ text: 'OK' }]
    );
    return;
  }

  // Handle regular API errors
  const message = error.response?.data?.message || error.message || defaultMessage;
  
  Alert.alert(
    'Error',
    message,
    [{ text: 'OK' }]
  );
};

/**
 * Handle success with optional offline notification
 */
export const handleApiSuccess = (message, isOffline = false) => {
  Alert.alert(
    'Success',
    isOffline 
      ? `${message}\n\nNote: You're offline. Changes will sync when online.`
      : message,
    [{ text: 'OK' }]
  );
};

