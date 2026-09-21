import { CreovatorTheme } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { useResponsive } from '@/constants/useResponsive';

export default function EntryScreen() {
  const router = useRouter();
   const r = useResponsive();;
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
    width: 280,
    height: 90,
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
