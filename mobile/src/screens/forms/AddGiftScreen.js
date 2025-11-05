import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, Pressable, FlatList, Modal, SafeAreaView } from 'react-native';
import { TextInput, Button, Text, HelperText, Chip, Checkbox, ActivityIndicator } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { giftsAPI, contactsAPI } from '../../services/api';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { formatPhoneNumber, getDeviceContacts } from '../../utils/contacts';

export default function AddGiftScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
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
      title: '',
      giftType: 'given',
      category: 'money',
      amount: '',
      currency: 'FRW',
      quantity: '1',
      giftDate: new Date(),
      occasion: 'none',
      recipientName: '',
      contactId: '',
      location: '',
      description: '',
      notes: '',
    },
  });

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
      // Show WhatsApp-style modal for phone number selection
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
    if (contactForPhonePicker) {
      onChange(contactForPhonePicker._id);
    }
    setShowPhonePicker(false);
    setShowContactPicker(false);
    setContactSearch('');
    setContactForPhonePicker(null);
  }, [contactForPhonePicker]);

  const createMutation = useMutation({
    mutationFn: giftsAPI.createGift,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gifts'] });
      queryClient.invalidateQueries({ queryKey: ['giftStats'] });
      Alert.alert('Success', 'Gift added successfully');
      navigation.goBack();
    },
    onError: (error) => {
      Alert.alert(
        'Error', 
        error.response?.data?.message || error.message || 'Failed to add gift. Please try again.'
      );
    },
  });

  const onSubmit = async (data) => {
    try {
      if (!data.title || !data.amount) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      const giftData = {
        title: data.title,
        giftType: data.giftType,
        category: data.category,
        amount: parseFloat(data.amount),
        currency: data.currency,
        quantity: parseInt(data.quantity) || 1,
        giftDate: data.giftDate.toISOString(),
        occasion: data.occasion,
        recipientName: data.recipientName || '',
        contactId: data.contactId || undefined,
        location: data.location || '',
        description: data.description || '',
        notes: data.notes || '',
      };

      createMutation.mutate(giftData);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || error.message || 'Failed to save gift');
    }
  };

  const giftTypes = ['given', 'received', 'charity', 'donation', 'reward', 'incentive'];
  const categories = ['money', 'item', 'service', 'food', 'clothing', 'electronics', 'other'];
  const occasions = ['birthday', 'wedding', 'graduation', 'holiday', 'anniversary', 'funeral', 'celebration', 'thank_you', 'other', 'none'];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text variant="headlineSmall" style={styles.title}>Add Gift</Text>

          <Controller
            control={control}
            name="title"
            rules={{ required: 'Title is required' }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Title *"
                value={value}
                onChangeText={onChange}
                mode="outlined"
                style={styles.input}
                error={!!errors.title}
              />
            )}
          />
          {errors.title && (
            <HelperText type="error">{errors.title.message}</HelperText>
          )}

          <Controller
            control={control}
            name="giftType"
            render={({ field: { onChange, value } }) => (
              <View>
                <Text variant="bodyMedium" style={styles.label}>Gift Type *</Text>
                <View style={styles.categoryContainer}>
                  {giftTypes.map((type) => (
                    <Chip
                      key={type}
                      selected={value === type}
                      onPress={() => onChange(type)}
                      style={styles.categoryChip}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Chip>
                  ))}
                </View>
              </View>
            )}
          />

          <Controller
            control={control}
            name="category"
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
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Chip>
                  ))}
                </View>
              </View>
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
            name="giftDate"
            render={({ field: { onChange, value } }) => (
              <View>
                <Text variant="bodyMedium" style={styles.label}>Gift Date *</Text>
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
            name="occasion"
            render={({ field: { onChange, value } }) => (
              <View>
                <Text variant="bodyMedium" style={styles.label}>Occasion</Text>
                <View style={styles.categoryContainer}>
                  {occasions.map((occ) => (
                    <Chip
                      key={occ}
                      selected={value === occ}
                      onPress={() => onChange(occ)}
                      style={styles.categoryChip}
                    >
                      {occ.charAt(0).toUpperCase() + occ.slice(1).replace('_', ' ')}
                    </Chip>
                  ))}
                </View>
              </View>
            )}
          />

          <Controller
            control={control}
            name="recipientName"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Recipient Name"
                value={value}
                onChangeText={onChange}
                mode="outlined"
                style={styles.input}
              />
            )}
          />

          <Controller
            control={control}
            name="contactId"
            render={({ field: { onChange, value } }) => {
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
            name="location"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Location"
                value={value}
                onChangeText={onChange}
                mode="outlined"
                style={styles.input}
              />
            )}
          />

          <Controller
            control={control}
            name="quantity"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Quantity"
                value={value}
                onChangeText={onChange}
                keyboardType="numeric"
                mode="outlined"
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

          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            style={styles.submitButton}
            loading={createMutation.isPending}
            buttonColor="#ec4899"
          >
            Add Gift
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
  clearButton: {
    marginBottom: 16,
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
    backgroundColor: '#ffffff',
  },
  searchInput: {
    backgroundColor: '#f7fafc',
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
  centerContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    color: '#64748b',
    fontWeight: '500',
  },
});

