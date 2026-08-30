import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send } from 'lucide-react';
import { useUserHealth } from '../../context/UserHealthContext';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  'What phase am I in today?',
  'Why do I feel bloated today?',
  'What foods support my follicular energy?',
  'Prepare my doctor summary for Dr. Sara.',
];

export const FloatingOvaSenseAI: React.FC = () => {
  const { userProfile, isAiChatOpen, toggleAiChat, closeAiChat } = useUserHealth();
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_1',
      sender: 'ai',
      text: `Hello ${userProfile.fullName.split(' ')[0] || 'there'}! I'm your OvaSense AI Digital Twin. You are currently on Day 14 (Follicular phase). How can I assist your health tracking today?`,
      timestamp: 'Just now',
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isAiChatOpen) {
      scrollToBottom();
    }
  }, [messages, isAiChatOpen]);

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: 'Now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Contextual simulated responses
    setTimeout(() => {
      let replyText = `I've recorded that against your Day 14 timeline. In the follicular phase, rising estrogen typically enhances insulin sensitivity and cognitive energy. Let me know if you want to explore more!`;

      const lower = text.toLowerCase();
      if (lower.includes('phase')) {
        replyText = `You are on Day 14 of your cycle, entering the peak of the Follicular phase right before ovulation. Estrogen is at its optimal physiological curve for strength and focus.`;
      } else if (lower.includes('bloat') || lower.includes('bloated')) {
        replyText = `Mild bloating during mid-cycle is frequently linked to estrogen surges triggering mild fluid retention or delayed gastric motility. Hydration with electrolytes and ginger tea can help ease abdominal tension.`;
      } else if (lower.includes('food') || lower.includes('nutrition') || lower.includes('meal')) {
        replyText = `For follicular support, prioritize complex carbohydrates with lean protein (like your brown rice + moong daal lunch) and cruciferous greens (palak, broccoli) to support hepatic estrogen breakdown.`;
      } else if (lower.includes('doctor') || lower.includes('sara') || lower.includes('appointment')) {
        replyText = `I have compiled your 30-day symptom log, your latest ultrasound AFC measurements (Left Vol 11.4 cm³), and your HOMA-IR 2.4 lab report. Click 'Export Summary' on your dashboard anytime to generate your PDF!`;
      }

      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: replyText,
        timestamp: 'Just now',
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 900);
  };

  return (
    <>
      {/* ── Chat Modal Panel (Desktop & Mobile) ── */}
      <AnimatePresence>
        {isAiChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed bottom-20 sm:bottom-24 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[420px] max-h-[580px] h-[80vh] rounded-[32px] bg-gradient-to-b from-[#180A26] via-[#140822] to-[#0D0417] border border-white/20 shadow-2xl z-50 flex flex-col justify-between overflow-hidden text-white backdrop-blur-2xl select-none"
          >
            {/* Panel Header */}
            <div className="p-4 sm:p-5 bg-white/[0.04] border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#6E2D8B] via-[#8E3EAF] to-[#FB7185] flex items-center justify-center text-white shadow-md">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold font-display text-white">OvaSense AI</h3>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#34D399]/20 text-[#34D399] font-bold">
                      Digital Twin Active
                    </span>
                  </div>
                  <span className="text-[11px] text-[#A797BD] font-sans">
                    Non-diagnostic health companion
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={closeAiChat}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#CDBDD8] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-left text-xs font-sans">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${
                    m.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-gradient-to-r from-[#6E2D8B] to-[#8E3EAF] text-white rounded-br-xs shadow-md'
                        : 'bg-white/10 text-[#EDE4F7] border border-white/10 rounded-bl-xs'
                    }`}
                  >
                    {m.text}
                  </div>
                  <span className="text-[9px] font-mono text-[#8D7E9E] mt-1 px-1">
                    {m.timestamp}
                  </span>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-1.5 p-3 rounded-2xl bg-white/5 border border-white/10 w-20 text-[#D8B4FE]">
                  <div className="w-2 h-2 rounded-full bg-[#FB7185] animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-[#8E3EAF] animate-bounce delay-150" />
                  <div className="w-2 h-2 rounded-full bg-[#D8B4FE] animate-bounce delay-300" />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompt Chips */}
            <div className="p-3 bg-white/[0.02] border-t border-white/5 flex gap-1.5 overflow-x-auto no-scrollbar">
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-[#8E3EAF]/40 text-[10px] font-medium text-[#EDE4F7] whitespace-nowrap transition-colors cursor-pointer border border-white/10"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Message Input Box */}
            <div className="p-3 sm:p-4 bg-white/[0.04] border-t border-white/10">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Ask about cycles, symptoms, nutrition..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-2xl bg-[#12071F] border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-[#8E3EAF]"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="p-2.5 rounded-2xl bg-gradient-to-r from-[#8E3EAF] to-[#E87084] text-white hover:brightness-110 shadow-md disabled:opacity-40 transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating WhatsApp-Style Trigger Button ── */}
      <div className="fixed bottom-20 md:bottom-8 right-5 sm:right-8 z-40 select-none">
        <motion.button
          type="button"
          onClick={toggleAiChat}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          className="relative group p-3.5 sm:p-4 rounded-full bg-gradient-to-tr from-[#6E2D8B] via-[#8E3EAF] to-[#FB7185] text-white shadow-2xl shadow-purple-950/70 border-2 border-white/40 flex items-center justify-center cursor-pointer transition-transform"
          aria-label="Ask OvaSense"
        >
          {/* Subtle pulse wave ring */}
          <span className="absolute inset-0 rounded-full bg-[#FB7185]/30 animate-ping pointer-events-none" />

          <Sparkles className="w-6 h-6 text-white" />

          {/* Hover Tooltip (Desktop) */}
          <span className="hidden sm:group-hover:block absolute right-full mr-3 px-3 py-1.5 rounded-xl bg-[#180A26] text-white text-xs font-mono font-bold whitespace-nowrap shadow-xl border border-white/20">
            Ask OvaSense ✨
          </span>
        </motion.button>
      </div>
    </>
  );
};
