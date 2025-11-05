import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, Alert, Linking } from 'react-native';
import { Text, Card, Button, Chip, ActivityIndicator, Divider, IconButton } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsAPI } from '../../services/api';
import { useNavigation, useRoute } from '@react-navigation/native';
import { formatDate } from '../../utils/formatters';
import { formatPhoneNumber } from '../../utils/contacts';

export default function ContactDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { contactId } = route.params;

  const { data: contactData, isLoading } = useQuery({
    queryKey: ['contact', contactId],
    queryFn: () => contactsAPI.getContact(contactId),
  });

  const deleteMutation = useMutation({
    mutationFn: contactsAPI.deleteContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      navigation.goBack();
    },
  });

  const contact = contactData?.data?.data?.contact || contactData?.data?.contact || contactData?.data;

  const displayPhone = useMemo(() => {
    return contact?.phone ? formatPhoneNumber(contact.phone) : null;
  }, [contact?.phone]);

  const handleCall = () => {
    if (contact?.phone) {
      // Clean phone number - remove all non-digit characters
      const cleanedPhone = contact.phone.replace(/\D/g, '');
      if (cleanedPhone) {
        Linking.openURL(`tel:${cleanedPhone}`).catch((err) => {
          Alert.alert('Error', 'Unable to make phone call');
        });
      } else {
        Alert.alert('Error', 'Invalid phone number');
      }
    } else {
      Alert.alert('Error', 'No phone number available');
    }
  };

  const handleSMS = () => {
    if (contact?.phone) {
      // Clean phone number - remove all non-digit characters
      const cleanedPhone = contact.phone.replace(/\D/g, '');
      if (cleanedPhone) {
        Linking.openURL(`sms:${cleanedPhone}`).catch((err) => {
          Alert.alert('Error', 'Unable to send SMS');
        });
      } else {
        Alert.alert('Error', 'Invalid phone number');
      }
    } else {
      Alert.alert('Error', 'No phone number available');
    }
  };

  const handleEmail = () => {
    if (contact?.email) {
      Linking.openURL(`mailto:${contact.email}`);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Contact',
      `Are you sure you want to delete ${contact?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(contactId),
        },
      ]
    );
  };

  const getTypeLabel = (type) => {
    const types = {
      debtor: 'Debtor',
      creditor: 'Creditor',
      partner: 'Partner',
    };
    return types[type] || type;
  };

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!contact) {
    return (
      <View style={styles.container}>
        <Text>Contact not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text variant="headlineSmall" style={styles.name}>
                  {contact.name}
                </Text>
                <Chip style={styles.typeChip}>
                  {getTypeLabel(contact.type)}
                </Chip>
              </View>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.actionButtons}>
              {contact.phone && (
                <Button
                  mode="contained"
                  onPress={handleCall}
                  icon="phone"
                  style={styles.actionButton}
                >
                  Call
                </Button>
              )}
              {contact.phone && (
                <Button
                  mode="contained"
                  onPress={handleSMS}
                  icon="message"
                  style={styles.actionButton}
                >
                  SMS
                </Button>
              )}
              {contact.email && (
                <Button
                  mode="contained"
                  onPress={handleEmail}
                  icon="email"
                  style={styles.actionButton}
                >
                  Email
                </Button>
              )}
            </View>

            <Divider style={styles.divider} />

            <View style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Contact Information
              </Text>
              {contact.phone && (
                <View style={styles.infoRow}>
                  <Text variant="bodyMedium" style={styles.label}>Phone:</Text>
                  <View style={styles.phoneValueContainer}>
                    <Text variant="bodyLarge" style={styles.value}>
                      {displayPhone || contact.phone}
                    </Text>
                    <View style={styles.quickActions}>
                      <IconButton
                        icon="phone"
                        size={20}
                        iconColor="#2563eb"
                        onPress={handleCall}
                        style={styles.quickActionButton}
                      />
                      <IconButton
                        icon="message-text"
                        size={20}
                        iconColor="#2563eb"
                        onPress={handleSMS}
                        style={styles.quickActionButton}
                      />
                    </View>
                  </View>
                </View>
              )}
              {contact.email && (
                <View style={styles.infoRow}>
                  <Text variant="bodyMedium" style={styles.label}>Email:</Text>
                  <Text variant="bodyLarge" style={styles.value}>
                    {contact.email}
                  </Text>
                </View>
              )}
              {contact.address && (
                <View style={styles.infoRow}>
                  <Text variant="bodyMedium" style={styles.label}>Address:</Text>
                  <Text variant="bodyLarge" style={styles.value}>
                    {contact.address}
                  </Text>
                </View>
              )}
              {contact.organization && (
                <View style={styles.infoRow}>
                  <Text variant="bodyMedium" style={styles.label}>Organization:</Text>
                  <Text variant="bodyLarge" style={styles.value}>
                    {contact.organization}
                  </Text>
                </View>
              )}
            </View>

            {contact.notes && (
              <>
                <Divider style={styles.divider} />
                <View style={styles.section}>
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Notes
                  </Text>
                  <Text variant="bodyMedium" style={styles.notes}>
                    {contact.notes}
                  </Text>
                </View>
              </>
            )}

            {contact.tags && contact.tags.length > 0 && (
              <>
                <Divider style={styles.divider} />
                <View style={styles.section}>
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Tags
                  </Text>
                  <View style={styles.tagsContainer}>
                    {contact.tags.map((tag, index) => (
                      <Chip key={index} style={styles.tag}>
                        {tag}
                      </Chip>
                    ))}
                  </View>
                </View>
              </>
            )}

            <Divider style={styles.divider} />

            <View style={styles.section}>
              <Text variant="bodySmall" style={styles.meta}>
                Created: {formatDate(contact.createdAt)}
              </Text>
              {contact.updatedAt && (
                <Text variant="bodySmall" style={styles.meta}>
                  Updated: {formatDate(contact.updatedAt)}
                </Text>
              )}
            </View>

            <Divider style={styles.divider} />

            <View style={styles.actions}>
              <Button
                mode="outlined"
                onPress={() => navigation.navigate('EditContact', { contactId: contact._id })}
                style={styles.actionButton}
                icon="pencil"
              >
                Edit Contact
              </Button>
              <Button
                mode="outlined"
                onPress={() => navigation.navigate('Loans', { contactId: contact._id })}
                style={styles.actionButton}
                icon="cash"
              >
                View Loans
              </Button>
              <Button
                mode="outlined"
                onPress={handleDelete}
                style={[styles.actionButton, styles.deleteButton]}
                textColor="#ef4444"
                icon="delete"
              >
                Delete Contact
              </Button>
            </View>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  header: {
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  name: {
    fontWeight: 'bold',
    marginRight: 8,
    marginBottom: 8,
  },
  typeChip: {
    height: 32,
    backgroundColor: '#dbeafe',
  },
  divider: {
    marginVertical: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    minWidth: 100,
    marginBottom: 8,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    color: '#6b7280',
    flex: 1,
  },
  value: {
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  phoneValueContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  quickActions: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  quickActionButton: {
    margin: 0,
    marginLeft: 4,
  },
  notes: {
    color: '#374151',
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    marginRight: 8,
    marginBottom: 8,
  },
  meta: {
    color: '#9ca3af',
    marginBottom: 4,
  },
  actions: {
    marginTop: 8,
  },
  deleteButton: {
    borderColor: '#ef4444',
  },
});
