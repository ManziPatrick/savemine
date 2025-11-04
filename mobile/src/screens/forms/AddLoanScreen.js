import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, HelperText, SegmentedButtons } from 'react-native-paper';
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

  const { data: contacts } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => contactsAPI.getContacts({ limit: 1000 }),
  });

  const createMutation = useMutation(loansAPI.createLoan, {
    onSuccess: () => {
      queryClient.invalidateQueries('loans');
      navigation.goBack();
    },
  });

  const updateMutation = useMutation(
    ({ id, data }) => loansAPI.updateLoan(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('loans');
        navigation.goBack();
      },
    }
  );

  const onSubmit = async (data) => {
    if (!selectedSourceType) {
      alert('Please select a source type');
      return;
    }

    if (!selectedSource && selectedSourceType !== 'income' && selectedSourceType !== 'other') {
      alert('Please select a source');
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
            render={({ field: { onChange, value } }) => (
              <View>
                <Text variant="bodyMedium" style={styles.label}>Contact *</Text>
                <View style={styles.selectContainer}>
                  {/* Contact selection - simplified for mobile */}
                  <Text variant="bodySmall" style={styles.hint}>
                    Select contact from contacts list
                  </Text>
                </View>
                {errors.contactId && (
                  <HelperText type="error">{errors.contactId.message}</HelperText>
                )}
              </View>
            )}
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
            loading={createMutation.isLoading || updateMutation.isLoading}
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
});

