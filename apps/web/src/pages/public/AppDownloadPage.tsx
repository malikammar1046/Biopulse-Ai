import React, { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import {
  Download,
  QrCode,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  ChevronRight,
  HeartPulse,
  Lock,
  Layers,
  HelpCircle,
  Apple,
  RefreshCw,
} from 'lucide-react';
import { Container } from '../../components/ui/Container';
import { ROUTES } from '../../constants/routes';

// Release Metadata
const APP_RELEASE = {
  version: '1.0.0',
  versionCode: 100,
  appName: 'BioPulse AI',
  filename: 'biopulse-ai-v1.0.0.apk',
  downloadPath: '/downloads/biopulse-ai-v1.0.0.apk',
  mirrorPath: '/downloads/biopulse-ai-latest.apk',
  fileSizeFormatted: '68.7 MB',
  sha256: '9fe3521da73347f37a2dd7ae319d03a06bbbc22eed2e4a8f27812b3b76f498a9',
  minAndroidVersion: 'Android 8.0+ (Oreo, API 26)',
  targetAndroidVersion: 'Android 14.0 (API 34)',
  architecture: 'Universal (ARM64, ARMv7, x86_64)',
  releaseType: 'Official Production Release (Signed)',
  releaseDate: 'October 2026',
};

// Interactive Phone Mockup Screens
const MOBILE_SCREENS = [
  {
    id: 'home',
    label: 'Home',
    title: 'Dual-Pathway Dashboard',
    tagline: 'Endocrine intelligence tailored to your biological pathway',
    accent: '#0891B2',
    femaleTitle: 'OvaSense • Women’s Health',
    maleTitle: 'AndroSense • Men’s Health',
    badge: 'Real-time Sync',
    content: {
      headline: 'Good afternoon, Sarah',
      subhead: 'Day 14 • Follicular Phase • Low Risk Tier',
      metrics: [
        { label: 'Adherence', val: '94%', sub: 'Meds & Habits' },
        { label: 'Cycle Day', val: 'Day 14', sub: 'Estrogen Peak' },
        { label: 'Hydration', val: '2.2L', sub: 'Target Met' },
      ],
      insight: 'Follicular phase optimal vitality. Recommended next step: Log luteal transition symptom check-in.',
    },
  },
  {
    id: 'screening',
    label: 'Screening',
    title: 'AI Clinical Assessment',
    tagline: 'Tiered, cost-aware screening with SHAP biomarker explainability',
    accent: '#0284C7',
    badge: 'Clinical Grade',
    content: {
      headline: 'Tier 1 PCOS Assessment',
      subhead: 'Algorithmic Confidence: 92%',
      metrics: [
        { label: 'Risk Tier', val: 'Low / Mod', sub: 'Monitoring' },
        { label: 'Cycle Var.', val: '± 2 Days', sub: 'Stable' },
        { label: 'Biomarkers', val: 'Normal', sub: '4 Evaluated' },
      ],
      insight: 'Top SHAP factors: Menstrual regularity, balanced BMI (22.4), and optimal fasting glucose range.',
    },
  },
  {
    id: 'track',
    label: 'Track',
    title: 'Daily Symptom & Cycle',
    tagline: 'Instant micro-logging for fatigue, mood, pain, and medications',
    accent: '#F43F7D',
    badge: 'Quick Check-in',
    content: {
      headline: 'Today’s Health Signals',
      subhead: '2 Entries recorded today',
      metrics: [
        { label: 'Energy', val: 'High', sub: 'Vitality' },
        { label: 'Pelvic', val: 'Mild', sub: 'Normal rhythm' },
        { label: 'Sleep', val: '7.8 hrs', sub: 'Restful' },
      ],
      insight: 'Prescription Inositol taken on time. Symptom pattern shows 35% reduction in luteal fatigue.',
    },
  },
  {
    id: 'guidance',
    label: 'Guidance',
    title: 'Nutrition & Movement',
    tagline: 'Endocrine-targeted dietary plans and circadian workout guidance',
    accent: '#10B981',
    badge: 'Personalized',
    content: {
      headline: 'Hormone Balance Nutrition',
      subhead: 'Glycemic-stabilizing meal recommendations',
      metrics: [
        { label: 'Protein', val: '78g', sub: 'Target: 80g' },
        { label: 'Fiber', val: '32g', sub: 'Gut health' },
        { label: 'Activity', val: '35 min', sub: 'Strength/Yoga' },
      ],
      insight: 'High-fiber, low-glycemic lunch logged. Insulin sensitivity supported for follicular energy.',
    },
  },
  {
    id: 'profile',
    label: 'Profile',
    title: 'Care Circle & PDF Export',
    tagline: 'Instant doctor reports and granular family sharing permissions',
    accent: '#6366F1',
    badge: 'HIPAA Aligned',
    content: {
      headline: 'Clinical Export & Circle',
      subhead: 'Doctor & Trusted Person Sharing',
      metrics: [
        { label: 'Care Circle', val: '2 Active', sub: 'Dr. Martinez' },
        { label: 'PDF Summary', val: 'Ready', sub: 'Multi-Page A4' },
        { label: 'Security', val: 'AES-256', sub: 'Encrypted' },
      ],
      insight: 'Generate clinical-grade multi-page PDF health summaries ready for specialist consultation.',
    },
  },
];

export const AppDownloadPage: React.FC = () => {
  const [activeScreenIndex, setActiveScreenIndex] = useState(0);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [qrTargetMode, setQrTargetMode] = useState<'expo' | 'apk' | 'web'>('expo');
  const [copiedSha, setCopiedSha] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);

  // Compute live absolute URLs based on current host
  const { absoluteApkUrl, absoluteWebUrl, expoGoUrl } = useMemo(() => {
    let origin = 'https://biopulse.ai';
    let host = '192.168.10.7';
    if (typeof window !== 'undefined') {
      origin = window.location.origin;
      host = window.location.hostname || '192.168.10.7';
      if (host === 'localhost' || host === '127.0.0.1') {
        host = '192.168.10.7';
      }
    }
    return {
      absoluteApkUrl: `${origin}${APP_RELEASE.downloadPath}`,
      absoluteWebUrl: `${origin}${ROUTES.APP.ROOT}`,
      expoGoUrl: `exp://${host}:8081`,
    };
  }, []);

  const currentQrTarget =
    qrTargetMode === 'expo'
      ? expoGoUrl
      : qrTargetMode === 'apk'
      ? absoluteApkUrl
      : absoluteWebUrl;

  // Generate crisp QR code on mount and whenever target changes
  useEffect(() => {
    let isMounted = true;

    QRCode.toDataURL(currentQrTarget, {
      width: 320,
      margin: 1.5,
      color: {
        dark: '#073B72',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => {
        if (isMounted) setQrCodeDataUrl(url);
      })
      .catch((err) => {
        console.error('Failed to generate QR Code:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [currentQrTarget]);

  const handleCopySha = () => {
    navigator.clipboard.writeText(APP_RELEASE.sha256);
    setCopiedSha(true);
    setTimeout(() => setCopiedSha(false), 2500);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentQrTarget);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleDirectDownload = () => {
    setDownloadStarted(true);
    const link = document.createElement('a');
    link.href = APP_RELEASE.downloadPath;
    link.download = APP_RELEASE.filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => setDownloadStarted(false), 3500);
  };

  const activeScreen = MOBILE_SCREENS[activeScreenIndex];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F0F9FF] via-white to-[#F8FAFC] text-slate-800 pt-28 sm:pt-32 pb-24 overflow-hidden">
      {/* ── Background Ambient Blobs ── */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[550px] pointer-events-none overflow-hidden -z-10 opacity-70">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-200/40 rounded-full blur-3xl" />
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-sky-200/35 rounded-full blur-3xl" />
        <div className="absolute top-48 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-indigo-100/30 rounded-full blur-3xl" />
      </div>

      <Container>
        {/* ── Breadcrumb & Release Pill ── */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-100/80 border border-cyan-200 text-cyan-900 text-xs font-semibold">
            <Smartphone className="w-3.5 h-3.5 text-[#0891B2]" />
            Official BioPulse AI Mobile App
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Version {APP_RELEASE.version} Production Build
          </span>
        </div>

        {/* ── Main Hero Title ── */}
        <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#073B72] tracking-tight leading-tight">
            Clinical Health Intelligence,{' '}
            <span className="bg-gradient-to-r from-[#0891B2] via-[#0284C7] to-[#073B72] bg-clip-text text-transparent">
              Everywhere You Go
            </span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Install the native Android app directly onto your mobile phone. Scan the QR code or tap direct download to experience dual-pathway hormonal tracking, AI digital twin explanations, and lab OCR.
          </p>
        </div>

        {/* ── HERO GRID: Direct Download + Interactive QR Code + Phone Preview ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-20">
          {/* LEFT: Download & QR Code Hub (Col 7) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Direct Download Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-[0_12px_40px_rgba(7,59,114,0.06)] relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-[#073B72]">
                      Direct APK Download
                    </h2>
                    <span className="px-2 py-0.5 rounded-md bg-sky-100 text-[#0284C7] font-mono text-[11px] font-bold">
                      APK v{APP_RELEASE.version}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Authentic standalone release package signed with BioPulse release keystore.
                  </p>
                </div>

                <div className="text-right sm:text-right">
                  <span className="text-xs font-mono font-bold text-slate-700 block">
                    {APP_RELEASE.fileSizeFormatted}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Universal Android Build
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 space-y-3">
                <button
                  type="button"
                  onClick={handleDirectDownload}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#073B72] via-[#0868B9] to-[#0891B2] hover:from-[#06305C] hover:to-[#077C99] text-white font-bold text-sm sm:text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 cursor-pointer group active:scale-[0.99]"
                >
                  {downloadStarted ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-300 animate-bounce" />
                      <span>Download Started! Check Notifications</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5 transition-transform group-hover:-translate-y-0.5" />
                      <span>Download APK Direct (v{APP_RELEASE.version})</span>
                    </>
                  )}
                </button>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    Digitally signed • Verified safe • Zero malware
                  </span>

                  <a
                    href={APP_RELEASE.mirrorPath}
                    download="biopulse-ai-latest.apk"
                    className="inline-flex items-center gap-1 text-[#0891B2] hover:text-[#073B72] font-semibold transition-colors"
                  >
                    <span>Download Latest Mirror (.apk)</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Cryptographic SHA-256 Checksum Card */}
              <div className="mt-6 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#073B72]" />
                    SHA-256 Cryptographic Checksum
                  </span>
                  <button
                    type="button"
                    onClick={handleCopySha}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0891B2] hover:text-[#073B72] transition-colors cursor-pointer"
                  >
                    {copiedSha ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700 font-semibold">Hash Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Checksum</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="font-mono text-[10px] text-slate-600 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 truncate select-all">
                  {APP_RELEASE.sha256}
                </div>
              </div>
            </div>

            {/* QR Code Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-[0_12px_40px_rgba(7,59,114,0.06)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-[#073B72] flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-[#0891B2]" />
                    Scan with Your Mobile Phone
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {qrTargetMode === 'expo'
                      ? 'Scan with the Expo Go app or your camera to launch the native app.'
                      : qrTargetMode === 'apk'
                      ? 'Scan with your Android camera or Google Lens to download APK.'
                      : 'Scan to open the mobile web dashboard in your phone browser.'}
                  </p>
                </div>

                {/* QR Target Switcher */}
                <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setQrTargetMode('expo')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      qrTargetMode === 'expo'
                        ? 'bg-white text-[#073B72] shadow-xs font-bold'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Expo Go (Native)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQrTargetMode('apk')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      qrTargetMode === 'apk'
                        ? 'bg-white text-[#073B72] shadow-xs font-bold'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Direct APK
                  </button>
                  <button
                    type="button"
                    onClick={() => setQrTargetMode('web')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      qrTargetMode === 'web'
                        ? 'bg-white text-[#073B72] shadow-xs font-bold'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Web App PWA
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* QR Code Container */}
                <div className="relative p-3 rounded-2xl bg-gradient-to-b from-white to-slate-50 border-2 border-slate-200 shadow-sm shrink-0 group">
                  {qrCodeDataUrl ? (
                    <img
                      src={qrCodeDataUrl}
                      alt="BioPulse AI Mobile App Download QR Code"
                      className="w-52 h-52 sm:w-56 sm:h-56 rounded-xl object-contain"
                    />
                  ) : (
                    <div className="w-52 h-52 sm:w-56 sm:h-56 rounded-xl bg-slate-100 flex items-center justify-center">
                      <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
                    </div>
                  )}

                  {/* Center BioPulse Badge Overlay */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-md flex items-center justify-center pointer-events-none">
                    <HeartPulse className="w-5 h-5 text-[#0891B2]" />
                  </div>
                </div>

                {/* Instructions & Link Sharing */}
                <div className="space-y-3.5 text-left flex-1 min-w-0">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-cyan-100 text-[#0891B2] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        Point your mobile camera or barcode scanner at the QR code.
                      </p>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-cyan-100 text-[#0891B2] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        Tap the banner to begin downloading <span className="font-mono font-bold text-slate-800">{APP_RELEASE.filename}</span>.
                      </p>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-cyan-100 text-[#0891B2] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        Open the downloaded file and confirm installation on your Android phone.
                      </p>
                    </div>
                  </div>

                  {/* Scanned Destination Link */}
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Scanned Destination URL
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="font-mono text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 truncate flex-1 select-all">
                        {currentQrTarget}
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        title="Copy URL"
                        className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
                      >
                        {copiedLink ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Interactive Mobile Device Preview (Col 5) */}
          <div className="lg:col-span-5 flex flex-col items-center">
            {/* Screen Selector Pills */}
            <div className="w-full flex items-center justify-center gap-1.5 p-1.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs mb-6 overflow-x-auto max-w-sm">
              {MOBILE_SCREENS.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveScreenIndex(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    activeScreenIndex === idx
                      ? 'bg-[#073B72] text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Smartphone Mockup Frame */}
            <div className="relative w-[290px] sm:w-[320px] rounded-[48px] bg-slate-900 p-3 shadow-[0_25px_60px_rgba(7,59,114,0.18)] border-4 border-slate-800">
              {/* Speaker / Camera Notch */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-900 rounded-full z-20 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-slate-800 mr-2" />
                <div className="w-10 h-1 rounded-full bg-slate-800" />
              </div>

              {/* Mobile Screen Display Container */}
              <div className="w-full h-[580px] rounded-[38px] bg-[#0A101D] text-white overflow-hidden flex flex-col justify-between pt-8 pb-4 px-4 relative select-none">
                {/* Mobile Top Bar */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pb-2 border-b border-white/10 shrink-0">
                  <span>9:41</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>BioPulse Mobile</span>
                  </div>
                </div>

                {/* Animated Screen Content */}
                <div className="flex-1 py-3 overflow-y-auto min-h-0 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 font-mono">
                      {activeScreen.badge}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {activeScreen.label} View
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-white leading-tight">
                      {activeScreen.content.headline}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {activeScreen.content.subhead}
                    </p>
                  </div>

                  {/* Metrics 3-card row */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {activeScreen.content.metrics.map((m, i) => (
                      <div
                        key={i}
                        className="p-2 rounded-xl bg-white/5 border border-white/10 text-center"
                      >
                        <span className="text-[9px] text-slate-400 block truncate">
                          {m.label}
                        </span>
                        <span className="text-xs font-bold text-white block mt-0.5 truncate">
                          {m.val}
                        </span>
                        <span className="text-[8px] text-cyan-300 block truncate">
                          {m.sub}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Clinical Insight Card */}
                  <div className="p-3 rounded-2xl bg-gradient-to-b from-white/10 to-white/5 border border-white/15">
                    <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold text-cyan-300">
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      <span>BioPulse Intelligence</span>
                    </div>
                    <p className="text-[11px] text-slate-200 leading-snug">
                      {activeScreen.content.insight}
                    </p>
                  </div>

                  {/* Dual Pathway Quick Switch */}
                  <div className="p-2.5 rounded-xl bg-[#073B72]/60 border border-cyan-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HeartPulse className="w-4 h-4 text-cyan-400" />
                      <div className="text-left">
                        <span className="text-[10px] font-bold text-white block">
                          Pathway Toggle
                        </span>
                        <span className="text-[8px] text-slate-300 block">
                          Female (PCOS) &amp; Male (Hypogonadism)
                        </span>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-cyan-300 bg-cyan-950/70 px-2 py-0.5 rounded-full border border-cyan-500/40">
                      Active
                    </span>
                  </div>
                </div>

                {/* Mobile Bottom Tab Bar */}
                <div className="pt-2 border-t border-white/10 shrink-0">
                  <div className="grid grid-cols-5 gap-1 text-center">
                    {MOBILE_SCREENS.map((s, idx) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setActiveScreenIndex(idx)}
                        className={`py-1 rounded-lg text-[9px] font-medium transition-colors cursor-pointer ${
                          activeScreenIndex === idx
                            ? 'text-cyan-400 font-bold bg-white/10'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500 mt-3 text-center">
              Previewing: <span className="font-bold text-slate-700">{activeScreen.title}</span>
            </p>
          </div>
        </div>

        {/* ── SECTION 2: 5-Step Android Installation Guide ── */}
        <div className="mb-20">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0891B2] font-mono block mb-1">
              Easy Installation
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#073B72]">
              How to Install the BioPulse AI APK on Android
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Installing directly via APK takes less than 60 seconds. Follow these standard Android steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              {
                step: '01',
                title: 'Download APK',
                desc: 'Click "Download APK Direct" or scan the QR code above from your Android phone.',
              },
              {
                step: '02',
                title: 'Confirm Download',
                desc: 'If Chrome warns "File might be harmful", tap "Download anyway" to proceed.',
              },
              {
                step: '03',
                title: 'Open File',
                desc: 'Pull down your notifications bar or open your Downloads folder and tap the APK.',
              },
              {
                step: '04',
                title: 'Allow Source',
                desc: 'If prompted by Android security, tap Settings and enable "Allow from this source".',
              },
              {
                step: '05',
                title: 'Launch App',
                desc: 'Tap "Install" and open BioPulse AI to start your personalized health journey.',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs relative flex flex-col justify-between"
              >
                <div>
                  <span className="text-2xl font-extrabold text-cyan-600/30 font-mono block mb-2">
                    {item.step}
                  </span>
                  <h3 className="text-sm font-bold text-slate-800 mb-1.5">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-semibold text-[#0891B2]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Verified Safe</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── SECTION 3: iOS Users / PWA Guide ── */}
        <div className="bg-gradient-to-r from-[#073B72] to-[#0A2540] rounded-3xl p-6 sm:p-10 text-white shadow-xl mb-20 relative overflow-hidden">
          <div className="max-w-3xl relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Apple className="w-5 h-5 text-white/90" />
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 font-mono">
                Apple iOS &amp; iPhone Experience
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Using an iPhone or iPad? Install as a Web App
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              BioPulse AI runs natively on iOS as a Progressive Web App (PWA) with zero App Store friction. Enjoy full-screen performance, offline caching, and instant biometric logins.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-6">
              <div className="p-3.5 rounded-xl bg-white/10 border border-white/15">
                <span className="text-xs font-bold text-cyan-300 block mb-1">Step 1</span>
                <p className="text-xs text-slate-200">
                  Open <strong>biopulse.ai</strong> in Safari on your iPhone.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/10 border border-white/15">
                <span className="text-xs font-bold text-cyan-300 block mb-1">Step 2</span>
                <p className="text-xs text-slate-200">
                  Tap the <strong>Share</strong> button (box with upward arrow) at bottom.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/10 border border-white/15">
                <span className="text-xs font-bold text-cyan-300 block mb-1">Step 3</span>
                <p className="text-xs text-slate-200">
                  Scroll and select <strong>"Add to Home Screen"</strong>, then tap Add.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href={ROUTES.APP.ROOT}
                className="py-2.5 px-5 rounded-xl bg-white text-[#073B72] hover:bg-slate-100 font-bold text-xs transition-colors shadow-sm inline-flex items-center gap-2"
              >
                <span>Launch iOS Web App</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <span className="text-xs text-slate-300 font-medium">
                TestFlight Beta invitations opening soon for certified clinical testers.
              </span>
            </div>
          </div>
        </div>

        {/* ── SECTION 4: System Requirements & Specs ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-cyan-100 text-[#0891B2] flex items-center justify-center mb-3">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">
              Device Compatibility
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Engineered for low latency and smooth rendering across modern Android phones and tablets.
            </p>
            <ul className="space-y-2 text-xs text-slate-600 font-medium">
              <li className="flex items-center justify-between">
                <span>Minimum OS:</span>
                <span className="font-bold text-slate-800">Android 8.0 (API 26)</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Target OS:</span>
                <span className="font-bold text-slate-800">Android 14.0 (API 34)</span>
              </li>
              <li className="flex items-center justify-between">
                <span>CPU Architectures:</span>
                <span className="font-bold text-slate-800">Universal (ARM64, v7a, x86)</span>
              </li>
              <li className="flex items-center justify-between">
                <span>RAM Recommended:</span>
                <span className="font-bold text-slate-800">2 GB or higher</span>
              </li>
            </ul>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">
              Privacy &amp; Permissions
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              We strictly enforce minimal permission scoping aligned with clinical HIPAA standards.
            </p>
            <ul className="space-y-2 text-xs text-slate-600 font-medium">
              <li className="flex items-center justify-between">
                <span>Camera:</span>
                <span className="font-bold text-slate-800">Optional (Ultrasound/Lab OCR)</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Location:</span>
                <span className="font-bold text-slate-800">Never Requested</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Ad Trackers:</span>
                <span className="font-bold text-emerald-600">Zero (0) Trackers</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Network:</span>
                <span className="font-bold text-slate-800">TLS 1.3 Supabase Encryption</span>
              </li>
            </ul>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">
              Build &amp; Architecture
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Modern mobile stack utilizing React Native 0.76 and Expo 52 for native responsiveness.
            </p>
            <ul className="space-y-2 text-xs text-slate-600 font-medium">
              <li className="flex items-center justify-between">
                <span>Framework:</span>
                <span className="font-bold text-slate-800">React Native / Expo 52</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Navigation:</span>
                <span className="font-bold text-slate-800">Expo Router 4.0</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Offline Sync:</span>
                <span className="font-bold text-slate-800">Encrypted Local Storage</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Package ID:</span>
                <span className="font-bold text-slate-800">com.biopulse.app</span>
              </li>
            </ul>
          </div>
        </div>

        {/* ── SECTION 5: FAQs ── */}
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold text-[#073B72]">
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Everything you need to know about the BioPulse AI mobile APK.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: 'Why download the APK directly instead of Google Play Store?',
                a: 'Direct APK distribution allows us to ship instant updates, clinical algorithm refinements, and AI model upgrades directly to patients without multi-week app store approval delays. You also receive a 100% tracker-free build.',
              },
              {
                q: 'Is it completely safe to install this APK on my phone?',
                a: 'Yes. The APK is compiled and signed directly with the official BioPulse AI cryptographic key. You can independently verify the package integrity against the SHA-256 checksum displayed on this page.',
              },
              {
                q: 'Will my health data sync between the web dashboard and mobile app?',
                a: 'Yes. All biometrics, daily symptoms, cycle logs, medical lab reports, and Care Circle permissions sync securely across web and mobile in real time via encrypted Supabase cloud storage.',
              },
              {
                q: 'What should I do if my phone says "There was a problem parsing the package"?',
                a: 'This common Android message occurs if "Install unknown apps" is disabled for your browser/file manager, or if Android detects an unsigned standalone package. To resolve this: (1) Go to Android Settings > Apps > Chrome (or Files) > enable "Allow from this source"; or (2) Run the mobile app directly via Expo Go on your phone by opening apps/mobile and running "npx expo start"; or (3) Tap "Web App PWA" above to launch and install BioPulse directly to your home screen with zero parsing hurdles.',
              },
              {
                q: 'How do I update to future versions of BioPulse AI?',
                a: 'You can check this download page at any time for new releases. The app will also alert you within Settings whenever a new clinical release package is ready for download.',
              },
            ].map((faq, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs"
              >
                <h4 className="text-xs sm:text-sm font-bold text-slate-800 mb-1.5 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-[#0891B2] shrink-0" />
                  <span>{faq.q}</span>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed pl-6">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
};

export default AppDownloadPage;

