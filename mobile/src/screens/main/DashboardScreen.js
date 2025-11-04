import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Card, Text, ActivityIndicator, Divider } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { 
  loansAPI, 
  transactionsAPI, 
  savingsAPI, 
  expensesAPI, 
  assetsAPI, 
  investmentsAPI, 
  businessesAPI, 
  giftsAPI, 
  remindersAPI, 
  pettyCashAPI,
  contactsAPI 
} from '../../services/api';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { formatCurrency } from '../../utils/formatters';

export default function DashboardScreen() {
  const navigation = useNavigation();

  // Fetch all stats
  const { data: loanStats, isLoading: loansLoading, refetch: refetchLoans } = useQuery({
    queryKey: ['loanStats'],
    queryFn: () => loansAPI.getLoanStats(),
  });

  const { data: transactionStats, isLoading: transactionsLoading, refetch: refetchTransactions } = useQuery({
    queryKey: ['transactionStats'],
    queryFn: () => transactionsAPI.getTransactionStats(),
  });

  const { data: savingsStats, isLoading: savingsLoading, refetch: refetchSavings } = useQuery({
    queryKey: ['savingsStats'],
    queryFn: () => savingsAPI.getSavingsStats(),
  });

  const { data: expenseStats, isLoading: expensesLoading, refetch: refetchExpenses } = useQuery({
    queryKey: ['expenseStats'],
    queryFn: () => expensesAPI.getExpenseStats(),
  });

  const { data: assetStats, isLoading: assetsLoading, refetch: refetchAssets } = useQuery({
    queryKey: ['assetStats'],
    queryFn: () => assetsAPI.getAssetStats(),
  });

  const { data: investmentStats, isLoading: investmentsLoading, refetch: refetchInvestments } = useQuery({
    queryKey: ['investmentStats'],
    queryFn: () => investmentsAPI.getInvestmentStats(),
  });

  const { data: businessStats, isLoading: businessesLoading, refetch: refetchBusinesses } = useQuery({
    queryKey: ['businessStats'],
    queryFn: () => businessesAPI.getBusinessStats(),
  });

  const { data: pettyCashData, isLoading: pettyCashLoading, refetch: refetchPettyCash } = useQuery({
    queryKey: ['pettyCash'],
    queryFn: () => pettyCashAPI.getPettyCash(),
  });

  const { data: contactsData, isLoading: contactsLoading, refetch: refetchContacts } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => contactsAPI.getContacts({ limit: 1 }),
  });

  const { data: remindersStats, isLoading: remindersLoading, refetch: refetchReminders } = useQuery({
    queryKey: ['reminderStats'],
    queryFn: () => remindersAPI.getReminderStats(),
  });

  const isLoading = loansLoading || transactionsLoading || savingsLoading || expensesLoading || 
                    assetsLoading || investmentsLoading || businessesLoading || pettyCashLoading || 
                    contactsLoading || remindersLoading || giftsLoading;

  const refetchAll = () => {
    refetchLoans();
    refetchTransactions();
    refetchSavings();
    refetchExpenses();
    refetchAssets();
    refetchInvestments();
    refetchBusinesses();
    refetchPettyCash();
    refetchContacts();
    refetchReminders();
    refetchGifts();
  };

  const loanData = loanStats?.data?.data?.overview || {};
  const transactionData = transactionStats?.data?.data || {};
  const savingsData = savingsStats?.data?.data || {};
  const expenseData = expenseStats?.data?.data || {};
  const assetData = assetStats?.data?.data || {};
  const investmentData = investmentStats?.data?.data || {};
  const businessData = businessStats?.data?.data || {};
  const pettyCash = pettyCashData?.data?.data || pettyCashData?.data;
  const contactsTotal = contactsData?.data?.data?.pagination?.total || contactsData?.data?.pagination?.total || 0;
  const remindersData = remindersStats?.data?.data || {};
  const giftsData = giftsStats?.data?.data || {};

  const totalIncome = (transactionData.totalIncome || 0) + (businessData.totalIncome || 0);
  const totalExpenses = (expenseData.totalAmount || 0) + (transactionData.totalExpenses || 0);
  const netWorth = (assetData.totalValue || 0) + 
                   (investmentData.totalValue || 0) + 
                   (savingsData.totalBalance || 0) + 
                   (pettyCash?.balance || 0) - 
                   (loanData.totalRemaining || 0);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refetchAll} />
      }
    >
      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.mainTitle}>
          Dashboard
        </Text>

        {isLoading ? (
          <ActivityIndicator size="large" style={styles.loader} />
        ) : (
          <>
            {/* Net Worth Card */}
            <Card style={[styles.card, styles.netWorthCard]}>
              <Card.Content>
                <View style={styles.netWorthHeader}>
                  <Icon name="wallet" size={32} color="#2563eb" />
                  <View style={styles.netWorthText}>
                    <Text variant="bodySmall" style={styles.netWorthLabel}>
                      Net Worth
                    </Text>
                    <Text variant="headlineLarge" style={styles.netWorthValue}>
                      {formatCurrency(netWorth, 'FRW')}
                    </Text>
                  </View>
                </View>
              </Card.Content>
            </Card>

            {/* Financial Overview */}
            <View style={styles.section}>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Financial Overview
              </Text>
              <View style={styles.statsGrid}>
                <TouchableOpacity 
                  onPress={() => navigation.navigate('Transactions')}
                  style={styles.statCard}
                >
                  <Card style={styles.card}>
                    <Card.Content style={styles.statContent}>
                      <Icon name="arrow-down-circle" size={24} color="#059669" />
                      <Text variant="headlineSmall" style={[styles.statValue, styles.success]}>
                        {formatCurrency(totalIncome, 'FRW')}
                      </Text>
                      <Text variant="bodySmall" style={styles.statLabel}>
                        Total Income
                      </Text>
                    </Card.Content>
                  </Card>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => navigation.navigate('Expenses')}
                  style={styles.statCard}
                >
                  <Card style={styles.card}>
                    <Card.Content style={styles.statContent}>
                      <Icon name="arrow-up-circle" size={24} color="#dc2626" />
                      <Text variant="headlineSmall" style={[styles.statValue, styles.danger]}>
                        {formatCurrency(totalExpenses, 'FRW')}
                      </Text>
                      <Text variant="bodySmall" style={styles.statLabel}>
                        Total Expenses
                      </Text>
                    </Card.Content>
                  </Card>
                </TouchableOpacity>
              </View>
            </View>

            {/* Loans Section */}
            <View style={styles.section}>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Loans
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Loans')}>
                <Card style={styles.card}>
                  <Card.Content>
                    <View style={styles.horizontalStat}>
                      <View style={styles.statLeft}>
                        <Icon name="cash-multiple" size={24} color="#2563eb" />
                        <View style={styles.statInfo}>
                          <Text variant="titleMedium" style={styles.statLabel}>
                            Total Loans
                          </Text>
                          <Text variant="bodySmall" style={styles.statSubLabel}>
                            {loanData.totalLoans || 0} active loans
                          </Text>
                        </View>
                      </View>
                      <View style={styles.statRight}>
                        <Text variant="titleLarge" style={styles.statValue}>
                          {formatCurrency(loanData.totalAmount || 0, 'FRW')}
                        </Text>
                        <Text variant="bodySmall" style={[styles.statSubLabel, styles.warning]}>
                          {formatCurrency(loanData.totalRemaining || 0, 'FRW')} outstanding
                        </Text>
                      </View>
                    </View>
                    {loanData.overdueLoans > 0 && (
                      <View style={styles.alertBadge}>
                        <Text variant="bodySmall" style={styles.alertText}>
                          ⚠️ {loanData.overdueLoans} overdue loans
                        </Text>
                      </View>
                    )}
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            </View>

            {/* Assets & Investments */}
            <View style={styles.section}>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Assets & Investments
              </Text>
              <View style={styles.statsGrid}>
                <TouchableOpacity 
                  onPress={() => navigation.navigate('Assets')}
                  style={styles.statCard}
                >
                  <Card style={styles.card}>
                    <Card.Content style={styles.statContent}>
                      <Icon name="package-variant" size={24} color="#2563eb" />
                      <Text variant="headlineSmall" style={styles.statValue}>
                        {formatCurrency(assetData.totalValue || 0, 'FRW')}
                      </Text>
                      <Text variant="bodySmall" style={styles.statLabel}>
                        Assets ({assetData.totalCount || 0})
                      </Text>
                    </Card.Content>
                  </Card>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => navigation.navigate('Investments')}
                  style={styles.statCard}
                >
                  <Card style={styles.card}>
                    <Card.Content style={styles.statContent}>
                      <Icon name="trending-up" size={24} color="#059669" />
                      <Text variant="headlineSmall" style={[styles.statValue, styles.success]}>
                        {formatCurrency(investmentData.totalValue || 0, 'FRW')}
                      </Text>
                      <Text variant="bodySmall" style={styles.statLabel}>
                        Investments ({investmentData.totalCount || 0})
                      </Text>
                    </Card.Content>
                  </Card>
                </TouchableOpacity>
              </View>
            </View>

            {/* Savings & Petty Cash */}
            <View style={styles.section}>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Savings & Cash
              </Text>
              <View style={styles.statsGrid}>
                <TouchableOpacity 
                  onPress={() => navigation.navigate('Savings')}
                  style={styles.statCard}
                >
                  <Card style={styles.card}>
                    <Card.Content style={styles.statContent}>
                      <Icon name="piggy-bank" size={24} color="#8b5cf6" />
                      <Text variant="headlineSmall" style={styles.statValue}>
                        {formatCurrency(savingsData.totalBalance || 0, 'FRW')}
                      </Text>
                      <Text variant="bodySmall" style={styles.statLabel}>
                        Savings ({savingsData.totalCount || 0})
                      </Text>
                    </Card.Content>
                  </Card>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => navigation.navigate('More', { screen: 'PettyCash' })}
                  style={styles.statCard}
                >
                  <Card style={styles.card}>
                    <Card.Content style={styles.statContent}>
                      <Icon name="wallet" size={24} color="#f59e0b" />
                      <Text variant="headlineSmall" style={styles.statValue}>
                        {formatCurrency(pettyCash?.balance || 0, pettyCash?.currency || 'FRW')}
                      </Text>
                      <Text variant="bodySmall" style={styles.statLabel}>
                        Petty Cash
                      </Text>
                    </Card.Content>
                  </Card>
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Stats Grid */}
            <View style={styles.section}>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Quick Stats
              </Text>
              <View style={styles.quickStatsGrid}>
                <TouchableOpacity 
                  onPress={() => navigation.navigate('Contacts')}
                  style={styles.quickStatCard}
                >
                  <Card style={styles.card}>
                    <Card.Content style={styles.quickStatContent}>
                      <Icon name="contacts" size={20} color="#64748b" />
                      <Text variant="headlineSmall" style={styles.quickStatValue}>
                        {contactsTotal}
                      </Text>
                      <Text variant="bodySmall" style={styles.quickStatLabel}>
                        Contacts
                      </Text>
                    </Card.Content>
                  </Card>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => navigation.navigate('More', { screen: 'Business' })}
                  style={styles.quickStatCard}
                >
                  <Card style={styles.card}>
                    <Card.Content style={styles.quickStatContent}>
                      <Icon name="office-building" size={20} color="#dc2626" />
                      <Text variant="headlineSmall" style={styles.quickStatValue}>
                        {businessData.totalCount || 0}
                      </Text>
                      <Text variant="bodySmall" style={styles.quickStatLabel}>
                        Businesses
                      </Text>
                    </Card.Content>
                  </Card>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => navigation.navigate('More', { screen: 'Gifts' })}
                  style={styles.quickStatCard}
                >
                  <Card style={styles.card}>
                    <Card.Content style={styles.quickStatContent}>
                      <Icon name="gift" size={20} color="#ec4899" />
                      <Text variant="headlineSmall" style={styles.quickStatValue}>
                        {giftsData.totalCount || 0}
                      </Text>
                      <Text variant="bodySmall" style={styles.quickStatLabel}>
                        Gifts
                      </Text>
                    </Card.Content>
                  </Card>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => navigation.navigate('More', { screen: 'Reminders' })}
                  style={styles.quickStatCard}
                >
                  <Card style={styles.card}>
                    <Card.Content style={styles.quickStatContent}>
                      <Icon name="bell" size={20} color="#8b5cf6" />
                      <Text variant="headlineSmall" style={styles.quickStatValue}>
                        {remindersData.totalCount || 0}
                      </Text>
                      <Text variant="bodySmall" style={styles.quickStatLabel}>
                        Reminders
                      </Text>
                    </Card.Content>
                  </Card>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 16,
  },
  mainTitle: {
    marginBottom: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  loader: {
    marginTop: 50,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  netWorthCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  netWorthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  netWorthText: {
    marginLeft: 16,
    flex: 1,
  },
  netWorthLabel: {
    color: '#64748b',
    marginBottom: 4,
  },
  netWorthValue: {
    fontWeight: '700',
    color: '#2563eb',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  statValue: {
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
    color: '#1e293b',
  },
  statLabel: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
  },
  success: {
    color: '#059669',
  },
  danger: {
    color: '#dc2626',
  },
  warning: {
    color: '#f59e0b',
  },
  horizontalStat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statInfo: {
    marginLeft: 12,
  },
  statSubLabel: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  statRight: {
    alignItems: 'flex-end',
  },
  alertBadge: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#dc2626',
  },
  alertText: {
    color: '#dc2626',
    fontWeight: '500',
  },
  quickStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickStatCard: {
    width: '48%',
  },
  quickStatContent: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  quickStatValue: {
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 2,
    color: '#1e293b',
  },
  quickStatLabel: {
    color: '#64748b',
    fontSize: 11,
    textAlign: 'center',
  },
});
