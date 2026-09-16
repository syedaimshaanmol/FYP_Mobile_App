import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { CreovatorTheme } from '@/constants/theme';
import { CreovatorHeader, CreovatorInput, CreovatorButton, CreovatorCard } from '@/components/creovator';

export interface EventItem {
  id: string;
  name: string;
  type: string;
  start_date: string;
  end_date: string;
  venue?: string;
  description?: string;
  participant_count?: number;
}

const CATEGORIES = [
  { key: 'all', label: 'All Events' },
  { key: 'tech', label: 'Tech' },
  { key: 'party', label: 'Party' },
  { key: 'wedding', label: 'Wedding' },
  { key: 'birthday', label: 'Birthday' },
  { key: 'others', label: 'Custom' },
];

export default function EventsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [activeCategory, setActiveCategory] = useState<string>((params.type as string) || 'all');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<EventItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (params.type) {
      setActiveCategory(params.type as string);
    }
  }, [params.type]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login-selection');
        return;
      }

      let query = supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (activeCategory !== 'all') {
        query = query.eq('type', activeCategory);
      }

      const { data: eventsData, error } = await query;
      if (error) throw error;

      if (eventsData) {
        // Fetch participant counts
        const eventIds = eventsData.map((e) => e.id);
        const countsMap: Record<string, number> = {};

        if (eventIds.length > 0) {
          const { data: participants } = await supabase
            .from('participants')
            .select('event_id')
            .in('event_id', eventIds);

          participants?.forEach((p) => {
            countsMap[p.event_id] = (countsMap[p.event_id] || 0) + 1;
          });
        }

        const formatted = eventsData.map((ev: any) => ({
          id: ev.id,
          name: ev.name,
          type: ev.type || 'others',
          start_date: ev.start_date,
          end_date: ev.end_date,
          venue: ev.venue || ev.day_venues?.[0] || 'Venue TBA',
          description: ev.description,
          participant_count: countsMap[ev.id] || 0,
        }));

        setEvents(formatted);
      }
    } catch (err: any) {
      console.error('Error fetching events:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadEvents();
    }, [activeCategory])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadEvents();
  };

  const confirmDelete = (event: EventItem) => {
    setEventToDelete(event);
    setDeleteModalVisible(true);
  };

  const handleDelete = async () => {
    if (!eventToDelete) return;
    setDeleting(true);

    try {
      // 1. Delete participants
      await supabase.from('participants').delete().eq('event_id', eventToDelete.id);
      // 2. Delete event_days
      await supabase.from('event_days').delete().eq('event_id', eventToDelete.id);
      // 3. Delete attendance
      await supabase.from('attendance').delete().eq('event_id', eventToDelete.id);
      // 4. Delete event
      const { error } = await supabase.from('events').delete().eq('id', eventToDelete.id);

      if (error) throw error;

      setDeleteModalVisible(false);
      setEventToDelete(null);
      loadEvents();
    } catch (err: any) {
      Alert.alert('Delete Failed', err.message || 'Could not delete event.');
    } finally {
      setDeleting(false);
    }
  };

  const filteredEvents = events.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    (e.venue && e.venue.toLowerCase().includes(search.toLowerCase()))
  );

  const renderEventItem = ({ item }: { item: EventItem }) => (
    <CreovatorCard
      style={styles.eventCard}
      onPress={() => router.push(/events/ as any)}
    >
      <View style={styles.cardTopRow}>
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>{(item.type || 'OTHERS').toUpperCase()}</Text>
        </View>

        <TouchableOpacity
          onPress={() => confirmDelete(item)}
          style={styles.deleteIconButton}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={18} color={CreovatorTheme.colors.textMuted} />
        </TouchableOpacity>
      </View>

      <Text style={styles.eventName}>{item.name}</Text>

      {item.description ? (
        <Text style={styles.eventDesc} numberOfLines={2}>{item.description}</Text>
      ) : null}

      <View style={styles.eventMetaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={14} color={CreovatorTheme.colors.primary} />
          <Text style={styles.metaText}>{item.start_date} → {item.end_date}</Text>
        </View>

        {item.venue ? (
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={14} color={CreovatorTheme.colors.secondary} />
            <Text style={styles.metaText} numberOfLines={1}>{item.venue}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.participantsBadge}>
          <Ionicons name="people" size={14} color={CreovatorTheme.colors.cyan} />
          <Text style={styles.participantsCountText}>{item.participant_count} Participants</Text>
        </View>

        <View style={styles.footerButtons}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push(`/events/${item.id}/participants` as any)}
          >
            <Ionicons name="list" size={14} color="#ffffff" />
            <Text style={styles.actionBtnText}>Participants</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnPrimary]}
            onPress={() => router.push(`/events/${item.id}` as any)}
          >
            <Text style={styles.actionBtnPrimaryText}>Workspace</Text>
            <Ionicons name="arrow-forward" size={14} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>
    </CreovatorCard>
  );

  return (
    <View style={styles.container}>
      <CreovatorHeader
        title="Events Manager"
        subtitle="Organize and manage your events pipeline"
        rightAction={
          <TouchableOpacity
            style={styles.headerAddBtn}
            onPress={() => router.push('/events/create')}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={22} color="#ffffff" />
          </TouchableOpacity>
        }
      />

      <View style={styles.searchSection}>
        <CreovatorInput
          placeholder="Search events or venues..."
          value={search}
          onChangeText={setSearch}
          leftIcon={<Ionicons name="search" size={18} color={CreovatorTheme.colors.textMuted} />}
          containerStyle={{ marginBottom: 10 }}
        />

        {/* Category Tabs */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.categoryTabsContainer}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryTab,
                activeCategory === item.key && styles.activeCategoryTab,
              ]}
              onPress={() => setActiveCategory(item.key)}
            >
              <Text
                style={[
                  styles.categoryTabText,
                  activeCategory === item.key && styles.activeCategoryTabText,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={CreovatorTheme.colors.primary} />
          <Text style={styles.loadingText}>Loading your events...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item.id}
          renderItem={renderEventItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={CreovatorTheme.colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={56} color={CreovatorTheme.colors.textDim} />
              <Text style={styles.emptyTitle}>No Events Found</Text>
              <Text style={styles.emptySubtitle}>
                {search ? 'No events matched your search query.' : 'Get started by creating your first event.'}
              </Text>
              <CreovatorButton
                title="Create an Event"
                onPress={() => router.push('/events/create')}
                icon={<Ionicons name="add" size={18} color="#ffffff" />}
                style={{ marginTop: 16 }}
              />
            </View>
          }
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconCircle}>
              <Ionicons name="alert" size={32} color={CreovatorTheme.colors.destructive} />
            </View>
            <Text style={styles.modalTitle}>Delete Event?</Text>
            <Text style={styles.modalSubtitle}>
              You are about to permanently delete:
            </Text>
            <Text style={styles.modalEventName}>"{eventToDelete?.name}"</Text>
            <Text style={styles.modalWarning}>
              ⚠️ All participants, custom lists, and check-in records will be permanently removed.
            </Text>

            <View style={styles.modalActions}>
              <CreovatorButton
                title="Cancel"
                variant="outline"
                onPress={() => setDeleteModalVisible(false)}
                style={{ flex: 1 }}
              />
              <CreovatorButton
                title={deleting ? 'Deleting...' : 'Delete'}
                variant="destructive"
                onPress={handleDelete}
                loading={deleting}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CreovatorTheme.colors.bgDark,
  },
  headerAddBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: CreovatorTheme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  categoryTabsContainer: {
    gap: 8,
    paddingBottom: 8,
  },
  categoryTab: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeCategoryTab: {
    backgroundColor: CreovatorTheme.colors.primary,
    borderColor: CreovatorTheme.colors.primary,
  },
  categoryTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: CreovatorTheme.colors.textMuted,
  },
  activeCategoryTabText: {
    color: '#ffffff',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: CreovatorTheme.colors.textMuted,
    fontSize: 14,
    marginTop: 10,
  },
  eventCard: {
    marginBottom: 14,
    padding: 18,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: {
    color: '#a5b4fc',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  deleteIconButton: {
    padding: 4,
  },
  eventName: {
    fontSize: 18,
    fontWeight: '800',
    color: CreovatorTheme.colors.textWhite,
    marginBottom: 4,
  },
  eventDesc: {
    fontSize: 12,
    color: CreovatorTheme.colors.textMuted,
    lineHeight: 16,
    marginBottom: 10,
  },
  eventMetaRow: {
    flexDirection: 'row',
    gap: 14,
    flexWrap: 'wrap',
    marginVertical: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 12,
    color: CreovatorTheme.colors.textLight,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: CreovatorTheme.colors.cardBorder,
  },
  participantsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  participantsCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: CreovatorTheme.colors.cyan,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  actionBtnPrimary: {
    backgroundColor: CreovatorTheme.colors.primary,
  },
  actionBtnPrimaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: CreovatorTheme.colors.textWhite,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 13,
    color: CreovatorTheme.colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: CreovatorTheme.colors.bgCard,
    borderWidth: 1,
    borderColor: CreovatorTheme.colors.cardBorder,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  modalIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: CreovatorTheme.colors.textWhite,
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    color: CreovatorTheme.colors.textMuted,
  },
  modalEventName: {
    fontSize: 16,
    fontWeight: '800',
    color: CreovatorTheme.colors.secondary,
    marginVertical: 6,
    textAlign: 'center',
  },
  modalWarning: {
    fontSize: 11,
    color: CreovatorTheme.colors.textDim,
    textAlign: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    padding: 10,
    borderRadius: 10,
    marginVertical: 14,
    lineHeight: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
});
