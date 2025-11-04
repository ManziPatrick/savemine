import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { TextInput, Button, Text, HelperText, Chip } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { investmentsAPI } from '../../services/api';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function AddInvestmentScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showMaturityDatePicker, setShowMaturityDatePicker] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      investmentType: 'savings',
      description: '',
      symbol: '',
      initialAmount: '',
      currentValue: '',
      currency: 'FRW',
      startDate: new Date(),
      maturityDate: null,
      interestRate: '0',
      riskLevel: 'medium',
      location: '',
      accountNumber: '',
      broker: '',
      notes: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: investmentsAPI.createInvestment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['investmentStats'] });
      Alert.alert('Success', 'Investment added successfully');
      navigation.goBack();
    },
    onError: (error) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add investment');
    },
  });

  const onSubmit = async (data) => {
    try {
      if (!data.name || !data.initialAmount || !data.currentValue) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      const investmentData = {
        name: data.name,
        investmentType: data.investmentType,
        description: data.description || '',
        symbol: data.symbol || '',
        initialAmount: parseFloat(data.initialAmount),
        currentValue: parseFloat(data.currentValue),
        currency: data.currency,
        startDate: data.startDate.toISOString(),
        maturityDate: data.maturityDate ? data.maturityDate.toISOString() : undefined,
        interestRate: parseFloat(data.interestRate) || 0,
        riskLevel: data.riskLevel,
        location: data.location || '',
        accountNumber: data.accountNumber || '',
        broker: data.broker || '',
        notes: data.notes || '',
      };

      createMutation.mutate(investmentData);
    } catch (error) {
      Alert.alert('Error', 'Failed to save investment');
    }
  };

  const investmentTypes = ['savings', 'stocks', 'bonds', 'real_estate', 'crypto', 'business', 'animals', 'agriculture', 'other'];
  const riskLevels = ['low', 'medium', 'high', 'very_high'];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text variant="headlineSmall" style={styles.title}>Add Investment</Text>

          <Controller
            control={control}
            name="name"
            rules={{ required: 'Investment name is required' }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Investment Name *"
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
            name="investmentType"
            render={({ field: { onChange, value } }) => (
              <View>
                <Text variant="bodyMedium" style={styles.label}>Investment Type *</Text>
                <View style={styles.categoryContainer}>
                  {investmentTypes.map((type) => (
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
            name="initialAmount"
            rules={{ required: 'Initial amount is required' }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Initial Amount *"
                value={value}
                onChangeText={onChange}
                keyboardType="numeric"
                mode="outlined"
                style={styles.input}
                error={!!errors.initialAmount}
              />
            )}
          />
          {errors.initialAmount && (
            <HelperText type="error">{errors.initialAmount.message}</HelperText>
          )}

          <Controller
            control={control}
            name="currentValue"
            rules={{ required: 'Current value is required' }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Current Value *"
                value={value}
                onChangeText={onChange}
                keyboardType="numeric"
                mode="outlined"
                style={styles.input}
                error={!!errors.currentValue}
              />
            )}
          />
          {errors.currentValue && (
            <HelperText type="error">{errors.currentValue.message}</HelperText>
          )}

          <Controller
            control={control}
            name="riskLevel"
            render={({ field: { onChange, value } }) => (
              <View>
                <Text variant="bodyMedium" style={styles.label}>Risk Level</Text>
                <View style={styles.statusContainer}>
                  {riskLevels.map((level) => (
                    <Chip
                      key={level}
                      selected={value === level}
                      onPress={() => onChange(level)}
                      style={styles.statusChip}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Chip>
                  ))}
                </View>
              </View>
            )}
          />

          <Controller
            control={control}
            name="startDate"
            render={({ field: { onChange, value } }) => (
              <View>
                <Text variant="bodyMedium" style={styles.label}>Start Date *</Text>
                <Button
                  mode="outlined"
                  onPress={() => setShowStartDatePicker(true)}
                  style={styles.dateButton}
                >
                  {value.toLocaleDateString()}
                </Button>
                {showStartDatePicker && (
                  <DateTimePicker
                    value={value}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                      setShowStartDatePicker(false);
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
            name="symbol"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Symbol (for stocks/crypto)"
                value={value}
                onChangeText={onChange}
                mode="outlined"
                style={styles.input}
              />
            )}
          />

          <Controller
            control={control}
            name="broker"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Broker/Platform"
                value={value}
                onChangeText={onChange}
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
            buttonColor="#059669"
          >
            Add Investment
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
});

