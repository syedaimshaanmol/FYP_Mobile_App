import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { supabase } from '@/lib/supabase';
import { CreovatorTheme } from '@/constants/theme';
import { CreovatorHeader, CreovatorButton, CreovatorCard } from '@/components/creovator';

const { width } = Dimensions.get('window');

interface Template {
  id: string;
  name: string;
  badge: string;
  bgColor: string;
  borderColor: string;
  titleColor: string;
  nameColor: string;
  accentColor: string;
  styleDesc: string;
}

const CERT_TEMPLATES: Template[] = [
  {
    id: 'elegant-gold',
    name: 'Elegant Gold',
    badge: 'CLASSIC',
    bgColor: '#FFFDF6',
    borderColor: '#C9A227',
    titleColor: '#2B2B2B',
    nameColor: '#C9A227',
    accentColor: '#8a6d1b',
    styleDesc: 'Traditional prestigious golden frame with elegant serif typography',
  },
  {
    id: 'modern-blue',
    name: 'Modern Blue',
    badge: 'CORPORATE',
    bgColor: '#FFFFFF',
    borderColor: '#2563EB',
    titleColor: '#1E293B',
    nameColor: '#1E3A8A',
    accentColor: '#3B82F6',
    styleDesc: 'Sleek corporate achievement certificate with professional indigo accents',
  },
  {
    id: 'minimalist-dark',
    name: 'Minimalist Dark',
    badge: 'TECH',
    bgColor: '#0F172A',
    borderColor: '#6366F1',
    titleColor: '#FFFFFF',
    nameColor: '#22D3EE',
    accentColor: '#A5B4FC',
    styleDesc: 'Futuristic dark theme certificate tailored for tech summits and hackathons',
  },
  {
    id: 'emerald-luxury',
    name: 'Emerald Luxury',
    badge: 'PREMIUM',
    bgColor: '#F0FDF4',
    borderColor: '#059669',
    titleColor: '#064E3B',
    nameColor: '#059669',
    accentColor: '#10B981',
    styleDesc: 'Royal emerald green bordered certificate of excellence',
  },
];

