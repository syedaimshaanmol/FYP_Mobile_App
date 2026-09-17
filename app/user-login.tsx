import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { CreovatorTheme } from '@/constants/theme';
import { CreovatorInput, CreovatorButton } from '@/components/creovator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function UserLogin() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(
    params.mode === 'signup' ? 'signup' : 'login'
  );

  useEffect(() => {
    if (params.mode === 'signup') {
      setMode('signup');
    }
  }, [params.mode]);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (mode === 'signup') {
      if (!fullName.trim()) errs.fullName = 'Full name is required';
      else if (fullName.trim().length < 2) errs.fullName = 'Name too short';
    }

    if (!email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Invalid email address';
    }

    if (mode !== 'forgot') {
      if (!password) {
        errs.password = 'Password is required';
      } else if (password.length < 6) {
        errs.password = 'Password must be at least 6 characters';
      }

      if (mode === 'signup' && password !== confirmPassword) {
        errs.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAuth = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          Alert.alert('Login Failed', error.message);
          setLoading(false);
          return;
        }

        if (data.user) {
          router.replace('/(tabs)');
        }
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              role: 'organizer',
            },
          },
        });

        if (error) {
          Alert.alert('Registration Failed', error.message);
          setLoading(false);
          return;
        }

        if (data.user) {
          // Upsert into profiles table
          await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name: fullName.trim(),
            email: email.trim(),
            role: 'organizer',
          });

          if (data.session) {
            Alert.alert('Welcome to Creovator! 🎉', 'Your account has been created.', [
              { text: 'Get Started', onPress: () => router.replace('/(tabs)') },
            ]);
          } else {
            Alert.alert(
              'Account Created',
              'Please check your email to confirm your account, then log in.',
              [{ text: 'OK', onPress: () => setMode('login') }]
            );
          }
        }
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
        if (error) {
          Alert.alert('Reset Failed', error.message);
        } else {
          Alert.alert(
            'Reset Link Sent',
            'Check your email inbox for the password reset instructions.',
            [{ text: 'Back to Login', onPress: () => setMode('login') }]
          );
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => (mode === 'forgot' ? setMode('login') : router.back())}
        >
          <Ionicons name="chevron-back" size={24} color={CreovatorTheme.colors.textWhite} />
        </TouchableOpacity>

        {/* Branding */}
        <View style={styles.branding}>
          <Image
            source={require('@/assets/images/creovator-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>
            {mode === 'login'
              ? 'Organizer Login'
              : mode === 'signup'
              ? 'Create Account'
              : 'Reset Password'}
          </Text>
          <Text style={styles.subtitle}>
            {mode === 'login'
              ? 'Welcome back! Sign in to manage your events.'
              : mode === 'signup'
              ? 'Sign up to build and automate smart events.'
              : 'Enter your email to receive recovery instructions.'}
          </Text>
        </View>

        {/* Mode Switch Tabs (Login / Signup) */}
        {mode !== 'forgot' && (
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, mode === 'login' && styles.activeTab]}
              onPress={() => {
                setMode('login');
                setErrors({});
              }}
            >
              <Text style={[styles.tabText, mode === 'login' && styles.activeTabText]}>
                Sign In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, mode === 'signup' && styles.activeTab]}
              onPress={() => {
                setMode('signup');
                setErrors({});
              }}
            >
              <Text style={[styles.tabText, mode === 'signup' && styles.activeTabText]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Inputs */}
        <View style={styles.formCard}>
          {mode === 'signup' && (
            <CreovatorInput
              label="Full Name"
              placeholder="e.g. Sarah Khan"
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                setErrors((e) => ({ ...e, fullName: '' }));
              }}
              error={errors.fullName}
              leftIcon={<Ionicons name="person-outline" size={18} color={CreovatorTheme.colors.textMuted} />}
            />
          )}

          <CreovatorInput
            label="Email Address"
            placeholder="name@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setErrors((e) => ({ ...e, email: '' }));
            }}
            error={errors.email}
            leftIcon={<Ionicons name="mail-outline" size={18} color={CreovatorTheme.colors.textMuted} />}
          />

          {mode !== 'forgot' && (
            <CreovatorInput
              label="Password"
              placeholder="Enter your password"
              isPassword
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setErrors((e) => ({ ...e, password: '' }));
              }}
              error={errors.password}
              leftIcon={<Ionicons name="lock-closed-outline" size={18} color={CreovatorTheme.colors.textMuted} />}
            />
          )}

          {mode === 'signup' && (
            <CreovatorInput
              label="Confirm Password"
              placeholder="Re-enter password"
              isPassword
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setErrors((e) => ({ ...e, confirmPassword: '' }));
              }}
              error={errors.confirmPassword}
              leftIcon={<Ionicons name="shield-checkmark-outline" size={18} color={CreovatorTheme.colors.textMuted} />}
            />
          )}

          {mode === 'login' && (
            <TouchableOpacity
              style={styles.forgotButton}
              onPress={() => setMode('forgot')}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          )}

          <CreovatorButton
            title={
              mode === 'login'
                ? 'Sign In to Creovator'
                : mode === 'signup'
                ? 'Create Organizer Account'
                : 'Send Reset Link'
            }
            onPress={handleAuth}
            loading={loading}
            size="lg"
            style={{ marginTop: 8 }}
          />
        </View>

        {/* Footer Alternative Mode Toggle */}
        <View style={styles.footerRow}>
          {mode === 'login' ? (
            <Text style={styles.footerMuted}>
              Don't have an account?{' '}
              <Text style={styles.footerHighlight} onPress={() => setMode('signup')}>
                Sign up
              </Text>
            </Text>
          ) : mode === 'signup' ? (
            <Text style={styles.footerMuted}>
              Already have an account?{' '}
              <Text style={styles.footerHighlight} onPress={() => setMode('login')}>
                Sign in
              </Text>
            </Text>
          ) : (
            <Text style={styles.footerMuted}>
              Remembered your password?{' '}
              <Text style={styles.footerHighlight} onPress={() => setMode('login')}>
                Sign in
              </Text>
            </Text>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CreovatorTheme.colors.bgDark,
  },
  scrollContent: {
    paddingHorizontal: 20,
    flexGrow: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  branding: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 170,
    height: 50,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: CreovatorTheme.colors.textWhite,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: CreovatorTheme.colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 18,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: CreovatorTheme.colors.primary,
  },
  tabText: {
    color: CreovatorTheme.colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  activeTabText: {
    color: '#ffffff',
    fontWeight: '800',
  },
  formCard: {
    backgroundColor: CreovatorTheme.colors.bgCard,
    borderWidth: 1,
    borderColor: CreovatorTheme.colors.cardBorder,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 16,
    marginTop: -4,
  },
  forgotText: {
    color: CreovatorTheme.colors.secondary,
    fontSize: 12,
    fontWeight: '700',
  },
  footerRow: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  footerMuted: {
    color: CreovatorTheme.colors.textMuted,
    fontSize: 13,
  },
  footerHighlight: {
    color: CreovatorTheme.colors.primary,
    fontWeight: '800',
  },
});
