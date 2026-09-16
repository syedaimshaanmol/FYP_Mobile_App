import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CreovatorColors } from '../../constants/theme';
import { CreovatorHeader } from '../../components/creovator/CreovatorHeader';
import { CreovatorCard } from '../../components/creovator/CreovatorCard';
import { supabase } from '../../lib/supabase';

interface PlatformEvent {
  id: string;
  name: string;
  category: string;
  event_type: string;
  start_date: string;
  end_date: string;
  created_at: string;
  total_days?: number;
}

export default function AdminEventsScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<PlatformEvent[]>([]);
  const [filtered, setFiltered] = useState<PlatformEvent[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    let result = events;
    if (selectedCategory !== 'all') {
      result = result.filter(e => (e.category || '').toLowerCase() === selectedCategory.toLowerCase());
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        e =>
          (e.name && e.name.toLowerCase().includes(q)) ||
          (e.category && e.category.toLowerCase().includes(q))
      );
    }
    setFiltered(result);
  }, [search, selectedCategory, events]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-list', {
        body: { table: 'events' },
      });

      if (!error && data?.data) {
        setEvents(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch ((category || '').toLowerCase()) {
      case 'tech':
        return 'laptop';
      case 'wedding':
        return 'heart';
      case 'party':
        return 'party-popper';
      case 'birthday':
        return 'cake-variant';
      default:
        return 'calendar-star';
    }
  };

  const renderItem = ({ item }: { item: PlatformEvent }) => {
    const iconName = getCategoryIcon(item.category);

    return (
      <CreovatorCard style={styles.card}>
        <View style={styles.iconBox}>
          <MaterialCommunityIcons name={iconName as any} size={22} color={CreovatorColors.accentGold} />
        </View>

        <View style={styles.infoCol}>
          <View style={styles.titleRow}>
            <Text style={styles.eventName} numberOfLines={1}>{item.name}</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{item.category || 'General'}</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="clock-outline" size={13} color={CreovatorColors.textMuted} />
            <Text style={styles.metaText}>
              {new Date(item.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              {item.end_date ? ` - ${new Date(item.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
            </Text>
          </View>

          <Text style={styles.dateText}>
            Registered on {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </Text>
        </View>
      </CreovatorCard>
    );
  };

  return (
    <View style={styles.container}>
      <CreovatorHeader
        title="Platform Events"
        subtitle={`${events.length} Events on Creovator`}
        showBack
        onBackPress={() => router.back()}
      />

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <MaterialCommunityIcons name="magnify" size={20} color={CreovatorColors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by event title or category..."
          placeholderTextColor={CreovatorColors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter Chips */}
      <View style={styles.chipsRow}>
        {['all', 'tech', 'wedding', 'party', 'birthday', 'custom'].map(cat => {
          const isSelected = selectedCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, isSelected && styles.chipActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                {cat.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={CreovatorColors.accentGold} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No events match your criteria.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchEvents();
              }}
              tintColor={CreovatorColors.accentGold}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CreovatorColors.bgDark,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: CreovatorColors.surfaceDark,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CreovatorColors.borderDark,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    color: CreovatorColors.textPrimary,
    fontSize: 14,
  },
  chipsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: CreovatorColors.surfaceDark,
    borderWidth: 1,
    borderColor: CreovatorColors.borderDark,
  },
  chipActive: {
    backgroundColor: CreovatorColors.primaryDark,
    borderColor: CreovatorColors.accentGold,
  },
  chipText: {
    color: CreovatorColors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  chipTextActive: {
    color: CreovatorColors.accentGold,
  },
  listContent: {
    padding: 16,
    paddingTop: 4,
    paddingBottom: 32,
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 14,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(249, 187, 30, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  eventName: {
    color: CreovatorColors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  categoryBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryBadgeText: {
    color: CreovatorColors.primaryLight,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  metaText: {
    color: CreovatorColors.textSecondary,
    fontSize: 12,
  },
  dateText: {
    color: CreovatorColors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  emptyText: {
    color: CreovatorColors.textMuted,
    fontSize: 14,
  },
});

