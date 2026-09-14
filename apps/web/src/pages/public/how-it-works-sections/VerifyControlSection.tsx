import React, { useState } from 'react';
import { UserCheck, Check, Edit3, ShieldAlert } from 'lucide-react';
import { Container } from '../../../components/ui/Container';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

export const VerifyControlSection: React.FC = () => {
  const [activePathway, setActivePathway] = useState<'womens' | 'mens'>('womens');
  
  // Women's state
  const [lhVal, setLhVal] = useState('8.4');
  const [lhEditing, setLhEditing] = useState(false);
  const [lhConfirmed, setLhConfirmed] = useState(false);

  // Men's state
  const [testosteroneVal, setTestosteroneVal] = useState('8.2');
  const [isMorningTiming, setIsMorningTiming] = useState(true);
  const [testoEditing, setTestoEditing] = useState(false);
  const [testoConfirmed, setTestoConfirmed] = useState(false);

  return (
    <section className="relative py-24 sm:py-32 bg-[#F8F5FA] text-[#1C1326] overflow-hidden">
      <Container size="xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Narrative */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <Badge variant="primary" showDot size="md">
              Human-in-the-Loop Verification
            </Badge>

            <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-[#1C1326] leading-tight">
              You stay in complete control of your health data
            </h2>

            <p className="text-base sm:text-lg text-[#584B68] leading-relaxed font-sans">
              Algorithmic document reading is helpful, but healthcare decisions demand uncompromising accuracy. In BIOPulse AI, every single parsed number must be inspected and verified by you before it enters your screening profile.
            </p>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-white border border-[#E7DFEF] flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EDE4F7] text-[#6E2D8B] flex items-center justify-center shrink-0 mt-0.5">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div className="space-y-1 text-xs text-[#584B68]">
                  <strong className="text-[#1C1326] block">Direct Human Verification</strong>
                  <p className="leading-relaxed">
                    Compare the parsed digital field directly against your paper slip. Fix OCR misreads with one tap.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#E7DFEF] flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFF0F2] text-[#E87084] flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="space-y-1 text-xs text-[#584B68]">
                  <strong className="text-[#1C1326] block">Contextual Specimen Timing</strong>
                  <p className="leading-relaxed">
                    For sensitive biomarkers — such as morning testosterone draws (men) or cycle day-3 gonadotropins (women) — BIOPulse AI records testing conditions so the evaluation reflects accurate clinical realities.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Interactive Verification Card */}
          <div className="lg:col-span-6">
            <div className="p-8 sm:p-10 rounded-3xl bg-white border border-[#E7DFEF] shadow-xl space-y-6 max-w-md mx-auto">
              <div className="flex items-center justify-between border-b border-[#E7DFEF] pb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#8E3EAF] block">
                    Interactive Verification Sandbox
                  </span>
                  <h3 className="text-base font-bold font-display text-[#1C1326]">
                    Inspect & Confirm Extracted Analyte
                  </h3>
                </div>
                {/* Switcher */}
                <div className="flex bg-[#EDE4F7] p-0.5 rounded-xl text-[10px] font-bold">
                  <button
                    onClick={() => setActivePathway('womens')}
                    className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                      activePathway === 'womens' ? 'bg-[#6E2D8B] text-white shadow-sm' : 'text-[#6E2D8B]'
                    }`}
                  >
                    PCOS Lab
                  </button>
                  <button
                    onClick={() => setActivePathway('mens')}
                    className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                      activePathway === 'mens' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-[#584B68]'
                    }`}
                  >
                    Male Lab
                  </button>
                </div>
              </div>

              {/* Marker Row - Women's */}
              {activePathway === 'womens' ? (
                <div className="p-4 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#584B68] font-bold font-display">
                      Serum Luteinizing Hormone (LH)
                    </span>
                    <span className="text-[10px] text-[#8D7E9E] font-mono">Scanned: 8.4</span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold font-mono text-[#1C1326]">
                        {lhVal}
                      </span>
                      <span className="text-xs text-[#584B68]">mIU/mL</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {!lhConfirmed ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setLhEditing(true);
                              setLhConfirmed(false);
                            }}
                            iconLeft={<Edit3 className="w-3.5 h-3.5" />}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              setLhConfirmed(true);
                              setLhEditing(false);
                            }}
                            iconLeft={<Check className="w-3.5 h-3.5" />}
                          >
                            Confirm
                          </Button>
                        </>
                      ) : (
                        <span className="px-3 py-1.5 rounded-xl bg-[#ECFDF5] text-[#047857] text-xs font-bold flex items-center gap-1.5">
                          <Check className="w-4 h-4" />
                          Verified
                        </span>
                      )}
                    </div>
                  </div>

                  {lhEditing && (
                    <div className="pt-2 border-t border-[#E7DFEF] flex items-center justify-between text-xs">
                      <span className="text-[#584B68]">Correct value from report:</span>
                      <button
                        onClick={() => {
                          setLhVal('7.9');
                          setLhEditing(false);
                          setLhConfirmed(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#6E2D8B] text-white font-bold cursor-pointer hover:bg-[#8E3EAF] transition-colors"
                      >
                        Set to 7.9 mIU/mL
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Marker Row - Men's */
                <div className="p-4 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#584B68] font-bold font-display">
                      Total Serum Testosterone
                    </span>
                    <span className="text-[10px] text-[#8D7E9E] font-mono">Scanned: 8.2</span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold font-mono text-[#1C1326]">
                        {testosteroneVal}
                      </span>
                      <span className="text-xs text-[#584B68]">nmol/L</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {!testoConfirmed ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setTestoEditing(true);
                              setTestoConfirmed(false);
                            }}
                            iconLeft={<Edit3 className="w-3.5 h-3.5" />}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              setTestoConfirmed(true);
                              setTestoEditing(false);
                            }}
                            iconLeft={<Check className="w-3.5 h-3.5" />}
                          >
                            Confirm
                          </Button>
                        </>
                      ) : (
                        <span className="px-3 py-1.5 rounded-xl bg-[#ECFDF5] text-[#047857] text-xs font-bold flex items-center gap-1.5">
                          <Check className="w-4 h-4" />
                          Verified
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Timing Verification Checkbox */}
                  <div className="pt-2 border-t border-[#E7DFEF] flex items-center justify-between text-xs">
                    <span className="text-[#584B68]">Morning draw (7:00–10:00 AM)?</span>
                    <button
                      onClick={() => setIsMorningTiming(!isMorningTiming)}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-bold cursor-pointer transition-colors ${
                        isMorningTiming ? 'bg-[#2563EB] text-white' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {isMorningTiming ? 'Yes (Morning Peak)' : 'No / Afternoon'}
                    </button>
                  </div>

                  {testoEditing && (
                    <div className="pt-2 border-t border-[#E7DFEF] flex items-center justify-between text-xs">
                      <span className="text-[#584B68]">Correct value from report:</span>
                      <button
                        onClick={() => {
                          setTestosteroneVal('8.6');
                          setTestoEditing(false);
                          setTestoConfirmed(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#2563EB] text-white font-bold cursor-pointer hover:bg-blue-700 transition-colors"
                      >
                        Set to 8.6 nmol/L
                      </button>
                    </div>
                  )}
                </div>
              )}

              <p className="text-[11px] text-[#8D7E9E] text-center">
                Click <strong>Edit</strong> to simulate correcting an OCR value before committing to the record.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};
