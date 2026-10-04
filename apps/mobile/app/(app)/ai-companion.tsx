import React, { useState, useRef } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';
import { AuthBackgroundFoliage } from '../../components/auth/AuthBackgroundFoliage';
import { useAuth } from '../../features/authentication';
import { BioPulseBottomNav, BOTTOM_NAV_HEIGHT } from '../../components/navigation';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  time: string;
}

export default function AiCompanionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const scrollViewRef = useRef<ScrollView>(null);

  const { pathway } = useAuth();
  const isFemale = pathway !== 'male_hypogonadism' && pathway !== 'male';
  const themeAccent = isFemale ? BioPulseColors.femaleAccent : BioPulseColors.malePrimary;

  const quickPrompts = isFemale
    ? [
        'Explain my PCOS screening result',
        'What should I do next?',
        'Why does insulin affect androgens?',
        'Recommend South Asian meals',
      ]
    : [
        'Explain my hypogonadism screening',
        'What should I do next?',
        'How does sleep affect testosterone?',
        'Recommend morning lab tests',
      ];

  const initialMessages: ChatMessage[] = [
    {
      id: '1',
      sender: 'assistant',
      text: isFemale
        ? 'Hello! I am your BioPulse AI Health Companion. I can help explain your PCOS screening results, discuss Rotterdam diagnostic criteria, and suggest evidence-based lifestyle changes.'
        : 'Hello! I am your BioPulse AI Health Companion. I can help explain your late-onset hypogonadism screening results, explain your ADAM symptom score, and suggest endocrine optimization protocols.',
      time: 'Just now',
    },
  ];

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputText, setInputText] = useState('');

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: text.trim(),
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');

    setTimeout(() => {
      let botReply = '';
      const lower = text.toLowerCase();

      if (lower.includes('explain') || lower.includes('result') || lower.includes('screening')) {
        botReply = isFemale
          ? 'Your screening evaluated menstrual regularity, acne/hirsutism symptoms, and BMI. These phenotypic drivers align with Rotterdam Consensus criteria for elevated risk of anovulatory cycles.'
          : 'Your screening assessed your Saint Louis University ADAM symptom score, waist metrics, and sleep. Affirmative sexual vitality and fatigue markers indicate potential late-onset androgen deficiency.';
      } else if (lower.includes('next') || lower.includes('do')) {
        botReply = isFemale
          ? 'Your recommended next step is Tier 2 confirmatory laboratory testing (Total/Free Testosterone, LH/FSH ratio, Fasting Insulin) and scheduling a consult with a reproductive endocrinologist or gynecologist.'
          : 'Your recommended next step is Tier 2 morning laboratory confirmation (8:00 AM Total & Free Testosterone with SHBG) and consulting with a clinical andrologist or urologist.';
      } else if (lower.includes('sleep') || lower.includes('insulin')) {
        botReply = isFemale
          ? 'Hyperinsulinemia stimulates ovarian theca cells to overproduce androgens while suppressing SHBG in the liver. Controlling glucose swings directly lowers free testosterone.'
          : 'Over 60% of diurnal testosterone production occurs during unbroken REM and slow-wave sleep. Chronic short sleep directly suppresses pituitary LH release.';
      } else {
        botReply =
          'Thank you for your question. Maintaining consistent nutrition, daily movement, and scheduling confirmatory laboratory biomarkers will provide the clearest clinical pathway.';
      }

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: botReply,
        time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 600);
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <AuthBackgroundFoliage />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={BioPulseColors.navy} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>BioPulse AI Companion</Text>
          <Text style={styles.headerSub}>Health Intelligence Assistant</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Medical Disclaimer Banner */}
      <View style={styles.disclaimerStrip}>
        <Ionicons name="shield-checkmark" size={14} color="#0369A1" />
        <Text style={styles.disclaimerText}>
          Health information & decision-support only. Not a medical diagnosis or prescription.
        </Text>
      </View>

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[
          styles.chatContent,
          isTablet && styles.tabletChatContent,
          { paddingBottom: BOTTOM_NAV_HEIGHT + insets.bottom + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Messages */}
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <View
              key={msg.id}
              style={[
                styles.messageRow,
                isUser ? styles.messageRowUser : styles.messageRowAssistant,
              ]}
            >
              {!isUser && (
                <View style={[styles.botAvatar, { backgroundColor: themeAccent }]}>
                  <Ionicons name="sparkles" size={14} color="#FFFFFF" />
                </View>
              )}

              <View
                style={[
                  styles.bubble,
                  isUser
                    ? [styles.bubbleUser, { backgroundColor: themeAccent }]
                    : styles.bubbleAssistant,
                ]}
              >
                <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
                  {msg.text}
                </Text>
                <Text style={[styles.bubbleTime, isUser && styles.bubbleTimeUser]}>
                  {msg.time}
                </Text>
              </View>
            </View>
          );
        })}

        {/* Quick Prompts */}
        <View style={styles.promptsContainer}>
          <Text style={styles.promptsTitle}>Suggested Prompts</Text>
          <View style={styles.promptsGrid}>
            {quickPrompts.map((prompt, i) => (
              <Pressable
                key={i}
                onPress={() => handleSendMessage(prompt)}
                style={styles.promptChip}
              >
                <Text style={styles.promptChipText}>{prompt}</Text>
                <Ionicons name="arrow-up-circle" size={16} color={themeAccent} />
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Input Bar */}
      <View
        style={[
          styles.inputBar,
          {
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}
      >
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask BioPulse AI about your health..."
          placeholderTextColor="#94A3B8"
          style={styles.textInput}
          onSubmitEditing={() => handleSendMessage()}
        />
        <Pressable
          onPress={() => handleSendMessage()}
          style={({ pressed }) => [
            styles.sendBtn,
            { backgroundColor: themeAccent },
            pressed && styles.sendBtnPressed,
          ]}
        >
          <Ionicons name="send" size={16} color="#FFFFFF" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BioPulseColors.navy,
  },
  headerSub: {
    fontSize: 11,
    color: BioPulseColors.secondaryText,
  },
  disclaimerStrip: {
    backgroundColor: '#F0F9FF',
    paddingVertical: 6,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#BAE6FD',
  },
  disclaimerText: {
    fontSize: 11,
    color: '#0369A1',
    fontWeight: '500',
  },
  chatContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  tabletChatContent: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 14,
    alignItems: 'flex-end',
    gap: 8,
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowAssistant: {
    justifyContent: 'flex-start',
  },
  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    maxWidth: '80%',
    padding: 14,
    borderRadius: 16,
  },
  bubbleUser: {
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    color: '#1E293B',
    lineHeight: 20,
  },
  bubbleTextUser: {
    color: '#FFFFFF',
  },
  bubbleTime: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  bubbleTimeUser: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  promptsContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  promptsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: BioPulseColors.secondaryText,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  promptsGrid: {
    gap: 8,
  },
  promptChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  promptChipText: {
    fontSize: 13,
    color: BioPulseColors.navy,
    fontWeight: '500',
  },
  inputBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  textInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#F8FAFC',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#1E293B',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnPressed: {
    opacity: 0.85,
  },
});
