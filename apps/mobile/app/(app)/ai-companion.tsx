import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';
import { BioPulseBackground } from '../../components/common/BioPulseBackground';
import { useAuth } from '../../features/authentication';
import { useHealthStore } from '../../store';
import { companionService } from '../../services/companionService';

interface ChatMessage {
  id: string;
  sender: 'assistant' | 'user';
  text: string;
}

/**
 * SCREEN 36: AI COMPANION
 *
 * Strict visual match to Screenshot 36:
 * - Top Header:
 *   - Back chevron (<)
 *   - Center: Robot avatar, "BioPulse AI Companion", disclaimer:
 *     "Health information only. Not a replacement for medical care."
 *   - Right: 3-dots icon (⋮)
 * - Initial Bot Message:
 *   "Hello! I'm your BioPulse AI Companion. I can help you understand your results,
 *    suggest next steps, and answer your questions about PCOS and hormonal health.
 *    How can I help you today?"
 * - 4 Quick Prompts:
 *   - [ Explain my screening result ]
 *   - [ What should I do next? ]
 *   - [ Why is this factor important? ]
 *   - [ Explain my lab result ]
 * - User and Bot message bubbles (pink for user, light gray for bot)
 * - Bottom Input Bar:
 *   - Paperclip icon on left
 *   - Text input "Type your message..."
 *   - Pink circular send button with white paper plane icon
 */
