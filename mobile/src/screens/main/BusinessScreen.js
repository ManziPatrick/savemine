import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, Card, FAB, Searchbar, Chip, Menu, IconButton, ActivityIndicator, ProgressBar } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { businessesAPI } from '../../services/api';
import { useNavigation } from '@react-navigation/native';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function BusinessScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: businesses, isLoading } = useQuery({
    queryKey: ['businesses', filter],
    queryFn: () => businessesAPI.getBusinesses({ 
      limit: 100
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: businessesAPI.deleteBusiness,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
    },
  });

  const businessesList = businesses?.data?.data || [];

  const handleDelete = (id, name) => {
    Alert.alert(
      'Delete Business',
      `Are you sure you want to delete ${name}?`,
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

  const renderBusiness = ({ item }) => {
    const progress = item.progress || 0;
    const totalInvestment = item.totalInvestment || 0;
    const monthlyIncome = item.monthlyIncome || 0;

    return (
      <Card 
        style={styles.card}
        onPress={() => navigation.navigate('BusinessDetail', { businessId: item._id })}
      >
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>💼</Text>
              </View>
              <View style={styles.textContainer}>
                <Text variant="titleMedium" style={styles.name}>
                  {item.name}
                </Text>
                <Text variant="bodySmall" style={styles.type}>
                  {item.businessType || 'Business'}
                </Text>
              </View>
            </View>
            <Menu
              anchor={
                <IconButton
                  icon="dots-vertical"
                  size={20}
                  onPress={() => {}}
                />
              }
            >
              <Menu.Item
                onPress={() => navigation.navigate('EditBusiness', { businessId: item._id })}
                title="Edit"
                leadingIcon="pencil"
              />
              <Menu.Item
                onPress={() => handleDelete(item._id, item.name)}
                title="Delete"
                leadingIcon="delete"
                titleStyle={{ color: '#ef4444' }}
              />
            </Menu>
          </View>
          
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text variant="bodySmall" style={styles.progressLabel}>Progress</Text>
              <Text variant="bodySmall" style={styles.progressPercent}>{progress}%</Text>
            </View>
            <ProgressBar 
              progress={progress / 100} 
              color="#2563eb" 
              style={styles.progressBar}
            />
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text variant="bodySmall" style={styles.statLabel}>Investment</Text>
              <Text variant="titleMedium" style={styles.statValue}>
                {formatCurrency(totalInvestment, item.currency)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="bodySmall" style={styles.statLabel}>Monthly Income</Text>
              <Text variant="titleMedium" style={[styles.statValue, styles.incomeValue]}>
                {formatCurrency(monthlyIncome, item.currency)}
              </Text>
            </View>
          </View>

          {item.status && (
            <View style={styles.statusRow}>
              <Chip 
                style={[
                  styles.statusChip,
                  item.status === 'active' && styles.statusActive,
                  item.status === 'planning' && styles.statusPlanning,
                  item.status === 'completed' && styles.statusCompleted,
                ]}
                textStyle={styles.chipText}
              >
                {item.status}
              </Chip>
            </View>
          )}
        </Card.Content>
      </Card>
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
      <View style={styles.header}>
        <Searchbar
          placeholder="Search businesses..."
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
            selected={filter === 'active'}
            onPress={() => setFilter('active')}
            style={styles.filterChip}
          >
            Active
          </Chip>
          <Chip
            selected={filter === 'planning'}
            onPress={() => setFilter('planning')}
            style={styles.filterChip}
          >
            Planning
          </Chip>
        </View>
      </View>

      <FlatList
        data={businessesList}
        renderItem={renderBusiness}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="headlineSmall" style={styles.emptyText}>No businesses found</Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              Add your first business project
            </Text>
          </View>
        }
      />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AddBusiness')}
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
  header: {
    backgroundColor: '#ffffff',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchbar: {
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    marginRight: 8,
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 28,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  type: {
    color: '#64748b',
    fontSize: 12,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    color: '#64748b',
    fontSize: 12,
  },
  progressPercent: {
    fontWeight: '600',
    color: '#2563eb',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
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
  incomeValue: {
    color: '#059669',
  },
  statusRow: {
    marginTop: 8,
  },
  statusChip: {
    height: 28,
  },
  statusActive: {
    backgroundColor: '#d1fae5',
  },
  statusPlanning: {
    backgroundColor: '#fef3c7',
  },
  statusCompleted: {
    backgroundColor: '#e0e7ff',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#94a3b8',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2563eb',
  },
});

