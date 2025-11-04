import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, FAB, Searchbar, Chip, Menu, IconButton, ActivityIndicator } from 'react-native-paper';
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

  const deleteMutation = useMutation({
    mutationFn: transactionsAPI.deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const transactionsList = transactions?.data?.data || [];

  const handleDelete = (id) => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(id),
        },
      ]
    );
  };

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
            {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount, item.currency)}
          </Text>
        </View>
        {item.description && (
          <Text variant="bodyMedium" style={styles.description}>
            {item.description}
          </Text>
        )}
        <View style={styles.cardFooter}>
          <Chip style={styles.chip}>{item.type}</Chip>
          {item.status && (
            <Chip style={styles.chip}>{item.status}</Chip>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        <Chip
          selected={filter === 'all'}
          onPress={() => setFilter('all')}
          style={styles.filterChip}
        >
          All
        </Chip>
        <Chip
          selected={filter === 'pending'}
          onPress={() => setFilter('pending')}
          style={styles.filterChip}
        >
          Pending
        </Chip>
        <Chip
          selected={filter === 'completed'}
          onPress={() => setFilter('completed')}
          style={styles.filterChip}
        >
          Completed
        </Chip>
      </View>
      <View style={styles.typeFilters}>
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
      <FlatList
        data={transactionsList}
        renderItem={renderTransaction}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge">No transactions found</Text>
          </View>
        }
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
    backgroundColor: '#f5f5f5',
  },
  filters: {
    flexDirection: 'row',
    padding: 10,
    gap: 8,
  },
  typeFilters: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingBottom: 10,
    gap: 8,
  },
  filterChip: {
    marginRight: 8,
  },
  list: {
    padding: 10,
  },
  card: {
    marginBottom: 10,
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
  },
  date: {
    color: '#666',
    marginTop: 4,
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
    marginTop: 8,
    color: '#666',
  },
  cardFooter: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  chip: {
    height: 28,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2563eb',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
});
