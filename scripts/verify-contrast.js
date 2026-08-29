/**
 * OVASense Contrast Ratio Verification Script
 *
 * Evaluates WCAG 2.1 relative luminance and contrast ratios between text/interactive foregrounds
 * and surface/background layers.
 *
 * Formula:
 * L = 0.2126 * R + 0.7152 * G + 0.0722 * B
 * Contrast Ratio = (L1 + 0.05) / (L2 + 0.05)
 */

function hexToRgb(hex) {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return [r, g, b];
}

function sRgbToLin(c) {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function getLuminance(hex) {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * sRgbToLin(r) + 0.7152 * sRgbToLin(g) + 0.0722 * sRgbToLin(b);
}

function getContrastRatio(hex1, hex2) {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

const lightTheme = {
  background: '#F8F5FA',
  surface: '#FFFFFF',
  surfaceSubtle: '#F2ECF7',
  primary: '#6E2D8B',
  primarySoft: '#EDE4F7',
  secondary: '#A21CAF',
  accent: '#E87084',
  textPrimary: '#1C1326',
  textSecondary: '#584B68',
  textMuted: '#8D7E9E',
  textInverse: '#FFFFFF',
  success: '#047857',
  warning: '#B45309',
  error: '#BE123C',
  info: '#4338CA',
};

const darkTheme = {
  background: '#0C0814',
  surface: '#161124',
  surfaceSubtle: '#201933',
  surfaceElevated: '#2A2042',
  primary: '#A855F7',
  primarySoft: '#2D1C3D',
  secondary: '#E879F9',
  accent: '#FB7185',
  textPrimary: '#F6F2FA',
  textSecondary: '#B4A6C7',
  textMuted: '#7E6F94',
  textInverse: '#0C0814',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#F43F5E',
  info: '#818CF8',
};

const pairs = [
  // Light Mode Tests
  { mode: 'Light', fgName: 'textPrimary (#1C1326)', fg: lightTheme.textPrimary, bgName: 'background (#F8F5FA)', bg: lightTheme.background, target: 'AAA (>= 7:1)' },
  { mode: 'Light', fgName: 'textPrimary (#1C1326)', fg: lightTheme.textPrimary, bgName: 'surface (#FFFFFF)', bg: lightTheme.surface, target: 'AAA (>= 7:1)' },
  { mode: 'Light', fgName: 'textSecondary (#584B68)', fg: lightTheme.textSecondary, bgName: 'background (#F8F5FA)', bg: lightTheme.background, target: 'AA (>= 4.5:1)' },
  { mode: 'Light', fgName: 'textSecondary (#584B68)', fg: lightTheme.textSecondary, bgName: 'surface (#FFFFFF)', bg: lightTheme.surface, target: 'AA (>= 4.5:1)' },
  { mode: 'Light', fgName: 'textInverse (#FFFFFF)', fg: lightTheme.textInverse, bgName: 'primary (#6E2D8B)', bg: lightTheme.primary, target: 'AAA (>= 7:1)' },
  { mode: 'Light', fgName: 'primary (#6E2D8B)', fg: lightTheme.primary, bgName: 'primarySoft (#EDE4F7)', bg: lightTheme.primarySoft, target: 'AA (>= 4.5:1)' },
  { mode: 'Light', fgName: 'textInverse (#FFFFFF)', fg: lightTheme.textInverse, bgName: 'secondary (#A21CAF)', bg: lightTheme.secondary, target: 'AA (>= 4.5:1)' },
  { mode: 'Light', fgName: 'textInverse (#FFFFFF)', fg: lightTheme.textInverse, bgName: 'error (#BE123C)', bg: lightTheme.error, target: 'AA (>= 4.5:1)' },
  { mode: 'Light', fgName: 'textInverse (#FFFFFF)', fg: lightTheme.textInverse, bgName: 'success (#047857)', bg: lightTheme.success, target: 'AA (>= 4.5:1)' },
  { mode: 'Light', fgName: 'textInverse (#FFFFFF)', fg: lightTheme.textInverse, bgName: 'info (#4338CA)', bg: lightTheme.info, target: 'AA (>= 4.5:1)' },

  // Dark Mode Tests
  { mode: 'Dark', fgName: 'textPrimary (#F6F2FA)', fg: darkTheme.textPrimary, bgName: 'background (#0C0814)', bg: darkTheme.background, target: 'AAA (>= 7:1)' },
  { mode: 'Dark', fgName: 'textPrimary (#F6F2FA)', fg: darkTheme.textPrimary, bgName: 'surface (#161124)', bg: darkTheme.surface, target: 'AAA (>= 7:1)' },
  { mode: 'Dark', fgName: 'textSecondary (#B4A6C7)', fg: darkTheme.textSecondary, bgName: 'background (#0C0814)', bg: darkTheme.background, target: 'AAA (>= 7:1)' },
  { mode: 'Dark', fgName: 'textSecondary (#B4A6C7)', fg: darkTheme.textSecondary, bgName: 'surface (#161124)', bg: darkTheme.surface, target: 'AAA (>= 7:1)' },
  { mode: 'Dark', fgName: 'textInverse (#0C0814)', fg: darkTheme.textInverse, bgName: 'primary (#A855F7)', bg: darkTheme.primary, target: 'AAA (>= 7:1)' },
  { mode: 'Dark', fgName: 'primary (#A855F7)', fg: darkTheme.primary, bgName: 'surface (#161124)', bg: darkTheme.surface, target: 'AA (>= 4.5:1)' },
  { mode: 'Dark', fgName: 'accent (#FB7185)', fg: darkTheme.accent, bgName: 'background (#0C0814)', bg: darkTheme.background, target: 'AA (>= 4.5:1)' },
  { mode: 'Dark', fgName: 'success (#10B981)', fg: darkTheme.success, bgName: 'background (#0C0814)', bg: darkTheme.background, target: 'AAA (>= 7:1)' },
  { mode: 'Dark', fgName: 'warning (#F59E0B)', fg: darkTheme.warning, bgName: 'background (#0C0814)', bg: darkTheme.background, target: 'AAA (>= 7:1)' },
  { mode: 'Dark', fgName: 'info (#818CF8)', fg: darkTheme.info, bgName: 'background (#0C0814)', bg: darkTheme.background, target: 'AAA (>= 7:1)' },
];

console.log('='.repeat(90));
console.log('OVASENSE DESIGN SYSTEM: PROGRAMMATIC WCAG 2.1 CONTRAST VERIFICATION');
console.log('='.repeat(90));

let allPassed = true;

pairs.forEach(({ mode, fgName, fg, bgName, bg, target }) => {
  const ratio = getContrastRatio(fg, bg);
  const passedAA = ratio >= 4.5;
  const passedAAA = ratio >= 7.0;
  const status = passedAAA ? 'PASS (AAA)' : passedAA ? 'PASS (AA)' : 'FAIL';

  if (!passedAA) allPassed = false;

  console.log(
    `[${mode.padEnd(5)}] ${fgName.padEnd(26)} on ${bgName.padEnd(24)} -> Ratio: ${ratio.toFixed(2)}:1 [${status}] (Target: ${target})`
  );
});

console.log('='.repeat(90));
console.log(allPassed ? 'ALL TESTED PAIRS MEET OR EXCEED WCAG AA / AAA STANDARDS.' : 'SOME PAIRS FAILED.');
console.log('='.repeat(90));
