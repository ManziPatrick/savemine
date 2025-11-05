import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, ActivityIndicator } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pettyCashAPI } from '../../services/api';
import { useNavigation } from '@react-navigation/native';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function PettyCashScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const { data: pettyCashData, isLoading } = useQuery({
    queryKey: ['pettyCash'],
    queryFn: () => pettyCashAPI.getPettyCash(),
  });

  const { data: transactionsData } = useQuery({
    queryKey: ['pettyCashTransactions'],
    queryFn: () => pettyCashAPI.getTransactions({ limit: 20 }),
  });

  const { data: statsData, error: statsError } = useQuery({
    queryKey: ['pettyCashStats'],
    queryFn: () => pettyCashAPI.getPettyCashStats(),
    retry: 1,
  });

  const pettyCash = pettyCashData?.data || null;
  const transactions = transactionsData?.data?.data || transactionsData?.data || [];
  const stats = statsData?.data?.data?.overview || statsData?.data?.overview || statsData?.data || {};

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading petty cash...</Text>
      </View>
    );
  }

  const balance = pettyCash?.currentBalance || pettyCash?.balance || stats?.currentBalance || 0;
  const currency = pettyCash?.currency || 'FRW';
  const totalDeposits = stats?.totalDeposits || 0;
  const totalWithdrawals = stats?.totalWithdrawals || 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Balance Card */}
        <Card style={styles.balanceCard}>
          <Card.Content>
            <Text variant="bodySmall" style={styles.balanceLabel}>Current Balance</Text>
            <Text variant="headlineLarge" style={styles.balanceAmount}>
              {formatCurrency(balance, currency)}
            </Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text variant="bodySmall" style={styles.statLabel}>Total Deposits</Text>
                <Text variant="titleMedium" style={styles.statValue}>
                  {statsError ? 'N/A' : formatCurrency(totalDeposits, currency)}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="bodySmall" style={styles.statLabel}>Total Withdrawals</Text>
                <Text variant="titleMedium" style={[styles.statValue, styles.withdrawalValue]}>
                  {statsError ? 'N/A' : formatCurrency(totalWithdrawals, currency)}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <Button
            mode="contained"
            icon="plus"
            style={[styles.actionButton, styles.depositButton]}
            onPress={() => navigation.navigate('AddDeposit')}
            contentStyle={styles.buttonContent}
          >
            Deposit
          </Button>
          <Button
            mode="contained"
            icon="minus"
            style={[styles.actionButton, styles.withdrawButton]}
            onPress={() => navigation.navigate('AddWithdrawal')}
            contentStyle={styles.buttonContent}
          >
            Withdraw
          </Button>
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Recent Transactions
          </Text>
          {transactions.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <Text variant="bodyMedium" style={styles.emptyText}>
                  No transactions yet
                </Text>
              </Card.Content>
            </Card>
          ) : (
            transactions.map((transaction, index) => (
              <Card key={transaction._id || index} style={styles.transactionCard}>
                <Card.Content>
                  <View style={styles.transactionRow}>
                    <View style={styles.transactionLeft}>
                      <View style={styles.transactionIconContainer}>
                        <Text style={styles.transactionIcon}>
                          {transaction.type === 'deposit' ? '⬇️' : '⬆️'}
                        </Text>
                      </View>
                      <View style={styles.transactionDetails}>
                        <Text variant="titleMedium" style={styles.transactionType}>
                          {transaction.type === 'deposit' ? 'Deposit' : 'Withdrawal'}
                        </Text>
                        <Text variant="bodySmall" style={styles.transactionDate}>
                          {formatDate(transaction.createdAt)}
                        </Text>
                      </View>
                    </View>
                    <Text 
                      variant="titleLarge" 
                      style={[
                        styles.transactionAmount,
                        transaction.type === 'deposit' ? styles.depositAmount : styles.withdrawalAmount
                      ]}
                    >
                      {transaction.type === 'deposit' ? '+' : '-'}
                      {formatCurrency(transaction.amount, currency)}
                    </Text>
                  </View>
                  {transaction.description && (
                    <Text variant="bodySmall" style={styles.transactionDescription}>
                      {transaction.description}
                    </Text>
                  )}
                </Card.Content>
              </Card>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 14,
  },
  content: {
    padding: 16,
  },
  balanceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  balanceLabel: {
    color: '#64748b',
    marginBottom: 8,
    fontSize: 12,
  },
  balanceAmount: {
    fontWeight: '700',
    color: '#059669',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    color: '#64748b',
    fontSize: 11,
    marginBottom: 4,
  },
  statValue: {
    fontWeight: '600',
    color: '#1e293b',
  },
  withdrawalValue: {
    color: '#dc2626',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
  },
  depositButton: {
    backgroundColor: '#059669',
  },
  withdrawButton: {
    backgroundColor: '#dc2626',
  },
  buttonContent: {
    paddingVertical: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
  },
  transactionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionIcon: {
    fontSize: 20,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionType: {
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  transactionDate: {
    color: '#64748b',
    fontSize: 11,
  },
  transactionAmount: {
    fontWeight: '700',
  },
  depositAmount: {
    color: '#059669',
  },
  withdrawalAmount: {
    color: '#dc2626',
  },
  transactionDescription: {
    color: '#64748b',
    marginTop: 8,
    fontSize: 12,
  },
});

