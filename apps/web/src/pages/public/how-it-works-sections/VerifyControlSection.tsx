import React, { useState } from 'react';
import { UserCheck, Check, Edit3 } from 'lucide-react';
import { Container } from '../../../components/ui/Container';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

export const VerifyControlSection: React.FC = () => {
  const [testosteroneVal, setTestosteroneVal] = useState('2.8');
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleEditClick = () => {
    setIsEditing(true);
    setIsConfirmed(false);
  };

  const handleQuickCorrect = () => {
    setTestosteroneVal('2.3');
    setIsEditing(false);
    setIsConfirmed(true);
  };

  const handleConfirm = () => {
    setIsConfirmed(true);
    setIsEditing(false);
  };

  return (
    <section className="relative py-24 sm:py-32 bg-[#F8F5FA] text-[#1C1326] overflow-hidden">
      <Container size="xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Narrative */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <Badge variant="primary" showDot size="md">
              Phase 03 — Human Verification
            </Badge>

            <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-[#1C1326] leading-tight">
              03 — You stay in control of your information
            </h2>

            <p className="text-base sm:text-lg text-[#584B68] leading-relaxed font-sans">
              OCR can help parse values from laboratory reports, but extracted numbers must be reviewed
              and confirmed by you before they enter your analytical record. No noisy or misread data is saved automatically.
            </p>

            <div className="p-4 rounded-2xl bg-white border border-[#E7DFEF] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#EDE4F7] text-[#6E2D8B] flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <p className="text-xs text-[#584B68] leading-relaxed">
                <strong>Human-in-the-Loop Protocol:</strong> You inspect extracted numbers side-by-side with your original laboratory paper slip.
              </p>
            </div>
          </div>

          {/* Right Interactive Verification Card */}
          <div className="lg:col-span-6">
            <div className="p-8 sm:p-10 rounded-3xl bg-white border border-[#E7DFEF] shadow-xl space-y-6 max-w-md mx-auto">
              <div className="flex items-center justify-between border-b border-[#E7DFEF] pb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#8E3EAF] block">
                    Interactive Verification Demo
                  </span>
                  <h3 className="text-lg font-bold font-display text-[#1C1326]">
                    Extracted Lab Marker Review
                  </h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#EDE4F7] text-[#6E2D8B] text-[10px] font-bold">
                  Step 3 of 6
                </span>
              </div>

              {/* Marker Row */}
              <div className="p-4 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#584B68] font-bold font-display">
                    Total Testosterone
                  </span>
                  <span className="text-[10px] text-[#8D7E9E] font-mono">Original OCR: 2.8</span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold font-mono text-[#1C1326]">
                      {testosteroneVal}
                    </span>
                    <span className="text-xs text-[#584B68]">nmol/L</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isConfirmed ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleEditClick}
                          iconLeft={<Edit3 className="w-3.5 h-3.5" />}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleConfirm}
                          iconLeft={<Check className="w-3.5 h-3.5" />}
                        >
                          Confirm
                        </Button>
                      </>
                    ) : (
                      <span className="px-3 py-1.5 rounded-xl bg-[#ECFDF5] text-[#047857] text-xs font-bold flex items-center gap-1.5">
                        <Check className="w-4 h-4" />
                        Verified & Saved
                      </span>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="pt-2 border-t border-[#E7DFEF] flex items-center justify-between text-xs">
                    <span className="text-[#584B68]">Correct value from scan:</span>
                    <button
                      onClick={handleQuickCorrect}
                      className="px-2.5 py-1 rounded-lg bg-[#6E2D8B] text-white font-bold cursor-pointer hover:bg-[#8E3EAF] transition-colors"
                    >
                      Set to 2.3 nmol/L
                    </button>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-[#8D7E9E] text-center">
                Click <strong>Edit</strong> to simulate correcting an OCR value from 2.8 to 2.3 nmol/L.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};
