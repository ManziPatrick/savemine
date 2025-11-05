import * as Contacts from 'expo-contacts';
import { Platform, Alert } from 'react-native';
import { contactsAPI } from '../services/api';

/**
 * Request contacts permission
 */
export const requestContactsPermission = async () => {
  try {
    const { status } = await Contacts.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting contacts permission:', error);
    return false;
  }
};

/**
 * Get all contacts from device with all phone numbers - exactly as they appear in phone
 * NO API CALLS - pure device access only
 */
export const getDeviceContacts = async () => {
  try {
    const hasPermission = await requestContactsPermission();
    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Please enable contacts permission in settings to use this feature.',
        [{ text: 'OK' }]
      );
      return [];
    }

    const { data } = await Contacts.getContactsAsync({
      fields: [
        Contacts.Fields.Name,
        Contacts.Fields.PhoneNumbers,
        Contacts.Fields.Emails,
      ],
      sort: Contacts.SortTypes.FirstName, // Sort alphabetically like phone contacts
    });

    // Format contacts exactly as they appear in phone - preserve exact names and all phone numbers
    return data
      .filter(contact => contact.name && contact.name.trim() !== '') // Only contacts with names
      .map((contact) => {
        // Get ALL phone numbers exactly as stored in phone
        const phoneNumbers = contact.phoneNumbers?.map(p => p.number).filter(p => p) || [];
        const primaryPhone = phoneNumbers[0] || '';
        
        return {
          id: contact.id,
          name: contact.name, // Use exact name from phone - no modification
          phone: primaryPhone,
          allPhones: phoneNumbers, // Store all phone numbers
          email: contact.emails?.[0]?.email || '',
          allEmails: contact.emails?.map(e => e.email) || [],
          rawContact: contact,
        };
      });
  } catch (error) {
    console.error('Error getting device contacts:', error);
    Alert.alert('Error', 'Failed to load contacts from device');
    return [];
  }
};

/**
 * Import all device contacts to backend
 */
export const importDeviceContacts = async (onProgress) => {
  try {
    const deviceContacts = await getDeviceContacts();
    if (deviceContacts.length === 0) {
      Alert.alert('Info', 'No contacts found on device');
      return { imported: 0, skipped: 0, errors: 0 };
    }

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (let i = 0; i < deviceContacts.length; i++) {
      const deviceContact = deviceContacts[i];
      
      if (onProgress) {
        onProgress(i + 1, deviceContacts.length, deviceContact.name);
      }

      try {
        // Skip if no phone number
        if (!deviceContact.phone) {
          skipped++;
          continue;
        }

        // Check if contact already exists by phone number
        const searchResponse = await contactsAPI.searchContacts(deviceContact.phone, 'phone');
        
        if (searchResponse?.data?.data?.length > 0) {
          // Contact already exists, skip
          skipped++;
          continue;
        }

        // Create new contact in backend
        const newContact = {
          name: deviceContact.name,
          phone: deviceContact.phone,
          email: deviceContact.email || '',
        };

        await contactsAPI.createContact(newContact);
        imported++;
      } catch (error) {
        console.error(`Error importing contact ${deviceContact.name}:`, error);
        errors++;
      }
    }

    return { imported, skipped, errors, total: deviceContacts.length };
  } catch (error) {
    console.error('Error importing device contacts:', error);
    Alert.alert('Error', 'Failed to import contacts from device');
    return { imported: 0, skipped: 0, errors: 0, total: 0 };
  }
};

/**
 * Pick a single contact from device
 */
export const pickContact = async () => {
  try {
    const hasPermission = await requestContactsPermission();
    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Please enable contacts permission in settings to use this feature.',
        [{ text: 'OK' }]
      );
      return null;
    }

    // On iOS, we can use pickContactAsync
    if (Platform.OS === 'ios') {
      const contact = await Contacts.pickContactAsync();
      if (contact) {
        return {
          id: contact.id,
          name: contact.name || 'Unknown',
          phone: contact.phoneNumbers?.[0]?.number || '',
          email: contact.emails?.[0]?.email || '',
          rawContact: contact,
        };
      }
    }

    // On Android, we'll return null and use the list view instead
    return null;
  } catch (error) {
    console.error('Error picking contact:', error);
    return null;
  }
};

/**
 * Find or create contact in backend
 * This matches device contact with backend contact or creates a new one
 */
export const findOrCreateContact = async (deviceContact) => {
  try {
    // First, try to find existing contact by phone number
    if (deviceContact.phone) {
      const searchResponse = await contactsAPI.searchContacts(deviceContact.phone, 'phone');
      if (searchResponse?.data?.data?.length > 0) {
        // Found existing contact
        return searchResponse.data.data[0];
      }
    }

    // If not found, create new contact in backend
    const newContact = {
      name: deviceContact.name,
      phone: deviceContact.phone,
      email: deviceContact.email || '',
    };

    const createResponse = await contactsAPI.createContact(newContact);
    if (createResponse?.data?.data) {
      return createResponse.data.data;
    }

    return null;
  } catch (error) {
    console.error('Error finding/creating contact:', error);
    // Return device contact as fallback
    return {
      _id: deviceContact.id,
      name: deviceContact.name,
      phone: deviceContact.phone,
      email: deviceContact.email,
    };
  }
};

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  // Format based on length (adjust for your region)
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  }
  return phone;
};

