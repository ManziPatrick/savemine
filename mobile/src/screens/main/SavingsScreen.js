import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Card, FAB, Searchbar, Chip, IconButton, Menu } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { savingsAPI } from '../../services/api';
import { useNavigation } from '@react-navigation/native';
import { formatCurrency } from '../../utils/formatters';

export default function SavingsScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [menuVisible, setMenuVisible] = useState({});

  const { data: savings, isLoading } = useQuery({
    queryKey: ['savings', filter],
    queryFn: () => savingsAPI.getSavings({ 
      location: filter === 'all' ? undefined : filter 
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: savingsAPI.deleteSavings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings'] });
    },
  });

  const savingsList = savings?.data?.data || savings?.data || [];

  const getLocationLabel = (location) => {
    const labels = {
      SACCO: 'SACCO',
      'MTN MoMo': 'MTN MoMo',
      Bank: 'Bank',
      Cash: 'Cash',
    };
    return labels[location] || location;
  };

  const renderSaving = ({ item }) => {
    const menuId = item._id;
    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Text variant="titleMedium" style={styles.name}>
                {item.name}
              </Text>
              <Text variant="bodySmall" style={styles.location}>
                {getLocationLabel(item.location)}
              </Text>
            </View>
            <Menu
              visible={menuVisible[menuId]}
              onDismiss={() => setMenuVisible({ ...menuVisible, [menuId]: false })}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  size={20}
                  onPress={() => setMenuVisible({ ...menuVisible, [menuId]: true })}
                />
              }
            >
              <Menu.Item
                onPress={() => {
                  navigation.navigate('AddSavingsAmount', { savingId: item._id });
                  setMenuVisible({ ...menuVisible, [menuId]: false });
                }}
                title="Add Amount"
                leadingIcon="plus"
              />
              <Menu.Item
                onPress={() => {
                  navigation.navigate('WithdrawSavings', { savingId: item._id });
                  setMenuVisible({ ...menuVisible, [menuId]: false });
                }}
                title="Withdraw"
                leadingIcon="minus"
              />
              <Menu.Item
                onPress={() => {
                  navigation.navigate('EditSavings', { savingId: item._id });
                  setMenuVisible({ ...menuVisible, [menuId]: false });
                }}
                title="Edit"
                leadingIcon="pencil"
              />
              <Menu.Item
                onPress={() => {
                  deleteMutation.mutate(item._id);
                  setMenuVisible({ ...menuVisible, [menuId]: false });
                }}
                title="Delete"
                leadingIcon="delete"
                titleStyle={{ color: '#ef4444' }}
              />
            </Menu>
          </View>
          <View style={styles.amountRow}>
            <Text variant="headlineMedium" style={styles.amount}>
              {formatCurrency(item.currentBalance || 0, item.currency)}
            </Text>
            {item.targetAmount && (
              <Text variant="bodySmall" style={styles.target}>
                Target: {formatCurrency(item.targetAmount, item.currency)}
              </Text>
            )}
          </View>
          {item.description && (
            <Text variant="bodySmall" style={styles.description}>
              {item.description}
            </Text>
          )}
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.filterRow}>
          {['all', 'SACCO', 'MTN MoMo', 'Bank', 'Cash'].map((location) => (
            <Chip
              key={location}
              selected={filter === location}
              onPress={() => setFilter(location)}
              style={styles.filterChip}
            >
              {location === 'all' ? 'All' : location}
            </Chip>
          ))}
        </View>
      </View>

      <FlatList
        data={savingsList}
        renderItem={renderSaving}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshing={isLoading}
        onRefresh={() => queryClient.invalidateQueries('savings')}
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AddSavings')}
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
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  name: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  location: {
    color: '#6b7280',
  },
  amountRow: {
    marginBottom: 8,
  },
  amount: {
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 4,
  },
  target: {
    color: '#6b7280',
  },
  description: {
    color: '#6b7280',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
