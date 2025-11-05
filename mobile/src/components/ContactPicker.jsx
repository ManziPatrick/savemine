import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet, Pressable, FlatList, Modal, SafeAreaView } from 'react-native';
import { TextInput, Button, Text, HelperText, ActivityIndicator, Checkbox } from 'react-native-paper';
import { Controller, useWatch } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { contactsAPI } from '../services/api';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { formatPhoneNumber, getDeviceContacts } from '../utils/contacts';

export default function ContactPicker({ 
  control, 
  name, 
  label = 'Contact (Optional)', 
  required = false,
  errors,
  setValue 
}) {
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  const [selectedContactData, setSelectedContactData] = useState(null);
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState(null);
  const [showPhonePicker, setShowPhonePicker] = useState(false);
  const [contactForPhonePicker, setContactForPhonePicker] = useState(null);
  const [showDeviceContacts, setShowDeviceContacts] = useState(false);
  const [deviceContacts, setDeviceContacts] = useState([]);
  
  // Watch the value from react-hook-form
  // useWatch must be called unconditionally, but we can pass undefined control safely
  const watchedValue = useWatch({ 
    control: control || undefined, 
    name: name || ''
  });

  const { data: contactsData, isLoading: contactsLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => contactsAPI.getContacts({ limit: 1000 }),
  });

  // Fetch device contacts
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

  // Merge device contacts with backend contacts
  const contactsList = useMemo(() => {
    const backendContacts = contactsData?.data?.data || [];
    
    const backendMap = new Map();
    backendContacts.forEach(contact => {
      if (contact.phone) {
        const normalizedPhone = contact.phone.replace(/\D/g, '');
        backendMap.set(normalizedPhone, contact);
      }
    });
    
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

  const handleContactSelect = useCallback((contact, onChange) => {
    setSelectedContactData(contact);
    
    const phoneNumbers = contact.allPhones || (contact.phone ? [contact.phone] : []);
    
    if (phoneNumbers.length > 1) {
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

  // Sync selectedContactData when watchedValue changes
  useEffect(() => {
    if (watchedValue && contactsList.length > 0) {
      const contact = contactsList.find(c => c._id === watchedValue);
      if (contact) {
        setSelectedContactData(contact);
        if (contact.phone && !selectedPhoneNumber) {
          setSelectedPhoneNumber(contact.phone);
        }
      }
    } else if (!watchedValue) {
      setSelectedContactData(null);
      setSelectedPhoneNumber(null);
    }
  }, [watchedValue, contactsList, selectedPhoneNumber]);

  return (
    <>
      {control ? (
        <Controller
          control={control}
          name={name}
          rules={required ? { required: 'Contact is required' } : {}}
          render={({ field: { onChange, value } }) => {
            return (
              <View style={styles.contactSection}>
                <Text variant="titleMedium" style={styles.sectionLabel}>
                  {label} {required && '*'}
                </Text>
                
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

                {errors?.[name] && (
                  <HelperText type="error" style={styles.errorHelper}>
                    {errors[name].message}
                  </HelperText>
                )}

                {/* Contact Picker Modal */}
                {showContactPicker && (
                  <Modal
                    visible={showContactPicker}
                    animationType="slide"
                    transparent={true}
                    statusBarTranslucent={true}
                    onRequestClose={() => {
                      setShowContactPicker(false);
                      setContactSearch('');
                      setShowDeviceContacts(false);
                    }}
                  >
                    <Pressable 
                      style={styles.modalOverlay}
                      onPress={() => {
                        setShowContactPicker(false);
                        setContactSearch('');
                        setShowDeviceContacts(false);
                      }}
                    >
                      <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
                        <SafeAreaView style={styles.modalSafeArea}>
                          <View style={styles.modalHeader}>
                            <Text variant="headlineSmall" style={styles.modalTitle}>Select Contact</Text>
                            <View style={styles.modalHeaderActions}>
                              <Button 
                                mode="text" 
                                onPress={() => {
                                  setShowDeviceContacts(!showDeviceContacts);
                                  setContactSearch('');
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
                      </Pressable>
                    </Pressable>
                  </Modal>
                )}

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
                              return (
                                <Pressable
                                  onPress={() => {
                                    handlePhoneSelect(phone, onChange);
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
              </View>
            );
          }}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
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
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedContactAvatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
  },
  selectedContactInfo: {
    flex: 1,
  },
  selectedContactName: {
    fontWeight: '600',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: '90%',
    width: '100%',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalSafeArea: {
    flex: 1,
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
    backgroundColor: '#ffffff',
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
  deviceLabel: {
    fontSize: 12,
    marginLeft: 4,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#94a3b8',
  },
  phonePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    paddingHorizontal: 0,
  },
  phonePickerContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    marginTop: 40,
    marginBottom: 20,
    marginHorizontal: 8,
    paddingBottom: 20,
    paddingTop: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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

