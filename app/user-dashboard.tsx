import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

type EventType = {
  type: string;
  count: number;
};

const eventCategories = [
  {
    key: 'tech',
    title: 'Tech Events',
    description:
      'Hackathons, conferences, summits with exhibitors, judges & volunteers.',
    icon: '💻',
  },
  {
    key: 'party',
    title: 'Party / Wedding / Birthday',
    description:
      'Manage guest lists and send beautiful invitation cards.',
    icon: '🎉',
  },
  {
    key: 'others',
    title: 'Custom Events',
    description:
      'Create your own event type with fully customizable participant lists.',
    icon: '✨',
  },
];

const tips = [
  'Tip: Switch to Calendar view to see your upcoming event timeline.',
  'Pro Tip: You can now batch-export certificates directly from the Design Queue.',
  "Reminder: Check your 'Tech Events' category for new participant registrations.",
  'Design Hint: AI-generated posters work best with high-resolution event logos.',
  "Efficiency Tip: Use the 'My Events' tab to quickly duplicate previous event settings.",
];

const TYPE_LABELS: Record<string, string> = {
  tech: 'Tech',
  party: 'Party',
  wedding: 'Wedding',
  birthday: 'Birthday',
  others: 'Others',
};

function DonutChart({
  data,
}: {
  data: EventType[];
}) {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <View style={styles.chartContainer}>
      <View style={styles.donut}>
        <Text style={styles.donutNumber}>{total}</Text>
        <Text style={styles.donutLabel}>EVENTS</Text>
      </View>

      <View style={styles.legend}>
        {data.length === 0 ? (
          <Text style={styles.noEvents}>
            No events yet
          </Text>
        ) : (
          data.map((item) => (
            <View
              key={item.type}
              style={styles.legendRow}
            >
              <View style={styles.legendDot} />

              <Text style={styles.legendText}>
                {TYPE_LABELS[item.type] || item.type}
              </Text>

              <Text style={styles.legendCount}>
                {item.count}
              </Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

export default function UserDashboard() {
  const [userName, setUserName] = useState('Organizer');
  const [eventTypeDist, setEventTypeDist] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [randomTip, setRandomTip] = useState('');

  useEffect(() => {
    loadDashboard();
    setRandomTip(
      tips[Math.floor(Math.random() * tips.length)]
    );
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        Alert.alert(
          'Session expired',
          'Please login again.',
          [
            {
              text: 'OK',
              onPress: () =>
                router.replace('/user-login'),
            },
          ]
        );

        return;
      }

      /*
       * Get user's profile
       */
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single();

      const name =
        profileData?.full_name ||
        user.user_metadata?.full_name ||
        'Organizer';

      setUserName(name);

      /*
       * Get user's events
       */
      const {
        data: eventsData,
        error: eventsError,
      } = await supabase
        .from('events')
        .select('type')
        .eq('user_id', user.id);

      if (!eventsError && eventsData) {
        const counts: Record<string, number> = {};

        eventsData.forEach((event: any) => {
          const type = (
            event.type || 'others'
          ).toLowerCase();

          counts[type] =
            (counts[type] || 0) + 1;
        });

        setEventTypeDist(
          Object.entries(counts).map(
            ([type, count]) => ({
              type,
              count,
            })
          )
        );
      }
    } catch (error) {
      console.log(
        'Dashboard Error:',
        error
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();

    router.replace('/user-login');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        {/* HEADER */}

        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>
              CreoVator
            </Text>

            <Text style={styles.headerSubtitle}>
              Event Automation Hub
            </Text>
          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutText}>
              Logout
            </Text>
          </TouchableOpacity>
        </View>

        {/* WELCOME */}

        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>
            Hello, {userName} 👋
          </Text>

          <Text style={styles.welcomeText}>
            Your event management pipeline is
            live and synced.
          </Text>
        </View>

        {/* HERO */}

        <View style={styles.hero}>
          <View style={styles.heroContent}>
            <Text style={styles.heroBadge}>
              EVENT AUTOMATION HUB
            </Text>

            <Text style={styles.heroTitle}>
              Revolutionize
            </Text>

            <Text style={styles.heroTitleYellow}>
              Events.
            </Text>

            <Text style={styles.heroDescription}>
              The ultimate workspace for smart
              event organization and automated
              asset generation.
            </Text>

            <TouchableOpacity
              style={styles.openDashboardButton}
              onPress={() =>
                router.push('/dashboard/manage')
              }
            >
              <Text
                style={
                  styles.openDashboardText
                }
              >
                OPEN DASHBOARD →
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* STATS */}

        <View style={styles.statsGrid}>

          {/* EVENT DISTRIBUTION */}

          <TouchableOpacity
            style={styles.statCard}
            onPress={() =>
              router.push('/dashboard/manage')
            }
          >
            <Text style={styles.statTitle}>
              EVENT DISTRIBUTION
            </Text>

            {loading ? (
              <ActivityIndicator
                size="large"
                color="#6366f1"
                style={styles.loader}
              />
            ) : (
              <DonutChart
                data={eventTypeDist}
              />
            )}
          </TouchableOpacity>

          {/* SMART FEATURES */}

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>
              ✨
            </Text>

            <Text style={styles.statTitle}>
              SMART FEATURES
            </Text>

            <Text style={styles.statDescription}>
              New tools and enhancements are
              on the way!
            </Text>
          </View>

          {/* SYSTEM READY */}

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>
              ✓
            </Text>

            <Text style={styles.statTitle}>
              SYSTEM READY
            </Text>

            <Text style={styles.statDescription}>
              All design modules are online
              and synced.
            </Text>
          </View>

        </View>

        {/* TIP */}

        <View style={styles.tipBox}>
          <Text style={styles.tipIcon}>
            ✨
          </Text>

          <Text style={styles.tipText}>
            "{randomTip}"
          </Text>
        </View>

        {/* CATEGORIES */}

        <View style={styles.categoriesSection}>

          <Text style={styles.categoriesTitle}>
            CATEGORIES
          </Text>

          <Text style={styles.categoriesSubtitle}>
            Select a category to start
            managing participants.
          </Text>

          {eventCategories.map(
            (category) => (
              <TouchableOpacity
                key={category.key}
                style={styles.categoryCard}
                onPress={() =>
                  router.push(
                    `/dashboard/manage?type=${category.key}`
                  )
                }
              >
                <View
                  style={styles.categoryIcon}
                >
                  <Text style={styles.iconText}>
                    {category.icon}
                  </Text>
                </View>

                <View
                  style={styles.categoryContent}
                >
                  <Text
                    style={
                      styles.categoryTitle
                    }
                  >
                    {category.title}
                  </Text>

                  <Text
                    style={
                      styles.categoryDescription
                    }
                  >
                    {category.description}
                  </Text>

                  <Text
                    style={styles.manageText}
                  >
                    MANAGE NOW →
                  </Text>
                </View>
              </TouchableOpacity>
            )
          )}

        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#160d33',
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 50,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },

  logo: {
    color: '#ffffff',
    fontSize: 25,
    fontWeight: '900',
  },

  headerSubtitle: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 3,
  },

  logoutButton: {
    backgroundColor: '#ffffff12',
    borderWidth: 1,
    borderColor: '#ffffff20',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },

  logoutText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },

  welcomeSection: {
    marginBottom: 25,
  },

  welcomeTitle: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '900',
  },

  welcomeText: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 8,
  },

  hero: {
    minHeight: 400,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: '#21124b',
    borderWidth: 1,
    borderColor: '#ffffff15',
    marginBottom: 20,
  },

  heroContent: {
    flex: 1,
    justifyContent: 'center',
    padding: 28,
  },

  heroBadge: {
    color: '#a78bfa',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 20,
  },

  heroTitle: {
    color: '#ffffff',
    fontSize: 43,
    fontWeight: '900',
    lineHeight: 48,
  },

  heroTitleYellow: {
    color: '#f9bb1e',
    fontSize: 55,
    fontWeight: '900',
    fontStyle: 'italic',
    marginBottom: 20,
  },

  heroDescription: {
    color: '#d1d5db',
    fontSize: 15,
    lineHeight: 23,
    maxWidth: 340,
    marginBottom: 30,
  },

  openDashboardButton: {
    backgroundColor: '#6366f1',
    alignSelf: 'flex-start',
    paddingHorizontal: 22,
    paddingVertical: 15,
    borderRadius: 15,
  },

  openDashboardText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },

  statsGrid: {
    gap: 15,
    marginBottom: 20,
  },

  statCard: {
    backgroundColor: '#ffffff0d',
    borderWidth: 1,
    borderColor: '#ffffff12',
    borderRadius: 25,
    padding: 20,
    minHeight: 150,
  },

  statTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 12,
  },

  statIcon: {
    fontSize: 28,
    marginBottom: 10,
  },

  statDescription: {
    color: '#9ca3af',
    fontSize: 12,
    lineHeight: 18,
  },

  loader: {
    marginTop: 20,
  },

  chartContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },

  donut: {
    width: 105,
    height: 105,
    borderRadius: 55,
    borderWidth: 15,
    borderColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },

  donutNumber: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
  },

  donutLabel: {
    color: '#9ca3af',
    fontSize: 8,
    fontWeight: '900',
  },

  legend: {
    marginLeft: 20,
    flex: 1,
  },

  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366f1',
    marginRight: 8,
  },

  legendText: {
    color: '#d1d5db',
    fontSize: 11,
    flex: 1,
  },

  legendCount: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '800',
  },

  noEvents: {
    color: '#6b7280',
    fontSize: 12,
  },

  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff0d',
    borderWidth: 1,
    borderColor: '#ffffff12',
    borderRadius: 20,
    padding: 16,
    marginBottom: 40,
  },

  tipIcon: {
    fontSize: 16,
    marginRight: 10,
  },

  tipText: {
    color: '#9ca3af',
    fontSize: 11,
    fontStyle: 'italic',
    flex: 1,
    lineHeight: 17,
  },

  categoriesSection: {
    marginBottom: 20,
  },

  categoriesTitle: {
    color: '#ffffff',
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: 2,
  },

  categoriesSubtitle: {
    color: '#9ca3af',
    fontSize: 13,
    marginTop: 7,
    marginBottom: 20,
  },

  categoryCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff0d',
    borderWidth: 1,
    borderColor: '#ffffff12',
    borderRadius: 25,
    padding: 20,
    marginBottom: 15,
  },

  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#21124b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },

  iconText: {
    fontSize: 28,
  },

  categoryContent: {
    flex: 1,
  },

  categoryTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 7,
  },

  categoryDescription: {
    color: '#9ca3af',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10,
  },

  manageText: {
    color: '#818cf8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
});