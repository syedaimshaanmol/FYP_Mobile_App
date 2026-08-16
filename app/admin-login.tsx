import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    // Check empty fields
    if (!username.trim() || !password.trim()) {
      Alert.alert(
        'Missing details',
        'Please enter both username and password.'
      );
      return;
    }

    setIsSubmitting(true);

    // Temporary login logic from your old FYP
    if (username === 'admin' && password === 'admin123') {
      setIsSubmitting(false);

      Alert.alert(
        'Welcome back',
        'Logged in successfully.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );

      return;
    }

    setIsSubmitting(false);

    Alert.alert(
      'Login failed',
      'Invalid username or password.'
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>

        {/* Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🛡️</Text>
        </View>

        {/* Heading */}
        <Text style={styles.title}>Admin Panel</Text>

        <Text style={styles.subtitle}>
          CreoVator platform administration
        </Text>

        {/* Username */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Username</Text>

          <TextInput
            style={styles.input}
            placeholder="Enter admin username"
            placeholderTextColor="#999"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Password */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>

          <TextInput
            style={styles.input}
            placeholder="Enter password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        {/* Login Button */}
        <TouchableOpacity
          style={[
            styles.loginButton,
            isSubmitting && styles.disabledButton,
          ]}
          onPress={handleLogin}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.loginButtonText}>
              Sign In
            </Text>
          )}
        </TouchableOpacity>

      </View>

      <Text style={styles.footer}>
        Restricted access — CreoVator platform administrators only
      </Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 28,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },

  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },

  icon: {
    fontSize: 30,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    color: '#111827',
  },

  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 28,
  },

  inputGroup: {
    marginBottom: 18,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#ffffff',
  },

  loginButton: {
    height: 50,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
  },

  disabledButton: {
    opacity: 0.7,
  },

  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },

  footer: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 18,
  },
});