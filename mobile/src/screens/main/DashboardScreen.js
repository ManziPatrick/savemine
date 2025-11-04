import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
import { Card, Text, ActivityIndicator, Surface } from 'react-native-paper';
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

const { width } = Dimensions.get('window');

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

  const { data: giftsStats, isLoading: giftsLoading, refetch: refetchGifts } = useQuery({
    queryKey: ['giftStats'],
    queryFn: () => giftsAPI.getGiftStats(),
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

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refetchAll} />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.headerTitle}>Dashboard</Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>Your financial overview</Text>
        </View>

        {/* Net Worth Card - Hero Section */}
        <Surface style={styles.heroCard} elevation={4}>
          <View style={styles.heroContent}>
            <View style={styles.heroIconContainer}>
              <Icon name="wallet" size={40} color="#ffffff" />
            </View>
            <View style={styles.heroTextContainer}>
              <Text variant="bodySmall" style={styles.heroLabel}>Total Net Worth</Text>
              <Text variant="displaySmall" style={styles.heroValue}>
                {formatCurrency(netWorth, 'FRW')}
              </Text>
            </View>
          </View>
        </Surface>

        {/* Income & Expenses Row */}
        <View style={styles.row}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Transactions')}
            style={styles.halfCard}
          >
            <Surface style={styles.statCard} elevation={2}>
              <View style={styles.statIconContainer}>
                <Icon name="arrow-down-circle" size={28} color="#059669" />
              </View>
              <Text variant="headlineSmall" style={styles.statValue}>
                {formatCurrency(totalIncome, 'FRW')}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>Total Income</Text>
            </Surface>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigation.navigate('Expenses')}
            style={styles.halfCard}
          >
            <Surface style={styles.statCard} elevation={2}>
              <View style={[styles.statIconContainer, styles.expenseIconContainer]}>
                <Icon name="arrow-up-circle" size={28} color="#dc2626" />
              </View>
              <Text variant="headlineSmall" style={[styles.statValue, styles.expenseValue]}>
                {formatCurrency(totalExpenses, 'FRW')}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>Total Expenses</Text>
            </Surface>
          </TouchableOpacity>
        </View>

        {/* Section Title */}
        <Text variant="titleLarge" style={styles.sectionTitle}>Financial Assets</Text>

        {/* Loans Card */}
        <TouchableOpacity onPress={() => navigation.navigate('Loans')}>
          <Surface style={styles.detailCard} elevation={2}>
            <View style={styles.detailCardContent}>
              <View style={[styles.detailIconContainer, { backgroundColor: '#eff6ff' }]}>
                <Icon name="cash-multiple" size={24} color="#2563eb" />
              </View>
              <View style={styles.detailTextContainer}>
                <Text variant="titleMedium" style={styles.detailTitle}>Loans</Text>
                <Text variant="bodySmall" style={styles.detailSubtitle}>
                  {loanData.totalLoans || 0} active • {formatCurrency(loanData.totalRemaining || 0, 'FRW')} outstanding
                </Text>
              </View>
              <View style={styles.detailValueContainer}>
                <Text variant="titleLarge" style={styles.detailValue}>
                  {formatCurrency(loanData.totalAmount || 0, 'FRW')}
                </Text>
                {loanData.overdueLoans > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{loanData.overdueLoans} overdue</Text>
                  </View>
                )}
              </View>
            </View>
          </Surface>
        </TouchableOpacity>

        {/* Assets & Investments Row */}
        <View style={styles.row}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('More', { screen: 'Assets' })}
            style={styles.halfCard}
          >
            <Surface style={styles.miniCard} elevation={2}>
              <View style={[styles.miniIconContainer, { backgroundColor: '#eff6ff' }]}>
                <Icon name="package-variant" size={24} color="#2563eb" />
              </View>
              <Text variant="headlineSmall" style={styles.miniValue}>
                {formatCurrency(assetData.totalValue || 0, 'FRW')}
              </Text>
              <Text variant="bodySmall" style={styles.miniLabel}>
                Assets ({assetData.totalCount || 0})
              </Text>
            </Surface>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigation.navigate('More', { screen: 'Investments' })}
            style={styles.halfCard}
          >
            <Surface style={styles.miniCard} elevation={2}>
              <View style={[styles.miniIconContainer, { backgroundColor: '#f0fdf4' }]}>
                <Icon name="trending-up" size={24} color="#059669" />
              </View>
              <Text variant="headlineSmall" style={[styles.miniValue, styles.successValue]}>
                {formatCurrency(investmentData.totalValue || 0, 'FRW')}
              </Text>
              <Text variant="bodySmall" style={styles.miniLabel}>
                Investments ({investmentData.totalCount || 0})
              </Text>
            </Surface>
          </TouchableOpacity>
        </View>

        {/* Savings & Petty Cash Row */}
        <View style={styles.row}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Savings')}
            style={styles.halfCard}
          >
            <Surface style={styles.miniCard} elevation={2}>
              <View style={[styles.miniIconContainer, { backgroundColor: '#f5f3ff' }]}>
                <Icon name="piggy-bank" size={24} color="#8b5cf6" />
              </View>
              <Text variant="headlineSmall" style={styles.miniValue}>
                {formatCurrency(savingsData.totalBalance || 0, 'FRW')}
              </Text>
              <Text variant="bodySmall" style={styles.miniLabel}>
                Savings ({savingsData.totalCount || 0})
              </Text>
            </Surface>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigation.navigate('More', { screen: 'PettyCash' })}
            style={styles.halfCard}
          >
            <Surface style={styles.miniCard} elevation={2}>
              <View style={[styles.miniIconContainer, { backgroundColor: '#fffbeb' }]}>
                <Icon name="wallet" size={24} color="#f59e0b" />
              </View>
              <Text variant="headlineSmall" style={styles.miniValue}>
                {formatCurrency(pettyCash?.balance || 0, pettyCash?.currency || 'FRW')}
              </Text>
              <Text variant="bodySmall" style={styles.miniLabel}>Petty Cash</Text>
            </Surface>
          </TouchableOpacity>
        </View>

        {/* Section Title */}
        <Text variant="titleLarge" style={styles.sectionTitle}>Quick Stats</Text>

        {/* Quick Stats Grid */}
        <View style={styles.gridRow}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Contacts')}
            style={styles.quarterCard}
          >
            <Surface style={styles.quickStatCard} elevation={1}>
              <Icon name="contacts" size={20} color="#64748b" />
              <Text variant="headlineSmall" style={styles.quickStatValue}>{contactsTotal}</Text>
              <Text variant="bodySmall" style={styles.quickStatLabel}>Contacts</Text>
            </Surface>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigation.navigate('More', { screen: 'Business' })}
            style={styles.quarterCard}
          >
            <Surface style={styles.quickStatCard} elevation={1}>
              <Icon name="office-building" size={20} color="#dc2626" />
              <Text variant="headlineSmall" style={styles.quickStatValue}>
                {businessData.totalCount || 0}
              </Text>
              <Text variant="bodySmall" style={styles.quickStatLabel}>Businesses</Text>
            </Surface>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigation.navigate('More', { screen: 'Gifts' })}
            style={styles.quarterCard}
          >
            <Surface style={styles.quickStatCard} elevation={1}>
              <Icon name="gift" size={20} color="#ec4899" />
              <Text variant="headlineSmall" style={styles.quickStatValue}>
                {giftsData.totalCount || 0}
              </Text>
              <Text variant="bodySmall" style={styles.quickStatLabel}>Gifts</Text>
            </Surface>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigation.navigate('More', { screen: 'Reminders' })}
            style={styles.quarterCard}
          >
            <Surface style={styles.quickStatCard} elevation={1}>
              <Icon name="bell" size={20} color="#8b5cf6" />
              <Text variant="headlineSmall" style={styles.quickStatValue}>
                {remindersData.totalCount || 0}
              </Text>
              <Text variant="bodySmall" style={styles.quickStatLabel}>Reminders</Text>
            </Surface>
          </TouchableOpacity>
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
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#64748b',
  },
  heroCard: {
    backgroundColor: '#2563eb',
    borderRadius: 20,
    marginBottom: 20,
    padding: 24,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  heroTextContainer: {
    flex: 1,
  },
  heroLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
    fontSize: 14,
  },
  heroValue: {
    color: '#ffffff',
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  halfCard: {
    flex: 1,
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  expenseIconContainer: {
    backgroundColor: '#fef2f2',
  },
  statValue: {
    fontWeight: '700',
    color: '#059669',
    marginBottom: 4,
  },
  expenseValue: {
    color: '#dc2626',
  },
  statLabel: {
    color: '#64748b',
    fontSize: 12,
  },
  sectionTitle: {
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 8,
    marginBottom: 16,
  },
  detailCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
  },
  detailCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  detailIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailTitle: {
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  detailSubtitle: {
    color: '#64748b',
    fontSize: 12,
  },
  detailValueContainer: {
    alignItems: 'flex-end',
  },
  detailValue: {
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  badge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  badgeText: {
    color: '#dc2626',
    fontSize: 10,
    fontWeight: '600',
  },
  miniCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  miniIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  miniValue: {
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  successValue: {
    color: '#059669',
  },
  miniLabel: {
    color: '#64748b',
    fontSize: 11,
    textAlign: 'center',
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  quarterCard: {
    flex: 1,
  },
  quickStatCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  quickStatValue: {
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 8,
    marginBottom: 4,
  },
  quickStatLabel: {
    color: '#64748b',
    fontSize: 11,
    textAlign: 'center',
  },
});
