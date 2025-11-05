import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, FAB, Searchbar, Menu, IconButton, ActivityIndicator } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assetsAPI } from '../../services/api';
import { useNavigation } from '@react-navigation/native';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function AssetsScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [menuVisible, setMenuVisible] = useState({});

  const { data: assets, isLoading, error } = useQuery({
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
      queryClient.invalidateQueries({ queryKey: ['assetStats'] });
    },
  });

  const assetsList = assets?.data?.data || assets?.data || [];
  
  // Filter and sort assets
  const filteredAssets = assetsList
    .filter(asset => {
      // Status filter
      if (filter !== 'all' && asset.status !== filter) return false;
      
      // Category filter
      if (categoryFilter && asset.category !== categoryFilter) return false;
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          asset.name?.toLowerCase().includes(query) ||
          asset.category?.toLowerCase().includes(query) ||
          asset.description?.toLowerCase().includes(query) ||
          asset.location?.toLowerCase().includes(query) ||
          asset.serialNumber?.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'value':
          return (b.value || 0) - (a.value || 0);
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'date':
          return new Date(b.purchaseDate || 0) - new Date(a.purchaseDate || 0);
        default:
          return 0;
      }
    });

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
      Electronics: 'laptop',
      Vehicle: 'car',
      Property: 'home',
      Furniture: 'sofa',
      Equipment: 'tools',
      Jewelry: 'diamond-stone',
      Art: 'palette',
      Books: 'book-open-variant',
      Clothing: 'tshirt-crew',
      Other: 'package-variant',
    };
    return icons[category] || 'package-variant';
  };

  const getCategoryColor = (category) => {
    const colors = {
      Electronics: { primary: '#6366f1', light: '#eef2ff', dark: '#4f46e5' },
      Vehicle: { primary: '#f59e0b', light: '#fef3c7', dark: '#d97706' },
      Property: { primary: '#10b981', light: '#d1fae5', dark: '#059669' },
      Furniture: { primary: '#8b5cf6', light: '#ede9fe', dark: '#7c3aed' },
      Equipment: { primary: '#ec4899', light: '#fce7f3', dark: '#db2777' },
      Jewelry: { primary: '#f97316', light: '#ffedd5', dark: '#ea580c' },
      Art: { primary: '#06b6d4', light: '#cffafe', dark: '#0891b2' },
      Books: { primary: '#14b8a6', light: '#ccfbf1', dark: '#0d9488' },
      Clothing: { primary: '#a855f7', light: '#f3e8ff', dark: '#9333ea' },
      Other: { primary: '#64748b', light: '#f1f5f9', dark: '#475569' },
    };
    return colors[category] || colors.Other;
  };

  const renderAsset = ({ item }) => {
    const statusConfig = {
      owned: { 
        bg: 'rgba(16, 185, 129, 0.12)', 
        text: '#059669', 
        border: '#10b981',
        icon: 'check-circle',
        label: 'Owned'
      },
      loaned: { 
        bg: 'rgba(245, 158, 11, 0.12)', 
        text: '#d97706', 
        border: '#f59e0b',
        icon: 'swap-horizontal',
        label: 'Loaned'
      },
      shared: { 
        bg: 'rgba(37, 99, 235, 0.12)', 
        text: '#2563eb', 
        border: '#3b82f6',
        icon: 'share-variant',
        label: 'Shared'
      },
    };
    const status = item.status || 'owned';
    const statusInfo = statusConfig[status] || statusConfig.owned;
    const categoryColor = getCategoryColor(item.category);

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation.navigate('AssetDetail', { assetId: item._id })}
        style={styles.cardWrapper}
      >
        <Card style={styles.card}>
          {/* Accent Bar */}
          <View style={[styles.accentBar, { backgroundColor: categoryColor.primary }]} />
          
          <Card.Content style={styles.cardContent}>
            {/* Header Section */}
            <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: categoryColor.light }]}>
                    <Icon 
                      name={getCategoryIcon(item.category)} 
                      size={28} 
                      color={categoryColor.primary} 
                    />
                    <View style={[styles.iconBadge, { backgroundColor: categoryColor.primary }]} />
                  </View>
                <View style={styles.textContainer}>
                  <Text variant="titleLarge" style={styles.name} numberOfLines={1}>
                    {item.name || 'Unnamed Asset'}
                  </Text>
                  <View style={styles.metaRow}>
                    <View style={[styles.categoryBadge, { backgroundColor: categoryColor.light }]}>
                      <Text style={[styles.categoryText, { color: categoryColor.dark }]}>
                        {item.category || 'Uncategorized'}
                      </Text>
                    </View>
                    {item.purchaseDate && (
                      <View style={styles.dateBadge}>
                        <Icon name="calendar-outline" size={12} color="#94a3b8" />
                        <Text style={styles.date}>
                          {formatDate(item.purchaseDate)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
              <Menu
                visible={menuVisible[item._id] || false}
                onDismiss={() => setMenuVisible({ ...menuVisible, [item._id]: false })}
                anchor={
                  <IconButton
                    icon="dots-vertical"
                    size={22}
                    iconColor="#64748b"
                    style={styles.menuButton}
                    onPress={() => setMenuVisible({ ...menuVisible, [item._id]: true })}
                  />
                }
              >
                <Menu.Item
                  onPress={() => {
                    setMenuVisible({ ...menuVisible, [item._id]: false });
                    navigation.navigate('EditAsset', { assetId: item._id });
                  }}
                  title="Edit"
                  leadingIcon="pencil"
                />
                <Menu.Item
                  onPress={() => {
                    setMenuVisible({ ...menuVisible, [item._id]: false });
                    handleDelete(item._id, item.name);
                  }}
                  title="Delete"
                  leadingIcon="delete"
                  titleStyle={{ color: '#ef4444' }}
                />
              </Menu>
            </View>

            {/* Value Section - Premium Design */}
            <View style={styles.valueSection}>
              <View style={styles.valueContainer}>
                <Text variant="bodySmall" style={styles.valueLabel}>CURRENT VALUE</Text>
                <Text variant="headlineMedium" style={[styles.value, { color: categoryColor.dark }]}>
                  {formatCurrency(item.value || 0, item.currency || 'FRW')}
                </Text>
              </View>
              <View style={[styles.statusBadge, { 
                backgroundColor: statusInfo.bg, 
                borderColor: statusInfo.border,
                borderWidth: 1.5
              }]}>
                <Icon name={statusInfo.icon} size={14} color={statusInfo.text} />
                <Text style={[styles.statusText, { color: statusInfo.text }]}>
                  {statusInfo.label}
                </Text>
              </View>
            </View>

            {/* Description */}
            {item.description && (
              <View style={styles.descriptionContainer}>
                <Text variant="bodyMedium" style={styles.description} numberOfLines={2}>
                  {item.description}
                </Text>
              </View>
            )}

            {/* Footer Info */}
            {(item.location || item.serialNumber) && (
              <View style={styles.footer}>
                {item.location && (
                  <View style={styles.infoItem}>
                    <View style={styles.infoIconContainer}>
                      <Icon name="map-marker" size={14} color="#64748b" />
                    </View>
                    <Text variant="bodySmall" style={styles.location} numberOfLines={1}>
                      {item.location}
                    </Text>
                  </View>
                )}
                {item.serialNumber && (
                  <View style={styles.infoItem}>
                    <View style={styles.infoIconContainer}>
                      <Icon name="barcode" size={14} color="#64748b" />
                    </View>
                    <Text variant="bodySmall" style={styles.serialNumber} numberOfLines={1}>
                      {item.serialNumber}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  if (isLoading && !assets) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading assets...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={styles.errorText}>Error loading assets</Text>
        <Text style={styles.errorSubtext}>{error.message}</Text>
      </View>
    );
  }

  const categories = ['Electronics', 'Vehicle', 'Property', 'Furniture', 'Equipment', 'Jewelry', 'Art', 'Books', 'Clothing', 'Other'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchRow}>
          <Searchbar
            placeholder="Search assets..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
            inputStyle={styles.searchInput}
            iconColor="#6366f1"
          />
          <Menu
            visible={showFilterMenu}
            onDismiss={() => setShowFilterMenu(false)}
            anchor={
              <IconButton
                icon="filter-variant"
                size={24}
                iconColor="#6366f1"
                onPress={() => setShowFilterMenu(true)}
                style={styles.filterButton}
              />
            }
          >
            <Menu.Item
              onPress={() => {
                setFilter('all');
                setShowFilterMenu(false);
              }}
              title="All Status"
              leadingIcon={filter === 'all' ? 'check-circle' : 'circle-outline'}
            />
            <Menu.Item
              onPress={() => {
                setFilter('owned');
                setShowFilterMenu(false);
              }}
              title="Owned"
              leadingIcon={filter === 'owned' ? 'check-circle' : 'circle-outline'}
            />
            <Menu.Item
              onPress={() => {
                setFilter('loaned');
                setShowFilterMenu(false);
              }}
              title="Loaned"
              leadingIcon={filter === 'loaned' ? 'check-circle' : 'circle-outline'}
            />
            <Menu.Item
              onPress={() => {
                setFilter('shared');
                setShowFilterMenu(false);
              }}
              title="Shared"
              leadingIcon={filter === 'shared' ? 'check-circle' : 'circle-outline'}
            />
            <Menu.Item
              onPress={() => {
                setShowCategoryMenu(true);
                setShowFilterMenu(false);
              }}
              title="Category"
              leadingIcon="tag-multiple"
            />
            <Menu.Item
              onPress={() => {
                setSortBy('name');
                setShowFilterMenu(false);
              }}
              title="Sort by Name"
              leadingIcon={sortBy === 'name' ? 'check-circle' : 'sort-alphabetical'}
            />
            <Menu.Item
              onPress={() => {
                setSortBy('value');
                setShowFilterMenu(false);
              }}
              title="Sort by Value"
              leadingIcon={sortBy === 'value' ? 'check-circle' : 'sort-numeric'}
            />
            <Menu.Item
              onPress={() => {
                setSortBy('date');
                setShowFilterMenu(false);
              }}
              title="Sort by Date"
              leadingIcon={sortBy === 'date' ? 'check-circle' : 'calendar'}
            />
          </Menu>
        </View>
        
        {(filter !== 'all' || categoryFilter) && (
          <View style={styles.activeFilters}>
            {filter !== 'all' && (
              <View style={styles.filterTag}>
                <Icon name="check-circle" size={14} color="#6366f1" />
                <Text style={styles.filterTagText}>{filter}</Text>
                <TouchableOpacity onPress={() => setFilter('all')}>
                  <Icon name="close" size={14} color="#64748b" />
                </TouchableOpacity>
              </View>
            )}
            {categoryFilter && (
              <View style={styles.filterTag}>
                <Icon name="tag" size={14} color="#6366f1" />
                <Text style={styles.filterTagText}>{categoryFilter}</Text>
                <TouchableOpacity onPress={() => setCategoryFilter('')}>
                  <Icon name="close" size={14} color="#64748b" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        <Menu
          visible={showCategoryMenu}
          onDismiss={() => setShowCategoryMenu(false)}
          anchor={<View />}
        >
          {categories.map((cat) => {
            const isSelected = categoryFilter === cat;
            const catColor = getCategoryColor(cat);
            return (
              <Menu.Item
                key={cat}
                onPress={() => {
                  setCategoryFilter(isSelected ? '' : cat);
                  setShowCategoryMenu(false);
                }}
                title={cat}
                leadingIcon={isSelected ? 'check-circle' : 'circle-outline'}
                titleStyle={{ color: isSelected ? catColor.dark : '#1e293b' }}
              />
            );
          })}
        </Menu>
      </View>

      <FlatList
        data={filteredAssets}
        renderItem={renderAsset}
        keyExtractor={(item) => item._id || item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Icon name="package-variant" size={56} color="#cbd5e1" />
            </View>
            <Text variant="headlineSmall" style={styles.emptyText}>
              {searchQuery ? 'No assets found' : 'No assets yet'}
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              {searchQuery 
                ? 'Try adjusting your search or filters' 
                : 'Add your first asset to get started'}
            </Text>
          </View>
        }
        refreshing={isLoading}
        onRefresh={() => queryClient.invalidateQueries({ queryKey: ['assets'] })}
        showsVerticalScrollIndicator={false}
      />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AddAsset')}
        color="#ffffff"
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
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#dc2626',
    marginBottom: 4,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#64748b',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchbar: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    elevation: 0,
    height: 48,
    marginRight: 8,
  },
  searchInput: {
    fontSize: 15,
    color: '#1e293b',
  },
  filterButton: {
    margin: 0,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  activeFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  filterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  filterTagText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    marginRight: 8,
    marginBottom: 4,
    height: 36,
    borderRadius: 18,
  },
  filterChipSelected: {
    backgroundColor: '#6366f1',
  },
  categoryChip: {
    marginRight: 8,
    marginBottom: 4,
    height: 36,
    borderRadius: 18,
  },
  list: {
    padding: 20,
    paddingTop: 16,
  },
  cardWrapper: {
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    zIndex: 1,
  },
  cardContent: {
    padding: 20,
    paddingLeft: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },
  iconBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
    fontSize: 20,
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
  },
  date: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '500',
  },
  menuButton: {
    margin: 0,
  },
  valueSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
    paddingTop: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  valueContainer: {
    flex: 1,
  },
  valueLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  value: {
    fontWeight: '800',
    fontSize: 26,
    letterSpacing: -0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  descriptionContainer: {
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  description: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
  },
  infoIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  location: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  serialNumber: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  emptyContainer: {
    padding: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyIcon: {
    // Removed - using Icon component now
  },
  emptyText: {
    color: '#0f172a',
    marginBottom: 8,
    fontWeight: '700',
    fontSize: 20,
    letterSpacing: -0.3,
  },
  emptySubtext: {
    color: '#64748b',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    margin: 20,
    right: 0,
    bottom: 0,
    backgroundColor: '#6366f1',
    borderRadius: 28,
    elevation: 8,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});

