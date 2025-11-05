import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, Pressable, FlatList } from 'react-native';
import { TextInput, Button, Text, HelperText, Chip, Checkbox } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { remindersAPI, contactsAPI, loansAPI } from '../../services/api';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function AddReminderScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [contactSearch, setContactSearch] = useState('');

  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      title: '',
      message: '',
      reminderType: 'general',
      scheduledDate: new Date(),
      priority: 'medium',
      sendMethod: 'sms',
      contactId: '',
      loanId: '',
      notes: '',
    },
  });

  const { data: contactsData } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => contactsAPI.getContacts({ limit: 1000 }),
  });

  const { data: loansData } = useQuery({
    queryKey: ['loans'],
    queryFn: () => loansAPI.getLoans({ limit: 100 }),
  });

  const contactsList = contactsData?.data?.data || [];
  const loansList = loansData?.data?.data || [];

  const filteredContacts = useMemo(() => {
    if (!contactSearch) return contactsList;
    const searchLower = contactSearch.toLowerCase();
    return contactsList.filter(contact => 
      contact.name?.toLowerCase().includes(searchLower) ||
      contact.phone?.includes(contactSearch)
    );
  }, [contactsList, contactSearch]);

  const createMutation = useMutation({
    mutationFn: remindersAPI.createReminder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['reminderStats'] });
      Alert.alert('Success', 'Reminder created successfully');
      navigation.goBack();
    },
    onError: (error) => {
      Alert.alert(
        'Error', 
        error.response?.data?.message || error.message || 'Failed to create reminder. Please try again.'
      );
    },
  });

  const onSubmit = async (data) => {
    try {
      if (!data.title || !data.message || !data.scheduledDate) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      const reminderData = {
        title: data.title,
        message: data.message,
        reminderType: data.reminderType,
        scheduledDate: data.scheduledDate.toISOString(),
        priority: data.priority,
        sendMethod: data.sendMethod,
        contactId: data.contactId || undefined,
        loanId: data.loanId || undefined,
        notes: data.notes || '',
      };

      createMutation.mutate(reminderData);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || error.message || 'Failed to save reminder');
    }
  };

  const reminderTypes = ['loan_payment', 'general', 'follow_up', 'birthday', 'appointment'];
  const priorities = ['low', 'medium', 'high', 'urgent'];
  const sendMethods = ['sms', 'email', 'both', 'none'];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text variant="headlineSmall" style={styles.title}>Add Reminder</Text>

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
            name="message"
            rules={{ required: 'Message is required' }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Message *"
                value={value}
                onChangeText={onChange}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={styles.input}
                error={!!errors.message}
              />
            )}
          />
          {errors.message && (
            <HelperText type="error">{errors.message.message}</HelperText>
          )}

          <Controller
            control={control}
            name="reminderType"
            render={({ field: { onChange, value } }) => (
              <View>
                <Text variant="bodyMedium" style={styles.label}>Reminder Type *</Text>
                <View style={styles.categoryContainer}>
                  {reminderTypes.map((type) => (
                    <Chip
                      key={type}
                      selected={value === type}
                      onPress={() => onChange(type)}
                      style={styles.categoryChip}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                    </Chip>
                  ))}
                </View>
              </View>
            )}
          />

          <Controller
            control={control}
            name="scheduledDate"
            render={({ field: { onChange, value } }) => (
              <View>
                <Text variant="bodyMedium" style={styles.label}>Scheduled Date & Time *</Text>
                <Button
                  mode="outlined"
                  onPress={() => setShowDatePicker(true)}
                  style={styles.dateButton}
                >
                  {value.toLocaleString()}
                </Button>
                {showDatePicker && (
                  <DateTimePicker
                    value={value}
                    mode="datetime"
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
            name="priority"
            render={({ field: { onChange, value } }) => (
              <View>
                <Text variant="bodyMedium" style={styles.label}>Priority</Text>
                <View style={styles.statusContainer}>
                  {priorities.map((priority) => (
                    <Chip
                      key={priority}
                      selected={value === priority}
                      onPress={() => onChange(priority)}
                      style={styles.statusChip}
                    >
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </Chip>
                  ))}
                </View>
              </View>
            )}
          />

          <Controller
            control={control}
            name="sendMethod"
            render={({ field: { onChange, value } }) => (
              <View>
                <Text variant="bodyMedium" style={styles.label}>Send Method</Text>
                <View style={styles.statusContainer}>
                  {sendMethods.map((method) => (
                    <Chip
                      key={method}
                      selected={value === method}
                      onPress={() => onChange(method)}
                      style={styles.statusChip}
                    >
                      {method.toUpperCase()}
                    </Chip>
                  ))}
                </View>
              </View>
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
                  
                  {selectedContact ? (
                    <Pressable
                      onPress={() => setShowContactPicker(true)}
                      style={styles.selectedContactCard}
                    >
                      <View style={styles.selectedContactContent}>
                        <View style={styles.selectedContactAvatar}>
                          <Text style={styles.selectedContactAvatarText}>
                            {selectedContact.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?'}
                          </Text>
                        </View>
                        <View style={styles.selectedContactInfo}>
                          <Text variant="titleMedium" style={styles.selectedContactName}>
                            {selectedContact.name}
                          </Text>
                          <Text variant="bodySmall" style={styles.selectedContactPhone}>
                            {selectedContact.phone || 'No phone'}
                          </Text>
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

                  {selectedContact && (
                    <Button
                      mode="text"
                      onPress={() => onChange('')}
                      style={styles.clearButton}
                      icon="close"
                    >
                      Clear Selection
                    </Button>
                  )}

                  {showContactPicker && (
                    <View style={styles.contactPickerContainer}>
                      <View style={styles.contactPickerHeader}>
                        <Text variant="titleMedium" style={styles.contactPickerTitle}>Select Contact</Text>
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
                          placeholder="Search contacts..."
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
                      </View>

                      <FlatList
                        data={filteredContacts}
                        style={styles.contactList}
                        contentContainerStyle={styles.contactListContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={true}
                        keyExtractor={(item) => item._id}
                        renderItem={({ item: contact }) => {
                          const isSelected = value === contact._id;
                          const initials = contact.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?';
                          
                          return (
                            <Pressable
                              onPress={() => {
                                onChange(contact._id);
                                setShowContactPicker(false);
                                setContactSearch('');
                              }}
                              style={({ pressed }) => [
                                styles.contactItem,
                                pressed && styles.contactItemPressed,
                                isSelected && styles.selectedContactItem
                              ]}
                            >
                              <View style={styles.checkboxContainer}>
                                <Checkbox
                                  status={isSelected ? 'checked' : 'unchecked'}
                                  onPress={() => {
                                    onChange(contact._id);
                                    setShowContactPicker(false);
                                    setContactSearch('');
                                  }}
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
                                </Text>
                                <Text variant="bodySmall" style={styles.contactPhone}>
                                  {contact.phone}
                                </Text>
                              </View>
                            </Pressable>
                          );
                        }}
                        ListEmptyComponent={
                          <View style={styles.centerContainer}>
                            <Text style={styles.emptyText}>No contacts found</Text>
                          </View>
                        }
                        initialNumToRender={20}
                        maxToRenderPerBatch={10}
                        windowSize={10}
                        removeClippedSubviews={true}
                      />
                    </View>
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
            loading={createMutation.isPending}
            buttonColor="#8b5cf6"
          >
            Create Reminder
          </Button>
        </View>
      </ScrollView>
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
  statusContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statusChip: {
    marginRight: 8,
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

