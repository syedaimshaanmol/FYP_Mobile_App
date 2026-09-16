import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CreovatorColors } from '../../constants/theme';
import { CreovatorHeader } from '../../components/creovator/CreovatorHeader';
import { CreovatorCard } from '../../components/creovator/CreovatorCard';
import { CreovatorButton } from '../../components/creovator/CreovatorButton';
import { supabase } from '../../lib/supabase';

interface EventItem {
  id: string;
  name: string;
  category: string;
}

interface ParticipantItem {
  id: string;
  name: string;
  email: string;
  event_day?: number;
}

const TEMPLATES = [
  {
    title: 'Event Reminder',
    subject: 'Friendly Reminder: Your Upcoming Event with Creovator',
    content: 'Dear Attendee,\n\nThis is a friendly reminder that our upcoming event is scheduled soon. We look forward to seeing you there!\n\nPlease arrive 15 minutes before the starting time.\n\nWarm regards,\nEvent Organizing Committee',
  },
  {
    title: 'Registration Confirmation',
    subject: 'Registration Confirmed - Welcome to the Event!',
    content: 'Dear Attendee,\n\nThank you for registering for our event! Your spot has been confirmed.\n\nYou can present your digital pass or QR badge at the registration desk upon arrival.\n\nBest regards,\nCreovator Team',
  },
  {
    title: 'Post-Event Thank You',
    subject: 'Thank You for Attending Our Event!',
    content: 'Dear Attendee,\n\nWe would like to express our sincere gratitude for your presence at our event today. It was a pleasure having you with us.\n\nYour certificate of participation is being prepared and will be sent shortly.\n\nBest regards,\nEvent Organizers',
  },
];

