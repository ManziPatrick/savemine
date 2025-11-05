import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Linking, Alert } from 'react-native';
import { Text, Card, FAB, Searchbar, ActivityIndicator, Button, Dialog, Portal, ProgressBar, SegmentedButtons } from 'react-native-paper';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { contactsAPI } from '../../services/api';
import { useNavigation } from '@react-navigation/native';
import { formatPhoneNumber, getDeviceContacts } from '../../utils/contacts';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function ContactsScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('app'); // 'app' or 'device'
  const [deviceContacts, setDeviceContacts] = useState([]);
  const [loadingDeviceContacts, setLoadingDeviceContacts] = useState(false);

  const { data: contacts, isLoading, refetch } = useQuery({
    queryKey: ['contacts', searchQuery],
    queryFn: () => contactsAPI.getContacts({ 
      search: searchQuery || undefined,
      limit: 1000 
    }),
    staleTime: 30000,
    enabled: viewMode === 'app', // Only fetch when viewing app contacts
  });

  const contactsList = contacts?.data?.data || [];

  // Fetch device contacts when switching to device view
  useEffect(() => {
    if (viewMode === 'device' && deviceContacts.length === 0 && !loadingDeviceContacts) {
      loadDeviceContacts();
    }
  }, [viewMode]);

  const loadDeviceContacts = useCallback(async () => {
    setLoadingDeviceContacts(true);
    try {
      const contacts = await getDeviceContacts();
      // Sort alphabetically by name, exactly like phone contacts app
      const sortedContacts = contacts.sort((a, b) => {
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
      setDeviceContacts(sortedContacts);
    } catch (error) {
      console.error('Error loading device contacts:', error);
      Alert.alert('Error', 'Failed to load device contacts');
    } finally {
      setLoadingDeviceContacts(false);
    }
  }, []);

  // Filter contacts based on search query
  const filteredContacts = useMemo(() => {
    const sourceList = viewMode === 'device' ? deviceContacts : contactsList;
    if (!searchQuery) return sourceList;
    
    const searchLower = searchQuery.toLowerCase();
    return sourceList.filter(contact => {
      const name = (contact.name || '').toLowerCase();
      const phone = (contact.phone || '').toLowerCase();
      const email = (contact.email || '').toLowerCase();
      const allPhones = contact.allPhones || (contact.phone ? [contact.phone] : []);
      const phonesMatch = allPhones.some(p => p.includes(searchQuery));
      
      return name.includes(searchLower) || 
             phone.includes(searchQuery) || 
             email.includes(searchLower) ||
             phonesMatch;
    });
  }, [viewMode, deviceContacts, contactsList, searchQuery]);

  const handlePhonePress = useCallback((phone) => {
    if (!phone) return;
    
    // Clean phone number for tel: link
    const cleanedPhone = phone.replace(/\D/g, '');
    if (cleanedPhone) {
      Linking.openURL(`tel:${cleanedPhone}`).catch((err) => {
        Alert.alert('Error', 'Unable to make phone call');
      });
    }
  }, []);

  const handleSMSPress = useCallback((phone) => {
    if (!phone) return;
    
    // Clean phone number for sms: link
    const cleanedPhone = phone.replace(/\D/g, '');
    if (cleanedPhone) {
      Linking.openURL(`sms:${cleanedPhone}`).catch((err) => {
        Alert.alert('Error', 'Unable to send SMS');
      });
    }
  }, []);

  const renderContact = useCallback(({ item }) => {
    const displayPhone = formatPhoneNumber(item.phone) || item.phone;
    const isDeviceContact = viewMode === 'device';
    
    return (
      <TouchableOpacity
        onPress={() => {
          if (isDeviceContact) {
            // For device contacts, show phone numbers directly - no backend calls
            if (item.allPhones && item.allPhones.length > 1) {
              // Show options if multiple phones
              Alert.alert(
                item.name,
                `Select phone number:\n${item.allPhones.map((p, i) => `${i + 1}. ${formatPhoneNumber(p) || p}`).join('\n')}`,
                [
                  ...item.allPhones.map((phone) => ({
                    text: formatPhoneNumber(phone) || phone,
                    onPress: () => handlePhonePress(phone),
                  })),
                  { text: 'Cancel', style: 'cancel' },
                ]
              );
            } else {
              // Single phone, call directly
              if (item.phone) {
                handlePhonePress(item.phone);
              }
            }
          } else {
            // For app contacts, navigate to detail
            navigation.navigate('ContactDetail', { contactId: item._id });
          }
        }}
        activeOpacity={0.7}
      >
        <Card style={styles.card} elevation={1}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.contactHeader}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {item.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?'}
                </Text>
              </View>
              <View style={styles.contactInfo}>
                <Text variant="titleMedium" style={styles.name} numberOfLines={1}>
                  {item.name || 'Unknown'}
                </Text>
                {displayPhone ? (
                  <View style={styles.phoneContainer}>
                    {item.allPhones && item.allPhones.length > 0 ? (
                      <View style={styles.phoneNumbersList}>
                        {item.allPhones.slice(0, 2).map((phone, idx) => (
                          <TouchableOpacity
                            key={idx}
                            onPress={(e) => {
                              e.stopPropagation();
                              handlePhonePress(phone);
                            }}
                            style={styles.phoneTouchable}
                          >
                            <Icon name="phone" size={16} color="#2563eb" />
                            <Text variant="bodyMedium" style={styles.phone}>
                              {formatPhoneNumber(phone) || phone}
                            </Text>
                          </TouchableOpacity>
                        ))}
                        {item.allPhones.length > 2 && (
                          <Text variant="bodySmall" style={styles.multiplePhones}>
                            +{item.allPhones.length - 2} more numbers
                          </Text>
                        )}
                      </View>
                    ) : (
                      <TouchableOpacity 
                        onPress={(e) => {
                          e.stopPropagation();
                          handlePhonePress(item.phone);
                        }}
                        style={styles.phoneTouchable}
                      >
                        <Icon name="phone" size={16} color="#2563eb" />
                        <Text variant="bodyMedium" style={styles.phone}>
                          {displayPhone}
                        </Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity 
                      onPress={(e) => {
                        e.stopPropagation();
                        const phoneToUse = item.allPhones && item.allPhones.length > 0 
                          ? item.allPhones[0] 
                          : item.phone;
                        handleSMSPress(phoneToUse);
                      }}
                      style={styles.smsButton}
                    >
                      <Icon name="message-text" size={18} color="#2563eb" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text variant="bodySmall" style={styles.noPhone}>No phone number</Text>
                )}
                {item.email && (
                  <Text variant="bodySmall" style={styles.email} numberOfLines={1}>
                    {item.email}
                  </Text>
                )}
                {item.type && !isDeviceContact && (
                  <Text variant="bodySmall" style={styles.type}>
                    {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                  </Text>
                )}
                {isDeviceContact && (
                  <Text variant="bodySmall" style={styles.deviceLabel}>
                    📱 Device Contact
                  </Text>
                )}
              </View>
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  }, [navigation, handlePhonePress, handleSMSPress, viewMode]);

  if ((isLoading && viewMode === 'app') || (loadingDeviceContacts && viewMode === 'device')) {
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
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SegmentedButtons
          value={viewMode}
          onValueChange={setViewMode}
          buttons={[
            { value: 'app', label: 'App Contacts' },
            { value: 'device', label: 'Device Contacts' },
          ]}
          style={styles.segmentedButtons}
        />
        <Searchbar
          placeholder={`Search ${viewMode === 'device' ? 'device' : 'app'} contacts...`}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>

      <FlatList
        data={filteredContacts}
        renderItem={renderContact}
        keyExtractor={(item) => item._id || item.id}
        contentContainerStyle={styles.list}
        refreshing={viewMode === 'app' ? isLoading : false}
        onRefresh={viewMode === 'app' ? refetch : loadDeviceContacts}
        initialNumToRender={20}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={true}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="account-search" size={64} color="#cbd5e1" />
            <Text variant="bodyLarge" style={styles.emptyText}>
              No contacts found
            </Text>
            <Text variant="bodySmall" style={styles.emptySubtext}>
              {searchQuery ? 'Try a different search term' : viewMode === 'device' ? 'No device contacts found' : 'Add your first contact'}
            </Text>
          </View>
        }
      />

      {viewMode === 'app' && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => navigation.navigate('AddContact')}
        />
      )}
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
  segmentedButtons: {
    marginBottom: 12,
  },
  searchbar: {
    marginBottom: 0,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 12,
    borderRadius: 12,
  },
  cardContent: {
    padding: 16,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
  },
  contactInfo: {
    flex: 1,
  },
  name: {
    fontWeight: '600',
    marginBottom: 6,
    color: '#1e293b',
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  phoneNumbersList: {
    flex: 1,
    gap: 4,
  },
  phoneTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  phone: {
    color: '#2563eb',
    marginLeft: 6,
    fontWeight: '500',
  },
  multiplePhones: {
    color: '#64748b',
    fontSize: 11,
  },
  deviceLabel: {
    color: '#8b5cf6',
    fontSize: 11,
    marginTop: 4,
  },
  smsButton: {
    padding: 4,
    marginLeft: 8,
  },
  noPhone: {
    color: '#9ca3af',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  email: {
    color: '#6b7280',
    marginBottom: 4,
  },
  type: {
    color: '#9ca3af',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    color: '#64748b',
    fontWeight: '600',
  },
  emptySubtext: {
    marginTop: 8,
    color: '#94a3b8',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

