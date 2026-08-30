import React from 'react';
import { Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import type { DigitalTwinInsight } from '../../types/dashboard';

interface DigitalTwinProps {
  insight: DigitalTwinInsight;
  onOpenChat: (prompt?: string) => void;
}

export const DigitalTwinInsightCard: React.FC<DigitalTwinProps> = ({ insight, onOpenChat }) => {
  return (
    <div className="p-6 sm:p-7 rounded-[32px] bg-gradient-to-br from-[#1C0D2E] via-[#140822] to-[#0F041B] text-white shadow-lg flex flex-col justify-between select-none text-left space-y-6 relative overflow-hidden border border-white/10">
      {/* Background Volumetric Glows */}
      <div className="absolute top-0 right-0 w-56 h-56 bg-gradient-to-bl from-[#8E3EAF]/30 to-transparent rounded-full blur-2xl pointer-events-none" />

      {/* Top Header & Identity Tag */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar / Emblem */}
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#6E2D8B] via-[#8E3EAF] to-[#FB7185] flex items-center justify-center text-white shadow-md shadow-purple-950/40">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold font-display text-white">Your Health Insights</h3>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-[#8E3EAF]/30 text-[#D8B4FE] border border-[#8E3EAF]/40">
                AI That Explains
              </span>
            </div>
            <span className="text-xs text-[#B4A6C7] font-sans">
              Helpful patterns found from your logs
            </span>
          </div>
        </div>

        <span className="w-2.5 h-2.5 rounded-full bg-[#34D399] shadow-[0_0_8px_#34D399] animate-pulse" />
      </div>

      {/* Main Narrative Content */}
      <div className="relative z-10 space-y-3">
        <p className="text-sm sm:text-base text-[#EDE4F7] font-medium leading-relaxed font-sans">
          "{insight.summary}"
        </p>

        {/* Pattern Bullet Highlights */}
        <div className="space-y-1.5 pt-1">
          {insight.detectedPatterns.map((pat, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-[#CDBDD8]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399] shrink-0 mt-0.5" />
              <span>{pat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Button to Open AI Chat */}
      <div className="relative z-10 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onOpenChat(insight.suggestedChatPrompt)}
          className="w-full sm:w-auto px-5 py-2.5 rounded-2xl font-sans font-bold text-xs text-white bg-gradient-to-r from-[#8E3EAF] to-[#E87084] hover:brightness-110 shadow-lg shadow-purple-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer group"
        >
          <Sparkles className="w-4 h-4 text-white" />
          <span>Ask a Question</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </button>

        <span className="text-[11px] font-mono text-[#A797BD]">Informational (not a diagnosis)</span>
      </div>
    </div>
  );
};
