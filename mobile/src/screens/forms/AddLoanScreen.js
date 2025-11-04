import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text, HelperText, SegmentedButtons, Menu, Portal, Modal } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { loansAPI, contactsAPI } from '../../services/api';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';

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

  const contactsList = contactsData?.data?.data || [];
  const filteredContacts = contactsList.filter(contact => 
    contact.name?.toLowerCase().includes(contactSearch.toLowerCase()) ||
    contact.phone?.includes(contactSearch)
  );

  const createMutation = useMutation({
    mutationFn: loansAPI.createLoan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      navigation.goBack();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => loansAPI.updateLoan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      navigation.goBack();
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
              const selectedContact = contactsList.find(c => c._id === value);
              
              return (
                <View>
                  <Text variant="bodyMedium" style={styles.label}>Contact *</Text>
                  <TouchableOpacity
                    onPress={() => setShowContactPicker(true)}
                    style={styles.contactButton}
                  >
                    <TextInput
                      label="Select Contact *"
                      value={selectedContact ? `${selectedContact.name} (${selectedContact.phone})` : ''}
                      mode="outlined"
                      editable={false}
                      right={<TextInput.Icon icon="chevron-down" />}
                      style={styles.input}
                      error={!!errors.contactId}
                    />
                  </TouchableOpacity>
                  {errors.contactId && (
                    <HelperText type="error">{errors.contactId.message}</HelperText>
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
  contactButton: {
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

