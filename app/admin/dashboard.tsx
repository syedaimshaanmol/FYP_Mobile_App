import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CreovatorColors } from '../../constants/theme';
import { CreovatorHeader } from '../../components/creovator/CreovatorHeader';
import { CreovatorCard } from '../../components/creovator/CreovatorCard';
import { supabase } from '../../lib/supabase';

interface AdminStats {
  totalManagers: number;
  totalEvents: number;
  certificatesGenerated: number;
  emailsSent: number;
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats>({
    totalManagers: 0,
    totalEvents: 0,
    certificatesGenerated: 0,
    emailsSent: 0,
  });
  const [adminUser, setAdminUser] = useState('Super Admin');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = async () => {
    try {
      const session = await AsyncStorage.getItem('creovator_admin_session');
      if (!session) {
        router.replace('/admin-login');
        return;
      }
      const parsed = JSON.parse(session);
      if (parsed.username) {
        setAdminUser(parsed.username);
      }
      await fetchStats();
    } catch (err) {
      console.error(err);
      router.replace('/admin-login');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-stats', {
        body: {},
      });

      if (!error && data?.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdminLogout = () => {
    Alert.alert(
      'Admin Sign Out',
      'Sign out of Creovator Administrator console?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('creovator_admin_session');
            router.replace('/login-selection');
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={CreovatorColors.accentGold} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CreovatorHeader
        title="Admin Console"
        subtitle={`Logged in as ${adminUser}`}
        rightIcon="logout"
        onRightPress={handleAdminLogout}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchStats();
              setRefreshing(false);
            }}
            tintColor={CreovatorColors.accentGold}
          />
        }
      >
        {/* Welcome Card */}
        <CreovatorCard style={styles.bannerCard}>
          <View style={styles.bannerRow}>
            <View style={styles.bannerTextWrap}>
              <View style={styles.adminBadge}>
                <MaterialCommunityIcons name="shield-crown" size={14} color={CreovatorColors.accentGold} />
                <Text style={styles.adminBadgeText}>SUPERUSER PRIVILEGES</Text>
              </View>
              <Text style={styles.bannerTitle}>Creovator Platform Overview</Text>
              <Text style={styles.bannerSub}>
                Real-time system telemetry across all registered organizers and platform events.
              </Text>
            </View>
          </View>
        </CreovatorCard>

        {/* 4 Core Metric Cards */}
        <Text style={styles.sectionLabel}>SYSTEM METRICS</Text>
        <View style={styles.statsGrid}>
          <CreovatorCard style={styles.statCard}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
              <MaterialCommunityIcons name="account-group" size={24} color={CreovatorColors.primaryLight} />
            </View>
            <Text style={styles.statNumber}>{stats.totalManagers}</Text>
            <Text style={styles.statLabel}>Event Organizers</Text>
          </CreovatorCard>

          <CreovatorCard style={styles.statCard}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(249, 187, 30, 0.15)' }]}>
              <MaterialCommunityIcons name="calendar-multiselect" size={24} color={CreovatorColors.accentGold} />
            </View>
            <Text style={styles.statNumber}>{stats.totalEvents}</Text>
            <Text style={styles.statLabel}>Total Events</Text>
          </CreovatorCard>

          <CreovatorCard style={styles.statCard}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(34, 211, 238, 0.15)' }]}>
              <MaterialCommunityIcons name="certificate" size={24} color={CreovatorColors.cyan} />
            </View>
            <Text style={styles.statNumber}>{stats.certificatesGenerated}</Text>
            <Text style={styles.statLabel}>Certificates</Text>
          </CreovatorCard>

          <CreovatorCard style={styles.statCard}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <MaterialCommunityIcons name="email-check" size={24} color={CreovatorColors.success} />
            </View>
            <Text style={styles.statNumber}>{stats.emailsSent}</Text>
            <Text style={styles.statLabel}>Emails Broadcast</Text>
          </CreovatorCard>
        </View>

        {/* Quick Management Navigation */}
        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>ADMINISTRATION MODULES</Text>
        <View style={styles.navStack}>
          <TouchableOpacity
            style={styles.navCard}
            onPress={() => router.push('/admin/organizers')}
          >
            <View style={[styles.navIconBox, { backgroundColor: 'rgba(99, 102, 241, 0.2)' }]}>
              <MaterialCommunityIcons name="account-cog" size={24} color={CreovatorColors.primaryLight} />
            </View>
            <View style={styles.navTextCol}>
              <Text style={styles.navTitle}>Organizers Management</Text>
              <Text style={styles.navSubtitle}>Inspect profiles, registration timestamps and organizer accounts</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={CreovatorColors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navCard}
            onPress={() => router.push('/admin/events')}
          >
            <View style={[styles.navIconBox, { backgroundColor: 'rgba(249, 187, 30, 0.2)' }]}>
              <MaterialCommunityIcons name="calendar-clock" size={24} color={CreovatorColors.accentGold} />
            </View>
            <View style={styles.navTextCol}>
              <Text style={styles.navTitle}>All Platform Events</Text>
              <Text style={styles.navSubtitle}>Browse events created across Tech, Wedding, Party & Custom categories</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={CreovatorColors.textMuted} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CreovatorColors.bgDark,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  bannerCard: {
    padding: 18,
    marginBottom: 20,
    backgroundColor: 'rgba(249, 187, 30, 0.08)',
    borderColor: 'rgba(249, 187, 30, 0.3)',
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerTextWrap: {
    flex: 1,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  adminBadgeText: {
    color: CreovatorColors.accentGold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  bannerTitle: {
    color: CreovatorColors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  bannerSub: {
    color: CreovatorColors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  sectionLabel: {
    color: CreovatorColors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    padding: 16,
    alignItems: 'flex-start',
    gap: 8,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statNumber: {
    color: CreovatorColors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
  },
  statLabel: {
    color: CreovatorColors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  navStack: {
    gap: 10,
  },
  navCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CreovatorColors.surfaceDark,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CreovatorColors.borderDark,
    padding: 16,
    gap: 14,
  },
  navIconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTextCol: {
    flex: 1,
  },
  navTitle: {
    color: CreovatorColors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  navSubtitle: {
    color: CreovatorColors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
});

