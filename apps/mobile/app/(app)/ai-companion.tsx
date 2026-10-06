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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';
import { BioPulseBackground } from '../../components/common/BioPulseBackground';
import { useAuth } from '../../features/authentication';
import { useHealthStore } from '../../store';

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

  const { pathway } = useAuth();
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
    {
      id: 'msg-2',
      sender: 'user',
      text: isFemale
        ? 'Why is irregular cycle an important factor in PCOS?'
        : 'Why is morning vitality an important factor in testosterone health?',
    },
    {
      id: 'msg-3',
      sender: 'assistant',
      text: isFemale
        ? 'Irregular menstrual cycles are an important factor because they often reflect hormonal imbalances, especially related to androgens and ovulation patterns. In PCOS, menstrual irregularity is a common sign and is strongly associated with higher screening risk.'
        : 'Morning vitality is an important factor because diurnal testosterone levels peak in the early morning hours following restful sleep. Reduced morning vitality often correlates with blunted circadian testosterone pulsatility.',
    },
  ];

  const [messages, setMessages] = useState<ChatMessage[]>(defaultMessages);
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');

    setTimeout(() => {
      let reply = '';
      const lower = text.toLowerCase();

      if (lower.includes('screening') || lower.includes('result')) {
        reply = isFemale
          ? `Your screening probability is ${screening.probabilityPercent || 28}% (${screening.riskBand || 'Moderate Risk'}). The model identified cycle patterns and metabolic markers as primary contributors.`
          : `Your screening probability is ${screening.probabilityPercent || 38}% (${screening.riskBand || 'Intermediate Risk'}). Early morning vitality and recovery time were the primary contributors.`;
      } else if (lower.includes('next') || lower.includes('do')) {
        reply = isFemale
          ? 'Recommended next steps: 1) Schedule clinical lab verification (FSH, LH, Fasting Insulin), 2) Focus on low-glycemic nutrition, and 3) Consult with an endocrinologist or gynecologist.'
          : 'Recommended next steps: 1) Schedule morning total testosterone testing, 2) Maintain consistent 7-8h sleep, and 3) Schedule an appointment with an andrologist or endocrinologist.';
      } else if (lower.includes('factor') || lower.includes('important')) {
        reply = isFemale
          ? 'Hormonal and lifestyle factors like insulin resistance directly stimulate ovarian androgen production. Addressing these factors early supports ovulatory rhythm.'
          : 'Metabolic markers and sleep duration strongly modulate endocrine signaling and androgen receptor sensitivity.';
      } else if (lower.includes('lab')) {
        reply =
          'You can upload your lab reports via our OCR tool or enter verified numbers manually under Track > Add Clinical Labs to generate refined clinical risk insights.';
      } else {
        reply =
          'Thank you for your question. Maintaining consistent nutrition, daily movement, and tracking your symptoms will provide the clearest pathway to optimal hormonal balance.';
      }

      const botMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        text: reply,
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 600);
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
});
