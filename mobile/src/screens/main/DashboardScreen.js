import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Card, Text, ActivityIndicator } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { loansAPI } from '../../services/api';
import { useNavigation } from '@react-navigation/native';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const { data: loanStats, isLoading, refetch } = useQuery({
    queryKey: ['loanStats'],
    queryFn: () => loansAPI.getLoanStats(),
  });

  const stats = loanStats?.data?.data?.overview || {};

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refetch} />
      }
    >
      <View style={styles.content}>
        <Text variant="headlineSmall" style={styles.title}>
          Dashboard
        </Text>

        {isLoading ? (
          <ActivityIndicator size="large" style={styles.loader} />
        ) : (
          <>
            <View style={styles.statsGrid}>
              <Card style={styles.card} onPress={() => navigation.navigate('Loans')}>
                <Card.Content>
                  <Text variant="headlineMedium" style={styles.statValue}>
                    {stats.totalLoans || 0}
                  </Text>
                  <Text variant="bodyMedium" style={styles.statLabel}>
                    Total Loans
                  </Text>
                </Card.Content>
              </Card>

              <Card style={styles.card}>
                <Card.Content>
                  <Text variant="headlineMedium" style={[styles.statValue, styles.success]}>
                    {stats.totalAmount?.toLocaleString() || 0} FRW
                  </Text>
                  <Text variant="bodyMedium" style={styles.statLabel}>
                    Total Amount
                  </Text>
                </Card.Content>
              </Card>

              <Card style={styles.card}>
                <Card.Content>
                  <Text variant="headlineMedium" style={[styles.statValue, styles.warning]}>
                    {stats.totalRemaining?.toLocaleString() || 0} FRW
                  </Text>
                  <Text variant="bodyMedium" style={styles.statLabel}>
                    Outstanding
                  </Text>
                </Card.Content>
              </Card>

              <Card style={styles.card}>
                <Card.Content>
                  <Text variant="headlineMedium" style={[styles.statValue, styles.danger]}>
                    {stats.overdueLoans || 0}
                  </Text>
                  <Text variant="bodyMedium" style={styles.statLabel}>
                    Overdue
                  </Text>
                </Card.Content>
              </Card>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 16,
  },
  title: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  loader: {
    marginTop: 50,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    marginBottom: 16,
  },
  statValue: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#6b7280',
  },
  success: {
    color: '#10b981',
  },
  warning: {
    color: '#f59e0b',
  },
  danger: {
    color: '#ef4444',
  },
});

