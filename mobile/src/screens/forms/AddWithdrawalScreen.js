import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pettyCashAPI } from '../../services/api';
import { useNavigation } from '@react-navigation/native';
import { formatCurrency } from '../../utils/formatters';

export default function AddWithdrawalScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const { data: pettyCashData } = useQuery({
    queryKey: ['pettyCash'],
    queryFn: () => pettyCashAPI.getPettyCash(),
  });

  const pettyCash = pettyCashData?.data?.data || pettyCashData?.data;
  const balance = pettyCash?.balance || 0;
  const currency = pettyCash?.currency || 'FRW';

  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      amount: '',
      description: '',
      purpose: '',
      currency: currency,
    },
  });

  const withdrawalMutation = useMutation({
    mutationFn: (data) => pettyCashAPI.makeWithdrawal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pettyCash'] });
      queryClient.invalidateQueries({ queryKey: ['pettyCashTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['pettyCashStats'] });
      Alert.alert('Success', 'Withdrawal recorded successfully');
      navigation.goBack();
    },
    onError: (error) => {
      Alert.alert(
        'Error', 
        error.response?.data?.message || error.message || 'Failed to record withdrawal. Please try again.'
      );
    },
  });

  const onSubmit = async (data) => {
    if (!data.amount || parseFloat(data.amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid withdrawal amount');
      return;
    }

    const withdrawalAmount = parseFloat(data.amount);
    
    if (withdrawalAmount > balance) {
      Alert.alert('Error', `Insufficient funds. Available balance: ${formatCurrency(balance, currency)}`);
      return;
    }

    const withdrawalData = {
      amount: withdrawalAmount,
      description: data.description || 'Withdrawal',
      purpose: data.purpose || '',
      currency: data.currency,
    };

    withdrawalMutation.mutate(withdrawalData);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text variant="headlineSmall" style={styles.title}>Record Withdrawal</Text>

          <View style={styles.balanceCard}>
            <Text variant="bodySmall" style={styles.balanceLabel}>Available Balance</Text>
            <Text variant="headlineMedium" style={styles.balanceAmount}>
              {formatCurrency(balance, currency)}
            </Text>
          </View>

          <Controller
            control={control}
            name="amount"
            rules={{ required: 'Amount is required' }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Withdrawal Amount *"
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

          <Controller
            control={control}
            name="purpose"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Purpose"
                value={value}
                onChangeText={onChange}
                mode="outlined"
                style={styles.input}
                placeholder="What is this withdrawal for?"
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
                placeholder="Optional description for this withdrawal"
              />
            )}
          />

          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            style={styles.submitButton}
            loading={withdrawalMutation.isPending}
            buttonColor="#dc2626"
          >
            Record Withdrawal
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
  balanceCard: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  balanceLabel: {
    color: '#64748b',
    marginBottom: 8,
  },
  balanceAmount: {
    fontWeight: '700',
    color: '#059669',
  },
  input: {
    marginBottom: 8,
  },
  submitButton: {
    marginTop: 20,
    paddingVertical: 8,
  },
});

