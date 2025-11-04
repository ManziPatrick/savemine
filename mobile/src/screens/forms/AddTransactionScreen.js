import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text, HelperText, SegmentedButtons, Chip, Modal } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { transactionsAPI, contactsAPI } from '../../services/api';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function AddTransactionScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const queryClient = useQueryClient();
  const { transactionId } = route.params || {};
  const isEditing = !!transactionId;

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [contactSearch, setContactSearch] = useState('');

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

  const contactsList = contactsData?.data?.data || [];
  const filteredContacts = contactsList.filter(contact => 
    contact.name?.toLowerCase().includes(contactSearch.toLowerCase()) ||
    contact.phone?.includes(contactSearch)
  );

  const createMutation = useMutation({
    mutationFn: transactionsAPI.createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      navigation.goBack();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => transactionsAPI.updateTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      navigation.goBack();
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
      Alert.alert('Error', error.response?.data?.message || 'Failed to save transaction');
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
                <View>
                  <Text variant="bodyMedium" style={styles.label}>Contact (Optional)</Text>
                  <TouchableOpacity
                    onPress={() => setShowContactPicker(true)}
                    style={styles.contactButton}
                  >
                    <TextInput
                      label="Select Contact"
                      value={selectedContact ? `${selectedContact.name} (${selectedContact.phone})` : ''}
                      mode="outlined"
                      editable={false}
                      right={<TextInput.Icon icon="chevron-down" />}
                      style={styles.input}
                      placeholder="Tap to select contact"
                    />
                  </TouchableOpacity>
                  {value && (
                    <Button
                      mode="text"
                      onPress={() => onChange('')}
                      style={styles.clearButton}
                    >
                      Clear Selection
                    </Button>
                  )}

                  <Modal
                    visible={showContactPicker}
                    onDismiss={() => setShowContactPicker(false)}
                    contentContainerStyle={styles.modalContent}
                  >
                    <View style={styles.modalHeader}>
                      <Text variant="titleLarge" style={styles.modalTitle}>Select Contact</Text>
                      <Button onPress={() => setShowContactPicker(false)}>Close</Button>
                    </View>
                    <TextInput
                      placeholder="Search contacts..."
                      value={contactSearch}
                      onChangeText={setContactSearch}
                      mode="outlined"
                      style={styles.searchInput}
                      left={<TextInput.Icon icon="magnify" />}
                    />
                    <ScrollView style={styles.contactList}>
                      {contactsLoading ? (
                        <Text style={styles.loadingText}>Loading contacts...</Text>
                      ) : filteredContacts.length === 0 ? (
                        <Text style={styles.emptyText}>No contacts found</Text>
                      ) : (
                        filteredContacts.map((contact) => (
                          <TouchableOpacity
                            key={contact._id}
                            onPress={() => {
                              onChange(contact._id);
                              setShowContactPicker(false);
                              setContactSearch('');
                            }}
                            style={[
                              styles.contactItem,
                              value === contact._id && styles.selectedContactItem
                            ]}
                          >
                            <View>
                              <Text variant="titleMedium" style={styles.contactName}>
                                {contact.name}
                              </Text>
                              <Text variant="bodySmall" style={styles.contactPhone}>
                                {contact.phone}
                              </Text>
                            </View>
                            {value === contact._id && (
                              <Text style={styles.checkmark}>✓</Text>
                            )}
                          </TouchableOpacity>
                        ))
                      )}
                    </ScrollView>
                  </Modal>
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
  clearButton: {
    marginBottom: 16,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 10,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontWeight: 'bold',
  },
  searchInput: {
    marginBottom: 16,
  },
  contactList: {
    maxHeight: 400,
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  selectedContactItem: {
    backgroundColor: '#eff6ff',
  },
  contactName: {
    fontWeight: '500',
    marginBottom: 4,
  },
  contactPhone: {
    color: '#6b7280',
  },
  checkmark: {
    color: '#2563eb',
    fontSize: 20,
    fontWeight: 'bold',
  },
  loadingText: {
    textAlign: 'center',
    padding: 20,
    color: '#6b7280',
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    color: '#9ca3af',
  },
});

