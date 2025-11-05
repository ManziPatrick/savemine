import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { TextInput, Button, Text, HelperText, Chip, ActivityIndicator } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { savingsAPI } from '../../services/api';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { handleApiError } from '../../utils/errorHandler';

export default function AddSavingsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const queryClient = useQueryClient();
  const { savingId } = route.params || {};
  const isEditing = !!savingId;

  const [showDatePicker, setShowDatePicker] = useState(false);

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      location: 'Bank',
      amount: '',
      currency: 'FRW',
      targetAmount: '',
      targetDate: new Date(),
      description: '',
      notes: '',
      accountNumber: '',
      interestRate: '',
    },
  });

  // Fetch saving data when editing
  const { data: savingData, isLoading: isLoadingSaving } = useQuery({
    queryKey: ['saving', savingId],
    queryFn: () => savingsAPI.getSaving(savingId),
    enabled: isEditing && !!savingId,
  });

  // Populate form fields when editing
  useEffect(() => {
    if (isEditing && savingData?.data?.data?.saving) {
      const saving = savingData.data.data.saving;
      setValue('name', saving.name || '');
      setValue('location', saving.location || 'Bank');
      setValue('amount', saving.amount?.toString() || '');
      setValue('currency', saving.currency || 'FRW');
      setValue('targetAmount', saving.targetAmount?.toString() || '');
      setValue('targetDate', saving.targetDate ? new Date(saving.targetDate) : new Date());
      setValue('description', saving.description || '');
      setValue('notes', saving.notes || '');
      setValue('accountNumber', saving.accountNumber || '');
      setValue('interestRate', saving.interestRate?.toString() || '');
    }
  }, [isEditing, savingData, setValue]);

  const createMutation = useMutation({
    mutationFn: savingsAPI.createSavings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings'] });
      queryClient.invalidateQueries({ queryKey: ['savingsStats'] });
      navigation.goBack();
    },
    onError: (error) => {
      if (error.isOffline || error.name === 'OfflineError') {
        Alert.alert(
          'Offline Mode',
          'Savings saved locally and will sync when online.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        handleApiError(error, 'Failed to create savings');
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => savingsAPI.updateSavings(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings'] });
      queryClient.invalidateQueries({ queryKey: ['savingsStats'] });
      queryClient.invalidateQueries({ queryKey: ['saving', savingId] });
      navigation.goBack();
    },
    onError: (error) => {
      if (error.isOffline || error.name === 'OfflineError') {
        Alert.alert(
          'Offline Mode',
          'Savings updated locally and will sync when online.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        handleApiError(error, 'Failed to update savings');
      }
    },
  });

  const onSubmit = async (data) => {
    try {
      const savingsData = {
        name: data.name,
        location: data.location,
        amount: parseFloat(data.amount) || 0,
        currency: data.currency || 'FRW',
        targetAmount: data.targetAmount && data.targetAmount.trim() !== '' ? parseFloat(data.targetAmount) : undefined,
        interestRate: data.interestRate && data.interestRate.trim() !== '' ? parseFloat(data.interestRate) : 0,
        targetDate: data.targetDate.toISOString(),
        description: data.description || '',
        notes: data.notes || '',
        accountNumber: data.accountNumber || '',
      };
      if (isEditing) {
        updateMutation.mutate({ id: savingId, data: savingsData });
      } else {
        createMutation.mutate(savingsData);
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save savings');
    }
  };

  const locations = ['Bank', 'SACCO', 'MTN MoMo', 'Cash'];

  if (isLoadingSaving) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading savings...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text variant="headlineSmall" style={styles.title}>
            {isEditing ? 'Edit Savings' : 'Add Savings'}
          </Text>

          <Controller
            control={control}
            name="name"
            rules={{ required: 'Name is required' }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Name *"
                value={value}
                onChangeText={onChange}
                mode="outlined"
                style={styles.input}
                error={!!errors.name}
              />
            )}
          />
          {errors.name && (
            <HelperText type="error">{errors.name.message}</HelperText>
          )}

          <Controller
            control={control}
            name="location"
            rules={{ required: 'Location is required' }}
            render={({ field: { onChange, value } }) => (
              <View>
                <Text variant="bodyMedium" style={styles.label}>Location *</Text>
                <View style={styles.locationContainer}>
                  {locations.map((loc) => (
                    <Chip
                      key={loc}
                      selected={value === loc}
                      onPress={() => onChange(loc)}
                      style={styles.locationChip}
                    >
                      {loc}
                    </Chip>
                  ))}
                </View>
              </View>
            )}
          />

          <View style={styles.row}>
            <View style={styles.halfWidth}>
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
            name="targetAmount"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Target Amount (Optional)"
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
            name="targetDate"
            render={({ field: { onChange, value } }) => (
              <View>
                <Text variant="bodyMedium" style={styles.label}>Target Date</Text>
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
            name="interestRate"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Interest Rate (%)"
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
            name="accountNumber"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Account Number"
                value={value}
                onChangeText={onChange}
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
            loading={createMutation.isPending || updateMutation.isPending}
          >
            {isEditing ? 'Update Savings' : 'Add Savings'}
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
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  halfWidth: {
    flex: 1,
  },
  locationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  locationChip: {
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
  },
});

