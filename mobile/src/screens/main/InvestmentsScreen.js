import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, FAB, Searchbar, Chip, Menu, IconButton, ActivityIndicator } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { investmentsAPI } from '../../services/api';
import { useNavigation } from '@react-navigation/native';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function InvestmentsScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: investments, isLoading } = useQuery({
    queryKey: ['investments', filter],
    queryFn: () => investmentsAPI.getInvestments({ 
      limit: 100
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: investmentsAPI.deleteInvestment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
    },
  });

  const investmentsList = investments?.data?.data || [];

  const handleDelete = (id, name) => {
    Alert.alert(
      'Delete Investment',
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

  const getInvestmentIcon = (type) => {
    const icons = {
      Stock: '📈',
      Bond: '📊',
      MutualFund: '💰',
      RealEstate: '🏢',
      Cryptocurrency: '₿',
      Business: '💼',
      Other: '📦',
    };
    return icons[type] || '📦';
  };

  const renderInvestment = ({ item }) => {
    const currentValue = item.currentValue || item.initialValue || 0;
    const initialValue = item.initialValue || 0;
    const gain = currentValue - initialValue;
    const gainPercent = initialValue > 0 ? ((gain / initialValue) * 100).toFixed(2) : 0;

    return (
      <Card 
        style={styles.card}
        onPress={() => navigation.navigate('InvestmentDetail', { investmentId: item._id })}
      >
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>{getInvestmentIcon(item.investmentType)}</Text>
              </View>
              <View style={styles.textContainer}>
                <Text variant="titleMedium" style={styles.name}>
                  {item.name}
                </Text>
                <Text variant="bodySmall" style={styles.type}>
                  {item.investmentType || 'Investment'}
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
                onPress={() => navigation.navigate('EditInvestment', { investmentId: item._id })}
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
          <View style={styles.valueRow}>
            <View>
              <Text variant="bodySmall" style={styles.label}>Current Value</Text>
              <Text variant="headlineSmall" style={styles.currentValue}>
                {formatCurrency(currentValue, item.currency)}
              </Text>
            </View>
            <View style={styles.gainContainer}>
              <Text 
                variant="titleMedium" 
                style={[styles.gain, gain >= 0 ? styles.gainPositive : styles.gainNegative]}
              >
                {gain >= 0 ? '+' : ''}{formatCurrency(gain, item.currency)}
              </Text>
              <Text 
                variant="bodySmall" 
                style={[styles.gainPercent, gain >= 0 ? styles.gainPositive : styles.gainNegative]}
              >
                {gain >= 0 ? '+' : ''}{gainPercent}%
              </Text>
            </View>
          </View>
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Text variant="bodySmall" style={styles.detailLabel}>Initial</Text>
              <Text variant="bodyMedium" style={styles.detailValue}>
                {formatCurrency(initialValue, item.currency)}
              </Text>
            </View>
            {item.riskLevel && (
              <Chip 
                style={[
                  styles.riskChip,
                  item.riskLevel === 'low' && styles.riskLow,
                  item.riskLevel === 'medium' && styles.riskMedium,
                  item.riskLevel === 'high' && styles.riskHigh,
                ]}
                textStyle={styles.chipText}
              >
                {item.riskLevel}
              </Chip>
            )}
          </View>
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
          placeholder="Search investments..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>

      <FlatList
        data={investmentsList}
        renderItem={renderInvestment}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="headlineSmall" style={styles.emptyText}>No investments found</Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              Start tracking your investments
            </Text>
          </View>
        }
      />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AddInvestment')}
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
    backgroundColor: '#eff6ff',
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
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  currentValue: {
    fontWeight: '700',
    color: '#059669',
    marginTop: 4,
  },
  gainContainer: {
    alignItems: 'flex-end',
  },
  gain: {
    fontWeight: '600',
    marginBottom: 2,
  },
  gainPositive: {
    color: '#059669',
  },
  gainNegative: {
    color: '#dc2626',
  },
  gainPercent: {
    fontWeight: '500',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    color: '#64748b',
    fontSize: 11,
    marginBottom: 4,
  },
  detailValue: {
    fontWeight: '500',
    color: '#1e293b',
  },
  riskChip: {
    height: 28,
  },
  riskLow: {
    backgroundColor: '#d1fae5',
  },
  riskMedium: {
    backgroundColor: '#fef3c7',
  },
  riskHigh: {
    backgroundColor: '#fee2e2',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '500',
  },
  label: {
    color: '#64748b',
    fontSize: 12,
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

