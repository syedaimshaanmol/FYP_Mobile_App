import { CreovatorButton, CreovatorHeader, CreovatorInput } from '@/components/creovator';
import { CreovatorTheme } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useResponsive } from '@/constants/useResponsive';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const CATEGORIES = [
  { key: 'tech', label: 'Tech Event', icon: 'laptop-outline' },
  { key: 'party', label: 'Party', icon: 'sparkles-outline' },
  { key: 'wedding', label: 'Wedding', icon: 'heart-outline' },
  { key: 'birthday', label: 'Birthday', icon: 'gift-outline' },
  { key: 'others', label: 'Custom', icon: 'color-palette-outline' },
];

export default function CreateEventScreen() {
  const router = useRouter();
  const r = useResponsive();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('tech');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [venue, setVenue] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Event name is required';
    if (!startDate.trim()) errs.startDate = 'Start date is required (YYYY-MM-DD)';
    if (!endDate.trim()) errs.endDate = 'End date is required (YYYY-MM-DD)';
    if (startDate > endDate) errs.endDate = 'End date cannot be before start date';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Session Expired', 'Please login again.');
        router.replace('/login-selection');
        return;
      }

      // Calculate days difference
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      // 1. Insert event
      const { data: eventRow, error: eventError } = await supabase
        .from('events')
        .insert([{
          name: name.trim(),
          type: category,
          start_date: startDate,
          end_date: endDate,
          venue: venue.trim() || 'Venue TBA',
          description: description.trim() || null,
          user_id: user.id,
        }])
        .select()
        .single();

      if (eventError) throw eventError;

      // 2. Initialize event_days
      const defaultLists = category === 'tech'
        ? ['Exhibitors', 'Judges', 'Volunteers', 'Visitors']
        : ['Guest List'];

      const dayRows = [];
      for (let i = 1; i <= (totalDays > 0 ? totalDays : 1); i++) {
        dayRows.push({
          event_id: eventRow.id,
          day_number: i,
          custom_lists: defaultLists,
        });
      }

      await supabase.from('event_days').insert(dayRows);

      Alert.alert('Event Created! 🎉', `"${name.trim()}" has been successfully created.`, [
        {
          text: 'Open Workspace',
          onPress: () => router.replace(`/events/${eventRow.id}` as any),
        },
      ]);
    } catch (err: any) {
      Alert.alert('Creation Failed', err.message || 'Could not create event.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <CreovatorHeader
        title="Create New Event"
        subtitle="Define event details and structure"
        showBack
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Event Category</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.key}
                style={[
                  styles.categoryOption,
                  category === cat.key && styles.activeCategoryOption,
                ]}
                onPress={() => setCategory(cat.key)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={20}
                  color={category === cat.key ? '#ffffff' : CreovatorTheme.colors.textMuted}
                />
                <Text
                  style={[
                    styles.categoryOptionText,
                    category === cat.key && styles.activeCategoryOptionText,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <CreovatorInput
            label="Event Title *"
            placeholder="e.g. AI & Robotics Summit 2026"
            value={name}
            onChangeText={(text) => {
              setName(text);
              setErrors((e) => ({ ...e, name: '' }));
            }}
            error={errors.name}
            leftIcon={<Ionicons name="flag-outline" size={18} color={CreovatorTheme.colors.textMuted} />}
          />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <CreovatorInput
                label="Start Date *"
                placeholder="YYYY-MM-DD"
                value={startDate}
                onChangeText={(text) => {
                  setStartDate(text);
                  setErrors((e) => ({ ...e, startDate: '' }));
                }}
                error={errors.startDate}
                leftIcon={<Ionicons name="calendar-outline" size={16} color={CreovatorTheme.colors.textMuted} />}
              />
            </View>

            <View style={{ width: 12 }} />

            <View style={{ flex: 1 }}>
              <CreovatorInput
                label="End Date *"
                placeholder="YYYY-MM-DD"
                value={endDate}
                onChangeText={(text) => {
                  setEndDate(text);
                  setErrors((e) => ({ ...e, endDate: '' }));
                }}
                error={errors.endDate}
                leftIcon={<Ionicons name="calendar-outline" size={16} color={CreovatorTheme.colors.textMuted} />}
              />
            </View>
          </View>

          <CreovatorInput
            label="Venue / Location"
            placeholder="e.g. Main Auditorium, City Center"
            value={venue}
            onChangeText={setVenue}
            leftIcon={<Ionicons name="location-outline" size={18} color={CreovatorTheme.colors.textMuted} />}
          />

          <CreovatorInput
            label="Event Description (Optional)"
            placeholder="Short summary about agenda, goals, or topics covered..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            style={{ height: 80, textAlignVertical: 'top' }}
          />

          <CreovatorButton
            title="Create & Launch Event"
            onPress={handleCreate}
            loading={submitting}
            size="lg"
            style={{ marginTop: 10 }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  card: {
    backgroundColor: CreovatorTheme.colors.bgCard,
    borderWidth: 1,
    borderColor: CreovatorTheme.colors.cardBorder,
    borderRadius: 24,
    padding: 20,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: CreovatorTheme.colors.textLight,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: CreovatorTheme.colors.cardBorder,
  },
  activeCategoryOption: {
    backgroundColor: CreovatorTheme.colors.primary,
    borderColor: CreovatorTheme.colors.primary,
  },
  categoryOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: CreovatorTheme.colors.textMuted,
  },
  activeCategoryOptionText: {
    color: '#ffffff',
  },
  row: {
    flexDirection: 'row',
  },
});
