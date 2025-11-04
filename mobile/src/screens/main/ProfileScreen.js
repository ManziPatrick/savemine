import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, TextInput, Divider, ActivityIndicator } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const updateMutation = useMutation({
    mutationFn: (data) => authAPI.updateProfile(data),
    onSuccess: () => {
      Alert.alert('Success', 'Profile updated successfully');
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
    },
  });

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Profile Header */}
        <Card style={styles.profileCard}>
          <Card.Content>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
            </View>
            <Text variant="headlineSmall" style={styles.name}>
              {user?.name || 'User'}
            </Text>
            <Text variant="bodyMedium" style={styles.email}>
              {user?.email || ''}
            </Text>
          </Card.Content>
        </Card>

        {/* Profile Information */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Profile Information
              </Text>
              {!editing && (
                <Button
                  mode="text"
                  onPress={() => setEditing(true)}
                  icon="pencil"
                >
                  Edit
                </Button>
              )}
            </View>
            <Divider style={styles.divider} />

            <View style={styles.inputGroup}>
              <Text variant="bodySmall" style={styles.label}>Name</Text>
              {editing ? (
                <TextInput
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  mode="outlined"
                  style={styles.input}
                />
              ) : (
                <Text variant="bodyLarge" style={styles.value}>
                  {user?.name || 'Not set'}
                </Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text variant="bodySmall" style={styles.label}>Email</Text>
              {editing ? (
                <TextInput
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  mode="outlined"
                  keyboardType="email-address"
                  style={styles.input}
                />
              ) : (
                <Text variant="bodyLarge" style={styles.value}>
                  {user?.email || 'Not set'}
                </Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text variant="bodySmall" style={styles.label}>Phone</Text>
              {editing ? (
                <TextInput
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  mode="outlined"
                  keyboardType="phone-pad"
                  style={styles.input}
                />
              ) : (
                <Text variant="bodyLarge" style={styles.value}>
                  {user?.phone || 'Not set'}
                </Text>
              )}
            </View>

            {editing && (
              <View style={styles.editActions}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setEditing(false);
                    setFormData({
                      name: user?.name || '',
                      email: user?.email || '',
                      phone: user?.phone || '',
                    });
                  }}
                  style={styles.cancelButton}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSave}
                  loading={updateMutation.isPending}
                  style={styles.saveButton}
                >
                  Save
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Account Actions */}
        <Card style={styles.actionsCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Account Actions
            </Text>
            <Divider style={styles.divider} />

            <Button
              mode="outlined"
              icon="logout"
              onPress={handleLogout}
              style={styles.actionButton}
              textColor="#dc2626"
            >
              Logout
            </Button>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 16,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  name: {
    textAlign: 'center',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  email: {
    textAlign: 'center',
    color: '#64748b',
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 20,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: '600',
    color: '#1e293b',
  },
  divider: {
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#64748b',
    marginBottom: 8,
    fontWeight: '500',
  },
  value: {
    color: '#1e293b',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#ffffff',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#2563eb',
  },
  actionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    elevation: 2,
  },
  actionButton: {
    marginTop: 8,
    borderColor: '#dc2626',
  },
});

