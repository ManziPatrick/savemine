import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pettyCashAPI } from '../../services/api';
import { useNavigation } from '@react-navigation/native';

export default function AddDepositScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      amount: '',
      description: '',
      currency: 'FRW',
    },
  });

  const depositMutation = useMutation({
    mutationFn: (data) => pettyCashAPI.addDeposit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pettyCash'] });
      queryClient.invalidateQueries({ queryKey: ['pettyCashTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['pettyCashStats'] });
      Alert.alert('Success', 'Deposit added successfully');
      navigation.goBack();
    },
    onError: (error) => {
      Alert.alert(
        'Error', 
        error.response?.data?.message || error.message || 'Failed to add deposit. Please try again.'
      );
    },
  });

  const onSubmit = async (data) => {
    if (!data.amount || parseFloat(data.amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid deposit amount');
      return;
    }

    const depositData = {
      amount: parseFloat(data.amount),
      description: data.description || 'Deposit',
      currency: data.currency,
    };

    depositMutation.mutate(depositData);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text variant="headlineSmall" style={styles.title}>Add Deposit</Text>

          <Controller
            control={control}
            name="amount"
            rules={{ required: 'Amount is required' }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Deposit Amount *"
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
                placeholder="Optional description for this deposit"
              />
            )}
          />

          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            style={styles.submitButton}
            loading={depositMutation.isPending}
            buttonColor="#059669"
          >
            Add Deposit
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
  submitButton: {
    marginTop: 20,
    paddingVertical: 8,
  },
});

