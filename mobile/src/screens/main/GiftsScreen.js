import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, Card, FAB, Searchbar, Chip, Menu, IconButton, ActivityIndicator } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { giftsAPI } from '../../services/api';
import { useNavigation } from '@react-navigation/native';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function GiftsScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: gifts, isLoading } = useQuery({
    queryKey: ['gifts', filter],
    queryFn: () => giftsAPI.getGifts({ 
      limit: 100
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: giftsAPI.deleteGift,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gifts'] });
    },
  });

  const giftsList = gifts?.data?.data || [];

  const handleDelete = (id, name) => {
    Alert.alert(
      'Delete Gift',
      `Are you sure you want to delete this gift?`,
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

  const getOccasionIcon = (occasion) => {
    const icons = {
      Birthday: '🎂',
      Wedding: '💒',
      Anniversary: '💝',
      Holiday: '🎄',
      Graduation: '🎓',
      Other: '🎁',
    };
    return icons[occasion] || '🎁';
  };

  const renderGift = ({ item }) => (
    <Card 
      style={styles.card}
      onPress={() => navigation.navigate('GiftDetail', { giftId: item._id })}
    >
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>{getOccasionIcon(item.occasion)}</Text>
            </View>
            <View style={styles.textContainer}>
              <Text variant="titleMedium" style={styles.name}>
                {item.recipientName || 'Recipient'}
              </Text>
              <Text variant="bodySmall" style={styles.occasion}>
                {item.occasion || 'Gift'} • {formatDate(item.date || item.createdAt)}
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
              onPress={() => navigation.navigate('EditGift', { giftId: item._id })}
              title="Edit"
              leadingIcon="pencil"
            />
            <Menu.Item
              onPress={() => handleDelete(item._id, item.recipientName)}
              title="Delete"
              leadingIcon="delete"
              titleStyle={{ color: '#ef4444' }}
            />
          </Menu>
        </View>
        <View style={styles.valueRow}>
          <Text variant="headlineSmall" style={styles.value}>
            {formatCurrency(item.amount || 0, item.currency)}
          </Text>
          {item.giftType && (
            <Chip 
              style={styles.typeChip}
              textStyle={styles.chipText}
            >
              {item.giftType}
            </Chip>
          )}
        </View>
        {item.description && (
          <Text variant="bodySmall" style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        {item.contactId && (
          <View style={styles.contactRow}>
            <IconButton icon="account" size={16} />
            <Text variant="bodySmall" style={styles.contact}>
              {item.contactId.name}
            </Text>
          </View>
        )}
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
      <View style={styles.header}>
        <Searchbar
          placeholder="Search gifts..."
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
            selected={filter === 'given'}
            onPress={() => setFilter('given')}
            style={styles.filterChip}
          >
            Given
          </Chip>
          <Chip
            selected={filter === 'received'}
            onPress={() => setFilter('received')}
            style={styles.filterChip}
          >
            Received
          </Chip>
        </View>
      </View>

      <FlatList
        data={giftsList}
        renderItem={renderGift}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="headlineSmall" style={styles.emptyText}>No gifts found</Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              Track your gifts and occasions
            </Text>
          </View>
        }
      />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AddGift')}
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
    marginBottom: 12,
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
    backgroundColor: '#fef3f2',
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
  occasion: {
    color: '#64748b',
    fontSize: 12,
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  value: {
    fontWeight: '700',
    color: '#dc2626',
  },
  typeChip: {
    height: 28,
    backgroundColor: '#fef3f2',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '500',
  },
  description: {
    color: '#64748b',
    marginBottom: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contact: {
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

