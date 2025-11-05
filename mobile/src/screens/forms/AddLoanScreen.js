import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, Pressable, FlatList, Modal, SafeAreaView } from 'react-native';
import { TextInput, Button, Text, HelperText, SegmentedButtons, ActivityIndicator, Checkbox } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { loansAPI, contactsAPI } from '../../services/api';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { formatPhoneNumber, getDeviceContacts } from '../../utils/contacts';

export default function AddLoanScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const queryClient = useQueryClient();
  const { loanId } = route.params || {};
  const isEditing = !!loanId;

  const [selectedSourceType, setSelectedSourceType] = useState('');
  const [selectedSource, setSelectedSource] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState({ givenDate: false, dueDate: false });
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  const [selectedContactData, setSelectedContactData] = useState(null); // Store selected contact info
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState(null); // Store selected phone number
  const [showPhonePicker, setShowPhonePicker] = useState(false);
  const [contactForPhonePicker, setContactForPhonePicker] = useState(null);
  const [showDeviceContacts, setShowDeviceContacts] = useState(false);

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

  const { data: contactsData, isLoading: contactsLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => contactsAPI.getContacts({ limit: 1000 }),
  });

  const [deviceContacts, setDeviceContacts] = useState([]);

  // Fetch device contacts to enrich backend contacts with all phone numbers
  useEffect(() => {
  const loadDeviceContacts = async () => {
    try {
        const deviceContactsList = await getDeviceContacts();
        setDeviceContacts(deviceContactsList);
    } catch (error) {
        console.error('Error loading device contacts:', error);
      }
    };
    loadDeviceContacts();
  }, []);

  const contactsList = useMemo(() => {
    const backendContacts = contactsData?.data?.data || [];
    
    // Create a map of backend contacts by phone number for quick lookup
    const backendMap = new Map();
    backendContacts.forEach(contact => {
      if (contact.phone) {
        const normalizedPhone = contact.phone.replace(/\D/g, '');
        backendMap.set(normalizedPhone, contact);
      }
    });
    
    // Merge device contacts with backend contacts
    // First, add all backend contacts with enriched phone numbers
    const enrichedBackendContacts = backendContacts.map(contact => {
      const deviceContact = deviceContacts.find(dc => 
        dc.phone && contact.phone && 
        dc.phone.replace(/\D/g, '') === contact.phone.replace(/\D/g, '')
      );
      
      if (deviceContact && deviceContact.allPhones && deviceContact.allPhones.length > 0) {
        return {
          ...contact,
          allPhones: deviceContact.allPhones,
          isDeviceContact: false,
        };
      }
      
      return {
        ...contact,
        allPhones: contact.phone ? [contact.phone] : [],
        isDeviceContact: false,
      };
    });
    
    // Then add device contacts that don't exist in backend
    const deviceOnlyContacts = deviceContacts
      .filter(dc => {
        if (!dc.phone) return false;
        const normalizedPhone = dc.phone.replace(/\D/g, '');
        return !backendMap.has(normalizedPhone);
      })
      .map(dc => ({
        _id: `device_${dc.id || dc.phone}`,
        name: dc.name,
        phone: dc.phone,
        allPhones: dc.allPhones || (dc.phone ? [dc.phone] : []),
        isDeviceContact: true,
      }));
    
    return [...enrichedBackendContacts, ...deviceOnlyContacts];
  }, [contactsData, deviceContacts]);

  const filteredContacts = useMemo(() => {
    if (!contactSearch) return contactsList;
    const searchLower = contactSearch.toLowerCase();
    return contactsList.filter(contact => 
      contact.name?.toLowerCase().includes(searchLower) ||
      contact.phone?.includes(contactSearch)
    );
  }, [contactsList, contactSearch]);

  const filteredDeviceContacts = useMemo(() => {
    const deviceList = deviceContacts.filter(dc => dc.phone).map(dc => ({
      _id: `device_${dc.id || dc.phone}`,
      name: dc.name,
      phone: dc.phone,
      allPhones: dc.allPhones || (dc.phone ? [dc.phone] : []),
      isDeviceContact: true,
    }));
    
    if (!contactSearch) return deviceList;
    const searchLower = contactSearch.toLowerCase();
    return deviceList.filter(contact => 
      contact.name?.toLowerCase().includes(searchLower) ||
      contact.phone?.includes(contactSearch) ||
      contact.allPhones.some(p => p.includes(contactSearch))
    );
  }, [deviceContacts, contactSearch]);

  // Sync selectedContactData when contactId changes or contacts load
  const contactId = watch('contactId');
  useEffect(() => {
    if (contactId && contactsList.length > 0) {
      const contact = contactsList.find(c => c._id === contactId);
      if (contact) {
        setSelectedContactData(contact);
        // Set default phone number if available
        if (contact.phone && !selectedPhoneNumber) {
          setSelectedPhoneNumber(contact.phone);
        }
      }
    } else if (!contactId) {
      setSelectedContactData(null);
      setSelectedPhoneNumber(null);
    }
  }, [contactId, contactsList, selectedPhoneNumber]);

  const handleContactSelect = useCallback((contact, onChange) => {
    setSelectedContactData(contact);
    
    // Check if contact has multiple phone numbers
    const phoneNumbers = contact.allPhones || (contact.phone ? [contact.phone] : []);
    
    if (phoneNumbers.length > 1) {
      // Show WhatsApp-style modal for phone number selection
      setContactForPhonePicker(contact);
      setShowPhonePicker(true);
    } else {
      // Single phone number, select directly
      setSelectedPhoneNumber(phoneNumbers[0] || null);
      onChange(contact._id);
      setShowContactPicker(false);
      setContactSearch('');
    }
  }, []);

  const handlePhoneSelect = useCallback((phone, onChange) => {
    setSelectedPhoneNumber(phone);
    if (contactForPhonePicker) {
      onChange(contactForPhonePicker._id);
    }
    setShowPhonePicker(false);
    setShowContactPicker(false);
    setContactSearch('');
    setContactForPhonePicker(null);
  }, [contactForPhonePicker]);

  const createMutation = useMutation({
    mutationFn: loansAPI.createLoan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['loanStats'] });
      Alert.alert('Success', 'Loan created successfully');
      navigation.goBack();
    },
    onError: (error) => {
      Alert.alert(
        'Error', 
        error.response?.data?.message || error.message || 'Failed to create loan. Please try again.'
      );
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
      Alert.alert(
        'Error', 
        error.response?.data?.message || error.message || 'Failed to update loan. Please try again.'
      );
    },
  });

  const onSubmit = async (data) => {
    if (!data.contactId) {
      Alert.alert('Error', 'Please select a contact');
      return;
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

    const loanData = {
      ...data,
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

          <Controller
            control={control}
            name="contactId"
            rules={{ required: 'Contact is required' }}
            render={({ field: { onChange, value } }) => {
              return (
                <View style={styles.contactSection}>
                  <Text variant="titleMedium" style={styles.sectionLabel}>Contact Information *</Text>
                  
                  {selectedContactData ? (
                  <Pressable
                      onPress={() => {
                        if (selectedContactData.allPhones && selectedContactData.allPhones.length > 1) {
                          setContactForPhonePicker(selectedContactData);
                          setShowPhonePicker(true);
                        } else {
                          setShowContactPicker(true);
                        }
                      }}
                      style={styles.selectedContactCard}
                    >
                      <View style={styles.selectedContactContent}>
                        <View style={styles.selectedContactAvatar}>
                          <Text style={styles.selectedContactAvatarText}>
                            {selectedContactData.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?'}
                          </Text>
                        </View>
                        <View style={styles.selectedContactInfo}>
                          <Text variant="titleMedium" style={styles.selectedContactName}>
                            {selectedContactData.name}
                            {selectedContactData.isDeviceContact && (
                              <Text style={styles.deviceLabel}> 📱</Text>
                            )}
                          </Text>
                          <Text variant="bodySmall" style={styles.selectedContactPhone}>
                            {selectedPhoneNumber ? formatPhoneNumber(selectedPhoneNumber) : (selectedContactData.phone ? formatPhoneNumber(selectedContactData.phone) : 'No phone')}
                          </Text>
                          {selectedContactData.allPhones && selectedContactData.allPhones.length > 1 && (
                            <Text variant="bodySmall" style={styles.multiplePhonesHint}>
                              Tap to change phone number
                            </Text>
                          )}
                        </View>
                        <View style={styles.editIconContainer}>
                          <Text style={styles.editIcon}>✏️</Text>
                        </View>
                      </View>
                    </Pressable>
                  ) : (
                    <Button
                      mode="outlined"
                      onPress={() => setShowContactPicker(true)}
                      style={styles.contactButton}
                      icon="account-plus"
                    >
                      Select Contact
                    </Button>
                  )}

                  {errors.contactId && (
                    <HelperText type="error" style={styles.errorHelper}>
                      {errors.contactId.message}
                    </HelperText>
                  )}

                  {showContactPicker && (
                    <Modal
                      visible={showContactPicker}
                      animationType="slide"
                      transparent={false}
                      statusBarTranslucent={true}
                      onRequestClose={() => {
                        setShowContactPicker(false);
                        setContactSearch('');
                        setShowDeviceContacts(false);
                      }}
                    >
                      <SafeAreaView style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                          <Text variant="headlineSmall" style={styles.modalTitle}>Select Contact</Text>
                          <View style={styles.modalHeaderActions}>
                            <Button 
                              mode="text" 
                              onPress={() => {
                                setShowDeviceContacts(!showDeviceContacts);
                                setContactSearch(''); // Clear search when switching
                              }}
                              icon={showDeviceContacts ? "account" : "phone"}
                              textColor={showDeviceContacts ? "#64748b" : "#25D366"}
                            >
                              {showDeviceContacts ? 'App' : 'Device'}
                            </Button>
                            <Button 
                              mode="text" 
                              onPress={() => {
                                setShowContactPicker(false);
                                setContactSearch('');
                                setShowDeviceContacts(false);
                              }}
                              icon="close"
                            >
                              Close
                            </Button>
                          </View>
                        </View>
                    
                    <View style={styles.searchContainer}>
                      <TextInput
                        placeholder="Search by name or phone..."
                        value={contactSearch}
                        onChangeText={setContactSearch}
                        mode="outlined"
                        style={styles.searchInput}
                        left={<TextInput.Icon icon="magnify" />}
                        right={
                          contactSearch ? (
                            <TextInput.Icon 
                              icon="close-circle" 
                              onPress={() => setContactSearch('')}
                            />
                          ) : null
                        }
                      />
                          {contactsLoading && (
                        <View style={styles.searchLoader}>
                          <ActivityIndicator size="small" />
                        </View>
                      )}
                    </View>

                        <FlatList
                          data={showDeviceContacts ? filteredDeviceContacts : filteredContacts}
                          style={styles.modalContactList}
                          contentContainerStyle={styles.contactListContent}
                          keyboardShouldPersistTaps="handled"
                          showsVerticalScrollIndicator={true}
                          keyExtractor={(item) => item._id}
                          renderItem={({ item: contact }) => {
                            const isSelected = value === contact._id;
                            const initials = contact.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?';
                            const allPhones = contact.allPhones || (contact.phone ? [contact.phone] : []);
                            
                            return (
                              <Pressable
                                onPress={() => handleContactSelect(contact, onChange)}
                                style={({ pressed }) => [
                                  styles.contactItem,
                                  pressed && styles.contactItemPressed,
                                  isSelected && styles.selectedContactItem
                                ]}
                              >
                                <View style={styles.checkboxContainer}>
                                  <Checkbox
                                    status={isSelected ? 'checked' : 'unchecked'}
                                    onPress={() => handleContactSelect(contact, onChange)}
                                    color="#25D366"
                                  />
                                </View>
                                <View style={[
                                  styles.avatarContainer,
                                  isSelected && styles.avatarContainerSelected
                                ]}>
                                  <Text style={styles.avatarText}>{initials}</Text>
                                </View>
                                <View style={styles.contactItemInfo}>
                                  <Text variant="titleMedium" style={styles.contactName}>
                                    {contact.name}
                                    {contact.isDeviceContact && (
                                      <Text style={styles.deviceLabel}> 📱</Text>
                                    )}
                                  </Text>
                                  {allPhones.length > 0 && (
                                    <View style={styles.phoneNumbersContainer}>
                                      {allPhones.slice(0, 2).map((phone, idx) => (
                                        <Text key={idx} variant="bodySmall" style={styles.contactPhone}>
                                          {formatPhoneNumber(phone) || phone}
                                        </Text>
                                      ))}
                                      {allPhones.length > 2 && (
                                        <Text variant="bodySmall" style={styles.multiplePhonesIndicator}>
                                          +{allPhones.length - 2} more
                                        </Text>
                                      )}
                                    </View>
                                  )}
                                  {(!allPhones || allPhones.length === 0) && (
                                    <Text variant="bodySmall" style={styles.contactPhone}>
                                      No phone
                                    </Text>
                                  )}
                                </View>
                              </Pressable>
                            );
                          }}
                          ListEmptyComponent={
                            contactsLoading && !showDeviceContacts ? (
                              <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" />
                                <Text style={styles.loadingText}>Loading contacts...</Text>
                              </View>
                            ) : (
                              <View style={styles.emptyContainer}>
                                <Icon name="account-search" size={64} color="#cbd5e1" />
                                <Text style={styles.emptyText}>No contacts found</Text>
                                <Text style={styles.emptySubtext}>
                                  {contactSearch ? 'Try a different search term' : 'No contacts available'}
                                </Text>
                              </View>
                            )
                          }
                          initialNumToRender={20}
                          maxToRenderPerBatch={10}
                          windowSize={10}
                          removeClippedSubviews={true}
                        />
                    </SafeAreaView>
                  </Modal>
                  )}
                </View>
              );
            }}
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

      {/* Phone Number Picker Modal (WhatsApp Style) */}
      <Modal
        visible={showPhonePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowPhonePicker(false);
          setContactForPhonePicker(null);
        }}
      >
        <Pressable 
          style={styles.phonePickerOverlay}
          onPress={() => {
            setShowPhonePicker(false);
            setContactForPhonePicker(null);
          }}
        >
          <Pressable style={styles.phonePickerContainer} onPress={(e) => e.stopPropagation()}>
            {contactForPhonePicker && (
              <>
                <View style={styles.phonePickerHeader}>
                  <Pressable
                    style={styles.phonePickerCloseButton}
                    onPress={() => {
                      setShowPhonePicker(false);
                      setContactForPhonePicker(null);
                    }}
                  >
                    <Icon name="close" size={24} color="#64748b" />
                  </Pressable>
                  <View style={styles.phonePickerAvatar}>
                    <Text style={styles.phonePickerAvatarText}>
                      {contactForPhonePicker.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?'}
                    </Text>
                  </View>
                  <Text variant="titleLarge" style={styles.phonePickerName}>
                    {contactForPhonePicker.name}
                  </Text>
                  <Text variant="bodyMedium" style={styles.phonePickerSubtitle}>
                    Select a phone number
                  </Text>
                </View>
                
                <FlatList
                  data={contactForPhonePicker.allPhones || (contactForPhonePicker.phone ? [contactForPhonePicker.phone] : [])}
                  keyExtractor={(item, index) => `phone-${index}-${item}`}
                  renderItem={({ item: phone }) => {
                    const contactId = watch('contactId');
                    return (
                      <Pressable
                        onPress={() => {
                          handlePhoneSelect(phone, (id) => {
                            if (contactForPhonePicker._id) {
                              setValue('contactId', contactForPhonePicker._id);
                            }
                          });
                        }}
                        style={styles.phonePickerItem}
                      >
                        <View style={styles.phonePickerItemContent}>
                          <Icon name="phone" size={24} color="#25D366" style={styles.phonePickerIcon} />
                          <View style={styles.phonePickerItemInfo}>
                            <Text variant="titleMedium" style={styles.phonePickerNumber}>
                              {formatPhoneNumber(phone) || phone}
                            </Text>
                            {phone === contactForPhonePicker.phone && (
                              <Text variant="bodySmall" style={styles.phonePickerPrimary}>
                                Primary
                              </Text>
                            )}
                          </View>
                          {selectedPhoneNumber === phone && (
                            <Icon name="check-circle" size={24} color="#25D366" />
                          )}
                        </View>
                      </Pressable>
                    );
                  }}
                />
                
                <Button
                  mode="text"
                  onPress={() => {
                    setShowPhonePicker(false);
                    setContactForPhonePicker(null);
                  }}
                  style={styles.phonePickerCancel}
                >
                  Cancel
                </Button>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
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

