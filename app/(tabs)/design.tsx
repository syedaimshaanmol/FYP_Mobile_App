import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CreovatorColors } from '../../constants/theme';
import { CreovatorHeader } from '../../components/creovator/CreovatorHeader';
import { CreovatorCard } from '../../components/creovator/CreovatorCard';
import {
  designTemplates,
  categoryLabels,
  DesignCategory,
  DesignTemplate,
} from '../../constants/designTemplates';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 44) / 2;

const CATEGORIES: (DesignCategory | 'all')[] = [
  'all',
  'tech',
  'wedding',
  'party',
  'birthday',
  'others',
];

export default function DesignStudioTab() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<DesignCategory | 'all'>('all');

  const filtered =
    activeCategory === 'all'
      ? designTemplates
      : designTemplates.filter(t => t.category === activeCategory);

  const handleOpenEditor = (template: DesignTemplate) => {
    router.push({
      pathname: '/design-studio/editor',
      params: { template_id: template.id },
    });
  };

  return (
    <View style={styles.container}>
      <CreovatorHeader
        title="Design Studio"
        subtitle="Posters, Banners & Digital Invitations"
        rightIcon="folder-multiple-image"
        onRightPress={() => router.push('/design-studio/my-designs')}
      />

      {/* Category Pills */}
      <View style={styles.categoriesWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {CATEGORIES.map(cat => {
            const isSelected = cat === activeCategory;
            const label = cat === 'all' ? 'All Templates' : categoryLabels[cat] || cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                onPress={() => setActiveCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    isSelected && styles.categoryPillTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Banner Card */}
        <CreovatorCard style={styles.heroCard}>
          <View style={styles.heroRow}>
            <View style={styles.heroTextCol}>
              <Text style={styles.heroTitle}>Creative Event Assets</Text>
              <Text style={styles.heroSubtitle}>
                Select an editable template to customize text, typography, colors, and layout directly on mobile.
              </Text>
            </View>
            <View style={styles.heroIconBox}>
              <MaterialCommunityIcons name="palette-swatch" size={32} color={CreovatorColors.accentGold} />
            </View>
          </View>
        </CreovatorCard>

        {/* Template Grid */}
        <View style={styles.grid}>
          {filtered.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.templateCard}
              activeOpacity={0.85}
              onPress={() => handleOpenEditor(item)}
            >
              {/* Card Preview Box */}
              <View
                style={[
                  styles.previewBox,
                  { backgroundColor: item.json?.background || CreovatorColors.surfaceElevated },
                ]}
              >
                {/* Kind Badge */}
                <View style={styles.kindBadge}>
                  <Text style={styles.kindBadgeText}>{item.kind}</Text>
                </View>

                {/* Simulated Content Lines */}
                <View style={styles.previewContent}>
                  <View style={styles.previewLineTitle} />
                  <View style={styles.previewLineSub} />
                  <View style={styles.previewLineBody} />
                </View>

                {/* Customize overlay pill */}
                <View style={styles.editPill}>
                  <MaterialCommunityIcons name="pencil" size={12} color="#fff" />
                  <Text style={styles.editPillText}>Edit</Text>
                </View>
              </View>

              <View style={styles.cardDetails}>
                <Text style={styles.templateName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.templateCategory}>
                  {categoryLabels[item.category] || item.category}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {filtered.length === 0 && (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No templates found in this category.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CreovatorColors.bgDark,
  },
  categoriesWrapper: {
    backgroundColor: CreovatorColors.surfaceDark,
    borderBottomWidth: 1,
    borderBottomColor: CreovatorColors.borderDark,
    paddingVertical: 10,
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: CreovatorColors.surfaceElevated,
    borderWidth: 1,
    borderColor: CreovatorColors.borderDark,
  },
  categoryPillActive: {
    backgroundColor: CreovatorColors.primaryDark,
    borderColor: CreovatorColors.primary,
  },
  categoryPillText: {
    color: CreovatorColors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  categoryPillTextActive: {
    color: CreovatorColors.textPrimary,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    padding: 16,
    marginBottom: 20,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTextCol: {
    flex: 1,
    paddingRight: 12,
  },
  heroTitle: {
    color: CreovatorColors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  heroSubtitle: {
    color: CreovatorColors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  heroIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(249, 187, 30, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  templateCard: {
    width: CARD_WIDTH,
    backgroundColor: CreovatorColors.surfaceDark,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CreovatorColors.borderDark,
    overflow: 'hidden',
    marginBottom: 4,
  },
  previewBox: {
    height: 160,
    width: '100%',
    padding: 12,
    justifyContent: 'space-between',
    position: 'relative',
  },
  kindBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  kindBadgeText: {
    color: CreovatorColors.textPrimary,
    fontSize: 10,
    fontWeight: '700',
  },
  previewContent: {
    gap: 6,
    alignItems: 'center',
  },
  previewLineTitle: {
    width: '75%',
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  previewLineSub: {
    width: '50%',
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  previewLineBody: {
    width: '65%',
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  editPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-end',
    backgroundColor: CreovatorColors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  editPillText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  cardDetails: {
    padding: 12,
  },
  templateName: {
    color: CreovatorColors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  templateCategory: {
    color: CreovatorColors.textMuted,
    fontSize: 11,
    textTransform: 'capitalize',
  },
  emptyWrap: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: CreovatorColors.textMuted,
    fontSize: 14,
  },
});

