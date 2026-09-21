import { useResponsive } from '@/constants/useResponsive';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CreovatorCard } from '../../components/creovator/CreovatorCard';
import { CreovatorHeader } from '../../components/creovator/CreovatorHeader';
import { CreovatorColors } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

interface OrganizerProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
  location: string | null;
  created_at: string;
}

export default function AdminOrganizersScreen() {
  const router = useRouter();
  const r = useResponsive();
  const [organizers, setOrganizers] = useState<OrganizerProfile[]>([]);
  const [filtered, setFiltered] = useState<OrganizerProfile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOrganizers();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(organizers);
    } else {
      const q = search.toLowerCase();
      setFiltered(
        organizers.filter(
          o =>
            (o.full_name && o.full_name.toLowerCase().includes(q)) ||
            (o.phone && o.phone.toLowerCase().includes(q)) ||
            (o.location && o.location.toLowerCase().includes(q))
        )
      );
    }
  }, [search, organizers]);

  const fetchOrganizers = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-list', {
        body: { table: 'profiles' },
      });

      if (!error && data?.data) {
        setOrganizers(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const renderItem = ({ item }: { item: OrganizerProfile }) => {
    const initial = (item.full_name || 'U').charAt(0).toUpperCase();

    return (
      <CreovatorCard style={styles.card}>
        <View style={styles.avatarWrap}>
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{initial}</Text>
            </View>
          )}
        </View>

        <View style={styles.infoCol}>
          <Text style={styles.nameText}>{item.full_name || 'Unnamed Organizer'}</Text>
          {item.phone && (
            <View style={styles.metaRow}>
              <MaterialCommunityIcons name="phone-outline" size={13} color={CreovatorColors.textMuted} />
              <Text style={styles.metaText}>{item.phone}</Text>
            </View>
          )}
          {item.location && (
            <View style={styles.metaRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={13} color={CreovatorColors.textMuted} />
              <Text style={styles.metaText}>{item.location}</Text>
            </View>
          )}
          <Text style={styles.dateText}>
            Joined {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </Text>
        </View>
      </CreovatorCard>
    );
  };

  return (
    <View style={styles.container}>
      <CreovatorHeader
        title="Organizers Directory"
        subtitle={`${organizers.length} Total Users`}
        showBack
        onBackPress={() => router.back()}
      />

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <MaterialCommunityIcons name="magnify" size={20} color={CreovatorColors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, phone or location..."
          placeholderTextColor={CreovatorColors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={CreovatorColors.accentGold} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No organizers match your query.</Text>
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
                fetchOrganizers();
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
    marginVertical: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    color: CreovatorColors.textPrimary,
    fontSize: 14,
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
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: CreovatorColors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: CreovatorColors.borderDark,
  },
  avatarInitial: {
    color: CreovatorColors.accentGold,
    fontSize: 20,
    fontWeight: '700',
  },
  infoCol: {
    flex: 1,
  },
  nameText: {
    color: CreovatorColors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
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

