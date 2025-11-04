import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Card, Text, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function MoreMainScreen() {
  const navigation = useNavigation();

  const menuItems = [
    { name: 'Assets', icon: 'package-variant', color: '#2563eb', screen: 'Assets' },
    { name: 'Investments', icon: 'trending-up', color: '#059669', screen: 'Investments' },
    { name: 'Business', icon: 'office-building', color: '#dc2626', screen: 'Business' },
    { name: 'Gifts', icon: 'gift', color: '#ec4899', screen: 'Gifts' },
    { name: 'Petty Cash', icon: 'wallet', color: '#f59e0b', screen: 'PettyCash' },
    { name: 'Reminders', icon: 'bell', color: '#8b5cf6', screen: 'Reminders' },
    { name: 'Profile', icon: 'account', color: '#64748b', screen: 'Profile' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text variant="headlineSmall" style={styles.title}>More</Text>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.screen}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Card style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
                  <Icon name={item.icon} size={24} color={item.color} />
                </View>
                <Text variant="titleMedium" style={styles.cardTitle}>
                  {item.name}
                </Text>
                <Icon name="chevron-right" size={24} color="#94a3b8" />
              </Card.Content>
            </Card>
          </TouchableOpacity>
        ))}
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
  title: {
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 20,
  },
  card: {
    marginBottom: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardTitle: {
    flex: 1,
    fontWeight: '500',
    color: '#1e293b',
  },
});

