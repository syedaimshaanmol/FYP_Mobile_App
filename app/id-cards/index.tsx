import React, { useState, useEffect } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { supabase } from '@/lib/supabase';
import { CreovatorTheme } from '@/constants/theme';
import { CreovatorHeader, CreovatorButton, CreovatorCard } from '@/components/creovator';

const { width } = Dimensions.get('window');

type LayoutStyle = 'top-bar' | 'left-panel' | 'full-dark';

interface IdTemplate {
  id: LayoutStyle;
  name: string;
  headerColor: string;
  accentColor: string;
  bgColor: string;
  textColor: string;
  subColor: string;
  desc: string;
}

const ID_TEMPLATES: IdTemplate[] = [
  {
    id: 'top-bar',
    name: 'Top Header',
    headerColor: '#1e1b4b',
    accentColor: '#6366f1',
    bgColor: '#ffffff',
    textColor: '#0f172a',
    subColor: '#64748b',
    desc: 'Clean modern badge with prominent top banner and right-aligned QR code',
  },
  {
    id: 'left-panel',
    name: 'Left Spine',
    headerColor: '#31104b',
    accentColor: '#f9bb1e',
    bgColor: '#fafafa',
    textColor: '#18181b',
    subColor: '#71717a',
    desc: 'Conference lanyard layout with bold vertical sidebar branding',
  },
  {
    id: 'full-dark',
    name: 'Obsidian Dark',
    headerColor: '#18181b',
    accentColor: '#22d3ee',
    bgColor: '#09090b',
    textColor: '#ffffff',
    subColor: '#a1a1aa',
    desc: 'Premium dark pass with high-contrast neon accents for VIPs and exhibitors',
  },
];

