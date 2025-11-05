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
import { colors } from '../../theme';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const navigation = useNavigation();

  // Fetch all stats with staggered loading to avoid 429 errors
  // Load them all at once but with no retries on 429 errors
  const { data: loanStats, isLoading: loansLoading, refetch: refetchLoans, error: loansError } = useQuery({
    queryKey: ['loanStats'],
    queryFn: () => loansAPI.getLoanStats(),
    retry: (failureCount, error) => {
      if (error?.response?.status === 429) return false;
      return failureCount < 1;
    },
    staleTime: 60000, // Cache for 60 seconds
  });

  const { data: transactionStats, isLoading: transactionsLoading, refetch: refetchTransactions, error: transactionsError } = useQuery({
    queryKey: ['transactionStats'],
    queryFn: () => transactionsAPI.getTransactionStats(),
    retry: (failureCount, error) => {
      if (error?.response?.status === 429) return false;
      return failureCount < 1;
    },
    staleTime: 60000,
  });

  const { data: savingsStats, isLoading: savingsLoading, refetch: refetchSavings, error: savingsError } = useQuery({
    queryKey: ['savingsStats'],
    queryFn: () => savingsAPI.getSavingsStats(),
    retry: (failureCount, error) => {
      if (error?.response?.status === 429) return false;
      return failureCount < 1;
    },
    staleTime: 60000,
  });

  const { data: expenseStats, isLoading: expensesLoading, refetch: refetchExpenses, error: expensesError } = useQuery({
    queryKey: ['expenseStats'],
    queryFn: () => expensesAPI.getExpenseStats(),
    retry: (failureCount, error) => {
      if (error?.response?.status === 429) return false;
      return failureCount < 1;
    },
    staleTime: 60000,
  });

  const { data: assetStats, isLoading: assetsLoading, refetch: refetchAssets, error: assetsError } = useQuery({
    queryKey: ['assetStats'],
    queryFn: () => assetsAPI.getAssetStats(),
    retry: (failureCount, error) => {
      if (error?.response?.status === 429) return false;
      return failureCount < 1;
    },
    staleTime: 60000,
  });

  const { data: investmentStats, isLoading: investmentsLoading, refetch: refetchInvestments, error: investmentsError } = useQuery({
    queryKey: ['investmentStats'],
    queryFn: () => investmentsAPI.getInvestmentStats(),
    retry: (failureCount, error) => {
      if (error?.response?.status === 429) return false;
      return failureCount < 1;
    },
    staleTime: 60000,
  });

  const { data: businessStats, isLoading: businessesLoading, refetch: refetchBusinesses, error: businessesError } = useQuery({
    queryKey: ['businessStats'],
    queryFn: () => businessesAPI.getBusinessStats(),
    retry: (failureCount, error) => {
      if (error?.response?.status === 429) return false;
      return failureCount < 1;
    },
    staleTime: 60000,
  });

  const { data: pettyCashData, isLoading: pettyCashLoading, refetch: refetchPettyCash, error: pettyCashError } = useQuery({
    queryKey: ['pettyCash'],
    queryFn: () => pettyCashAPI.getPettyCashStats(), // Use stats endpoint instead
    retry: (failureCount, error) => {
      if (error?.response?.status === 429) return false;
      return failureCount < 1;
    },
    staleTime: 60000,
  });

  const { data: contactsData, isLoading: contactsLoading, refetch: refetchContacts, error: contactsError } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => contactsAPI.getContacts({ limit: 1 }),
    retry: (failureCount, error) => {
      if (error?.response?.status === 429) return false;
      return failureCount < 1;
    },
    staleTime: 60000,
  });

  const { data: remindersStats, isLoading: remindersLoading, refetch: refetchReminders, error: remindersError } = useQuery({
    queryKey: ['reminderStats'],
    queryFn: () => remindersAPI.getReminderStats(),
    retry: (failureCount, error) => {
      if (error?.response?.status === 429) return false;
      return failureCount < 1;
    },
    staleTime: 60000,
  });

  const { data: giftsStats, isLoading: giftsLoading, refetch: refetchGifts, error: giftsError } = useQuery({
    queryKey: ['giftStats'],
    queryFn: () => giftsAPI.getGiftStats(),
    retry: (failureCount, error) => {
      if (error?.response?.status === 429) return false;
      return failureCount < 1;
    },
    staleTime: 60000,
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

  const loanData = loanStats?.data?.data?.overview || loanStats?.data?.overview || loanStats?.overview || {};
  
  // Transaction stats: structure is { data: { typeBreakdown: { income: {...}, expense: {...} } } }
  const transactionData = transactionStats?.data?.data || transactionStats?.data || transactionStats || {};
  const transactionTypeBreakdown = transactionData.typeBreakdown || {};
  const incomeType = transactionTypeBreakdown.income || transactionTypeBreakdown.INCOME || {};
  const expenseType = transactionTypeBreakdown.expense || transactionTypeBreakdown.EXPENSE || {};
  
  // Savings stats: structure is { data: { overall: { totalAmount, count } } }
  const savingsData = savingsStats?.data?.data || savingsStats?.data || savingsStats || {};
  const savingsOverall = savingsData.overall || {};
  
  // Expense stats: structure is { data: { overview: { totalAmount, ... } } }
  const expenseData = expenseStats?.data?.data || expenseStats?.data || expenseStats || {};
  const expenseOverview = expenseData.overview || {};
  
  // Asset stats: structure is { data: { overall: { totalValue, count } } }
  const assetData = assetStats?.data?.data || assetStats?.data || assetStats || {};
  const assetOverall = assetData.overall || {};
  
  // Investment stats: structure is { data: { overview: { currentValue, totalInvestments } } }
  const investmentData = investmentStats?.data?.data || investmentStats?.data || investmentStats || {};
  const investmentOverview = investmentData.overview || {};
  
  // Business stats: structure is { data: { overview: { totalBusinesses, totalRevenue } } }
  const businessData = businessStats?.data?.data || businessStats?.data || businessStats || {};
  const businessOverview = businessData.overview || {};
  
  // Petty cash: structure is { data: { overview: { currentBalance } } } from stats endpoint
  const pettyCash = pettyCashData?.data?.data || pettyCashData?.data || pettyCashData || {};
  const pettyCashOverview = pettyCash.overview || {};
  
  // Contacts: structure is { data: { data: [...], pagination: { total } } }
  const contactsTotal = contactsData?.data?.data?.pagination?.total || contactsData?.data?.pagination?.total || contactsData?.pagination?.total || contactsData?.data?.length || contactsData?.length || 0;
  
  // Reminders stats: structure is { data: { overview: { totalReminders } } }
  const remindersData = remindersStats?.data?.data || remindersStats?.data || remindersStats || {};
  const remindersOverview = remindersData.overview || {};
  
  // Gifts stats: structure is { data: { overview: { totalGifts } } }
  const giftsData = giftsStats?.data?.data || giftsStats?.data || giftsStats || {};
  const giftsOverview = giftsData.overview || {};
  
  // Calculate totals
  const totalIncome = (incomeType.totalAmount || incomeType.amount || 0) + (businessOverview.totalRevenue || 0);
  const totalExpenses = (expenseOverview.totalAmount || 0) + (expenseType.totalAmount || expenseType.amount || 0);

  // Debug logging to verify data extraction
  React.useEffect(() => {
    // Log actual data structures for debugging
    if (assetStats) {
      console.log('Asset Stats Raw:', JSON.stringify(assetStats, null, 2));
      console.log('Asset Overall:', assetOverall);
    }
    if (savingsStats) {
      console.log('Savings Stats Raw:', JSON.stringify(savingsStats, null, 2));
      console.log('Savings Overall:', savingsOverall);
    }
    if (pettyCashData) {
      console.log('Petty Cash Raw:', JSON.stringify(pettyCashData, null, 2));
      console.log('Petty Cash Overview:', pettyCashOverview);
    }
    
    // Log errors only
    if (loansError) console.error('Loan Stats Error:', loansError?.response?.status, loansError?.message);
    if (transactionsError) console.error('Transaction Stats Error:', transactionsError?.response?.status, transactionsError?.message);
    if (savingsError) console.error('Savings Stats Error:', savingsError?.response?.status, savingsError?.message);
    if (assetsError) console.error('Asset Stats Error:', assetsError?.response?.status, assetsError?.message);
    if (investmentsError) console.error('Investment Stats Error:', investmentsError?.response?.status, investmentsError?.message);
    if (businessesError) console.error('Business Stats Error:', businessesError?.response?.status, businessesError?.message);
    if (pettyCashError) console.error('Petty Cash Error:', pettyCashError?.response?.status, pettyCashError?.message);
    if (giftsError) console.error('Gifts Stats Error:', giftsError?.response?.status, giftsError?.message);
    if (remindersError) console.error('Reminders Stats Error:', remindersError?.response?.status, remindersError?.message);
  }, [assetStats, savingsStats, pettyCashData, assetOverall, savingsOverall, pettyCashOverview, loansError, transactionsError, savingsError, assetsError, investmentsError, businessesError, pettyCashError, giftsError, remindersError]);

  const netWorth = (assetOverall.totalValue || assetOverall.totalCurrentValue || 0) + 
                   (investmentOverview.currentValue || investmentOverview.totalInvested || 0) + 
                   (savingsOverall.totalAmount || savingsOverall.totalBalance || 0) + 
                   (pettyCashOverview.currentBalance || pettyCash.balance || pettyCash.amount || 0) - 
                   (loanData.totalRemaining || loanData.remaining || loanData.outstanding || 0);

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
              <Icon name="wallet" size={48} color="#ffffff" />
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
                <Icon name="arrow-down-circle" size={36} color={colors.success} />
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
                <Icon name="arrow-up-circle" size={36} color={colors.error} />
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
              <View style={[styles.detailIconContainer, { backgroundColor: colors.surface }]}>
                <Icon name="cash-multiple" size={32} color={colors.primary} />
              </View>
              <View style={styles.detailTextContainer}>
                <Text variant="titleMedium" style={styles.detailTitle}>Loans</Text>
                <Text variant="bodySmall" style={styles.detailSubtitle}>
                  {loanData.totalLoans || loanData.count || loanData.loans || 0} active • {formatCurrency(loanData.totalRemaining || loanData.remaining || loanData.outstanding || 0, 'FRW')} outstanding
                </Text>
              </View>
              <View style={styles.detailValueContainer}>
                <Text variant="titleLarge" style={styles.detailValue}>
                  {formatCurrency(loanData.totalAmount || loanData.amount || loanData.total || 0, 'FRW')}
                </Text>
                {(loanData.overdueLoans || loanData.overdue || 0) > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{loanData.overdueLoans || loanData.overdue || 0} overdue</Text>
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
              <View style={[styles.miniIconContainer, { backgroundColor: colors.surface }]}>
                <Icon name="package-variant" size={32} color={colors.primary} />
              </View>
              <Text variant="headlineSmall" style={styles.miniValue}>
                {formatCurrency(assetOverall.totalValue || assetOverall.totalCurrentValue || 0, 'FRW')}
              </Text>
              <Text variant="bodySmall" style={styles.miniLabel}>
                Assets ({assetOverall.count || 0})
              </Text>
            </Surface>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigation.navigate('More', { screen: 'Investments' })}
            style={styles.halfCard}
          >
            <Surface style={styles.miniCard} elevation={2}>
              <View style={[styles.miniIconContainer, { backgroundColor: colors.surface }]}>
                <Icon name="trending-up" size={32} color={colors.success} />
              </View>
              <Text variant="headlineSmall" style={[styles.miniValue, styles.successValue]}>
                {formatCurrency(investmentOverview.currentValue || investmentOverview.totalInvested || 0, 'FRW')}
              </Text>
              <Text variant="bodySmall" style={styles.miniLabel}>
                Investments ({investmentOverview.totalInvestments || investmentOverview.totalInvested || 0})
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
                <Icon name="piggy-bank" size={32} color="#8b5cf6" />
              </View>
              <Text variant="headlineSmall" style={styles.miniValue}>
                {formatCurrency(savingsOverall.totalAmount || savingsOverall.totalBalance || 0, 'FRW')}
              </Text>
              <Text variant="bodySmall" style={styles.miniLabel}>
                Savings ({savingsOverall.count || 0})
              </Text>
            </Surface>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigation.navigate('More', { screen: 'PettyCash' })}
            style={styles.halfCard}
          >
            <Surface style={styles.miniCard} elevation={2}>
              <View style={[styles.miniIconContainer, { backgroundColor: '#fffbeb' }]}>
                <Icon name="wallet" size={32} color="#f59e0b" />
              </View>
              <Text variant="headlineSmall" style={styles.miniValue}>
                {formatCurrency(pettyCashOverview.currentBalance || pettyCash.balance || pettyCash.amount || 0, pettyCash?.currency || 'FRW')}
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
              <Icon name="contacts" size={32} color="#64748b" />
              <Text variant="headlineSmall" style={styles.quickStatValue}>{contactsTotal}</Text>
              <Text variant="bodySmall" style={styles.quickStatLabel}>Contacts</Text>
            </Surface>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigation.navigate('More', { screen: 'Business' })}
            style={styles.quarterCard}
          >
            <Surface style={styles.quickStatCard} elevation={1}>
              <Icon name="office-building" size={32} color={colors.error} />
              <Text variant="headlineSmall" style={styles.quickStatValue}>
                {businessOverview.totalBusinesses || businessOverview.totalCount || 0}
              </Text>
              <Text variant="bodySmall" style={styles.quickStatLabel}>Businesses</Text>
            </Surface>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigation.navigate('More', { screen: 'Gifts' })}
            style={styles.quarterCard}
          >
            <Surface style={styles.quickStatCard} elevation={1}>
              <Icon name="gift" size={32} color="#ec4899" />
              <Text variant="headlineSmall" style={styles.quickStatValue}>
                {giftsOverview.totalGifts || giftsOverview.totalCount || 0}
              </Text>
              <Text variant="bodySmall" style={styles.quickStatLabel}>Gifts</Text>
            </Surface>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigation.navigate('More', { screen: 'Reminders' })}
            style={styles.quarterCard}
          >
            <Surface style={styles.quickStatCard} elevation={1}>
              <Icon name="bell" size={32} color="#8b5cf6" />
              <Text variant="headlineSmall" style={styles.quickStatValue}>
                {remindersOverview.totalReminders || remindersOverview.totalCount || 0}
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
    backgroundColor: colors.primary,
    borderRadius: 20,
    marginBottom: 20,
    padding: 24,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
    width: 72,
    height: 72,
    borderRadius: 36,
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
    color: colors.success,
    marginBottom: 4,
  },
  expenseValue: {
    color: colors.error,
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
    width: 64,
    height: 64,
    borderRadius: 32,
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
    color: colors.error,
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
    width: 64,
    height: 64,
    borderRadius: 32,
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
    color: colors.success,
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
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    minHeight: 120,
  },
  quickStatValue: {
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 12,
    marginBottom: 6,
    fontSize: 18,
  },
  quickStatLabel: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
});
