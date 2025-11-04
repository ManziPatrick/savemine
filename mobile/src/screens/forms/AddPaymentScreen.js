import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { TextInput, Button, Text, HelperText, Chip, ActivityIndicator } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { loansAPI } from '../../services/api';
import { useNavigation, useRoute } from '@react-navigation/native';
import { formatCurrency } from '../../utils/formatters';

export default function AddPaymentScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const queryClient = useQueryClient();
  const { loanId } = route.params;
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      amount: '',
      paymentMethod: 'cash',
      notes: '',
    },
  });

  const { data: loanData } = useQuery({
    queryKey: ['loan', loanId],
    queryFn: () => loansAPI.getLoan(loanId),
  });

  const loan = loanData?.data?.data || loanData?.data;

  const addPaymentMutation = useMutation({
    mutationFn: ({ id, data }) => loansAPI.addPayment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['loan', loanId] });
      Alert.alert('Success', 'Payment added successfully');
      navigation.goBack();
    },
    onError: (error) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add payment');
    },
  });

  const onSubmit = async (data) => {
    if (!data.amount || parseFloat(data.amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid payment amount');
      return;
    }

    const paymentAmount = parseFloat(data.amount);
    if (loan && paymentAmount > loan.remainingAmount) {
      Alert.alert('Error', `Payment amount cannot exceed remaining balance of ${formatCurrency(loan.remainingAmount, loan.currency)}`);
      return;
    }

    addPaymentMutation.mutate({
      id: loanId,
      data: {
        amount: paymentAmount,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
      },
    });
  };

  if (!loan) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
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
          <Text variant="headlineSmall" style={styles.title}>Add Payment</Text>

          <View style={styles.loanInfo}>
            <Text variant="titleMedium" style={styles.infoTitle}>Loan Details</Text>
            <Text variant="bodyMedium">Borrower: {loan.contactId?.name || 'Unknown'}</Text>
            <Text variant="bodyMedium">Remaining: {formatCurrency(loan.remainingAmount, loan.currency)}</Text>
            <Text variant="bodyMedium">Total Amount: {formatCurrency(loan.totalAmount, loan.currency)}</Text>
          </View>

          <Controller
            control={control}
            name="amount"
            rules={{ required: 'Amount is required' }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Payment Amount *"
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
            name="paymentMethod"
            render={({ field: { onChange, value } }) => (
              <View>
                <Text variant="bodyMedium" style={styles.label}>Payment Method *</Text>
                <View style={styles.methodContainer}>
                  {['cash', 'card', 'mobile', 'bank'].map((method) => (
                    <Chip
                      key={method}
                      selected={value === method}
                      onPress={() => onChange(method)}
                      style={styles.methodChip}
                    >
                      {method.charAt(0).toUpperCase() + method.slice(1)}
                    </Chip>
                  ))}
                </View>
              </View>
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
            loading={addPaymentMutation.isPending}
          >
            Add Payment
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
  loanInfo: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    marginBottom: 8,
  },
  label: {
    marginBottom: 8,
    marginTop: 8,
  },
  methodContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  methodChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  submitButton: {
    marginTop: 20,
    paddingVertical: 8,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