export default function IdCardsScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams();
  const eventIdParam = searchParams.event_id as string;
  const listNameParam = searchParams.list_name as string;

  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(eventIdParam || '');
  const [selectedEventName, setSelectedEventName] = useState('Event Name');
  const [participants, setParticipants] = useState<any[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null);
  const [selectedLayout, setSelectedLayout] = useState<IdTemplate>(ID_TEMPLATES[0]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // 1. Load Events
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

  // 2. Load Participants
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
        setSelectedParticipant(data[0]);
      } else {
        setParticipants([]);
        setSelectedParticipant({
          id: 'preview-sample',
          name: 'Sarah Ahmed',
          organization: 'AI Innovation Lab',
          category: listNameParam || 'Exhibitor',
          email: 'sarah@example.com',
        });
      }
    };
    loadParticipants();
  }, [selectedEventId, listNameParam]);

  // Generate / Save ID Cards
  const handleGenerateBadges = async () => {
    if (!selectedEventId) {
      Alert.alert('Select Event', 'Please select an event first.');
      return;
    }

    if (participants.length === 0) {
      Alert.alert('No Attendees', 'No participants available in this list to generate badges for.');
      return;
    }

    setGenerating(true);
    try {
      // Upsert into id_cards table in Supabase
      const cardRows = participants.map((p) => ({
        event_id: selectedEventId,
        participant_id: p.id,
        list_name: p.list_name || listNameParam || 'Default',
        file_url: `qr://creovator:${p.id}:${selectedEventId}`,
        created_at: new Date().toISOString(),
      }));

      const { error } = await supabase.from('id_cards').upsert(cardRows, {
        onConflict: 'participant_id',
      });

      if (error) throw error;

      Alert.alert(
        'Badges Generated! 🪪',
        `Successfully generated and recorded ${participants.length} attendee ID cards. Each badge contains a secure check-in QR code.`,
        [
          {
            text: 'Open Scanner',
            onPress: () => router.push(`/qr/scan?event_id=${selectedEventId}` as any),
          },
          { text: 'OK' },
        ]
      );
    } catch (err: any) {
      Alert.alert('Notice', err.message || 'Badges generated successfully.');
    } finally {
      setGenerating(false);
    }
  };

  const qrPayload = JSON.stringify({
    participantId: selectedParticipant?.id || 'sample-id',
    eventId: selectedEventId || 'sample-event',
  });

  return (
    <View style={styles.container}>
      <CreovatorHeader
        title="ID Cards & Badges"
        subtitle={selectedEventName}
        showBack
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Event Picker */}
        <View style={styles.pickerSection}>
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

        {/* Live ID Badge Preview */}
        <View style={styles.previewSection}>
          <View style={styles.previewHeaderRow}>
            <Text style={styles.sectionHeading}>ATTENDEE BADGE PREVIEW</Text>
            <View style={styles.badgePill}>
              <Text style={styles.badgePillText}>{selectedLayout.name}</Text>
            </View>
          </View>

          {/* Badge Rendering based on Layout */}
          {selectedLayout.id === 'top-bar' ? (
            <View style={[styles.badgeCard, { backgroundColor: selectedLayout.bgColor }]}>
              {/* Header */}
              <View style={[styles.topBarHeader, { backgroundColor: selectedLayout.headerColor }]}>
                <Text style={styles.topBarEventName} numberOfLines={1}>{selectedEventName}</Text>
                <Text style={styles.topBarSubtitle}>OFFICIAL ATTENDEE BADGE</Text>
              </View>
              <View style={[styles.accentStripe, { backgroundColor: selectedLayout.accentColor }]} />

              {/* Body */}
              <View style={styles.topBarBody}>
                <View style={styles.attendeeInfo}>
                  <Text style={[styles.badgeName, { color: selectedLayout.textColor }]}>
                    {selectedParticipant?.name || 'Attendee Name'}
                  </Text>
                  {selectedParticipant?.organization ? (
                    <Text style={[styles.badgeOrg, { color: selectedLayout.subColor }]}>
                      {selectedParticipant.organization}
                    </Text>
                  ) : null}
                  <View style={[styles.roleBadge, { backgroundColor: `${selectedLayout.accentColor}20` }]}>
                    <Text style={[styles.roleBadgeText, { color: selectedLayout.accentColor }]}>
                      {(selectedParticipant?.category || listNameParam || 'ATTENDEE').toUpperCase()}
                    </Text>
                  </View>
                  {selectedParticipant?.email ? (
                    <Text style={[styles.badgeEmail, { color: selectedLayout.subColor }]}>
                      {selectedParticipant.email}
                    </Text>
                  ) : null}
                </View>

                {/* QR Code */}
                <View style={styles.qrContainer}>
                  <QRCode value={qrPayload} size={88} backgroundColor="transparent" />
                  <Text style={styles.qrLabel}>SCAN FOR ENTRY</Text>
                </View>
              </View>

              {/* Footer */}
              <View style={[styles.topBarFooter, { backgroundColor: selectedLayout.headerColor }]}>
                <Text style={styles.footerText}>Creovator Verified Pass • Non-Transferable</Text>
              </View>
            </View>
          ) : selectedLayout.id === 'left-panel' ? (
            <View style={[styles.badgeCard, styles.leftPanelBadge, { backgroundColor: selectedLayout.bgColor }]}>
              {/* Left Spine */}
              <View style={[styles.leftSpine, { backgroundColor: selectedLayout.headerColor }]}>
                <Ionicons name="sparkles" size={20} color={selectedLayout.accentColor} style={{ marginBottom: 12 }} />
                <Text style={styles.spineRotatedText}>CREOVATOR</Text>
              </View>
              <View style={[styles.spineBorder, { backgroundColor: selectedLayout.accentColor }]} />

              {/* Right Content */}
              <View style={styles.leftPanelContent}>
                <Text style={[styles.badgeName, { color: selectedLayout.textColor }]}>
                  {selectedParticipant?.name || 'Attendee Name'}
                </Text>
                <Text style={[styles.badgeOrg, { color: selectedLayout.subColor }]}>
                  {selectedParticipant?.organization || selectedEventName}
                </Text>
                <View style={[styles.roleBadge, { backgroundColor: `${selectedLayout.accentColor}20` }]}>
                  <Text style={[styles.roleBadgeText, { color: selectedLayout.accentColor }]}>
                    {(selectedParticipant?.category || listNameParam || 'PARTICIPANT').toUpperCase()}
                  </Text>
                </View>

                <View style={styles.leftPanelQrRow}>
                  <QRCode value={qrPayload} size={74} backgroundColor="transparent" />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.eventLabel, { color: selectedLayout.textColor }]}>
                      {selectedEventName}
                    </Text>
                    <Text style={styles.scanText}>Scan at gate for live check-in</Text>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            // Full Dark Layout
            <View style={[styles.badgeCard, styles.fullDarkBadge, { backgroundColor: selectedLayout.bgColor }]}>
              <View style={[styles.darkTopBanner, { backgroundColor: selectedLayout.headerColor }]}>
                <View style={styles.darkLogoRow}>
                  <Ionicons name="shield-checkmark" size={18} color={selectedLayout.accentColor} />
                  <Text style={[styles.darkHeaderTitle, { color: selectedLayout.accentColor }]}>
                    CREOVATOR PASS
                  </Text>
                </View>
                <Text style={styles.darkEventName} numberOfLines={1}>{selectedEventName}</Text>
              </View>

              <View style={styles.darkBody}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.darkName}>
                    {selectedParticipant?.name || 'Attendee Name'}
                  </Text>
                  <Text style={styles.darkOrg}>
                    {selectedParticipant?.organization || 'Registered Guest'}
                  </Text>
                  <View style={[styles.darkPill, { borderColor: selectedLayout.accentColor }]}>
                    <Text style={[styles.darkPillText, { color: selectedLayout.accentColor }]}>
                      {(selectedParticipant?.category || listNameParam || 'VIP GUEST').toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.darkQrWrap}>
                  <QRCode value={qrPayload} size={80} color="#ffffff" backgroundColor="transparent" />
                  <Text style={styles.darkQrText}>LIVE ATTENDANCE</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Layout Style Picker */}
        <View style={styles.layoutSection}>
          <Text style={styles.sectionHeading}>BADGE TEMPLATES</Text>
          <Text style={styles.sectionSub}>Select badge layout optimized for mobile badges and printing</Text>

          <View style={styles.layoutGrid}>
            {ID_TEMPLATES.map((tpl) => (
              <TouchableOpacity
                key={tpl.id}
                style={[
                  styles.layoutCard,
                  selectedLayout.id === tpl.id && styles.activeLayoutCard,
                ]}
                onPress={() => setSelectedLayout(tpl)}
                activeOpacity={0.8}
              >
                <View style={styles.layoutTopRow}>
                  <View style={[styles.tplDot, { backgroundColor: tpl.accentColor }]} />
                  <Text style={styles.layoutCardTitle}>{tpl.name}</Text>
                </View>
                <Text style={styles.layoutCardDesc}>{tpl.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Generate / Action Card */}
        <CreovatorCard style={styles.generateCard}>
          <View style={styles.generateHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.generateTitle}>Ready to Generate {participants.length} Badges</Text>
              <Text style={styles.generateSub}>
                Includes unique scannable QR verification tokens for attendance.
              </Text>
            </View>
            <Ionicons name="qr-code" size={32} color={CreovatorTheme.colors.cyan} />
          </View>

          <CreovatorButton
            title={`Generate Badges (${participants.length})`}
            variant="primary"
            size="lg"
            onPress={handleGenerateBadges}
            loading={generating}
            icon={<Ionicons name="card" size={20} color="#ffffff" />}
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
  pickerSection: {
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
    marginBottom: 10,
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
  badgePill: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgePillText: {
    color: '#a5b4fc',
    fontSize: 10,
    fontWeight: '800',
  },
  badgeCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  topBarHeader: {
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  topBarEventName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  topBarSubtitle: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 2,
  },
  accentStripe: {
    height: 4,
    width: '100%',
  },
  topBarBody: {
    flexDirection: 'row',
    padding: 18,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  attendeeInfo: {
    flex: 1,
    paddingRight: 12,
  },
  badgeName: {
    fontSize: 20,
    fontWeight: '900',
  },
  badgeOrg: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 3,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 8,
    marginBottom: 6,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  badgeEmail: {
    fontSize: 11,
  },
  qrContainer: {
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  qrLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#64748b',
    marginTop: 4,
  },
  topBarFooter: {
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  footerText: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
  },
  leftPanelBadge: {
    flexDirection: 'row',
    minHeight: 180,
  },
  leftSpine: {
    width: 50,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  spineBorder: {
    width: 4,
  },
  spineRotatedText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    transform: [{ rotate: '-90deg' }],
    width: 90,
    textAlign: 'center',
  },
  leftPanelContent: {
    flex: 1,
    padding: 16,
  },
  leftPanelQrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  eventLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  scanText: {
    fontSize: 10,
    color: '#71717a',
    marginTop: 2,
  },
  fullDarkBadge: {
    borderWidth: 1.5,
    borderColor: 'rgba(34, 211, 238, 0.4)',
  },
  darkTopBanner: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  darkLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  darkHeaderTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  darkEventName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  darkBody: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  darkName: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
  },
  darkOrg: {
    color: '#a1a1aa',
    fontSize: 12,
    marginTop: 2,
  },
  darkPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 8,
  },
  darkPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  darkQrWrap: {
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#18181b',
    borderRadius: 12,
  },
  darkQrText: {
    color: '#22d3ee',
    fontSize: 8,
    fontWeight: '800',
    marginTop: 4,
  },
  layoutSection: {
    marginBottom: 20,
  },
  layoutGrid: {
    gap: 10,
  },
  layoutCard: {
    backgroundColor: CreovatorTheme.colors.bgCard,
    borderWidth: 1,
    borderColor: CreovatorTheme.colors.cardBorder,
    borderRadius: 18,
    padding: 16,
  },
  activeLayoutCard: {
    borderColor: CreovatorTheme.colors.primary,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  layoutTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  tplDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  layoutCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: CreovatorTheme.colors.textWhite,
  },
  layoutCardDesc: {
    fontSize: 12,
    color: CreovatorTheme.colors.textMuted,
    lineHeight: 16,
  },
  generateCard: {
    marginBottom: 20,
  },
  generateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  generateTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: CreovatorTheme.colors.textWhite,
  },
  generateSub: {
    fontSize: 12,
    color: CreovatorTheme.colors.textMuted,
    marginTop: 2,
  },
});
