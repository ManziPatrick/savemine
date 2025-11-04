import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Card, FAB, Searchbar, Chip, Menu, IconButton } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsAPI } from '../../services/api';
import { useNavigation } from '@react-navigation/native';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function TransactionsScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions', filter, typeFilter],
    queryFn: () => transactionsAPI.getTransactions({ 
      status: filter === 'all' ? undefined : filter,
      type: typeFilter === 'all' ? undefined : typeFilter,
      limit: 100
    }),
  });

  const deleteMutation = useMutation(transactionsAPI.deleteTransaction, {
    onSuccess: () => {
      queryClient.invalidateQueries('transactions');
    },
  });

  const transactionsList = transactions?.data?.data || [];

  const renderTransaction = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text variant="titleMedium" style={styles.category}>
              {item.category || 'Uncategorized'}
            </Text>
            <Text variant="bodySmall" style={styles.date}>
              {formatDate(item.date || item.createdAt)}
            </Text>
          </View>
          <Text 
            variant="titleLarge" 
            style={[
              styles.amount,
              item.type === 'income' ? styles.income : styles.expense
            ]}
          >
            {item.type === 'income' ? '+' : '-'} {formatCurrency(item.amount, item.currency)}
          </Text>
        </View>
        {item.description && (
          <Text variant="bodyMedium" style={styles.description}>
            {item.description}
          </Text>
        )}
        <View style={styles.cardFooter}>
          <Chip 
            style={[
              styles.typeChip,
              item.type === 'income' ? styles.typeIncome : styles.typeExpense
            ]}
            textStyle={styles.chipText}
          >
            {item.type}
          </Chip>
          <IconButton
            icon="delete"
            size={20}
            onPress={() => deleteMutation.mutate(item._id)}
          />
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Search transactions..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        <View style={styles.filterRow}>
          <Chip
            selected={filter === 'all'}
            onPress={() => setFilter('all')}
            style={styles.filterChip}
          >
            All
          </Chip>
          <Chip
            selected={filter === 'completed'}
            onPress={() => setFilter('completed')}
            style={styles.filterChip}
          >
            Completed
          </Chip>
          <Chip
            selected={filter === 'pending'}
            onPress={() => setFilter('pending')}
            style={styles.filterChip}
          >
            Pending
          </Chip>
        </View>
        <View style={styles.filterRow}>
          <Chip
            selected={typeFilter === 'all'}
            onPress={() => setTypeFilter('all')}
            style={styles.filterChip}
          >
            All Types
          </Chip>
          <Chip
            selected={typeFilter === 'income'}
            onPress={() => setTypeFilter('income')}
            style={styles.filterChip}
          >
            Income
          </Chip>
          <Chip
            selected={typeFilter === 'expense'}
            onPress={() => setTypeFilter('expense')}
            style={styles.filterChip}
          >
            Expense
          </Chip>
        </View>
      </View>

      <FlatList
        data={transactionsList}
        renderItem={renderTransaction}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshing={isLoading}
        onRefresh={() => queryClient.invalidateQueries('transactions')}
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AddTransaction')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 16,
    backgroundColor: '#ffffff',
  },
  searchbar: {
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  filterChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  category: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  date: {
    color: '#6b7280',
  },
  amount: {
    fontWeight: 'bold',
  },
  income: {
    color: '#10b981',
  },
  expense: {
    color: '#ef4444',
  },
  description: {
    color: '#6b7280',
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeChip: {
    height: 24,
  },
  typeIncome: {
    backgroundColor: '#d1fae5',
  },
  typeExpense: {
    backgroundColor: '#fee2e2',
  },
  chipText: {
    fontSize: 12,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
