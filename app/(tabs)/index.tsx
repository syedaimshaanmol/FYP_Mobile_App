import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>

      <Text style={styles.subtitle}>
        Welcome to the CreoVator Admin Panel
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Dashboard</Text>
        <Text style={styles.cardText}>
          You are successfully logged in as an administrator.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 24,
    justifyContent: 'center',
  },

  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 30,
  },

  card: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 16,
    elevation: 4,
  },

  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2563eb',
    marginBottom: 10,
  },

  cardText: {
    fontSize: 15,
    color: '#374151',
  },
});