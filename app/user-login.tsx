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

import { supabase } from '../lib/supabase';

export default function UserLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(
        'Missing details',
        'Please enter both email and password.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        console.log('SUPABASE LOGIN ERROR:', error.message);

        setIsSubmitting(false);

        Alert.alert(
          'Login Failed',
          error.message
        );

        return;
      }

      if (!data.user) {
        setIsSubmitting(false);

        Alert.alert(
          'Login Failed',
          'User account was not found.'
        );

        return;
      }

      console.log('USER LOGIN SUCCESS:', data.user.email);

      setIsSubmitting(false);

      Alert.alert(
        'Welcome Back 👋',
        'Logged in successfully.',
        [
          {
            text: 'Continue',
            onPress: () => router.replace('/user-dashboard'),
          },
        ]
      );

    } catch (error) {
      console.log('LOGIN ERROR:', error);

      setIsSubmitting(false);

      Alert.alert(
        'Error',
        'Something went wrong. Please try again.'
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>

        {/* ICON */}
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>👤</Text>
        </View>

        {/* TITLE */}
        <Text style={styles.title}>
          User Login
        </Text>

        <Text style={styles.subtitle}>
          Welcome to the CreoVator platform
        </Text>

        {/* EMAIL */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Email
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* PASSWORD */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Password
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* LOGIN BUTTON */}
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
        Welcome to CreoVator
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