import React from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Card, Text, ActivityIndicator } from 'react-native-paper';
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

  // Prepare dashboard items as an array for table-like rendering
  const dashboardItems = [
    {
      id: 'netWorth',
      title: 'Net Worth',
      value: formatCurrency(netWorth, 'FRW'),
      icon: 'wallet',
      iconColor: '#2563eb',
      type: 'highlight',
      onPress: null,
    },
    {
      id: 'income',
      title: 'Total Income',
      value: formatCurrency(totalIncome, 'FRW'),
      icon: 'arrow-down-circle',
      iconColor: '#059669',
      type: 'stat',
      onPress: () => navigation.navigate('Transactions'),
    },
    {
      id: 'expenses',
      title: 'Total Expenses',
      value: formatCurrency(totalExpenses, 'FRW'),
      icon: 'arrow-up-circle',
      iconColor: '#dc2626',
      type: 'stat',
      onPress: () => navigation.navigate('Expenses'),
    },
    {
      id: 'loans',
      title: 'Loans',
      subtitle: `${loanData.totalLoans || 0} active loans`,
      value: formatCurrency(loanData.totalAmount || 0, 'FRW'),
      subValue: `${formatCurrency(loanData.totalRemaining || 0, 'FRW')} outstanding`,
      icon: 'cash-multiple',
      iconColor: '#2563eb',
      type: 'detail',
      alert: loanData.overdueLoans > 0 ? `${loanData.overdueLoans} overdue` : null,
      onPress: () => navigation.navigate('Loans'),
    },
    {
      id: 'assets',
      title: 'Assets',
      subtitle: `${assetData.totalCount || 0} items`,
      value: formatCurrency(assetData.totalValue || 0, 'FRW'),
      icon: 'package-variant',
      iconColor: '#2563eb',
      type: 'detail',
      onPress: () => navigation.navigate('More', { screen: 'Assets' }),
    },
    {
      id: 'investments',
      title: 'Investments',
      subtitle: `${investmentData.totalCount || 0} items`,
      value: formatCurrency(investmentData.totalValue || 0, 'FRW'),
      icon: 'trending-up',
      iconColor: '#059669',
      type: 'detail',
      onPress: () => navigation.navigate('More', { screen: 'Investments' }),
    },
    {
      id: 'savings',
      title: 'Savings',
      subtitle: `${savingsData.totalCount || 0} accounts`,
      value: formatCurrency(savingsData.totalBalance || 0, 'FRW'),
      icon: 'piggy-bank',
      iconColor: '#8b5cf6',
      type: 'detail',
      onPress: () => navigation.navigate('Savings'),
    },
    {
      id: 'pettyCash',
      title: 'Petty Cash',
      value: formatCurrency(pettyCash?.balance || 0, pettyCash?.currency || 'FRW'),
      icon: 'wallet',
      iconColor: '#f59e0b',
      type: 'detail',
      onPress: () => navigation.navigate('More', { screen: 'PettyCash' }),
    },
    {
      id: 'contacts',
      title: 'Contacts',
      value: contactsTotal.toString(),
      icon: 'contacts',
      iconColor: '#64748b',
      type: 'quick',
      onPress: () => navigation.navigate('Contacts'),
    },
    {
      id: 'businesses',
      title: 'Businesses',
      value: (businessData.totalCount || 0).toString(),
      icon: 'office-building',
      iconColor: '#dc2626',
      type: 'quick',
      onPress: () => navigation.navigate('More', { screen: 'Business' }),
    },
    {
      id: 'gifts',
      title: 'Gifts',
      value: (giftsData.totalCount || 0).toString(),
      icon: 'gift',
      iconColor: '#ec4899',
      type: 'quick',
      onPress: () => navigation.navigate('More', { screen: 'Gifts' }),
    },
    {
      id: 'reminders',
      title: 'Reminders',
      value: (remindersData.totalCount || 0).toString(),
      icon: 'bell',
      iconColor: '#8b5cf6',
      type: 'quick',
      onPress: () => navigation.navigate('More', { screen: 'Reminders' }),
    },
  ];

  const renderDashboardItem = ({ item }) => {
    if (item.type === 'highlight') {
      return (
        <Card style={[styles.card, styles.highlightCard]}>
          <Card.Content>
            <View style={styles.rowItem}>
              <View style={[styles.iconContainer, { backgroundColor: `${item.iconColor}20` }]}>
                <Icon name={item.icon} size={28} color={item.iconColor} />
              </View>
              <View style={styles.rowContent}>
                <Text variant="bodySmall" style={styles.rowLabel}>{item.title}</Text>
                <Text variant="headlineLarge" style={styles.rowValue}>{item.value}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      );
    }

    if (item.type === 'stat') {
      return (
        <TouchableOpacity onPress={item.onPress} style={styles.halfWidth}>
          <Card style={styles.card}>
            <Card.Content style={styles.statCardContent}>
              <View style={styles.rowItem}>
                <Icon name={item.icon} size={24} color={item.iconColor} />
                <View style={styles.rowContent}>
                  <Text variant="headlineSmall" style={[styles.rowValue, { color: item.iconColor }]}>
                    {item.value}
                  </Text>
                  <Text variant="bodySmall" style={styles.rowLabel}>{item.title}</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </TouchableOpacity>
      );
    }

    if (item.type === 'detail') {
      return (
        <TouchableOpacity onPress={item.onPress}>
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.rowItem}>
                <View style={[styles.iconContainer, { backgroundColor: `${item.iconColor}20` }]}>
                  <Icon name={item.icon} size={24} color={item.iconColor} />
                </View>
                <View style={styles.rowContent}>
                  <Text variant="titleMedium" style={styles.rowTitle}>{item.title}</Text>
                  {item.subtitle && (
                    <Text variant="bodySmall" style={styles.rowSubtitle}>{item.subtitle}</Text>
                  )}
                </View>
                <View style={styles.rowRight}>
                  <Text variant="titleLarge" style={styles.rowValue}>{item.value}</Text>
                  {item.subValue && (
                    <Text variant="bodySmall" style={styles.rowSubValue}>{item.subValue}</Text>
                  )}
                </View>
              </View>
              {item.alert && (
                <View style={styles.alertBadge}>
                  <Text variant="bodySmall" style={styles.alertText}>⚠️ {item.alert}</Text>
                </View>
              )}
            </Card.Content>
          </Card>
        </TouchableOpacity>
      );
    }

    // Quick stat
    return (
      <TouchableOpacity onPress={item.onPress} style={styles.quickStatItem}>
        <Card style={styles.card}>
          <Card.Content style={styles.quickStatContent}>
            <Icon name={item.icon} size={20} color={item.iconColor} />
            <Text variant="headlineSmall" style={styles.quickStatValue}>{item.value}</Text>
            <Text variant="bodySmall" style={styles.quickStatLabel}>{item.title}</Text>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={dashboardItems}
        renderItem={renderDashboardItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetchAll} />
        }
        ListHeaderComponent={
          <Text variant="headlineMedium" style={styles.mainTitle}>Dashboard</Text>
        }
        numColumns={2}
        columnWrapperStyle={styles.row}
        scrollEnabled={true}
      />
    </View>
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
  listContent: {
    padding: 16,
  },
  mainTitle: {
    marginBottom: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    width: '100%',
  },
  row: {
    justifyContent: 'space-between',
    gap: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  highlightCard: {
    marginBottom: 20,
    width: '100%',
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rowContent: {
    flex: 1,
  },
  rowTitle: {
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  rowLabel: {
    color: '#64748b',
    fontSize: 12,
  },
  rowSubtitle: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  rowRight: {
    alignItems: 'flex-end',
  },
  rowValue: {
    fontWeight: '700',
    color: '#1e293b',
  },
  rowSubValue: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  statCardContent: {
    paddingVertical: 12,
  },
  halfWidth: {
    width: '48%',
  },
  quickStatItem: {
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
});