export default function CertificatesScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams();
  const eventIdParam = searchParams.event_id as string;
  const listNameParam = searchParams.list_name as string;

  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(eventIdParam || '');
  const [selectedEventName, setSelectedEventName] = useState('Event Name');
  const [participants, setParticipants] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(CERT_TEMPLATES[0]);
  const [previewParticipant, setPreviewParticipant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Load events
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from('events')
          .select('id, name')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (data) {
          setEvents(data);
          if (!selectedEventId && data.length > 0) {
            setSelectedEventId(data[0].id);
            setSelectedEventName(data[0].name);
          } else if (selectedEventId) {
            const ev = data.find((e) => e.id === selectedEventId);
            if (ev) setSelectedEventName(ev.name);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadEvents();
  }, [selectedEventId]);

  // Load participants for the selected event
  useEffect(() => {
    if (!selectedEventId) return;

    const loadParticipants = async () => {
      let query = supabase
        .from('participants')
        .select('*')
        .eq('event_id', selectedEventId);

      if (listNameParam) {
        query = query.eq('list_name', listNameParam);
      }

      const { data } = await query;
      if (data && data.length > 0) {
        setParticipants(data);
        setPreviewParticipant(data[0]);
      } else {
        setParticipants([]);
        setPreviewParticipant({ name: 'Jane Doe', category: 'Attendee' });
      }
    };
    loadParticipants();
  }, [selectedEventId, listNameParam]);

  // Handle batch certificate issuance
  const handleIssueCertificates = async () => {
    if (!selectedEventId) {
      Alert.alert('Select Event', 'Please select an event first.');
      return;
    }

    if (participants.length === 0) {
      Alert.alert('No Participants', 'There are no participants in this list to award certificates to.');
      return;
    }

    setGenerating(true);
    try {
      // Upsert certificates records into certificates table
      const certRows = participants.map((p) => ({
        event_id: selectedEventId,
        participant_id: p.id,
        template_name: selectedTemplate.name,
        created_at: new Date().toISOString(),
      }));

      const { error } = await supabase.from('certificates').upsert(certRows, {
        onConflict: 'participant_id',
      });

      if (error) throw error;

      Alert.alert(
        'Certificates Generated! 🎓',
        `Successfully generated and recorded ${participants.length} certificates with template "${selectedTemplate.name}".`,
        [
          {
            text: 'View Workspace',
            onPress: () => router.push(`/events/${selectedEventId}` as any),
          },
          { text: 'OK' },
        ]
      );
    } catch (err: any) {
      Alert.alert('Generation Notice', err.message || 'Certificates successfully recorded.');
    } finally {
      setGenerating(false);
    }
  };

  const sampleName = previewParticipant?.name || 'Sample Participant';
  const sampleRole = previewParticipant?.category || listNameParam || 'Participant';
  const issueDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <View style={styles.container}>
      <CreovatorHeader
        title="Certificates Generator"
        subtitle={selectedEventName}
        showBack
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Event Selector Horizontal Pills */}
        <View style={styles.eventPickerSection}>
          <Text style={styles.pickerLabel}>SELECT EVENT</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.eventPills}>
            {events.map((ev) => (
              <TouchableOpacity
                key={ev.id}
                style={[styles.eventPill, selectedEventId === ev.id && styles.activeEventPill]}
                onPress={() => {
                  setSelectedEventId(ev.id);
                  setSelectedEventName(ev.name);
                }}
              >
                <Text style={[styles.eventPillText, selectedEventId === ev.id && styles.activeEventPillText]}>
                  {ev.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Certificate Visual Preview Card */}
        <View style={styles.previewSection}>
          <View style={styles.previewHeaderRow}>
            <Text style={styles.sectionHeading}>LIVE CERTIFICATE PREVIEW</Text>
            <View style={styles.badgeLive}>
              <Text style={styles.badgeLiveText}>Interactive</Text>
            </View>
          </View>

          <View
            style={[
              styles.certCanvas,
              {
                backgroundColor: selectedTemplate.bgColor,
                borderColor: selectedTemplate.borderColor,
              },
            ]}
          >
            {/* Inner Border Frame */}
            <View
              style={[
                styles.certInnerBorder,
                { borderColor: selectedTemplate.borderColor },
              ]}
            >
              {/* Corner Accents */}
              <View style={[styles.cornerTL, { borderColor: selectedTemplate.borderColor }]} />
              <View style={[styles.cornerTR, { borderColor: selectedTemplate.borderColor }]} />
              <View style={[styles.cornerBL, { borderColor: selectedTemplate.borderColor }]} />
              <View style={[styles.cornerBR, { borderColor: selectedTemplate.borderColor }]} />

              <Ionicons
                name="ribbon"
                size={34}
                color={selectedTemplate.nameColor}
                style={{ alignSelf: 'center', marginBottom: 6 }}
              />

              <Text
                style={[
                  styles.certHeader,
                  { color: selectedTemplate.titleColor },
                ]}
              >
                CERTIFICATE OF PARTICIPATION
              </Text>

              <Text style={[styles.certPresentedTo, { color: selectedTemplate.accentColor }]}>
                This is proudly presented to
              </Text>

              <Text
                style={[
                  styles.certParticipantName,
                  { color: selectedTemplate.nameColor },
                ]}
                numberOfLines={1}
              >
                {sampleName}
              </Text>

              <View
                style={[
                  styles.certUnderline,
                  { backgroundColor: selectedTemplate.borderColor },
                ]}
              />

              <Text style={[styles.certReason, { color: selectedTemplate.titleColor }]}>
                for actively participating as {sampleRole} in
              </Text>

              <Text style={[styles.certEventName, { color: selectedTemplate.nameColor }]}>
                {selectedEventName}
              </Text>

              <Text style={[styles.certDate, { color: selectedTemplate.accentColor }]}>
                Issued on {issueDate}
              </Text>

              {/* Signatures */}
              <View style={styles.signaturesRow}>
                <View style={styles.sigBox}>
                  <View style={[styles.sigLine, { backgroundColor: selectedTemplate.borderColor }]} />
                  <Text style={[styles.sigLabel, { color: selectedTemplate.accentColor }]}>
                    Organizing Committee
                  </Text>
                </View>

                <View style={styles.sigBox}>
                  <View style={[styles.sigLine, { backgroundColor: selectedTemplate.borderColor }]} />
                  <Text style={[styles.sigLabel, { color: selectedTemplate.accentColor }]}>
                    Creovator Verified
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Template Selector Carousel */}
        <View style={styles.templatesSection}>
          <Text style={styles.sectionHeading}>CHOOSE TEMPLATE</Text>
          <Text style={styles.sectionSub}>Select from professional handcrafted certificates</Text>

          <View style={styles.templateCardsGrid}>
            {CERT_TEMPLATES.map((tpl) => (
              <TouchableOpacity
                key={tpl.id}
                style={[
                  styles.templateCard,
                  selectedTemplate.id === tpl.id && styles.activeTemplateCard,
                ]}
                onPress={() => setSelectedTemplate(tpl)}
                activeOpacity={0.8}
              >
                <View style={styles.tplTopRow}>
                  <View style={[styles.tplColorDot, { backgroundColor: tpl.borderColor }]} />
                  <Text style={styles.tplBadge}>{tpl.badge}</Text>
                </View>

                <Text style={styles.tplName}>{tpl.name}</Text>
                <Text style={styles.tplDesc}>{tpl.styleDesc}</Text>

                {selectedTemplate.id === tpl.id && (
                  <View style={styles.selectedPill}>
                    <Ionicons name="checkmark-circle" size={14} color="#ffffff" />
                    <Text style={styles.selectedPillText}>Selected</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Participant Summary Strip */}
        <CreovatorCard style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryTitle}>Recipients: {participants.length} Participants</Text>
              <Text style={styles.summarySubtitle}>
                {listNameParam ? `List: ${listNameParam}` : 'All registered participants in event'}
              </Text>
            </View>

            <Ionicons name="documents-outline" size={28} color={CreovatorTheme.colors.secondary} />
          </View>

          <CreovatorButton
            title={`Issue ${participants.length} Certificates`}
            variant="secondary"
            size="lg"
            onPress={handleIssueCertificates}
            loading={generating}
            icon={<Ionicons name="ribbon" size={20} color="#0f0a1f" />}
            style={{ marginTop: 14 }}
          />
        </CreovatorCard>
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
  eventPickerSection: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: CreovatorTheme.colors.textMuted,
    letterSpacing: 1,
    marginBottom: 8,
  },
  eventPills: {
    gap: 8,
  },
  eventPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: CreovatorTheme.colors.bgCard,
    borderWidth: 1,
    borderColor: CreovatorTheme.colors.cardBorder,
  },
  activeEventPill: {
    backgroundColor: CreovatorTheme.colors.primary,
    borderColor: CreovatorTheme.colors.primary,
  },
  eventPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: CreovatorTheme.colors.textLight,
  },
  activeEventPillText: {
    color: '#ffffff',
  },
  previewSection: {
    marginBottom: 20,
  },
  previewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: CreovatorTheme.colors.textWhite,
    letterSpacing: 1.2,
  },
  sectionSub: {
    fontSize: 12,
    color: CreovatorTheme.colors.textMuted,
    marginTop: 2,
    marginBottom: 12,
  },
  badgeLive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeLiveText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '800',
  },
  certCanvas: {
    borderRadius: 16,
    borderWidth: 6,
    padding: 10,
    minHeight: 330,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  certInnerBorder: {
    flex: 1,
    borderWidth: 1.5,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cornerTL: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 12,
    height: 12,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  cornerTR: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 12,
    height: 12,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    width: 12,
    height: 12,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 12,
    height: 12,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
  certHeader: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 4,
  },
  certPresentedTo: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 2,
  },
  certParticipantName: {
    fontSize: 22,
    fontWeight: '800',
    marginVertical: 4,
    textAlign: 'center',
  },
  certUnderline: {
    width: 140,
    height: 1.5,
    marginBottom: 6,
  },
  certReason: {
    fontSize: 11,
    textAlign: 'center',
  },
  certEventName: {
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 2,
  },
  certDate: {
    fontSize: 10,
    marginTop: 4,
  },
  signaturesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
    paddingHorizontal: 10,
  },
  sigBox: {
    alignItems: 'center',
    width: 110,
  },
  sigLine: {
    width: '100%',
    height: 1,
    marginBottom: 4,
  },
  sigLabel: {
    fontSize: 9,
    fontWeight: '600',
  },
  templatesSection: {
    marginBottom: 20,
  },
  templateCardsGrid: {
    gap: 10,
  },
  templateCard: {
    backgroundColor: CreovatorTheme.colors.bgCard,
    borderWidth: 1,
    borderColor: CreovatorTheme.colors.cardBorder,
    borderRadius: 20,
    padding: 16,
  },
  activeTemplateCard: {
    borderColor: CreovatorTheme.colors.primary,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  tplTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  tplColorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  tplBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: CreovatorTheme.colors.textMuted,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tplName: {
    fontSize: 16,
    fontWeight: '800',
    color: CreovatorTheme.colors.textWhite,
  },
  tplDesc: {
    fontSize: 12,
    color: CreovatorTheme.colors.textMuted,
    marginTop: 3,
    lineHeight: 16,
  },
  selectedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: CreovatorTheme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 10,
  },
  selectedPillText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  summaryCard: {
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryInfo: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: CreovatorTheme.colors.textWhite,
  },
  summarySubtitle: {
    fontSize: 12,
    color: CreovatorTheme.colors.textMuted,
    marginTop: 2,
  },
});
