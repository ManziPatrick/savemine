import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Card, FAB, Searchbar, Chip } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { loansAPI } from '../../services/api';
import { useNavigation } from '@react-navigation/native';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function LoansScreen() {
  const navigation = useNavigation();
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: loans, isLoading } = useQuery({
    queryKey: ['loans', filter],
    queryFn: () => loansAPI.getLoans({ 
      status: filter === 'all' ? undefined : filter 
    }),
  });

  const loansList = loans?.data?.data || [];

  const renderLoan = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('LoanDetail', { loanId: item._id })}
    >
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Text variant="titleMedium" style={styles.contactName}>
              {item.contactId?.name || 'Unknown'}
            </Text>
            <Chip 
              style={[
                styles.statusChip,
                item.status === 'active' && styles.statusActive,
                item.status === 'overdue' && styles.statusOverdue,
                item.status === 'completed' && styles.statusCompleted,
              ]}
            >
              {item.status}
            </Chip>
          </View>
          <Text variant="bodyMedium" style={styles.phone}>
            {item.contactId?.phone || 'No phone'}
          </Text>
          <View style={styles.amountRow}>
            <Text variant="titleLarge" style={styles.amount}>
              {item.totalAmount?.toLocaleString()} FRW
            </Text>
            <Text variant="bodySmall" style={styles.remaining}>
              Remaining: {item.remainingAmount?.toLocaleString()} FRW
            </Text>
          </View>
          <Text variant="bodySmall" style={styles.dueDate}>
            Due: {new Date(item.dueDate).toLocaleDateString()}
          </Text>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Search loans..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        <View style={styles.filterRow}>
          {['all', 'active', 'overdue', 'completed'].map((status) => (
            <Chip
              key={status}
              selected={filter === status}
              onPress={() => setFilter(status)}
              style={styles.filterChip}
            >
              {status}
            </Chip>
          ))}
        </View>
      </View>

      <FlatList
        data={loansList}
        renderItem={renderLoan}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshing={isLoading}
        onRefresh={() => {}}
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {
          // Navigate to add loan screen
          navigation.navigate('AddLoan');
        }}
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
    gap: 8,
  },
  filterChip: {
    marginRight: 8,
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
    alignItems: 'center',
    marginBottom: 8,
  },
  contactName: {
    fontWeight: 'bold',
    flex: 1,
  },
  phone: {
    color: '#6b7280',
    marginBottom: 8,
  },
  amountRow: {
    marginVertical: 8,
  },
  amount: {
    fontWeight: 'bold',
    color: '#2563eb',
  },
  remaining: {
    color: '#6b7280',
    marginTop: 4,
  },
  dueDate: {
    color: '#6b7280',
  },
  statusChip: {
    height: 24,
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
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

