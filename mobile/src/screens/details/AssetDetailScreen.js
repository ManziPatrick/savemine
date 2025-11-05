import React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, ActivityIndicator, Divider, IconButton } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assetsAPI } from '../../services/api';
import { useNavigation, useRoute } from '@react-navigation/native';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function AssetDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const queryClient = useQueryClient();
  const { assetId } = route.params || {};

  const { data: assetData, isLoading, error } = useQuery({
    queryKey: ['asset', assetId],
    queryFn: () => {
      if (!assetId) {
        throw new Error('Asset ID is required');
      }
      return assetsAPI.getAsset(assetId);
    },
    enabled: !!assetId,
    retry: (failureCount, error) => {
      if (error?.response?.status === 429 || error?.response?.status === 404) return false;
      return failureCount < 1;
    },
    staleTime: 60000, // Cache for 60 seconds
  });

  const deleteMutation = useMutation({
    mutationFn: assetsAPI.deleteAsset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['assetStats'] });
      queryClient.invalidateQueries({ queryKey: ['asset', assetId] });
      Alert.alert('Success', 'Asset deleted successfully');
      navigation.goBack();
    },
    onError: (error) => {
      Alert.alert(
        'Error',
        error.response?.data?.message || error.message || 'Failed to delete asset. Please try again.'
      );
    },
  });

  const handleDelete = () => {
    Alert.alert(
      'Delete Asset',
      'Are you sure you want to delete this asset? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(assetId),
        },
      ]
    );
  };

  if (!assetId) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={styles.errorText}>Asset ID is missing</Text>
        <Text style={styles.errorSubtext}>Please try selecting the asset again.</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading asset details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={styles.errorText}>Error loading asset</Text>
        <Text style={styles.errorSubtext}>{error.message}</Text>
      </View>
    );
  }

  const asset = assetData?.data?.asset || assetData?.data?.data || assetData?.data;

  if (!asset && !isLoading && !error) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={styles.errorText}>Asset not found</Text>
        <Text style={styles.errorSubtext}>The asset you're looking for doesn't exist or has been deleted.</Text>
      </View>
    );
  }

  if (!asset) {
    return null; // Will show loading state or error state
  }

  const statusColors = {
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
  const status = asset.status || 'owned';
  const statusInfo = statusColors[status] || statusColors.owned;

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

  const categoryColor = getCategoryColor(asset.category);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Card style={styles.card}>
          {/* Accent Bar */}
          <View style={[styles.accentBar, { backgroundColor: categoryColor.primary }]} />
          
          <Card.Content style={styles.cardContent}>
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={[styles.iconContainer, { backgroundColor: categoryColor.light }]}>
                  <Icon 
                    name={getCategoryIcon(asset.category)} 
                    size={36} 
                    color={categoryColor.primary} 
                  />
                  <View style={[styles.iconBadge, { backgroundColor: categoryColor.primary }]} />
                </View>
                <View style={styles.headerText}>
                  <Text variant="headlineMedium" style={styles.name}>
                    {asset.name || 'Unnamed Asset'}
                  </Text>
                  <View style={styles.categoryBadgeContainer}>
                    <View style={[styles.categoryBadge, { backgroundColor: categoryColor.light }]}>
                      <Text style={[styles.categoryText, { color: categoryColor.dark }]}>
                        {asset.category || 'Uncategorized'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              <IconButton
                icon="pencil"
                size={24}
                iconColor="#6366f1"
                onPress={() => navigation.navigate('EditAsset', { assetId: asset._id })}
                style={styles.editIcon}
              />
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.valueSection}>
              <View style={styles.valueContainer}>
                <Text variant="bodySmall" style={styles.valueLabel}>CURRENT VALUE</Text>
                <Text variant="headlineLarge" style={[styles.value, { color: categoryColor.dark }]}>
                  {formatCurrency(asset.value || 0, asset.currency || 'FRW')}
                </Text>
              </View>
              <View style={[styles.statusBadge, { 
                backgroundColor: statusInfo.bg, 
                borderColor: statusInfo.border,
                borderWidth: 1.5
              }]}>
                <Icon name={statusInfo.icon} size={16} color={statusInfo.text} />
                <Text style={[styles.statusText, { color: statusInfo.text }]}>
                  {statusInfo.label}
                </Text>
              </View>
            </View>

            {asset.description && (
              <View style={styles.section}>
                <Text variant="titleSmall" style={styles.sectionTitle}>Description</Text>
                <Text variant="bodyMedium" style={styles.sectionText}>
                  {asset.description}
                </Text>
              </View>
            )}

            <View style={styles.detailsGrid}>
              {asset.location && (
                <View style={styles.detailItem}>
                  <View style={styles.detailIconContainer}>
                    <Icon name="map-marker" size={20} color="#6366f1" />
                  </View>
                  <View style={styles.detailContent}>
                    <Text variant="titleSmall" style={styles.detailLabel}>Location</Text>
                    <Text variant="bodyMedium" style={styles.detailValue}>{asset.location}</Text>
                  </View>
                </View>
              )}

              {asset.serialNumber && (
                <View style={styles.detailItem}>
                  <View style={styles.detailIconContainer}>
                    <Icon name="barcode" size={20} color="#6366f1" />
                  </View>
                  <View style={styles.detailContent}>
                    <Text variant="titleSmall" style={styles.detailLabel}>Serial Number</Text>
                    <Text variant="bodyMedium" style={styles.detailValue}>{asset.serialNumber}</Text>
                  </View>
                </View>
              )}

              {asset.purchaseDate && (
                <View style={styles.detailItem}>
                  <View style={styles.detailIconContainer}>
                    <Icon name="calendar" size={20} color="#6366f1" />
                  </View>
                  <View style={styles.detailContent}>
                    <Text variant="titleSmall" style={styles.detailLabel}>Purchase Date</Text>
                    <Text variant="bodyMedium" style={styles.detailValue}>
                      {formatDate(asset.purchaseDate)}
                    </Text>
                  </View>
                </View>
              )}

              {asset.depreciationRate && asset.depreciationRate > 0 && (
                <View style={styles.detailItem}>
                  <View style={styles.detailIconContainer}>
                    <Icon name="trending-down" size={20} color="#6366f1" />
                  </View>
                  <View style={styles.detailContent}>
                    <Text variant="titleSmall" style={styles.detailLabel}>Depreciation Rate</Text>
                    <Text variant="bodyMedium" style={styles.detailValue}>
                      {asset.depreciationRate}% per year
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {asset.notes && (
              <View style={styles.section}>
                <Text variant="titleSmall" style={styles.sectionTitle}>Notes</Text>
                <Text variant="bodyMedium" style={styles.sectionText}>
                  {asset.notes}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        <View style={styles.actions}>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('EditAsset', { assetId: asset._id })}
            style={styles.editButton}
            icon="pencil"
            buttonColor="#6366f1"
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            Edit Asset
          </Button>
          <Button
            mode="outlined"
            onPress={handleDelete}
            style={styles.deleteButton}
            icon="delete"
            textColor="#ef4444"
            borderColor="#ef4444"
            loading={deleteMutation.isPending}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            Delete Asset
          </Button>
        </View>
      </View>
    </ScrollView>
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
    fontSize: 20,
    fontWeight: '700',
    color: '#dc2626',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  errorSubtext: {
    fontSize: 15,
    color: '#64748b',
    lineHeight: 22,
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    marginBottom: 20,
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
    padding: 24,
    paddingLeft: 28,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    position: 'relative',
  },
  iconBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2.5,
    borderColor: '#ffffff',
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
    fontSize: 26,
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  categoryBadgeContainer: {
    marginTop: 4,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  editIcon: {
    margin: 0,
  },
  divider: {
    marginVertical: 24,
    backgroundColor: '#e5e7eb',
    height: 1,
  },
  valueSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 32,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  valueContainer: {
    flex: 1,
  },
  valueLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  value: {
    fontWeight: '800',
    fontSize: 32,
    letterSpacing: -0.8,
    lineHeight: 40,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    gap: 8,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  section: {
    marginBottom: 28,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sectionTitle: {
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 12,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionText: {
    color: '#1e293b',
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.1,
  },
  detailsGrid: {
    marginBottom: 28,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 6,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  detailValue: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  actions: {
    gap: 12,
  },
  editButton: {
    marginBottom: 8,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  deleteButton: {
    borderRadius: 16,
    borderWidth: 1.5,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  buttonLabel: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