export default function AiCompanionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const scrollViewRef = useRef<ScrollView>(null);

  const { user, pathway } = useAuth();
  const isFemale = pathway !== 'male_hypogonadism' && pathway !== 'male';
  const { screening } = useHealthStore();

  const quickPrompts = [
    'Explain my screening result',
    'What should I do next?',
    'Why is this factor important?',
    'Explain my lab result',
  ];

  const defaultMessages: ChatMessage[] = [
    {
      id: 'msg-1',
      sender: 'assistant',
      text: isFemale
        ? "Hello! I'm your BioPulse AI Companion. I can help you understand your results, suggest next steps, and answer your questions about PCOS and hormonal health.\n\nHow can I help you today?"
        : "Hello! I'm your BioPulse AI Companion. I can help you understand your results, suggest next steps, and answer your questions about testosterone and hormonal health.\n\nHow can I help you today?",
    },
  ];

  const [messages, setMessages] = useState<ChatMessage[]>(defaultMessages);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages, isTyping]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isTyping) return;

    setLastFailedMessage(null);
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    try {
      const history = messages.map((m) => ({
        sender: m.sender === 'user' ? ('user' as const) : ('companion' as const),
        text: m.text,
      }));

      const res = await companionService.sendMessage(user?.accessToken || '', {
        message: text.trim(),
        pathway: isFemale ? 'female' : 'male',
        conversation_history: history,
      });

      if (res.data?.reply || res.data?.message) {
        const botMsg: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          sender: 'assistant',
          text: res.data.reply || res.data.message,
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        setLastFailedMessage(text.trim());
        const botMsg: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          sender: 'assistant',
          text: res.error
            ? `Unable to connect to AI service: ${res.error}`
            : "I'm having trouble processing your question right now. Please check your connection and tap Retry.",
        };
        setMessages((prev) => [...prev, botMsg]);
      }
    } catch (err: any) {
      setLastFailedMessage(text.trim());
      const botMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        text: 'Network error communicating with BioPulse AI Companion. Please check your connection and tap Retry.',
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <BioPulseBackground />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.headerBtn}
          accessibilityLabel="Back"
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </Pressable>

        <View style={styles.headerCenter}>
          <View style={styles.botTitleRow}>
            <View style={styles.headerBotIconBox}>
              <MaterialCommunityIcons name="robot-outline" size={16} color="#0284C7" />
            </View>
            <Text style={styles.headerTitle}>BioPulse AI Companion</Text>
          </View>
          <Text style={styles.disclaimerText}>
            Health information only. Not a replacement for medical care.
          </Text>
        </View>

        <Pressable style={styles.headerBtn} hitSlop={8}>
          <Ionicons name="ellipsis-vertical" size={20} color="#0F172A" />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[
            styles.scrollContent,
            isTablet && styles.tabletContent,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Messages */}
          {messages.map((msg, index) => {
            const isBot = msg.sender === 'assistant';
            return (
              <React.Fragment key={msg.id}>
                <View style={[styles.msgRow, isBot ? styles.msgRowBot : styles.msgRowUser]}>
                  {isBot && (
                    <View style={styles.botAvatar}>
                      <MaterialCommunityIcons name="robot-outline" size={16} color="#0284C7" />
                    </View>
                  )}

                  <View
                    style={[
                      styles.bubble,
                      isBot ? styles.bubbleBot : styles.bubbleUser,
                    ]}
                  >
                    <Text
                      style={[
                        styles.bubbleText,
                        isBot ? styles.bubbleTextBot : styles.bubbleTextUser,
                      ]}
                    >
                      {msg.text}
                    </Text>
                  </View>
                </View>

                {/* Show quick prompts right after initial greeting */}
                {index === 0 && (
                  <View style={styles.promptsContainer}>
                    <View style={styles.promptsGrid}>
                      {quickPrompts.map((prompt, pIdx) => (
                        <Pressable
                          key={pIdx}
                          onPress={() => handleSend(prompt)}
                          style={({ pressed }) => [
                            styles.promptPill,
                            pressed && styles.promptPillPressed,
                          ]}
                        >
                          <Text style={styles.promptText}>{prompt}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}
              </React.Fragment>
            );
          })}

          {lastFailedMessage && !isTyping && (
            <View style={styles.retryRow}>
              <Text style={styles.retryInfoText}>Message delivery interrupted.</Text>
              <Pressable
                onPress={() => handleSend(lastFailedMessage)}
                style={[styles.retryBtn, { backgroundColor: isFemale ? '#E11D48' : '#0284C7' }]}
              >
                <Ionicons name="refresh" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.retryBtnText}>Retry</Text>
              </Pressable>
            </View>
          )}

          {isTyping && (
            <View style={[styles.msgRow, styles.msgRowBot, { marginTop: 4, opacity: 0.9 }]}>
              <View style={styles.botAvatar}>
                <MaterialCommunityIcons name="robot-outline" size={16} color="#0284C7" />
              </View>
              <View style={[styles.bubble, styles.bubbleBot, { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 14 }]}>
                <ActivityIndicator size="small" color={isFemale ? '#F43F7D' : '#0284C7'} />
                <Text style={[styles.bubbleText, styles.bubbleTextBot, { fontSize: 13, fontStyle: 'italic', color: '#64748B' }]}>
                  BioPulse AI is thinking...
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Bottom Input Bar */}
        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          <Pressable style={styles.attachBtn} hitSlop={8}>
            <Ionicons name="attach-outline" size={24} color="#64748B" />
          </Pressable>

          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your message..."
            placeholderTextColor="#94A3B8"
            multiline={false}
            onSubmitEditing={() => handleSend()}
            returnKeyType="send"
          />

          <Pressable
            onPress={() => handleSend()}
            style={({ pressed }) => [styles.sendBtn, pressed && styles.sendBtnPressed]}
          >
            <Ionicons name="send" size={16} color="#FFFFFF" style={{ marginLeft: 2 }} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAF5FF',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  botTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerBotIconBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  disclaimerText: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  tabletContent: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },

  // Message Rows
  msgRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  msgRowBot: {
    justifyContent: 'flex-start',
  },
  msgRowUser: {
    justifyContent: 'flex-end',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  bubbleBot: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  bubbleUser: {
    backgroundColor: '#FCE7F3',
    alignSelf: 'flex-end',
  },
  bubbleText: {
    fontSize: 13,
    lineHeight: 19,
  },
  bubbleTextBot: {
    color: '#334155',
  },
  bubbleTextUser: {
    color: '#0F172A',
  },

  // Quick Prompts Grid
  promptsContainer: {
    marginBottom: 16,
    paddingLeft: 42,
  },
  promptsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  promptPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  promptPillPressed: {
    backgroundColor: '#F0F9FF',
  },
  promptText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284C7',
  },

  // Bottom Input Bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 8,
  },
  attachBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    fontSize: 13,
    color: '#0F172A',
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E11D48',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  retryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginVertical: 6,
    marginHorizontal: 10,
  },
  retryInfoText: {
    fontSize: 12,
    color: '#991B1B',
    fontWeight: '500',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  retryBtnText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
