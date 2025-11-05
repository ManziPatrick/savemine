import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import api from '../config/api';

const SYNC_QUEUE_KEY = '@sync_queue';
const OFFLINE_DATA_PREFIX = '@offline_data_';

// Check if device is online
export const isOnline = async () => {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected && state.isInternetReachable !== false;
  } catch (error) {
    return false;
  }
};

// Get sync queue
export const getSyncQueue = async () => {
  try {
    const queueJson = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
    return queueJson ? JSON.parse(queueJson) : [];
  } catch (error) {
    console.error('Error getting sync queue:', error);
    return [];
  }
};

// Add to sync queue
export const addToSyncQueue = async (operation) => {
  try {
    const queue = await getSyncQueue();
    const newOperation = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...operation,
    };
    queue.push(newOperation);
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    return newOperation.id;
  } catch (error) {
    console.error('Error adding to sync queue:', error);
    throw error;
  }
};

// Remove from sync queue
export const removeFromSyncQueue = async (operationId) => {
  try {
    const queue = await getSyncQueue();
    const filteredQueue = queue.filter(op => op.id !== operationId);
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(filteredQueue));
  } catch (error) {
    console.error('Error removing from sync queue:', error);
  }
};

// Store data locally with key pattern
export const storeOfflineData = async (resourceType, resourceId, data) => {
  try {
    const storageKey = `${OFFLINE_DATA_PREFIX}${resourceType}_${resourceId}`;
    await AsyncStorage.setItem(storageKey, JSON.stringify({
      data,
      timestamp: new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Error storing offline data:', error);
    throw error;
  }
};

// Get offline data
export const getOfflineData = async (resourceType, resourceId) => {
  try {
    const storageKey = `${OFFLINE_DATA_PREFIX}${resourceType}_${resourceId}`;
    const dataJson = await AsyncStorage.getItem(storageKey);
    if (dataJson) {
      const parsed = JSON.parse(dataJson);
      return parsed.data;
    }
    return null;
  } catch (error) {
    console.error('Error getting offline data:', error);
    return null;
  }
};

// Get all offline data for a resource type
export const getAllOfflineData = async (resourceType) => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const prefix = `${OFFLINE_DATA_PREFIX}${resourceType}_`;
    const relevantKeys = allKeys.filter(key => key.startsWith(prefix));
    
    const data = [];
    for (const key of relevantKeys) {
      const dataJson = await AsyncStorage.getItem(key);
      if (dataJson) {
        const parsed = JSON.parse(dataJson);
        data.push(parsed.data);
      }
    }
    return data;
  } catch (error) {
    console.error('Error getting all offline data:', error);
    return [];
  }
};

// Clear offline data
export const clearOfflineData = async (resourceType, resourceId) => {
  try {
    const storageKey = `${OFFLINE_DATA_PREFIX}${resourceType}_${resourceId}`;
    await AsyncStorage.removeItem(storageKey);
  } catch (error) {
    console.error('Error clearing offline data:', error);
  }
};

// Execute sync operation
const executeSyncOperation = async (operation) => {
  try {
    const { method, endpoint, data, id } = operation;
    
    // Check if we're still online before attempting sync
    const online = await isOnline();
    if (!online) {
      throw new Error('Lost connection during sync');
    }
    
    let response;
    switch (method.toLowerCase()) {
      case 'post':
        response = await api.post(endpoint, data);
        break;
      case 'put':
        response = await api.put(endpoint, data);
        break;
      case 'patch':
        response = await api.patch(endpoint, data);
        break;
      case 'delete':
        response = await api.delete(endpoint);
        break;
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
    
    // Clear offline data if it exists
    if (operation.resourceType && operation.resourceId) {
      await clearOfflineData(operation.resourceType, operation.resourceId);
    }
    
    // Remove from queue on success
    await removeFromSyncQueue(operation.id);
    return { success: true, operationId: id, response };
  } catch (error) {
    // Don't remove from queue if it's a network error - will retry later
    const isNetworkError = !error.response && (
      error.message?.includes('Network') || 
      error.message?.includes('timeout') ||
      error.message?.includes('connection') ||
      error.code === 'NETWORK_ERROR' ||
      error.code === 'ECONNABORTED'
    );
    
    if (!isNetworkError && error.response?.status !== 429) {
      // If it's not a network error and not rate limit, might be a permanent error
      // Log it but keep in queue for one more retry
      console.error('Error executing sync operation:', error);
    }
    
    throw error;
  }
};

// Sync pending operations
export const syncPendingOperations = async () => {
  const online = await isOnline();
  if (!online) {
    return { synced: 0, failed: 0, errors: [] };
  }

  const queue = await getSyncQueue();
  if (queue.length === 0) {
    return { synced: 0, failed: 0, errors: [] };
  }

  let synced = 0;
  let failed = 0;
  const errors = [];

  // Process queue in order (create a copy to avoid modifying while iterating)
  const queueCopy = [...queue];
  
  for (const operation of queueCopy) {
    // Double-check we're still online before each operation
    const stillOnline = await isOnline();
    if (!stillOnline) {
      break; // Stop syncing if we lost connection
    }
    
    try {
      await executeSyncOperation(operation);
      synced++;
    } catch (error) {
      // Check if it's a network error
      const isNetworkError = !error.response && (
        error.message?.includes('Network') || 
        error.message?.includes('timeout') ||
        error.message?.includes('connection') ||
        error.code === 'NETWORK_ERROR'
      );
      
      // Only count as failed if it's not a network error (network errors will retry)
      if (!isNetworkError) {
        failed++;
        errors.push({ 
          operationId: operation.id, 
          error: error.message || error.response?.data?.message || 'Unknown error',
          status: error.response?.status 
        });
        
        // Stop syncing if we hit too many non-network errors (might be server issue)
        if (failed >= 5) {
          break;
        }
      } else {
        // Network error - break and retry later
        break;
      }
    }
  }

  return { synced, failed, errors, queueLength: queue.length };
};

// Wrapper for API calls that handles offline mode
export const offlineApiCall = async (apiCall, operation) => {
  const online = await isOnline();
  
  if (online) {
    try {
      // Try to make the API call
      const result = await apiCall();
      
      // If successful, try to sync any pending operations in background (non-blocking)
      syncPendingOperations().catch(err => {
        console.error('Background sync error:', err);
      });
      
      return result;
    } catch (error) {
      // If API call fails, check if it's a network error
      const isNetworkError = !error.response && (
        error.message?.includes('Network') || 
        error.message?.includes('timeout') ||
        error.message?.includes('ECONNREFUSED') ||
        error.message?.includes('ENOTFOUND') ||
        error.code === 'NETWORK_ERROR' ||
        error.code === 'ECONNABORTED' ||
        error.code === 'ECONNREFUSED'
      );
      
      // Also check axios error codes
      const isAxiosNetworkError = error.code === 'ERR_NETWORK' || 
                                   error.code === 'ETIMEDOUT' ||
                                   error.code === 'ECONNABORTED';
      
      if ((isNetworkError || isAxiosNetworkError) && operation) {
        // Network error - store offline
        try {
          await addToSyncQueue({
            type: operation.type,
            resourceType: operation.resourceType,
            resourceId: operation.id || operation.resourceId,
            endpoint: operation.endpoint,
            method: operation.method,
            data: operation.data,
          });
          
          // Store data locally if it's a create/update operation
          if (operation.type === 'create' || operation.type === 'update') {
            const resourceId = operation.type === 'create' ? `temp_${Date.now()}` : (operation.id || operation.resourceId);
            await storeOfflineData(operation.resourceType, resourceId, operation.data);
          }
          
          // Create a user-friendly error
          const offlineError = new Error('Offline mode - data will be synced when online');
          offlineError.isOffline = true;
          offlineError.name = 'OfflineError';
          throw offlineError;
        } catch (queueError) {
          // If queue storage fails, throw original error
          console.error('Error adding to sync queue:', queueError);
          throw error;
        }
      }
      throw error;
    }
  } else {
    // Offline - store operation
    if (operation) {
      try {
        await addToSyncQueue({
          type: operation.type,
          resourceType: operation.resourceType,
          resourceId: operation.id || operation.resourceId,
          endpoint: operation.endpoint,
          method: operation.method,
          data: operation.data,
        });
        
        // Store data locally if it's a create/update operation
        if (operation.type === 'create' || operation.type === 'update') {
          const resourceId = operation.type === 'create' ? `temp_${Date.now()}` : (operation.id || operation.resourceId);
          await storeOfflineData(operation.resourceType, resourceId, operation.data);
        }
        
        // Create a user-friendly error
        const offlineError = new Error('Offline mode - data will be synced when online');
        offlineError.isOffline = true;
        offlineError.name = 'OfflineError';
        throw offlineError;
      } catch (queueError) {
        // If queue storage fails, throw error
        console.error('Error storing offline operation:', queueError);
        const offlineError = new Error('Failed to save offline. Please try again.');
        offlineError.isOffline = true;
        offlineError.name = 'OfflineError';
        throw offlineError;
      }
    } else {
      const offlineError = new Error('Offline mode - Please check your connection');
      offlineError.isOffline = true;
      offlineError.name = 'OfflineError';
      throw offlineError;
    }
  }
};

// Initialize sync listener
let unsubscribe = null;

export const initializeSync = () => {
  if (unsubscribe) {
    unsubscribe();
  }
  
  unsubscribe = NetInfo.addEventListener(state => {
    if (state.isConnected && state.isInternetReachable !== false) {
      // Online - sync pending operations
      syncPendingOperations().then(result => {
        if (result.synced > 0) {
          console.log(`Synced ${result.synced} operations`);
        }
      }).catch(err => {
        console.error('Sync error:', err);
      });
    }
  });
};

// Cleanup sync listener
export const cleanupSync = () => {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
};

