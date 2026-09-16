import React, { useState, useEffect, useCallback } from 'react';
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
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { CreovatorTheme } from '@/constants/theme';
import { CreovatorHeader, CreovatorCard } from '@/components/creovator';

interface EventDetail {
  id: string;
  name: string;
  type: string;
  start_date: string;
  end_date: string;
  venue?: string;
  description?: string;
}

interface WorkspaceStats {
  participants: number;
  certificates: number;
  checkedIn: number;
}

export default function EventWorkspaceScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const eventId = id as string;

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [stats, setStats] = useState<WorkspaceStats>({ participants: 0, certificates: 0, checkedIn: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadWorkspace = async () => {
    if (!eventId) return;

    try {
      setLoading(true);

      // 1. Fetch Event
      const { data: eventData, error: eventErr } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventErr || !eventData) {
        Alert.alert('Not Found', 'Event not found.');
        router.back();
        return;
      }

      setEvent(eventData);

      // 2. Fetch Stats
      const [
        { count: participantsCount },
        { count: certificatesCount },
        { count: checkedInCount },
      ] = await Promise.all([
        supabase.from('participants').select('*', { count: 'exact', head: true }).eq('event_id', eventId),
        supabase.from('certificates').select('*', { count: 'exact', head: true }).eq('event_id', eventId),
        supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('event_id', eventId),
      ]);

      setStats({
        participants: participantsCount || 0,
        certificates: certificatesCount || 0,
        checkedIn: checkedInCount || 0,
      });
    } catch (err: any) {
      console.error('Error loading workspace:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadWorkspace();
    }, [eventId])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadWorkspace();
  };

  const modules = [
    {
      title: 'Participants & Lists',
      description: 'Manage guest lists, categories, import/export data and CRUD.',
      icon: 'people-outline',
      accent: CreovatorTheme.colors.primary,
      onPress: () => router.push(`/events/${id}/participants` as any),
    },
    {
      title: 'Certificates Generator',
      description: 'Award participation and achievement certificates to attendee lists.',
      icon: 'ribbon-outline',
      accent: CreovatorTheme.colors.secondary,
      onPress: () => router.push(`/certificates?event_id=${id}` as any),
    },
    {
      title: 'ID Cards & Badges',
      description: 'Generate customizable participant badges with live verification QR codes.',
      icon: 'card-outline',
      accent: CreovatorTheme.colors.cyan,
      onPress: () => router.push(`/id-cards?event_id=${id}` as any),
    },
    {
      title: 'Live QR Check-in',
      description: 'Scan participant QR codes at the entrance to record attendance live.',
      icon: 'qr-code-outline',
      accent: CreovatorTheme.colors.success,
      onPress: () => router.push(`/qr/scan?event_id=${id}` as any),
    },
    {
      title: 'Email Automation',
      description: 'Send personalized notifications, invitations, and updates in bulk.',
      icon: 'mail-outline',
      accent: CreovatorTheme.colors.fuchsia,
      onPress: () => router.push(`/emails?event_id=${id}` as any),
    },
    {
      title: 'AI Content Studio',
      description: 'Generate invitations, speaker letters & agendas with Gemini AI.',
      icon: 'sparkles-outline',
      accent: '#a855f7',
      onPress: () => router.push('/(tabs)/ai'),
    },
  ];

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={CreovatorTheme.colors.primary} />
        <Text style={styles.loadingText}>Opening event workspace...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CreovatorHeader
        title={event?.name || 'Event Workspace'}
        subtitle={(event?.type || 'Event').toUpperCase()}
        showBack
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
        {/* Event Header Banner */}
        <View style={styles.eventBanner}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{(event?.type || 'EVENT').toUpperCase()}</Text>
          </View>
          <Text style={styles.bannerTitle}>{event?.name}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar" size={14} color={CreovatorTheme.colors.primary} />
              <Text style={styles.metaText}>{event?.start_date} → {event?.end_date}</Text>
            </View>

            {event?.venue ? (
              <View style={styles.metaItem}>
                <Ionicons name="location" size={14} color={CreovatorTheme.colors.secondary} />
                <Text style={styles.metaText} numberOfLines={1}>{event.venue}</Text>
              </View>
            ) : null}
          </View>

          {event?.description ? (
            <Text style={styles.bannerDesc}>{event.description}</Text>
          ) : null}
        </View>

        {/* Stats Row */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { borderLeftColor: CreovatorTheme.colors.primary }]}>
            <Ionicons name="people" size={22} color={CreovatorTheme.colors.primary} />
            <Text style={styles.statVal}>{stats.participants}</Text>
            <Text style={styles.statLabel}>Participants</Text>
          </View>

          <View style={[styles.statCard, { borderLeftColor: CreovatorTheme.colors.secondary }]}>
            <Ionicons name="ribbon" size={22} color={CreovatorTheme.colors.secondary} />
            <Text style={styles.statVal}>{stats.certificates}</Text>
            <Text style={styles.statLabel}>Certificates</Text>
          </View>

          <View style={[styles.statCard, { borderLeftColor: CreovatorTheme.colors.success }]}>
            <Ionicons name="checkmark-circle" size={22} color={CreovatorTheme.colors.success} />
            <Text style={styles.statVal}>{stats.checkedIn}</Text>
            <Text style={styles.statLabel}>Checked In</Text>
          </View>
        </View>

        {/* Workspace Tools Heading */}
        <View style={styles.toolsHeader}>
          <Text style={styles.toolsTitle}>WORKSPACE MODULES</Text>
          <Text style={styles.toolsSubtitle}>Direct tools integrated for this event</Text>
        </View>

        {/* Modules List */}
        <View style={styles.modulesGrid}>
          {modules.map((mod, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.moduleCard, { borderLeftColor: mod.accent }]}
              onPress={mod.onPress}
              activeOpacity={0.8}
            >
              <View style={[styles.moduleIconCircle, { backgroundColor: `${mod.accent}20` }]}>
                <Ionicons name={mod.icon as any} size={26} color={mod.accent} />
              </View>
              <View style={styles.moduleTextContainer}>
                <View style={styles.moduleTitleRow}>
                  <Text style={styles.moduleTitle}>{mod.title}</Text>
                  <Ionicons name="chevron-forward" size={18} color={CreovatorTheme.colors.textMuted} />
                </View>
                <Text style={styles.moduleDesc}>{mod.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CreovatorTheme.colors.bgDark,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: CreovatorTheme.colors.bgDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: CreovatorTheme.colors.textMuted,
    fontSize: 14,
    marginTop: 10,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  eventBanner: {
    backgroundColor: CreovatorTheme.colors.bgCard,
    borderWidth: 1,
    borderColor: CreovatorTheme.colors.cardBorder,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
  },
  typeBadgeText: {
    color: '#a5b4fc',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: CreovatorTheme.colors.textWhite,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 14,
    flexWrap: 'wrap',
    marginVertical: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: CreovatorTheme.colors.textLight,
  },
  bannerDesc: {
    fontSize: 12,
    color: CreovatorTheme.colors.textMuted,
    lineHeight: 18,
    marginTop: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: CreovatorTheme.colors.bgCard,
    borderWidth: 1,
    borderColor: CreovatorTheme.colors.cardBorder,
    borderLeftWidth: 4,
    borderRadius: 18,
    padding: 14,
  },
  statVal: {
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
  toolsHeader: {
    marginBottom: 12,
  },
  toolsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: CreovatorTheme.colors.textWhite,
    letterSpacing: 1.2,
  },
  toolsSubtitle: {
    fontSize: 12,
    color: CreovatorTheme.colors.textMuted,
    marginTop: 2,
  },
  modulesGrid: {
    gap: 12,
  },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CreovatorTheme.colors.bgCard,
    borderWidth: 1,
    borderColor: CreovatorTheme.colors.cardBorder,
    borderLeftWidth: 4,
    borderRadius: 20,
    padding: 16,
  },
  moduleIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  moduleTextContainer: {
    flex: 1,
  },
  moduleTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: CreovatorTheme.colors.textWhite,
  },
  moduleDesc: {
    fontSize: 12,
    color: CreovatorTheme.colors.textMuted,
    lineHeight: 16,
  },
});