import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { CreovatorTheme } from '@/constants/theme';
import { CreovatorHeader, CreovatorCard, CreovatorButton } from '@/components/creovator';

interface EventTypeCount {
  type: string;
  count: number;
}

const organizerTips = [
  'Tip: Switch to Events view to see your upcoming event timeline.',
  'Pro Tip: You can now batch-export certificates directly from participant lists.',
  'Reminder: Check your Tech Events category for new participant registrations.',
  'Design Hint: AI-generated posters work best with clear event descriptions.',
  'Efficiency Tip: Use the QR Check-in scanner at your venue entrance for live attendance.',
];

const TYPE_COLORS: Record<string, string> = {
  tech: '#6366f1',
  party: '#f9bb1e',
  wedding: '#ec4899',
  birthday: '#f97316',
  others: '#22d3ee',
};

const TYPE_LABELS: Record<string, string> = {
  tech: 'Tech Events',
  party: 'Party',
  wedding: 'Wedding',
  birthday: 'Birthday',
  others: 'Custom Events',
};

export default function DashboardScreen() {
  const router = useRouter();

  const [userName, setUserName] = useState('Organizer');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [eventTypeDist, setEventTypeDist] = useState<EventTypeCount[]>([]);
  const [totalEvents, setTotalEvents] = useState(0);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [randomTip, setRandomTip] = useState(organizerTips[0]);

  const loadDashboardData = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        router.replace('/login-selection');
        return;
      }

      // Load Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single();

      const name = profileData?.full_name || user.user_metadata?.full_name || 'Organizer';
      setUserName(name);
      if (profileData?.avatar_url) setAvatarUrl(profileData.avatar_url);

      // Load Events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('id, type')
        .eq('user_id', user.id);

      if (!eventsError && eventsData) {
        setTotalEvents(eventsData.length);
        const counts: Record<string, number> = {};
        eventsData.forEach((ev: any) => {
          const t = (ev.type || 'others').toLowerCase();
          counts[t] = (counts[t] || 0) + 1;
        });
        setEventTypeDist(
          Object.entries(counts).map(([type, count]) => ({ type, count }))
        );

        // Count participants for user's events
        if (eventsData.length > 0) {
          const eventIds = eventsData.map((e) => e.id);
          const { count: pCount } = await supabase
            .from('participants')
            .select('*', { count: 'exact', head: true })
            .in('event_id', eventIds);

          setTotalParticipants(pCount || 0);
        } else {
          setTotalParticipants(0);
        }
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
      setRandomTip(organizerTips[Math.floor(Math.random() * organizerTips.length)]);
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  return (
    <View style={styles.container}>
      <CreovatorHeader
        showLogo
        rightAction={
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push('/(tabs)/profile')}
            activeOpacity={0.8}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>{userName.charAt(0).toUpperCase()}</Text>
              </View>
            )}
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={CreovatorTheme.colors.primary}
          />
        }
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeSubtitle}>WORKSPACE OVERVIEW</Text>
          <Text style={styles.welcomeTitle}>Hello, {userName} 👋</Text>
          <Text style={styles.welcomeDesc}>
            Your event management pipeline is live and synced.
          </Text>
        </View>

        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroGlow} />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>EVENT AUTOMATION HUB</Text>
          </View>
          <Text style={styles.heroTitle}>Revolutionize</Text>
          <Text style={styles.heroTitleGold}>Events.</Text>
          <Text style={styles.heroDesc}>
            The ultimate mobile workspace for smart event organization and automated asset generation.
          </Text>

          <View style={styles.heroActions}>
            <CreovatorButton
              title="Manage Events"
              onPress={() => router.push('/(tabs)/events')}
              icon={<Ionicons name="arrow-forward" size={18} color="#ffffff" />}
              size="md"
            />
            <CreovatorButton
              title="Create"
              variant="secondary"
              onPress={() => router.push('/events/create')}
              icon={<Ionicons name="add" size={20} color="#0f0a1f" />}
              size="md"
            />
          </View>
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.quickStatsRow}>
          <View style={[styles.statBox, { borderLeftColor: CreovatorTheme.colors.primary }]}>
            <Ionicons name="calendar" size={22} color={CreovatorTheme.colors.primary} />
            <Text style={styles.statNumber}>{loading ? '...' : totalEvents}</Text>
            <Text style={styles.statLabel}>Total Events</Text>
          </View>

          <View style={[styles.statBox, { borderLeftColor: CreovatorTheme.colors.secondary }]}>
            <Ionicons name="people" size={22} color={CreovatorTheme.colors.secondary} />
            <Text style={styles.statNumber}>{loading ? '...' : totalParticipants}</Text>
            <Text style={styles.statLabel}>Participants</Text>
          </View>

          <View style={[styles.statBox, { borderLeftColor: CreovatorTheme.colors.cyan }]}>
            <Ionicons name="qr-code" size={22} color={CreovatorTheme.colors.cyan} />
            <TouchableOpacity onPress={() => router.push('/qr/scan')}>
              <Text style={[styles.statNumber, { fontSize: 16, marginTop: 4, color: CreovatorTheme.colors.cyan }]}>
                Scanner
              </Text>
            </TouchableOpacity>
            <Text style={styles.statLabel}>Check-in Tool</Text>
          </View>
        </View>

        {/* Event Distribution Card */}
        <CreovatorCard style={styles.distCard}>
          <View style={styles.cardHeader}>
            <View style={styles.headerIconCircle}>
              <Ionicons name="pie-chart" size={18} color={CreovatorTheme.colors.primary} />
            </View>
            <Text style={styles.cardHeaderTitle}>EVENT DISTRIBUTION</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color={CreovatorTheme.colors.primary} style={{ marginVertical: 20 }} />
          ) : eventTypeDist.length === 0 ? (
            <View style={styles.emptyDist}>
              <Text style={styles.emptyDistText}>No events created yet.</Text>
              <Text style={styles.emptyDistSub}>Tap below to create your first event!</Text>
            </View>
          ) : (
            <View style={styles.distContent}>
              <View style={styles.donutCircle}>
                <Text style={styles.donutNumber}>{totalEvents}</Text>
                <Text style={styles.donutSub}>EVENTS</Text>
              </View>

              <View style={styles.distList}>
                {eventTypeDist.map((item) => (
                  <View key={item.type} style={styles.distRow}>
                    <View
                      style={[
                        styles.colorDot,
                        { backgroundColor: TYPE_COLORS[item.type] || CreovatorTheme.colors.primary },
                      ]}
                    />
                    <Text style={styles.distLabel}>{TYPE_LABELS[item.type] || item.type}</Text>
                    <Text style={styles.distCount}>{item.count}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </CreovatorCard>

        {/* Organizer Tip */}
        <View style={styles.tipCard}>
          <Ionicons name="bulb-outline" size={20} color={CreovatorTheme.colors.secondary} style={styles.tipIcon} />
          <Text style={styles.tipText}>"{randomTip}"</Text>
        </View>

        {/* Categories Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>CATEGORIES</Text>
          <Text style={styles.sectionSub}>Select a category to manage your events & participants</Text>
        </View>

        <TouchableOpacity
          style={[styles.categoryCard, { borderLeftColor: CreovatorTheme.colors.primary }]}
          onPress={() => router.push('/(tabs)/events?type=tech')}
          activeOpacity={0.8}
        >
          <View style={[styles.catIconCircle, { backgroundColor: 'rgba(99, 102, 241, 0.2)' }]}>
            <Ionicons name="laptop-outline" size={26} color={CreovatorTheme.colors.primary} />
          </View>
          <View style={styles.catInfo}>
            <Text style={styles.catTitle}>Tech Events</Text>
            <Text style={styles.catDesc}>
              Hackathons, conferences, seminars with exhibitors, judges & volunteers.
            </Text>
            <Text style={[styles.catAction, { color: CreovatorTheme.colors.primary }]}>
              OPEN CATEGORY →
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.categoryCard, { borderLeftColor: CreovatorTheme.colors.secondary }]}
          onPress={() => router.push('/(tabs)/events?type=party')}
          activeOpacity={0.8}
        >
          <View style={[styles.catIconCircle, { backgroundColor: 'rgba(249, 187, 30, 0.2)' }]}>
            <Ionicons name="sparkles-outline" size={26} color={CreovatorTheme.colors.secondary} />
          </View>
          <View style={styles.catInfo}>
            <Text style={styles.catTitle}>Party / Wedding / Birthday</Text>
            <Text style={styles.catDesc}>
              Manage guest lists, RSVP, and send customized invitation cards.
            </Text>
            <Text style={[styles.catAction, { color: CreovatorTheme.colors.secondary }]}>
              OPEN CATEGORY →
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.categoryCard, { borderLeftColor: CreovatorTheme.colors.cyan }]}
          onPress={() => router.push('/(tabs)/events?type=others')}
          activeOpacity={0.8}
        >
          <View style={[styles.catIconCircle, { backgroundColor: 'rgba(34, 211, 238, 0.2)' }]}>
            <Ionicons name="color-palette-outline" size={26} color={CreovatorTheme.colors.cyan} />
          </View>
          <View style={styles.catInfo}>
            <Text style={styles.catTitle}>Custom Events</Text>
            <Text style={styles.catDesc}>
              Create your own custom event type with completely custom participant lists.
            </Text>
            <Text style={[styles.catAction, { color: CreovatorTheme.colors.cyan }]}>
              OPEN CATEGORY →
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CreovatorTheme.colors.bgDark,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: CreovatorTheme.colors.primary,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: CreovatorTheme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16,
  },
  welcomeSection: {
    marginVertical: 12,
  },
  welcomeSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: CreovatorTheme.colors.primary,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: CreovatorTheme.colors.textWhite,
  },
  welcomeDesc: {
    fontSize: 13,
    color: CreovatorTheme.colors.textMuted,
    marginTop: 4,
  },
  heroCard: {
    backgroundColor: CreovatorTheme.colors.bgCard,
    borderWidth: 1,
    borderColor: CreovatorTheme.colors.cardBorder,
    borderRadius: 26,
    padding: 24,
    marginVertical: 14,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 14,
  },
  badgeText: {
    color: '#a5b4fc',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: CreovatorTheme.colors.textWhite,
    lineHeight: 36,
  },
  heroTitleGold: {
    fontSize: 38,
    fontWeight: '900',
    color: CreovatorTheme.colors.secondary,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  heroDesc: {
    fontSize: 13,
    color: CreovatorTheme.colors.textMuted,
    lineHeight: 19,
    marginBottom: 20,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: CreovatorTheme.colors.bgCard,
    borderWidth: 1,
    borderColor: CreovatorTheme.colors.cardBorder,
    borderLeftWidth: 4,
    borderRadius: 18,
    padding: 14,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: CreovatorTheme.colors.textWhite,
    marginTop: 6,
  },
  statLabel: {
    fontSize: 11,
    color: CreovatorTheme.colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  distCard: {
    marginVertical: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cardHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: CreovatorTheme.colors.textWhite,
    letterSpacing: 1,
  },
  emptyDist: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  emptyDistText: {
    color: CreovatorTheme.colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  emptyDistSub: {
    color: CreovatorTheme.colors.textDim,
    fontSize: 12,
    marginTop: 4,
  },
  distContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  donutCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 10,
    borderColor: CreovatorTheme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  donutNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: CreovatorTheme.colors.textWhite,
  },
  donutSub: {
    fontSize: 8,
    fontWeight: '800',
    color: CreovatorTheme.colors.textMuted,
  },
  distList: {
    flex: 1,
    marginLeft: 20,
    gap: 8,
  },
  distRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  distLabel: {
    flex: 1,
    fontSize: 12,
    color: CreovatorTheme.colors.textLight,
  },
  distCount: {
    fontSize: 12,
    fontWeight: '800',
    color: CreovatorTheme.colors.textMuted,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: CreovatorTheme.colors.cardBorder,
    borderRadius: 18,
    padding: 14,
    marginVertical: 10,
  },
  tipIcon: {
    marginRight: 10,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: CreovatorTheme.colors.textMuted,
    fontStyle: 'italic',
    lineHeight: 17,
  },
  sectionHeader: {
    marginTop: 18,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: CreovatorTheme.colors.textWhite,
    letterSpacing: 1.5,
  },
  sectionSub: {
    fontSize: 12,
    color: CreovatorTheme.colors.textMuted,
    marginTop: 2,
  },
  categoryCard: {
    flexDirection: 'row',
    backgroundColor: CreovatorTheme.colors.bgCard,
    borderWidth: 1,
    borderColor: CreovatorTheme.colors.cardBorder,
    borderLeftWidth: 4,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  catIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  catInfo: {
    flex: 1,
  },
  catTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: CreovatorTheme.colors.textWhite,
    marginBottom: 4,
  },
  catDesc: {
    fontSize: 12,
    color: CreovatorTheme.colors.textMuted,
    lineHeight: 16,
    marginBottom: 8,
  },
  catAction: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
