import React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, Chip, ActivityIndicator, Divider } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loansAPI } from '../../services/api';
import { useNavigation, useRoute } from '@react-navigation/native';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function LoanDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { loanId } = route.params;

  const { data: loanData, isLoading } = useQuery({
    queryKey: ['loan', loanId],
    queryFn: () => loansAPI.getLoan(loanId),
  });

  const deleteMutation = useMutation(loansAPI.deleteLoan, {
    onSuccess: () => {
      queryClient.invalidateQueries('loans');
      navigation.goBack();
    },
  });

  const loan = loanData?.data?.data || loanData?.data;

  const handleDelete = () => {
    Alert.alert(
      'Delete Loan',
      `Are you sure you want to delete the loan to ${loan?.contactId?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(loanId),
        },
      ]
    );
  };

  const getDaysUntilDue = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!loan) {
    return (
      <View style={styles.container}>
        <Text>Loan not found</Text>
      </View>
    );
  }

  const daysUntilDue = getDaysUntilDue(loan.dueDate);
  const isOverdue = daysUntilDue < 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.header}>
              <Text variant="headlineSmall" style={styles.title}>
                Loan Details
              </Text>
              <Chip
                style={[
                  styles.statusChip,
                  loan.status === 'active' && styles.statusActive,
                  loan.status === 'overdue' && styles.statusOverdue,
                  loan.status === 'completed' && styles.statusCompleted,
                ]}
              >
                {loan.status}
              </Chip>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Borrower Information
              </Text>
              <View style={styles.infoRow}>
                <Text variant="bodyMedium" style={styles.label}>Name:</Text>
                <Text variant="bodyLarge" style={styles.value}>
                  {loan.contactId?.name || 'Unknown'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text variant="bodyMedium" style={styles.label}>Phone:</Text>
                <Text variant="bodyLarge" style={styles.value}>
                  {loan.contactId?.phone || 'No phone'}
                </Text>
              </View>
              {loan.contactId?.email && (
                <View style={styles.infoRow}>
                  <Text variant="bodyMedium" style={styles.label}>Email:</Text>
                  <Text variant="bodyLarge" style={styles.value}>
                    {loan.contactId.email}
                  </Text>
                </View>
              )}
            </View>

            <Divider style={styles.divider} />

            <View style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Loan Information
              </Text>
              <View style={styles.infoRow}>
                <Text variant="bodyMedium" style={styles.label}>Type:</Text>
                <Text variant="bodyLarge" style={styles.value}>
                  {loan.loanType || 'Personal'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text variant="bodyMedium" style={styles.label}>Principal Amount:</Text>
                <Text variant="bodyLarge" style={styles.value}>
                  {formatCurrency(loan.principalAmount, loan.currency)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text variant="bodyMedium" style={styles.label}>Total Amount:</Text>
                <Text variant="bodyLarge" style={[styles.value, styles.totalAmount]}>
                  {formatCurrency(loan.totalAmount, loan.currency)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text variant="bodyMedium" style={styles.label}>Amount Paid:</Text>
                <Text variant="bodyLarge" style={[styles.value, styles.paidAmount]}>
                  {formatCurrency(loan.amountPaid || 0, loan.currency)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text variant="bodyMedium" style={styles.label}>Remaining:</Text>
                <Text variant="bodyLarge" style={[styles.value, styles.remainingAmount]}>
                  {formatCurrency(loan.remainingAmount, loan.currency)}
                </Text>
              </View>
              {loan.interestRate > 0 && (
                <View style={styles.infoRow}>
                  <Text variant="bodyMedium" style={styles.label}>Interest Rate:</Text>
                  <Text variant="bodyLarge" style={styles.value}>
                    {loan.interestRate}% ({loan.interestType || 'simple'})
                  </Text>
                </View>
              )}
            </View>

            <Divider style={styles.divider} />

            <View style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Dates
              </Text>
              <View style={styles.infoRow}>
                <Text variant="bodyMedium" style={styles.label}>Loan Date:</Text>
                <Text variant="bodyLarge" style={styles.value}>
                  {formatDate(loan.loanDate || loan.createdAt)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text variant="bodyMedium" style={styles.label}>Due Date:</Text>
                <Text 
                  variant="bodyLarge" 
                  style={[styles.value, isOverdue && styles.overdue]}
                >
                  {formatDate(loan.dueDate)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text variant="bodyMedium" style={styles.label}>Days Until Due:</Text>
                <Text 
                  variant="bodyLarge" 
                  style={[styles.value, isOverdue && styles.overdue]}
                >
                  {isOverdue ? `${Math.abs(daysUntilDue)} days overdue` : `${daysUntilDue} days left`}
                </Text>
              </View>
            </View>

            {loan.source && (
              <>
                <Divider style={styles.divider} />
                <View style={styles.section}>
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Source
                  </Text>
                  <View style={styles.infoRow}>
                    <Text variant="bodyMedium" style={styles.label}>Source:</Text>
                    <Text variant="bodyLarge" style={styles.value}>
                      {loan.source.sourceName}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text variant="bodyMedium" style={styles.label}>Type:</Text>
                    <Text variant="bodyLarge" style={styles.value}>
                      {loan.source.type}
                    </Text>
                  </View>
                </View>
              </>
            )}

            {loan.description && (
              <>
                <Divider style={styles.divider} />
                <View style={styles.section}>
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Description
                  </Text>
                  <Text variant="bodyMedium" style={styles.description}>
                    {loan.description}
                  </Text>
                </View>
              </>
            )}

            {loan.notes && (
              <>
                <Divider style={styles.divider} />
                <View style={styles.section}>
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Notes
                  </Text>
                  <Text variant="bodyMedium" style={styles.notes}>
                    {loan.notes}
                  </Text>
                </View>
              </>
            )}

            <Divider style={styles.divider} />

            <View style={styles.actions}>
              {loan.status !== 'completed' && (
                <Button
                  mode="contained"
                  onPress={() => navigation.navigate('AddPayment', { loanId: loan._id })}
                  style={styles.actionButton}
                  icon="cash"
                >
                  Add Payment
                </Button>
              )}
              <Button
                mode="outlined"
                onPress={() => navigation.navigate('EditLoan', { loanId: loan._id })}
                style={styles.actionButton}
                icon="pencil"
              >
                Edit Loan
              </Button>
              <Button
                mode="outlined"
                onPress={handleDelete}
                style={[styles.actionButton, styles.deleteButton]}
                textColor="#ef4444"
                icon="delete"
              >
                Delete Loan
              </Button>
            </View>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
    flex: 1,
  },
  statusChip: {
    height: 32,
  },
  statusActive: {
    backgroundColor: '#dbeafe',
  },
  statusOverdue: {
    backgroundColor: '#fee2e2',
  },
  statusCompleted: {
    backgroundColor: '#d1fae5',
  },
  divider: {
    marginVertical: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    color: '#6b7280',
    flex: 1,
  },
  value: {
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  totalAmount: {
    color: '#2563eb',
    fontWeight: 'bold',
  },
  paidAmount: {
    color: '#10b981',
  },
  remainingAmount: {
    color: '#f59e0b',
    fontWeight: 'bold',
  },
  overdue: {
    color: '#ef4444',
    fontWeight: 'bold',
  },
  description: {
    color: '#374151',
    lineHeight: 20,
  },
  notes: {
    color: '#6b7280',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  actions: {
    marginTop: 16,
  },
  actionButton: {
    marginBottom: 8,
  },
  deleteButton: {
    borderColor: '#ef4444',
  },
});
