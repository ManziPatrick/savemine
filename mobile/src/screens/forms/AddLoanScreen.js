import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { TextInput, Button, Text, HelperText, SegmentedButtons, ActivityIndicator } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { loansAPI, contactsAPI } from '../../services/api';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import ContactPicker from '../../components/ContactPicker';
import { handleApiError } from '../../utils/errorHandler';

export default function AddLoanScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const queryClient = useQueryClient();
  const { loanId } = route.params || {};
  const isEditing = !!loanId;

  const [selectedSourceType, setSelectedSourceType] = useState('');
  const [selectedSource, setSelectedSource] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState({ givenDate: false, dueDate: false });

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      contactId: '',
      amount: '',
      currency: 'FRW',
      givenDate: new Date(),
      dueDate: new Date(),
      interestRate: '0',
      description: '',
      notes: '',
    },
  });

  const { data: sources } = useQuery({
    queryKey: ['loanSources'],
    queryFn: () => loansAPI.getLoanSources(),
  });

  const createMutation = useMutation({
    mutationFn: loansAPI.createLoan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['loanStats'] });
      Alert.alert('Success', 'Loan created successfully');
      navigation.goBack();
    },
    onError: (error) => {
      if (error.isOffline || error.name === 'OfflineError') {
        Alert.alert(
          'Offline Mode',
          'Loan saved locally and will sync when online.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        handleApiError(error, 'Failed to create loan. Please try again.');
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => loansAPI.updateLoan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['loanStats'] });
      Alert.alert('Success', 'Loan updated successfully');
      navigation.goBack();
    },
    onError: (error) => {
      if (error.isOffline || error.name === 'OfflineError') {
        Alert.alert(
          'Offline Mode',
          'Loan updated locally and will sync when online.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        handleApiError(error, 'Failed to update loan. Please try again.');
      }
    },
  });

  const onSubmit = async (data) => {
    if (!data.contactId) {
      Alert.alert('Error', 'Please select a contact');
      return;
    }

    // Check if device contact was selected (starts with "device_" or is JSON string)
    let finalContactId = data.contactId;
    let selectedPhoneNumber = null;
    let deviceContactName = null;
    let deviceContactPhone = null;
    
    // Check if contactId is a JSON string (contains selected phone)
    try {
      const parsed = JSON.parse(data.contactId);
      if (parsed.contactId && parsed.selectedPhone) {
        finalContactId = parsed.contactId;
        selectedPhoneNumber = parsed.selectedPhone;
      }
    } catch (e) {
      // Not JSON, use as is
    }
    
    if (finalContactId.startsWith('device_')) {
      try {
        // Get device contacts to find the selected one
        const { getDeviceContacts } = require('../../utils/contacts');
        const deviceContacts = await getDeviceContacts();
        const deviceId = finalContactId.replace('device_', '');
        const deviceContact = deviceContacts.find(dc => 
          (dc.id || dc.phone) === deviceId || dc.phone === deviceId
        );

        if (!deviceContact) {
          Alert.alert('Error', 'Could not find device contact details');
          return;
        }

        // Use the selected phone number if available, otherwise use primary phone
        const phoneToUse = selectedPhoneNumber || deviceContact.phone;
        
        if (!phoneToUse) {
          Alert.alert('Error', 'Contact has no phone number');
          return;
        }

        // Format phone number - ensure it starts with +250 for Rwanda
        let formattedPhone = phoneToUse.trim();
        // Remove all non-digit characters except +
        let cleaned = formattedPhone.replace(/[^\d+]/g, '');
        
        // If it doesn't start with +, add +250 (Rwanda country code)
        if (!cleaned.startsWith('+')) {
          // If it starts with 0, replace with +250
          if (cleaned.startsWith('0')) {
            formattedPhone = '+250' + cleaned.substring(1);
          } else if (cleaned.length === 9) {
            // 9 digits - assume Rwanda number (e.g., 781234567)
            formattedPhone = '+250' + cleaned;
          } else if (cleaned.length === 10) {
            // 10 digits starting with 0 (e.g., 0781234567)
            formattedPhone = '+250' + cleaned.substring(1);
          } else {
            // Default: add +250
            formattedPhone = '+250' + cleaned;
          }
        } else {
          formattedPhone = cleaned;
        }

        // Validate phone format matches backend requirements
        // Backend expects: +250[789]\d{8} for Rwanda or +[1-9]\d{9,14} for international
        const rwandaRegex = /^\+250[789]\d{8}$/;
        const internationalRegex = /^\+[1-9]\d{9,14}$/;
        
        if (!rwandaRegex.test(formattedPhone) && !internationalRegex.test(formattedPhone)) {
          Alert.alert('Error', `Invalid phone format: ${formattedPhone}. Please ensure it's a valid Rwanda number (+250...)`);
          return;
        }

        // Store device contact information (update variables already declared above)
        deviceContactName = (deviceContact.name || 'Unknown Contact').trim();
        deviceContactPhone = formattedPhone;
        
        // Remove empty email if invalid
        let contactEmail = deviceContact.email;
        if (contactEmail && (!contactEmail.includes('@') || contactEmail.trim() === '')) {
          contactEmail = undefined;
        }

        const newContactData = {
          name: deviceContactName,
          phone: deviceContactPhone,
          type: 'debtor', // Default type for loans
          allowDuplicate: true, // Backend will skip duplicate check
          ...(contactEmail && { email: contactEmail.trim() }),
        };

        console.log('Creating contact with data:', newContactData);

        // Try to create contact, but ALWAYS find/use existing contact if creation fails
        try {
          const createResponse = await contactsAPI.createContact(newContactData);
          if (createResponse?.data?.data?._id) {
            finalContactId = createResponse.data.data._id;
            console.log('✅ Contact created successfully:', finalContactId);
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
          } else {
            throw new Error('No contact ID returned');
          }
        } catch (createError) {
          console.warn('⚠️ Contact creation failed (duplicate?), finding existing contact...', createError?.response?.data?.message || createError?.message);
          
          // ALWAYS try to find existing contact by phone - MULTIPLE attempts with different formats
          const normalizedPhone = formattedPhone.replace(/\D/g, '');
          let foundContact = false;
          
          // Try multiple search strategies
          const searchPhones = [
            formattedPhone, // Original formatted
            normalizedPhone, // Just digits
            formattedPhone.replace('+', ''), // Without +
            formattedPhone.substring(1), // Without leading +
          ];
          
          try {
            // Strategy 1: Fetch ALL contacts (no limit or high limit)
            console.log('🔍 Searching contacts (all)...');
            const retryContactsData = await contactsAPI.getContacts({ limit: 10000 }).catch(() => ({ data: { data: [] } }));
            const retryContacts = retryContactsData?.data?.data || [];
            
            // Try each phone format
            for (const searchPhone of searchPhones) {
              if (foundContact) break;
              
              const searchNormalized = searchPhone.replace(/\D/g, '');
              
              const retryExisting = retryContacts.find(c => {
                if (!c.phone) return false;
                const contactPhone = c.phone.replace(/\D/g, '');
                // Try exact match and also check if numbers match
                return contactPhone === searchNormalized || 
                       contactPhone === normalizedPhone ||
                       contactPhone.endsWith(searchNormalized.slice(-9)) || // Last 9 digits
                       searchNormalized.endsWith(contactPhone.slice(-9));
              });
              
              if (retryExisting) {
                finalContactId = retryExisting._id;
                foundContact = true;
                console.log('✅ Found existing contact:', finalContactId, retryExisting.name, retryExisting.phone);
                queryClient.invalidateQueries({ queryKey: ['contacts'] });
                break;
              }
            }
          } catch (fetchError) {
            console.warn('⚠️ Could not fetch contacts:', fetchError);
          }
          
          // Strategy 2: If still not found, try creating with minimal data
          if (!foundContact) {
            try {
              console.log('⚠️ Trying to create with minimal data...');
              const minimalContactData = {
                name: deviceContactName,
                phone: deviceContactPhone,
                type: 'debtor',
                allowDuplicate: true,
              };
              const minimalResponse = await contactsAPI.createContact(minimalContactData);
              if (minimalResponse?.data?.data?._id) {
                finalContactId = minimalResponse.data.data._id;
                foundContact = true;
                console.log('✅ Contact created with minimal data:', finalContactId);
                queryClient.invalidateQueries({ queryKey: ['contacts'] });
              }
            } catch (minimalError) {
              console.warn('⚠️ Minimal contact creation also failed:', minimalError?.response?.data?.message);
              // If it's a duplicate error, the contact exists - try one more search
              if (minimalError?.response?.status === 400 || minimalError?.response?.status === 500) {
                console.log('🔍 Duplicate error detected, retrying search...');
                try {
                  const finalSearchData = await contactsAPI.getContacts({ limit: 10000 }).catch(() => ({ data: { data: [] } }));
                  const finalSearchContacts = finalSearchData?.data?.data || [];
                  const finalMatch = finalSearchContacts.find(c => {
                    if (!c.phone) return false;
                    const cPhone = c.phone.replace(/\D/g, '');
                    return cPhone === normalizedPhone || 
                           cPhone.endsWith(normalizedPhone.slice(-9)) ||
                           normalizedPhone.endsWith(cPhone.slice(-9));
                  });
                  if (finalMatch) {
                    finalContactId = finalMatch._id;
                    foundContact = true;
                    console.log('✅ Found contact in final search:', finalContactId);
                  }
                } catch (e) {
                  console.warn('⚠️ Final search failed:', e);
                }
              }
            }
          }
          
          // If still no contact found, show warning but CONTINUE with loan creation
          // The loan will fail at backend if contactId is required, but we tried our best
          if (!foundContact) {
            console.error('❌ Could not create or find contact after all attempts');
            console.error('Search phone:', formattedPhone);
            console.error('Normalized:', normalizedPhone);
            Alert.alert(
              'Warning',
              `Could not find contact with phone: ${formattedPhone}\nContact: ${deviceContactName}\n\nWill try to proceed with loan creation...`,
              [{ text: 'OK' }]
            );
            // Don't return - let it try to create loan anyway
            // Backend will handle the validation
          }
        }
      } catch (error) {
        console.error('Error handling device contact:', error);
        const errorMsg = error?.response?.data?.message || error?.message || 'Failed to process device contact';
        const errorDetails = error?.response?.data?.error || '';
        Alert.alert(
          'Error',
          `${errorMsg}${errorDetails ? ': ' + errorDetails : ''}. Please try selecting an app contact instead.`,
          [{ text: 'OK' }]
        );
        return;
      }
    }

    if (!selectedSourceType) {
      Alert.alert('Error', 'Please select a source type');
      return;
    }

    if (!selectedSource && selectedSourceType !== 'income' && selectedSourceType !== 'other') {
      Alert.alert('Error', 'Please select a source');
      return;
    }

    if (!data.amount || parseFloat(data.amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    // If we still don't have a contactId for device contact, try one more time with extensive search
    if (!finalContactId && deviceContactPhone) {
      console.log('⚠️ No contactId found, trying extensive final search...');
      try {
        const finalContactsData = await contactsAPI.getContacts({ limit: 10000 }).catch(() => ({ data: { data: [] } }));
        const finalContacts = finalContactsData?.data?.data || [];
        const normalizedPhone = deviceContactPhone.replace(/\D/g, '');
        
        // Try multiple matching strategies
        const finalExisting = finalContacts.find(c => {
          if (!c.phone) return false;
          const contactPhone = c.phone.replace(/\D/g, '');
          // Exact match
          if (contactPhone === normalizedPhone) return true;
          // Last 9 digits match (Rwanda numbers)
          if (contactPhone.length >= 9 && normalizedPhone.length >= 9) {
            if (contactPhone.slice(-9) === normalizedPhone.slice(-9)) return true;
          }
          // One contains the other
          if (contactPhone.includes(normalizedPhone.slice(-9)) || normalizedPhone.includes(contactPhone.slice(-9))) {
            return true;
          }
          return false;
        });
        
        if (finalExisting) {
          finalContactId = finalExisting._id;
          console.log('✅ Found contact in extensive final search:', finalContactId, finalExisting.name, finalExisting.phone);
        } else {
          console.warn('⚠️ Contact not found in final search. Phone:', deviceContactPhone, 'Normalized:', normalizedPhone);
        }
      } catch (e) {
        console.warn('⚠️ Final extensive search failed:', e);
      }
    }
    
    // If still no contactId, we MUST have one for loan creation
    // Let's try one last time to create a contact with a modified phone if needed
    if (!finalContactId && deviceContactPhone) {
      console.log('⚠️ Last resort: Trying to create contact with slightly modified phone...');
      try {
        // Try creating with a timestamp suffix to make it unique
        const timestamp = Date.now().toString().slice(-6);
        const modifiedPhone = deviceContactPhone + timestamp.slice(-2); // Add last 2 digits
        
        // Actually, let's just try the original phone again but with better error handling
        const lastResortData = {
          name: deviceContactName || 'Device Contact',
          phone: deviceContactPhone,
          type: 'debtor',
          allowDuplicate: true,
        };
        
        const lastResortResponse = await contactsAPI.createContact(lastResortData).catch(() => null);
        if (lastResortResponse?.data?.data?._id) {
          finalContactId = lastResortResponse.data.data._id;
          console.log('✅ Created contact in last resort:', finalContactId);
        }
      } catch (e) {
        console.warn('⚠️ Last resort contact creation failed:', e);
      }
    }
    
    // If still no contactId, show error but try to proceed
    if (!finalContactId) {
      console.error('❌ No contactId available after all attempts');
      Alert.alert(
        'Error',
        `Could not find or create contact.\nContact: ${deviceContactName || 'Unknown'}\nPhone: ${deviceContactPhone || 'N/A'}\n\nLoan cannot be created without a contact. Please try selecting an app contact.`,
        [{ text: 'OK' }]
      );
      return; // Must return here - loan requires contactId
    }

    const loanData = {
      ...data,
      contactId: finalContactId,
      principalAmount: parseFloat(data.amount),
      source: {
        type: selectedSourceType,
        sourceId: selectedSource?.id || null,
        sourceName: selectedSource?.name || `${selectedSourceType.charAt(0).toUpperCase() + selectedSourceType.slice(1)} - General`,
        amount: parseFloat(data.amount),
        currency: data.currency,
      },
      givenDate: data.givenDate.toISOString(),
      dueDate: data.dueDate.toISOString(),
      // Store device contact info in notes if available
      ...(deviceContactName && deviceContactPhone && {
        notes: data.notes ? `${data.notes}\n\nContact: ${deviceContactName} (${deviceContactPhone})` : `Contact: ${deviceContactName} (${deviceContactPhone})`,
      }),
    };

    if (isEditing) {
      updateMutation.mutate({ id: loanId, data: loanData });
    } else {
      createMutation.mutate(loanData);
    }
  };

  const sourceList = sources?.data?.data?.[selectedSourceType] || [];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text variant="headlineSmall" style={styles.title}>
            {isEditing ? 'Edit Loan' : 'Add New Loan'}
          </Text>

          <ContactPicker
            control={control}
            name="contactId"
            label="Contact Information"
            required={true}
            errors={errors}
            setValue={setValue}
          />

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Controller
                control={control}
                name="amount"
                rules={{ required: 'Amount is required', min: { value: 0, message: 'Amount must be positive' } }}
                render={({ field: { onChange, value } }) => (
                  <View>
                    <TextInput
                      label="Amount *"
                      value={value}
                      onChangeText={onChange}
                      mode="outlined"
                      keyboardType="numeric"
                      style={styles.input}
                      error={!!errors.amount}
                    />
                    {errors.amount && (
                      <HelperText type="error">{errors.amount.message}</HelperText>
                    )}
                  </View>
                )}
              />
            </View>

            <View style={styles.halfWidth}>
              <Controller
                control={control}
                name="currency"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    label="Currency"
                    value={value}
                    onChangeText={onChange}
                    mode="outlined"
                    style={styles.input}
                    editable={false}
                  />
                )}
              />
            </View>
          </View>

          <Controller
            control={control}
            name="givenDate"
            rules={{ required: 'Given date is required' }}
            render={({ field: { onChange, value } }) => (
              <View>
                <Text variant="bodyMedium" style={styles.label}>Given Date *</Text>
                <Button
                  mode="outlined"
                  onPress={() => setShowDatePicker({ ...showDatePicker, givenDate: true })}
                  style={styles.dateButton}
                >
                  {value.toLocaleDateString()}
                </Button>
                {showDatePicker.givenDate && (
                  <DateTimePicker
                    value={value}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker({ ...showDatePicker, givenDate: false });
                      if (selectedDate) onChange(selectedDate);
                    }}
                  />
                )}
                {errors.givenDate && (
                  <HelperText type="error">{errors.givenDate.message}</HelperText>
                )}
              </View>
            )}
          />

          <Controller
            control={control}
            name="dueDate"
            rules={{ required: 'Due date is required' }}
            render={({ field: { onChange, value } }) => (
              <View>
                <Text variant="bodyMedium" style={styles.label}>Due Date *</Text>
                <Button
                  mode="outlined"
                  onPress={() => setShowDatePicker({ ...showDatePicker, dueDate: true })}
                  style={styles.dateButton}
                >
                  {value.toLocaleDateString()}
                </Button>
                {showDatePicker.dueDate && (
                  <DateTimePicker
                    value={value}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker({ ...showDatePicker, dueDate: false });
                      if (selectedDate) onChange(selectedDate);
                    }}
                  />
                )}
                {errors.dueDate && (
                  <HelperText type="error">{errors.dueDate.message}</HelperText>
                )}
              </View>
            )}
          />

          <Controller
            control={control}
            name="interestRate"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Interest Rate (%)"
                value={value}
                onChangeText={onChange}
                mode="outlined"
                keyboardType="numeric"
                style={styles.input}
              />
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Description"
                value={value}
                onChangeText={onChange}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={styles.input}
              />
            )}
          />

          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Notes"
                value={value}
                onChangeText={onChange}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={styles.input}
              />
            )}
          />

          <Text variant="bodyMedium" style={styles.label}>Source Type *</Text>
          <SegmentedButtons
            value={selectedSourceType}
            onValueChange={setSelectedSourceType}
            buttons={[
              { value: 'petty_cash', label: 'Petty Cash' },
              { value: 'income', label: 'Income' },
              { value: 'savings', label: 'Savings' },
              { value: 'business', label: 'Business' },
            ]}
            style={styles.segmentedButtons}
          />

          {selectedSourceType && sourceList.length > 0 && (
            <View>
              <Text variant="bodyMedium" style={styles.label}>Source *</Text>
              {sourceList.map((source) => (
                <Button
                  key={source.id}
                  mode={selectedSource?.id === source.id ? 'contained' : 'outlined'}
                  onPress={() => setSelectedSource(source)}
                  style={styles.sourceButton}
                >
                  {source.name} - {source.balance?.toLocaleString()} {source.currency}
                </Button>
              ))}
            </View>
          )}

          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            loading={createMutation.isPending || updateMutation.isPending}
            style={styles.submitButton}
          >
            {isEditing ? 'Update Loan' : 'Create Loan'}
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 24,
  },
  label: {
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  dateButton: {
    marginBottom: 16,
  },
  selectContainer: {
    marginBottom: 16,
  },
  hint: {
    color: '#6b7280',
    marginBottom: 8,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  sourceButton: {
    marginBottom: 8,
  },
  submitButton: {
    marginTop: 24,
    paddingVertical: 8,
  },
  contactSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontWeight: '600',
    marginBottom: 12,
    color: '#1e293b',
  },
  contactButton: {
    marginBottom: 8,
  },
  selectedContactCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#25D366',
    marginBottom: 8,
  },
  selectedContactContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedContactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedContactAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  selectedContactInfo: {
    flex: 1,
  },
  selectedContactName: {
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
    fontSize: 15,
  },
  selectedContactPhone: {
    color: '#64748b',
    fontSize: 13,
  },
  editIconContainer: {
    padding: 8,
  },
  editIcon: {
    fontSize: 18,
  },
  errorHelper: {
    marginTop: 8,
    fontSize: 12,
  },
  contactPickerContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 8,
    marginBottom: 16,
    maxHeight: 400,
    overflow: 'hidden',
  },
  contactPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#f7fafc',
  },
  contactPickerTitle: {
    fontWeight: '600',
    fontSize: 15,
    color: '#1a202c',
  },
  searchContainer: {
    padding: 12,
    position: 'relative',
    backgroundColor: '#ffffff',
  },
  searchInput: {
    backgroundColor: '#f7fafc',
  },
  searchLoader: {
    position: 'absolute',
    right: 24,
    top: 24,
  },
  contactList: {
    maxHeight: 300,
  },
  contactListContent: {
    paddingHorizontal: 8,
    paddingBottom: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  contactItemPressed: {
    backgroundColor: '#f5f5f5',
  },
  selectedContactItem: {
    backgroundColor: '#e8f5e9',
  },
  checkboxContainer: {
    marginRight: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarContainerSelected: {
    backgroundColor: '#25D366',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  contactItemInfo: {
    flex: 1,
  },
  contactName: {
    fontWeight: '500',
    marginBottom: 2,
    color: '#212121',
    fontSize: 15,
  },
  contactPhone: {
    color: '#757575',
    fontSize: 13,
    marginBottom: 2,
  },
  phoneNumbersContainer: {
    marginTop: 2,
  },
  multiplePhonesIndicator: {
    color: '#64748b',
    fontSize: 11,
    fontStyle: 'italic',
  },
  multiplePhonesHint: {
    color: '#8b5cf6',
    fontSize: 11,
    marginTop: 4,
    fontStyle: 'italic',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 14,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    color: '#64748b',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#94a3b8',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    width: '100%',
    height: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontWeight: '600',
    fontSize: 20,
    color: '#1a202c',
  },
  modalContactList: {
    flex: 1,
  },
  deviceLabel: {
    fontSize: 12,
    marginLeft: 4,
  },
  phonePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  phonePickerContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  phonePickerHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    position: 'relative',
  },
  phonePickerCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    zIndex: 1,
  },
  phonePickerAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  phonePickerAvatarText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#ffffff',
  },
  phonePickerName: {
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  phonePickerSubtitle: {
    color: '#64748b',
    fontSize: 14,
  },
  phonePickerItem: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  phonePickerItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phonePickerIcon: {
    marginRight: 16,
  },
  phonePickerItemInfo: {
    flex: 1,
  },
  phonePickerNumber: {
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 4,
  },
  phonePickerPrimary: {
    color: '#64748b',
    fontSize: 12,
  },
  phonePickerCancel: {
    marginTop: 16,
    marginHorizontal: 16,
  },
});

