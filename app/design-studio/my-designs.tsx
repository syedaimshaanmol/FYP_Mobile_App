import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CreovatorColors } from '../../constants/theme';
import { CreovatorHeader } from '../../components/creovator/CreovatorHeader';
import { CreovatorCard } from '../../components/creovator/CreovatorCard';
import { supabase } from '../../lib/supabase';

interface SavedDesign {
  id: string;
  name: string;
  category: string;
  template_id?: string;
  created_at: string;
  canvas_json?: any;
}

export default function MyDesignsScreen() {
  const router = useRouter();
  const [designs, setDesigns] = useState<SavedDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDesigns();
  }, []);

  const fetchDesigns = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setDesigns([]);
        return;
      }

      const { data, error } = await supabase
        .from('designs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setDesigns(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleOpenDesign = (design: SavedDesign) => {
    router.push({
      pathname: '/design-studio/editor',
      params: { design_id: design.id },
    });
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Design',
      'Are you sure you want to remove this saved design?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('designs').delete().eq('id', id);
            if (!error) {
              setDesigns(prev => prev.filter(d => d.id !== id));
            } else {
              Alert.alert('Error', error.message || 'Could not delete design.');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: SavedDesign }) => {
    const bg = item.canvas_json?.background || CreovatorColors.surfaceElevated;
    const objectCount = item.canvas_json?.objects?.length || 0;

    return (
      <CreovatorCard style={styles.card}>
        <TouchableOpacity
          style={styles.cardMain}
          activeOpacity={0.8}
          onPress={() => handleOpenDesign(item)}
        >
          {/* Mini Thumbnail */}
          <View style={[styles.thumb, { backgroundColor: bg }]}>
            <MaterialCommunityIcons name="palette" size={20} color={CreovatorColors.accentGold} />
          </View>

          <View style={styles.cardInfo}>
            <Text style={styles.designTitle} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.categoryBadge}>{item.category || 'General'}</Text>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.metaText}>{objectCount} element{objectCount !== 1 ? 's' : ''}</Text>
            </View>
            <Text style={styles.dateText}>
              {new Date(item.created_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Action Buttons */}
        <View style={styles.actionCol}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleOpenDesign(item)}
          >
            <MaterialCommunityIcons name="pencil-outline" size={18} color={CreovatorColors.primaryLight} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleDelete(item.id)}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={18} color={CreovatorColors.error} />
          </TouchableOpacity>
        </View>
      </CreovatorCard>
    );
  };

  return (
    <View style={styles.container}>
      <CreovatorHeader
        title="My Saved Designs"
        showBack
        onBackPress={() => router.back()}
        rightIcon="plus"
        onRightPress={() => router.push('/(tabs)/design')}
      />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={CreovatorColors.primary} />
        </View>
      ) : designs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <MaterialCommunityIcons name="folder-open-outline" size={36} color={CreovatorColors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No Saved Designs</Text>
          <Text style={styles.emptySubtitle}>
            Custom designs you create and save in the Design Studio will appear here for easy access and reuse.
          </Text>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => router.push('/(tabs)/design')}
          >
            <MaterialCommunityIcons name="compass-outline" size={18} color="#fff" />
            <Text style={styles.browseBtnText}>Browse Templates</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={designs}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchDesigns();
              }}
              tintColor={CreovatorColors.primary}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  card: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  thumb: {
    width: 54,
    height: 64,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: CreovatorColors.borderDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  designTitle: {
    color: CreovatorColors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  categoryBadge: {
    color: CreovatorColors.primaryLight,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  dot: {
    color: CreovatorColors.textMuted,
    fontSize: 10,
  },
  metaText: {
    color: CreovatorColors.textMuted,
    fontSize: 11,
  },
  dateText: {
    color: CreovatorColors.textMuted,
    fontSize: 11,
  },
  actionCol: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: CreovatorColors.surfaceDark,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: CreovatorColors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: CreovatorColors.borderDark,
  },
  emptyTitle: {
    color: CreovatorColors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: CreovatorColors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  browseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: CreovatorColors.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

