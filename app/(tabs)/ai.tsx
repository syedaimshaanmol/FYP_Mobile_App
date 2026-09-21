import { useResponsive } from '@/constants/useResponsive';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CreovatorHeader } from '../../components/creovator/CreovatorHeader';
import { CreovatorColors } from '../../constants/theme';
import { supabase } from '../../lib/supabase';



const CONTENT_TYPES = [
  'Invitation Email',
  'Proposal Letter',
  'Congratulations Email',
  'Thank You Message',
  'Speaker Invitation',
  'Certificate Delivery Email',
  'Event Announcement',
];

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  contentType?: string;
  createdAt?: string;
}

interface ChatSession {
  id: string;
  title: string;
}

export default function AIStudioTab() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const r = useResponsive();


  const [selectedType, setSelectedType] = useState(CONTENT_TYPES[0]);
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [showSessionDrawer, setShowSessionDrawer] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (activeSessionId) {
      loadMessages(activeSessionId);
    }
  }, [activeSessionId]);

  const loadSessions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('chat_sessions')
        .select('id, title')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        setSessions(data);
        setActiveSessionId(data[0].id);
      } else {
        await createNewSession();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const createNewSession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({ user_id: user.id, title: 'New Conversation' })
        .select()
        .single();

      if (!error && data) {
        setSessions(prev => [data, ...prev]);
        setActiveSessionId(data.id);
        setMessages([]);
        setShowSessionDrawer(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadMessages = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('id, role, content, content_type, created_at')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(
          data.map(m => ({
            id: m.id,
            role: m.role as 'user' | 'ai',
            content: m.content,
            contentType: m.content_type || undefined,
            createdAt: m.created_at,
          }))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async () => {
    if (!prompt.trim() || generating || !activeSessionId) return;

    const userPrompt = prompt.trim();
    const contentTypeToUse = selectedType;
    setPrompt('');
    setGenerating(true);

    const tempUserMsgId = `temp-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: tempUserMsgId,
      role: 'user',
      content: userPrompt,
      contentType: contentTypeToUse,
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      // Save user message to database
      await supabase.from('chat_messages').insert({
        session_id: activeSessionId,
        role: 'user',
        content: userPrompt,
        content_type: contentTypeToUse,
      });

      // Update session title if first message
      if (messages.length === 0) {
        const titleSnippet = userPrompt.slice(0, 30);
        await supabase
          .from('chat_sessions')
          .update({ title: titleSnippet })
          .eq('id', activeSessionId);
        setSessions(prev =>
          prev.map(s => (s.id === activeSessionId ? { ...s, title: titleSnippet } : s))
        );
      }

      // Invoke generate-content edge function
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: { prompt: userPrompt, contentType: contentTypeToUse },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const generatedContent = data?.content || 'No content returned from AI.';

      // Save AI message to database
      const { data: aiSavedData } = await supabase
        .from('chat_messages')
        .insert({
          session_id: activeSessionId,
          role: 'ai',
          content: generatedContent,
          content_type: contentTypeToUse,
        })
        .select()
        .single();

      const aiMsg: ChatMessage = {
        id: aiSavedData?.id || `ai-${Date.now()}`,
        role: 'ai',
        content: generatedContent,
        contentType: contentTypeToUse,
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      Alert.alert('Generation Note', err.message || 'AI generation failed. Please try again.');
    } finally {
      setGenerating(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  };

  const handleUseInEmail = (content: string) => {
    router.push({
      pathname: '/emails',
      params: {
        prefill_subject: `${selectedType} - Creovator`,
        prefill_content: content,
      },
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <CreovatorHeader
        title="Creovator AI Studio"
        subtitle="Powered by Google Gemini 2.5"
        rightIcon="history"
        onRightPress={() => setShowSessionDrawer(!showSessionDrawer)}
      />

      {/* Content Type Selector Pills */}
      <View style={styles.typesWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typesScroll}>
          {CONTENT_TYPES.map(type => {
            const isSelected = type === selectedType;
            return (
              <TouchableOpacity
                key={type}
                style={[styles.typePill, isSelected && styles.typePillActive]}
                onPress={() => setSelectedType(type)}
              >
                <Text style={[styles.typePillText, isSelected && styles.typePillTextActive]}>
                  {type}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Chat Sessions Dropdown / Drawer Modal */}
      {showSessionDrawer && (
        <View style={styles.sessionsBar}>
          <View style={styles.sessionsBarHeader}>
            <Text style={styles.sessionsBarTitle}>Chat Conversations</Text>
            <TouchableOpacity style={styles.newChatBtn} onPress={createNewSession}>
              <MaterialCommunityIcons name="plus" size={16} color={CreovatorColors.textPrimary} />
              <Text style={styles.newChatBtnText}>New Chat</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sessionChipsScroll}>
            {sessions.map(s => {
              const isActive = s.id === activeSessionId;
              return (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.sessionChip, isActive && styles.sessionChipActive]}
                  onPress={() => {
                    setActiveSessionId(s.id);
                    setShowSessionDrawer(false);
                  }}
                >
                  <MaterialCommunityIcons
                    name="message-text-outline"
                    size={14}
                    color={isActive ? CreovatorColors.textPrimary : CreovatorColors.textMuted}
                  />
                  <Text style={[styles.sessionChipText, isActive && styles.sessionChipTextActive]} numberOfLines={1}>
                    {s.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Messages Scroll View */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {loadingHistory ? (
          <ActivityIndicator color={CreovatorColors.primary} style={{ marginTop: 40 }} />
        ) : messages.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.sparkleCircle}>
              <MaterialCommunityIcons name="creation" size={38} color={CreovatorColors.accentGold} />
            </View>
            <Text style={styles.emptyTitle}>AI Event Copywriter</Text>
            <Text style={styles.emptySubtitle}>
              Select a content type above, describe what you need, and Gemini AI will craft tailored, high-converting event communications.
            </Text>

            <View style={styles.exampleCardList}>
              <TouchableOpacity
                style={styles.exampleCard}
                onPress={() => setPrompt('Create an invitation for our Annual Tech Summit 2026 highlighting AI workshops and guest keynote speakers.')}
              >
                <MaterialCommunityIcons name="lightbulb-outline" size={16} color={CreovatorColors.accentGold} />
                <Text style={styles.exampleCardText}>"Tech Summit invitation with AI workshops"</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.exampleCard}
                onPress={() => setPrompt('Write a warm thank-you message to attendees for participating in our Hackathon and submitting projects.')}
              >
                <MaterialCommunityIcons name="lightbulb-outline" size={16} color={CreovatorColors.accentGold} />
                <Text style={styles.exampleCardText}>"Post-Hackathon thank-you note to attendees"</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          messages.map(msg => {
            const isUser = msg.role === 'user';
            return (
              <View
                key={msg.id}
                style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowAi]}
              >
                {!isUser && (
                  <View style={styles.aiAvatar}>
                    <MaterialCommunityIcons name="creation" size={16} color={CreovatorColors.accentGold} />
                  </View>
                )}
                <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
                  {msg.contentType && !isUser && (
                    <View style={styles.bubbleTag}>
                      <Text style={styles.bubbleTagText}>{msg.contentType}</Text>
                    </View>
                  )}
                  <Text style={styles.messageText}>{msg.content}</Text>

                  {!isUser && (
                    <View style={styles.aiActionRow}>
                      <TouchableOpacity
                        style={styles.aiActionBtn}
                        onPress={() => {
                          Alert.alert('Action', 'Content ready for broadcast.', [
                            { text: 'Use in Email Broadcast', onPress: () => handleUseInEmail(msg.content) },
                            { text: 'OK' },
                          ]);
                        }}
                      >
                        <MaterialCommunityIcons name="email-fast-outline" size={15} color={CreovatorColors.primaryLight} />
                        <Text style={styles.aiActionText}>Use in Broadcast</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}

        {generating && (
          <View style={[styles.messageRow, styles.messageRowAi]}>
            <View style={styles.aiAvatar}>
              <MaterialCommunityIcons name="creation" size={16} color={CreovatorColors.accentGold} />
            </View>
            <View style={[styles.messageBubble, styles.aiBubble, styles.generatingBubble]}>
              <ActivityIndicator size="small" color={CreovatorColors.accentGold} />
              <Text style={styles.generatingText}>Generating {selectedType}...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Prompt Input Box */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          placeholder={`Describe the ${selectedType.toLowerCase()}...`}
          placeholderTextColor={CreovatorColors.textMuted}
          multiline
          value={prompt}
          onChangeText={setPrompt}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!prompt.trim() || generating) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!prompt.trim() || generating}
        >
          <MaterialCommunityIcons
            name="send"
            size={20}
            color={prompt.trim() && !generating ? CreovatorColors.textPrimary : CreovatorColors.textMuted}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CreovatorColors.bgDark,
  },
  typesWrapper: {
    backgroundColor: CreovatorColors.surfaceDark,
    borderBottomWidth: 1,
    borderBottomColor: CreovatorColors.borderDark,
    paddingVertical: 10,
  },
  typesScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  typePill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: CreovatorColors.surfaceElevated,
    borderWidth: 1,
    borderColor: CreovatorColors.borderDark,
  },
  typePillActive: {
    backgroundColor: CreovatorColors.primaryDark,
    borderColor: CreovatorColors.primary,
  },
  typePillText: {
    color: CreovatorColors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  typePillTextActive: {
    color: CreovatorColors.textPrimary,
  },
  sessionsBar: {
    backgroundColor: CreovatorColors.surfaceElevated,
    borderBottomWidth: 1,
    borderBottomColor: CreovatorColors.borderDark,
    padding: 12,
  },
  sessionsBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionsBarTitle: {
    color: CreovatorColors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: CreovatorColors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  newChatBtnText: {
    color: CreovatorColors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  sessionChipsScroll: {
    flexDirection: 'row',
  },
  sessionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: CreovatorColors.surfaceDark,
    borderWidth: 1,
    borderColor: CreovatorColors.borderDark,
    marginRight: 8,
    maxWidth: 160,
  },
  sessionChipActive: {
    borderColor: CreovatorColors.primaryLight,
    backgroundColor: CreovatorColors.primaryDark,
  },
  sessionChipText: {
    color: CreovatorColors.textMuted,
    fontSize: 12,
  },
  sessionChipTextActive: {
    color: CreovatorColors.textPrimary,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 24,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    paddingHorizontal: 20,
  },
  sparkleCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(249, 187, 30, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(249, 187, 30, 0.3)',
  },
  emptyTitle: {
    color: CreovatorColors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: CreovatorColors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  exampleCardList: {
    width: '100%',
    gap: 10,
  },
  exampleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: CreovatorColors.surfaceDark,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: CreovatorColors.borderDark,
  },
  exampleCardText: {
    color: CreovatorColors.textSecondary,
    fontSize: 12,
    flex: 1,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowAi: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: CreovatorColors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: CreovatorColors.borderDark,
    marginTop: 4,
  },
  messageBubble: {
    maxWidth: '82%',
    padding: 14,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: CreovatorColors.primaryDark,
    borderBottomRightRadius: 4,
    borderWidth: 1,
    borderColor: CreovatorColors.primary,
  },
  aiBubble: {
    backgroundColor: CreovatorColors.surfaceElevated,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: CreovatorColors.borderDark,
  },
  bubbleTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 8,
  },
  bubbleTagText: {
    color: CreovatorColors.primaryLight,
    fontSize: 11,
    fontWeight: '700',
  },
  messageText: {
    color: CreovatorColors.textPrimary,
    fontSize: 14,
    lineHeight: 22,
  },
  aiActionRow: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'flex-end',
  },
  aiActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  aiActionText: {
    color: CreovatorColors.primaryLight,
    fontSize: 12,
    fontWeight: '600',
  },
  generatingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  generatingText: {
    color: CreovatorColors.accentGold,
    fontSize: 13,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CreovatorColors.surfaceDark,
    borderTopWidth: 1,
    borderTopColor: CreovatorColors.borderDark,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: CreovatorColors.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CreovatorColors.borderDark,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: CreovatorColors.textPrimary,
    fontSize: 14,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: CreovatorColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: CreovatorColors.surfaceElevated,
  },
});