export default function EmailAutomationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ event_id?: string; prefill_subject?: string; prefill_content?: string }>();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(params.event_id || '');
  const [participants, setParticipants] = useState<ParticipantItem[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());

  const [subject, setSubject] = useState<string>(params.prefill_subject || '');
  const [content, setContent] = useState<string>(params.prefill_content || '');

  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchParticipants(selectedEventId);
    } else {
      setParticipants([]);
      setSelectedEmails(new Set());
    }
  }, [selectedEventId]);

  const fetchEvents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('events')
        .select('id, name, category')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setEvents(data);
        if (!selectedEventId && data.length > 0) {
          setSelectedEventId(data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEvents(false);
    }
  };

  const fetchParticipants = async (eventId: string) => {
    setLoadingParticipants(true);
    try {
      const { data, error } = await supabase
        .from('participants')
        .select('id, name, email, event_day')
        .eq('event_id', eventId);

      if (!error && data) {
        setParticipants(data);
        // Default select all
        const allEmails = new Set(data.filter(p => !!p.email).map(p => p.email));
        setSelectedEmails(allEmails);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingParticipants(false);
    }
  };

  const toggleRecipient = (email: string) => {
    const next = new Set(selectedEmails);
    if (next.has(email)) {
      next.delete(email);
    } else {
      next.add(email);
    }
    setSelectedEmails(next);
  };

  const toggleSelectAll = () => {
    const validEmails = participants.filter(p => !!p.email).map(p => p.email);
    if (selectedEmails.size === validEmails.length) {
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails(new Set(validEmails));
    }
  };

  const applyTemplate = (tpl: typeof TEMPLATES[0]) => {
    setSubject(tpl.subject);
    setContent(tpl.content);
  };

  const handleSendEmails = async () => {
    if (!subject.trim()) {
      Alert.alert('Missing Subject', 'Please enter an email subject.');
      return;
    }
    if (!content.trim()) {
      Alert.alert('Missing Content', 'Please enter email body content.');
      return;
    }
    if (selectedEmails.size === 0) {
      Alert.alert('No Recipients', 'Please select at least one recipient with an email address.');
      return;
    }

    const recipients = participants
      .filter(p => selectedEmails.has(p.email))
      .map(p => ({ email: p.email, name: p.name }));

    Alert.alert(
      'Confirm Email Broadcast',
      `Send this email to ${recipients.length} recipient${recipients.length > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Now',
          style: 'default',
          onPress: async () => {
            setSending(true);
            try {
              const { data, error } = await supabase.functions.invoke('send-email', {
                body: {
                  recipients,
                  subject: subject.trim(),
                  content: content.trim(),
                  eventId: selectedEventId || undefined,
                },
              });

              if (error) {
                Alert.alert('Email Dispatch Note', error.message || 'Could not trigger email service.');
              } else if (data && data.success) {
                Alert.alert(
                  'Emails Processed',
                  `Successfully sent: ${data.sent || 0}\nFailed: ${data.failed || 0}`,
                  [{ text: 'OK', onPress: () => router.back() }]
                );
              } else {
                Alert.alert('Notice', data?.error || 'Email operation completed with response.');
              }
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to communicate with email gateway.');
            } finally {
              setSending(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <CreovatorHeader
        title="Email Automation"
        showBack
        onBackPress={() => router.back()}
        rightIcon="robot-outline"
        onRightPress={() => router.push('/(tabs)/ai')}
      />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Event Selection */}
        <Text style={styles.sectionLabel}>TARGET EVENT</Text>
        {loadingEvents ? (
          <ActivityIndicator color={CreovatorColors.primary} style={{ marginVertical: 12 }} />
        ) : events.length === 0 ? (
          <CreovatorCard style={styles.emptyEventCard}>
            <Text style={styles.emptyText}>No events found. Please create an event first.</Text>
          </CreovatorCard>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.eventsScroll}>
            {events.map(ev => {
              const isSelected = ev.id === selectedEventId;
              return (
                <TouchableOpacity
                  key={ev.id}
                  style={[styles.eventChip, isSelected && styles.eventChipActive]}
                  onPress={() => setSelectedEventId(ev.id)}
                >
                  <MaterialCommunityIcons
                    name="calendar-check"
                    size={16}
                    color={isSelected ? CreovatorColors.textPrimary : CreovatorColors.textMuted}
                  />
                  <Text style={[styles.eventChipText, isSelected && styles.eventChipTextActive]}>
                    {ev.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Templates Quick Pick */}
        <Text style={[styles.sectionLabel, { marginTop: 18 }]}>QUICK TEMPLATES</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tplScroll}>
          {TEMPLATES.map((tpl, i) => (
            <TouchableOpacity key={i} style={styles.tplCard} onPress={() => applyTemplate(tpl)}>
              <View style={styles.tplIconCircle}>
                <MaterialCommunityIcons name="file-document-outline" size={16} color={CreovatorColors.accentGold} />
              </View>
              <Text style={styles.tplTitle}>{tpl.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Compose Section */}
        <Text style={[styles.sectionLabel, { marginTop: 18 }]}>EMAIL CONTENT</Text>
        <CreovatorCard style={styles.composeCard}>
          <Text style={styles.inputLabel}>Subject Line</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Important Information About Our Event"
            placeholderTextColor={CreovatorColors.textMuted}
            value={subject}
            onChangeText={setSubject}
          />

          <View style={styles.contentHeaderRow}>
            <Text style={styles.inputLabel}>Message Body</Text>
            <TouchableOpacity
              style={styles.aiAssistBtn}
              onPress={() => router.push('/(tabs)/ai')}
            >
              <MaterialCommunityIcons name="auto-fix" size={14} color={CreovatorColors.primaryLight} />
              <Text style={styles.aiAssistText}>Generate with AI</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Write your email body or choose a quick template..."
            placeholderTextColor={CreovatorColors.textMuted}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            value={content}
            onChangeText={setContent}
          />
        </CreovatorCard>

        {/* Recipients Multi-Select */}
        <View style={styles.recipientsHeader}>
          <Text style={styles.sectionLabel}>RECIPIENTS ({selectedEmails.size}/{participants.length})</Text>
          {participants.length > 0 && (
            <TouchableOpacity onPress={toggleSelectAll}>
              <Text style={styles.selectAllText}>
                {selectedEmails.size === participants.length ? 'Deselect All' : 'Select All'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {loadingParticipants ? (
          <ActivityIndicator color={CreovatorColors.primary} style={{ marginVertical: 20 }} />
        ) : participants.length === 0 ? (
          <CreovatorCard style={styles.emptyCard}>
            <MaterialCommunityIcons name="account-multiple-outline" size={32} color={CreovatorColors.textMuted} />
            <Text style={styles.emptySubText}>No participants found in this event.</Text>
          </CreovatorCard>
        ) : (
          <CreovatorCard style={styles.recipientsListCard}>
            {participants.map(p => {
              const hasEmail = !!p.email;
              const isChecked = selectedEmails.has(p.email);
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.recipientRow, !hasEmail && styles.recipientRowDisabled]}
                  onPress={() => hasEmail && toggleRecipient(p.email)}
                  disabled={!hasEmail}
                >
                  <MaterialCommunityIcons
                    name={isChecked ? 'checkbox-marked' : 'checkbox-blank-outline'}
                    size={22}
                    color={isChecked ? CreovatorColors.primaryLight : CreovatorColors.textMuted}
                  />
                  <View style={styles.recipientInfo}>
                    <Text style={styles.recipientName}>{p.name}</Text>
                    <Text style={styles.recipientEmail}>
                      {hasEmail ? p.email : 'No email address registered'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </CreovatorCard>
        )}

        {/* Action Button */}
        <View style={styles.actionContainer}>
          <CreovatorButton
            title={`Send Broadcast to ${selectedEmails.size} Recipient${selectedEmails.size > 1 ? 's' : ''}`}
            icon="send"
            loading={sending}
            disabled={selectedEmails.size === 0 || !subject.trim() || !content.trim()}
            onPress={handleSendEmails}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CreovatorColors.bgDark,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionLabel: {
    color: CreovatorColors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  eventsScroll: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  eventChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: CreovatorColors.surfaceDark,
    borderWidth: 1,
    borderColor: CreovatorColors.borderDark,
    marginRight: 10,
  },
  eventChipActive: {
    backgroundColor: CreovatorColors.primaryDark,
    borderColor: CreovatorColors.primary,
  },
  eventChipText: {
    color: CreovatorColors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  eventChipTextActive: {
    color: CreovatorColors.textPrimary,
  },
  tplScroll: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  tplCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: CreovatorColors.surfaceElevated,
    borderWidth: 1,
    borderColor: CreovatorColors.borderDark,
    marginRight: 8,
  },
  tplIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(249, 187, 30, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tplTitle: {
    color: CreovatorColors.textPrimary,
    fontSize: 13,
    fontWeight: '500',
  },
  composeCard: {
    padding: 16,
    gap: 12,
  },
  inputLabel: {
    color: CreovatorColors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    backgroundColor: CreovatorColors.surfaceDark,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: CreovatorColors.borderDark,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: CreovatorColors.textPrimary,
    fontSize: 14,
  },
  contentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  aiAssistBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  aiAssistText: {
    color: CreovatorColors.primaryLight,
    fontSize: 12,
    fontWeight: '600',
  },
  textArea: {
    minHeight: 120,
  },
  recipientsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  selectAllText: {
    color: CreovatorColors.primaryLight,
    fontSize: 13,
    fontWeight: '600',
  },
  recipientsListCard: {
    padding: 6,
    maxHeight: 280,
  },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  recipientRowDisabled: {
    opacity: 0.4,
  },
  recipientInfo: {
    flex: 1,
  },
  recipientName: {
    color: CreovatorColors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  recipientEmail: {
    color: CreovatorColors.textMuted,
    fontSize: 12,
  },
  emptyEventCard: {
    padding: 16,
    alignItems: 'center',
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    color: CreovatorColors.textMuted,
    fontSize: 13,
  },
  emptySubText: {
    color: CreovatorColors.textMuted,
    fontSize: 13,
  },
  actionContainer: {
    marginTop: 24,
  },
});

