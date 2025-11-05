import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, Pressable, FlatList, Modal, SafeAreaView } from 'react-native';
import { TextInput, Button, Text, HelperText, SegmentedButtons, Chip, Checkbox, ActivityIndicator } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { transactionsAPI, contactsAPI } from '../../services/api';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { formatPhoneNumber, getDeviceContacts } from '../../utils/contacts';

export default function AddTransactionScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const queryClient = useQueryClient();
  const { transactionId } = route.params || {};
  const isEditing = !!transactionId;

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  const [selectedContactData, setSelectedContactData] = useState(null);
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState(null);
  const [deviceContacts, setDeviceContacts] = useState([]);
  const [showPhonePicker, setShowPhonePicker] = useState(false);
  const [contactForPhonePicker, setContactForPhonePicker] = useState(null);

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      type: 'expense',
      amount: '',
      currency: 'FRW',
      category: '',
      date: new Date(),
      description: '',
      notes: '',
      contactId: '',
    },
  });

  const transactionType = watch('type');

  const { data: contactsData, isLoading: contactsLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => contactsAPI.getContacts({ limit: 1000 }),
  });

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

  // Sync selectedContactData when contactId changes
  const contactId = watch('contactId');
  useEffect(() => {
    if (contactId && contactsList.length > 0) {
      const contact = contactsList.find(c => c._id === contactId);
      if (contact) {
        setSelectedContactData(contact);
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
    
    const phoneNumbers = contact.allPhones || (contact.phone ? [contact.phone] : []);
    
    if (phoneNumbers.length > 1) {
      // Show modal for phone number selection (WhatsApp style)
      setContactForPhonePicker(contact);
      setShowPhonePicker(true);
    } else {
      setSelectedPhoneNumber(phoneNumbers[0] || null);
      onChange(contact._id);
      setShowContactPicker(false);
      setContactSearch('');
    }
  }, []);

  const handlePhoneSelect = useCallback((phone, onChange) => {
    setSelectedPhoneNumber(phone);
    if (contactForPhonePicker && contactForPhonePicker._id) {
      onChange(contactForPhonePicker._id);
    }
    setShowPhonePicker(false);
    setShowContactPicker(false);
    setContactSearch('');
    setContactForPhonePicker(null);
  }, [contactForPhonePicker]);

  const createMutation = useMutation({
    mutationFn: transactionsAPI.createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactionStats'] });
      Alert.alert('Success', 'Transaction created successfully');
      navigation.goBack();
    },
    onError: (error) => {
      Alert.alert(
        'Error', 
        error.response?.data?.message || error.message || 'Failed to create transaction. Please try again.'
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => transactionsAPI.updateTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactionStats'] });
      Alert.alert('Success', 'Transaction updated successfully');
      navigation.goBack();
    },
    onError: (error) => {
      Alert.alert(
        'Error', 
        error.response?.data?.message || error.message || 'Failed to update transaction. Please try again.'
      );
    },
  });

  const onSubmit = async (data) => {
    try {
      if (!data.amount || parseFloat(data.amount) <= 0) {
        Alert.alert('Error', 'Please enter a valid amount');
        return;
      }

      if (!data.category) {
        Alert.alert('Error', 'Please select a category');
        return;
      }

      const transactionData = {
        ...data,
        amount: parseFloat(data.amount),
        date: data.date.toISOString(),
        contactId: data.contactId || undefined,
      };

      if (isEditing) {
        updateMutation.mutate({ id: transactionId, data: transactionData });
      } else {
        createMutation.mutate(transactionData);
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || error.message || 'Failed to save transaction');
    }
  };

  const categories = transactionType === 'income' 
    ? ['Salary', 'Business', 'Freelance', 'Investment', 'Gift', 'Other']
    : ['Food', 'Transport', 'Utilities', 'Entertainment', 'Healthcare', 'Education', 'Shopping', 'Other'];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text variant="headlineSmall" style={styles.title}>
            {isEditing ? 'Edit Transaction' : 'Add Transaction'}
          </Text>

          <Controller
            control={control}
            name="type"
            render={({ field: { onChange, value } }) => (
              <SegmentedButtons
                value={value}
                onValueChange={onChange}
                buttons={[
                  { value: 'income', label: 'Income' },
                  { value: 'expense', label: 'Expense' },
                ]}
                style={styles.segmentedButtons}
              />
            )}
          />

          <Controller
            control={control}
            name="amount"
            rules={{ required: 'Amount is required' }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Amount *"
                value={value}
                onChangeText={onChange}
                keyboardType="numeric"
                mode="outlined"
                style={styles.input}
                error={!!errors.amount}
              />
            )}
          />
          {errors.amount && (
            <HelperText type="error">{errors.amount.message}</HelperText>
          )}

          <Controller
            control={control}
            name="category"
            rules={{ required: 'Category is required' }}
            render={({ field: { onChange, value } }) => (
              <View>
                <Text variant="bodyMedium" style={styles.label}>Category *</Text>
                <View style={styles.categoryContainer}>
                  {categories.map((cat) => (
                    <Chip
                      key={cat}
                      selected={value === cat}
                      onPress={() => onChange(cat)}
                      style={styles.categoryChip}
                    >
                      {cat}
                    </Chip>
                  ))}
                </View>
              </View>
            )}
          />

          <Controller
            control={control}
            name="date"
            render={({ field: { onChange, value } }) => (
              <View>
                <Text variant="bodyMedium" style={styles.label}>Date *</Text>
                <Button
                  mode="outlined"
                  onPress={() => setShowDatePicker(true)}
                  style={styles.dateButton}
                >
                  {value.toLocaleDateString()}
                </Button>
                {showDatePicker && (
                  <DateTimePicker
                    value={value}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) onChange(selectedDate);
                    }}
                  />
                )}
              </View>
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
            name="contactId"
            render={({ field: { onChange, value } }) => {
              const selectedContact = contactsList.find(c => c._id === value);
              
              return (
                <View style={styles.contactSection}>
                  <Text variant="titleMedium" style={styles.sectionLabel}>Contact (Optional)</Text>
                  
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

                  {selectedContactData && (
                    <Button
                      mode="text"
                      onPress={() => {
                        onChange('');
                        setSelectedContactData(null);
                        setSelectedPhoneNumber(null);
                      }}
                      style={styles.clearButton}
                      icon="close"
                    >
                      Clear Selection
                    </Button>
                  )}

                  {showContactPicker && (
                    <Modal
                      visible={showContactPicker}
                      animationType="slide"
                      transparent={false}
                      onRequestClose={() => {
                        setShowContactPicker(false);
                        setContactSearch('');
                      }}
                    >
                      <SafeAreaView style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                          <Text variant="headlineSmall" style={styles.modalTitle}>Select Contact</Text>
                          <Button 
                            mode="text" 
                            onPress={() => {
                              setShowContactPicker(false);
                              setContactSearch('');
                            }}
                            icon="close"
                          >
                            Close
                          </Button>
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
                          data={filteredContacts}
                          style={styles.modalContactList}
                          contentContainerStyle={styles.contactListContent}
                          keyboardShouldPersistTaps="handled"
                          showsVerticalScrollIndicator={true}
                          keyExtractor={(item) => item._id}
                          renderItem={({ item: contact }) => {
                            const isSelected = value === contact._id;
                            const initials = contact.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?';
                            
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
                                  <Text variant="bodySmall" style={styles.contactPhone}>
                                    {formatPhoneNumber(contact.phone) || 'No phone'}
                                    {contact.allPhones && contact.allPhones.length > 1 && (
                                      <Text style={styles.multiplePhonesIndicator}>
                                        {' '}(+{contact.allPhones.length - 1})
                                      </Text>
                                    )}
                                  </Text>
                                </View>
                              </Pressable>
                            );
                          }}
                          ListEmptyComponent={
                            contactsLoading ? (
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

          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            style={styles.submitButton}
            loading={createMutation.isPending || updateMutation.isPending}
          >
            {isEditing ? 'Update Transaction' : 'Add Transaction'}
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
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    marginBottom: 20,
    fontWeight: 'bold',
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 8,
  },
  label: {
    marginBottom: 8,
    marginTop: 8,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  dateButton: {
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 20,
    paddingVertical: 8,
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
  multiplePhonesHint: {
    color: '#8b5cf6',
    fontSize: 11,
    marginTop: 4,
    fontStyle: 'italic',
  },
  multiplePhonesIndicator: {
    color: '#64748b',
    fontSize: 11,
    fontStyle: 'italic',
  },
  searchLoader: {
    position: 'absolute',
    right: 24,
    top: 24,
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
  editIconContainer: {
    padding: 8,
  },
  editIcon: {
    fontSize: 18,
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
  deviceLabel: {
    fontSize: 12,
    marginLeft: 4,
  },
  clearButton: {
    marginBottom: 16,
  },
  contactSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontWeight: '600',
    marginBottom: 12,
    color: '#1e293b',
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
  contactPickerContainer: {
    display: 'none', // Not used anymore, replaced by Modal
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#f7fafc',
  },
  modalTitle: {
    fontWeight: '600',
    fontSize: 20,
    color: '#1a202c',
  },
  modalContactList: {
    flex: 1,
  },
  contactListContent: {
    paddingHorizontal: 8,
    paddingBottom: 12,
  },
  centerContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 0,
    margin: 0,
    borderRadius: 0,
    maxHeight: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#ffffff',
  },
  modalTitle: {
    fontWeight: '600',
    fontSize: 16,
  },
  searchInput: {
    margin: 16,
    backgroundColor: '#f5f5f5',
  },
  contactList: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingText: {
    textAlign: 'center',
    padding: 20,
    color: '#64748b',
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    color: '#64748b',
    marginTop: 12,
    fontWeight: '500',
  },
});

