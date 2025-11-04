import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, FAB, Searchbar, Chip, Menu, IconButton, ActivityIndicator } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assetsAPI } from '../../services/api';
import { useNavigation } from '@react-navigation/native';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function AssetsScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: assets, isLoading } = useQuery({
    queryKey: ['assets', filter, categoryFilter],
    queryFn: () => assetsAPI.getAssets({ 
      status: filter === 'all' ? undefined : filter,
      category: categoryFilter || undefined,
      limit: 100
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: assetsAPI.deleteAsset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });

  const assetsList = assets?.data?.data || [];

  const handleDelete = (id, name) => {
    Alert.alert(
      'Delete Asset',
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

  const getCategoryIcon = (category) => {
    const icons = {
      Electronics: '💻',
      Vehicle: '🚗',
      Property: '🏠',
      Furniture: '🪑',
      Equipment: '⚙️',
      Jewelry: '💍',
      Art: '🎨',
      Books: '📚',
      Clothing: '👕',
      Other: '📦',
    };
    return icons[category] || '📦';
  };

  const renderAsset = ({ item }) => (
    <Card 
      style={styles.card}
      onPress={() => navigation.navigate('AssetDetail', { assetId: item._id })}
    >
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>{getCategoryIcon(item.category)}</Text>
            </View>
            <View style={styles.textContainer}>
              <Text variant="titleMedium" style={styles.name}>
                {item.name}
              </Text>
              <Text variant="bodySmall" style={styles.category}>
                {item.category || 'Uncategorized'}
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
              onPress={() => navigation.navigate('EditAsset', { assetId: item._id })}
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
          <Text variant="headlineSmall" style={styles.value}>
            {formatCurrency(item.value || 0, item.currency)}
          </Text>
          <Chip 
            style={[
              styles.statusChip,
              item.status === 'owned' && styles.statusOwned,
              item.status === 'loaned' && styles.statusLoaned,
            ]}
            textStyle={styles.chipText}
          >
            {item.status || 'owned'}
          </Chip>
        </View>
        {item.description && (
          <Text variant="bodySmall" style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        {item.location && (
          <View style={styles.locationRow}>
            <IconButton icon="map-marker" size={16} />
            <Text variant="bodySmall" style={styles.location}>
              {item.location}
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

  const categories = ['Electronics', 'Vehicle', 'Property', 'Furniture', 'Equipment', 'Jewelry', 'Art', 'Books', 'Clothing', 'Other'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Search assets..."
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
            selected={filter === 'owned'}
            onPress={() => setFilter('owned')}
            style={styles.filterChip}
          >
            Owned
          </Chip>
          <Chip
            selected={filter === 'loaned'}
            onPress={() => setFilter('loaned')}
            style={styles.filterChip}
          >
            Loaned
          </Chip>
        </View>
        <View style={styles.categoryRow}>
          {categories.slice(0, 5).map((cat) => (
            <Chip
              key={cat}
              selected={categoryFilter === cat}
              onPress={() => setCategoryFilter(categoryFilter === cat ? '' : cat)}
              style={styles.categoryChip}
            >
              {cat}
            </Chip>
          ))}
        </View>
      </View>

      <FlatList
        data={assetsList}
        renderItem={renderAsset}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="headlineSmall" style={styles.emptyText}>No assets found</Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              Add your first asset to get started
            </Text>
          </View>
        }
      />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AddAsset')}
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
    marginBottom: 12,
    gap: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    marginRight: 8,
  },
  categoryChip: {
    marginRight: 8,
    marginBottom: 8,
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  category: {
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
    color: '#059669',
  },
  statusChip: {
    height: 28,
  },
  statusOwned: {
    backgroundColor: '#d1fae5',
  },
  statusLoaned: {
    backgroundColor: '#fef3c7',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '500',
  },
  description: {
    color: '#64748b',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
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

