import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card, FAB, Searchbar, Chip } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { expensesAPI } from '../../services/api';
import { useNavigation } from '@react-navigation/native';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function ExpensesScreen() {
  const navigation = useNavigation();
  const [filter, setFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses', filter, categoryFilter],
    queryFn: () => expensesAPI.getExpenses({ 
      category: categoryFilter || undefined,
      limit: 100
    }),
  });

  const expensesList = expenses?.data?.data || expenses?.data || [];

  const getCategoryName = (category) => {
    const categories = {
      food: 'Food & Dining',
      transport: 'Transportation',
      housing: 'Housing & Rent',
      utilities: 'Utilities',
      healthcare: 'Healthcare',
      education: 'Education',
      entertainment: 'Entertainment',
      clothing: 'Clothing',
      personal_care: 'Personal Care',
      business: 'Business',
      animal_care: 'Animal Care',
      agriculture: 'Agriculture',
      investment: 'Investment',
      emergency: 'Emergency',
      gift: 'Gifts',
      donation: 'Donations',
      other: 'Other'
    };
    return categories[category] || category;
  };

  const renderExpense = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text variant="titleMedium" style={styles.category}>
              {getCategoryName(item.category)}
            </Text>
            <Text variant="bodySmall" style={styles.date}>
              {formatDate(item.date || item.createdAt)}
            </Text>
          </View>
          <Text variant="titleLarge" style={styles.amount}>
            {formatCurrency(item.amount, item.currency)}
          </Text>
        </View>
        {item.description && (
          <Text variant="bodyMedium" style={styles.description}>
            {item.description}
          </Text>
        )}
        {item.businessName && (
          <Chip style={styles.businessChip} textStyle={styles.chipText}>
            {item.businessName}
          </Chip>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Search expenses..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        <View style={styles.filterRow}>
          <Chip
            selected={categoryFilter === ''}
            onPress={() => setCategoryFilter('')}
            style={styles.filterChip}
          >
            All Categories
          </Chip>
          <Chip
            selected={categoryFilter === 'food'}
            onPress={() => setCategoryFilter('food')}
            style={styles.filterChip}
          >
            Food
          </Chip>
          <Chip
            selected={categoryFilter === 'transport'}
            onPress={() => setCategoryFilter('transport')}
            style={styles.filterChip}
          >
            Transport
          </Chip>
          <Chip
            selected={categoryFilter === 'business'}
            onPress={() => setCategoryFilter('business')}
            style={styles.filterChip}
          >
            Business
          </Chip>
        </View>
      </View>

      <FlatList
        data={expensesList}
        renderItem={renderExpense}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshing={isLoading}
        onRefresh={() => {}}
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AddExpense')}
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
    color: '#ef4444',
  },
  description: {
    color: '#6b7280',
    marginBottom: 8,
  },
  businessChip: {
    height: 24,
    backgroundColor: '#dbeafe',
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
