import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Card, FAB, Searchbar } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { contactsAPI } from '../../services/api';
import { useNavigation } from '@react-navigation/native';
import { formatDate } from '../../utils/formatters';

export default function ContactsScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: contacts, isLoading } = useQuery({
    queryKey: ['contacts', searchQuery],
    queryFn: () => contactsAPI.getContacts({ 
      search: searchQuery || undefined,
      limit: 1000 
    }),
  });

  const contactsList = contacts?.data?.data || [];

  const renderContact = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('ContactDetail', { contactId: item._id })}
    >
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.name}>
            {item.name}
          </Text>
          <Text variant="bodyMedium" style={styles.phone}>
            {item.phone}
          </Text>
          {item.email && (
            <Text variant="bodySmall" style={styles.email}>
              {item.email}
            </Text>
          )}
          <Text variant="bodySmall" style={styles.type}>
            Type: {item.type}
          </Text>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Search contacts..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>

      <FlatList
        data={contactsList}
        renderItem={renderContact}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshing={isLoading}
        onRefresh={() => {}}
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {
          // Navigate to add contact screen
          navigation.navigate('AddContact');
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
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 12,
  },
  name: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  phone: {
    color: '#2563eb',
    marginBottom: 4,
  },
  email: {
    color: '#6b7280',
    marginBottom: 4,
  },
  type: {
    color: '#6b7280',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

