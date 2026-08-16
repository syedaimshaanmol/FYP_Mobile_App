import { router } from 'expo-router';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function LoginSelection() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>CreoVator</Text>
      <Text style={styles.title}>Welcome to CreoVator</Text>
      <Text style={styles.subtitle}>Please select how you want to continue</Text>

      <TouchableOpacity
        style={styles.userButton}
        onPress={() => router.push('/user-login')}
      >
        <Text style={styles.buttonTitle}>👤 Login as User</Text>
        <Text style={styles.buttonText}>
          Access your CreoVator account
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.adminButton}
        onPress={() => router.push('/admin-login')}
      >
        <Text style={styles.buttonTitle}>🔐 Login as Admin</Text>
        <Text style={styles.buttonText}>
          Access the Admin Panel
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
    justifyContent: 'center',
    padding: 25,
  },
  logo: {
    fontSize: 34,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 35,
  },
  userButton: {
    backgroundColor: '#ffffff',
    padding: 22,
    borderRadius: 15,
    marginBottom: 18,
    elevation: 4,
  },
  adminButton: {
    backgroundColor: '#ffffff',
    padding: 22,
    borderRadius: 15,
    elevation: 4,
  },
  buttonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  buttonText: {
    fontSize: 14,
    color: '#666',
  },
});