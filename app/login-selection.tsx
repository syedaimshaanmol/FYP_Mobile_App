import { useRouter } from 'expo-router';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CreovatorTheme } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LoginSelection() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
      {/* Background Decorative Glow */}
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <View style={styles.header}>
        <Image
          source={require('@/assets/images/creovator-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>EVENT AUTOMATION HUB</Text>
        </View>
        <Text style={styles.title}>Welcome to Creovator</Text>
        <Text style={styles.subtitle}>
          The ultimate mobile platform for smart event organization and automated asset generation.
        </Text>
      </View>

      <View style={styles.cardsContainer}>
        {/* Organizer Option */}
        <TouchableOpacity
          style={styles.roleCard}
          onPress={() => router.push('/user-login')}
          activeOpacity={0.8}
        >
          <View style={[styles.iconCircle, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
            <Ionicons name="calendar" size={28} color={CreovatorTheme.colors.primary} />
          </View>
          <View style={styles.cardTextContainer}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.buttonTitle}>Event Organizer</Text>
              <Ionicons name="arrow-forward" size={18} color={CreovatorTheme.colors.primary} />
            </View>
            <Text style={styles.buttonText}>
              Manage events, participants, certificates, ID cards, and AI designs
            </Text>
          </View>
        </TouchableOpacity>

        {/* Admin Option */}
        <TouchableOpacity
          style={styles.roleCard}
          onPress={() => router.push('/admin-login')}
          activeOpacity={0.8}
        >
          <View style={[styles.iconCircle, { backgroundColor: 'rgba(249, 187, 30, 0.15)' }]}>
            <Ionicons name="shield-checkmark" size={28} color={CreovatorTheme.colors.secondary} />
          </View>
          <View style={styles.cardTextContainer}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.buttonTitle}>Platform Admin</Text>
              <Ionicons name="arrow-forward" size={18} color={CreovatorTheme.colors.secondary} />
            </View>
            <Text style={styles.buttonText}>
              Access platform statistics, manage event managers & events
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Creovator Platform © 2026</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CreovatorTheme.colors.bgDark,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  glowTop: {
    position: 'absolute',
    top: -80,
    left: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(236, 72, 153, 0.12)',
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
  },
  logo: {
    width: 260,
    height: 80,
    marginBottom: 16,
  },
  badgeContainer: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    marginBottom: 12,
  },
  badgeText: {
    color: '#a5b4fc',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: CreovatorTheme.colors.textWhite,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: CreovatorTheme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 10,
  },
  cardsContainer: {
    gap: 16,
    marginVertical: 30,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  buttonTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: CreovatorTheme.colors.textWhite,
  },
  buttonText: {
    fontSize: 12,
    color: CreovatorTheme.colors.textMuted,
    lineHeight: 17,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: CreovatorTheme.colors.textDim,
    fontSize: 12,
    fontWeight: '600',
  },
});
