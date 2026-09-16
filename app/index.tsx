import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Image, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { CreovatorTheme } from '@/constants/theme';

export default function EntryScreen() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          router.replace('/(tabs)');
        } else {
          router.replace('/login-selection');
        }
      } catch (err) {
        router.replace('/login-selection');
      } finally {
        setChecking(false);
      }
    };

    checkAuth();
  }, [router]);

  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/creovator-logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <ActivityIndicator size="large" color={CreovatorTheme.colors.primary} style={styles.loader} />
      <Text style={styles.tagline}>Smart Event Organization & Automation</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CreovatorTheme.colors.bgDark,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logo: {
    width: 220,
    height: 70,
    marginBottom: 20,
  },
  loader: {
    marginVertical: 20,
  },
  tagline: {
    color: CreovatorTheme.colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
