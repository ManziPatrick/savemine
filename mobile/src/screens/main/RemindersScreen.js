import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, Card, FAB, Searchbar, Chip, Menu, IconButton, ActivityIndicator } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { remindersAPI } from '../../services/api';
import { useNavigation } from '@react-navigation/native';
import { formatDate } from '../../utils/formatters';

export default function RemindersScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: reminders, isLoading } = useQuery({
    queryKey: ['reminders', filter],
    queryFn: () => remindersAPI.getReminders({ 
      status: filter === 'all' ? undefined : filter,
      limit: 100
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: remindersAPI.deleteReminder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });

  const sendNowMutation = useMutation({
    mutationFn: remindersAPI.sendReminderNow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      Alert.alert('Success', 'Reminder sent successfully');
    },
  });

  const remindersList = reminders?.data?.data || [];

  const handleDelete = (id) => {
    Alert.alert(
      'Delete Reminder',
      'Are you sure you want to delete this reminder?',
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'sent':
        return '#059669';
      case 'failed':
        return '#dc2626';
      default:
        return '#64748b';
    }
  };

  const isOverdue = (sendAt) => {
    if (!sendAt) return false;
    return new Date(sendAt) < new Date();
  };

  const renderReminder = ({ item }) => {
    const overdue = isOverdue(item.sendAt);
    const statusColor = getStatusColor(item.status);

    return (
      <Card 
        style={[styles.card, overdue && styles.overdueCard]}
        onPress={() => navigation.navigate('ReminderDetail', { reminderId: item._id })}
      >
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.iconContainer, { backgroundColor: overdue ? '#fee2e2' : '#eff6ff' }]}>
                <Text style={styles.icon}>🔔</Text>
              </View>
              <View style={styles.textContainer}>
                <Text variant="titleMedium" style={styles.title}>
                  {item.title || 'Reminder'}
                </Text>
                <Text variant="bodySmall" style={styles.date}>
                  {item.sendAt ? formatDate(item.sendAt) : 'No date set'}
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
              {item.status === 'pending' && (
                <Menu.Item
                  onPress={() => sendNowMutation.mutate(item._id)}
                  title="Send Now"
                  leadingIcon="send"
                />
              )}
              <Menu.Item
                onPress={() => navigation.navigate('EditReminder', { reminderId: item._id })}
                title="Edit"
                leadingIcon="pencil"
              />
              <Menu.Item
                onPress={() => handleDelete(item._id)}
                title="Delete"
                leadingIcon="delete"
                titleStyle={{ color: '#ef4444' }}
              />
            </Menu>
          </View>
          
          {item.description && (
            <Text variant="bodySmall" style={styles.description} numberOfLines={2}>
              {item.description}
            </Text>
          )}

          <View style={styles.footer}>
            <Chip 
              style={[styles.statusChip, { backgroundColor: `${statusColor}20` }]}
              textStyle={[styles.chipText, { color: statusColor }]}
            >
              {item.status || 'pending'}
            </Chip>
            {item.modelType && (
              <Chip 
                style={styles.typeChip}
                textStyle={styles.chipText}
              >
                {item.modelType}
              </Chip>
            )}
            {overdue && (
              <Chip 
                style={styles.overdueChip}
                textStyle={styles.chipText}
              >
                Overdue
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
          placeholder="Search reminders..."
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
            selected={filter === 'pending'}
            onPress={() => setFilter('pending')}
            style={styles.filterChip}
          >
            Pending
          </Chip>
          <Chip
            selected={filter === 'sent'}
            onPress={() => setFilter('sent')}
            style={styles.filterChip}
          >
            Sent
          </Chip>
        </View>
      </View>

      <FlatList
        data={remindersList}
        renderItem={renderReminder}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="headlineSmall" style={styles.emptyText}>No reminders found</Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              Set up reminders for your loans and events
            </Text>
          </View>
        }
      />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AddReminder')}
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
  overdueCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
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
  title: {
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  date: {
    color: '#64748b',
    fontSize: 12,
  },
  description: {
    color: '#64748b',
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  statusChip: {
    height: 28,
  },
  typeChip: {
    height: 28,
    backgroundColor: '#f1f5f9',
  },
  overdueChip: {
    height: 28,
    backgroundColor: '#fee2e2',
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

