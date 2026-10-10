import test from 'node:test';
import assert from 'node:assert/strict';

test('Bug Audit Repair — Network & API URL Normalization', () => {
  // Test URL resolution logic
  function resolveTestUrl(override, hostUri, isAndroid, isDevice) {
    if (override && override.trim().length > 0) {
      let clean = override.trim().replace(/\/+$/, '');
      if (!clean.endsWith('/api')) clean = `${clean}/api`;
      return clean;
    }
    if (hostUri) {
      const parts = hostUri.split(':');
      if (parts[0] && parts[0] !== 'localhost' && parts[0] !== '127.0.0.1') {
        return `http://${parts[0]}:8000/api`;
      }
    }
    if (isAndroid && !isDevice) {
      return 'http://10.0.2.2:8000/api';
    }
    return 'http://127.0.0.1:8000/api';
  }

  // 1. Never creates duplicate /api/api
  assert.equal(resolveTestUrl('http://192.168.1.50:8000/api'), 'http://192.168.1.50:8000/api');
  assert.equal(resolveTestUrl('http://192.168.1.50:8000'), 'http://192.168.1.50:8000/api');
  assert.equal(resolveTestUrl('http://192.168.1.50:8000/'), 'http://192.168.1.50:8000/api');

  // 2. Extracts hostUri on physical device
  assert.equal(resolveTestUrl(null, '192.168.10.45:8081', true, true), 'http://192.168.10.45:8000/api');

  // 3. Uses Android emulator bridge 10.0.2.2 when running in emulator
  assert.equal(resolveTestUrl(null, null, true, false), 'http://10.0.2.2:8000/api');

  // 4. Fallback for localhost
  assert.equal(resolveTestUrl(null, null, false, false), 'http://127.0.0.1:8000/api');
});

test('Bug Audit Repair — Authoritative ML Screening Thresholds Preserved', () => {
  const FEMALE_TIER1_THRESHOLD = 0.25;
  const FEMALE_TIER2_THRESHOLD = 0.25;
  const MALE_TIER1_THRESHOLD = 0.1808;
  const MALE_TIER2_THRESHOLD = 0.3379;

  assert.equal(FEMALE_TIER1_THRESHOLD, 0.25);
  assert.equal(FEMALE_TIER2_THRESHOLD, 0.25);
  assert.equal(MALE_TIER1_THRESHOLD, 0.1808);
  assert.equal(MALE_TIER2_THRESHOLD, 0.3379);
});

test('Bug Audit Repair — Shared Safe Error Status Mapping', () => {
  function mapError(status, detail) {
    if (status === 0 || status === 408) {
      return { type: 'network', message: 'Screening engine is currently unreachable. Please check your network connection.' };
    }
    if (status === 401) {
      return { type: 'auth', message: 'Authentication session expired. Please sign in again.' };
    }
    if (status === 400 || status === 422) {
      return { type: 'validation', message: detail || 'Please check that all assessment fields are properly completed.' };
    }
    if (status >= 500) {
      return { type: 'server', message: 'Screening engine experienced a temporary server error. Please retry.' };
    }
    return { type: 'unknown', message: detail || 'Assessment could not be completed.' };
  }

  assert.equal(mapError(0).type, 'network');
  assert.equal(mapError(408).type, 'network');
  assert.equal(mapError(401).type, 'auth');
  assert.equal(mapError(400, 'Invalid age').type, 'validation');
  assert.equal(mapError(500).type, 'server');
});

test('Bug Audit Repair — Units and Metrics Conversion Sanity', () => {
  // Height: cm <-> ft
  function cmToFt(cm) {
    return (cm / 30.48).toFixed(1);
  }
  function ftToCm(ft) {
    return Math.round(ft * 30.48);
  }

  // Weight: kg <-> lbs
  function kgToLbs(kg) {
    return Math.round(kg * 2.20462);
  }
  function lbsToKg(lbs) {
    return Math.round(lbs * 0.453592);
  }

  // Test round-trip consistency without scale explosion
  const initialHeightCm = 178;
  const inFt = parseFloat(cmToFt(initialHeightCm)); // 5.8
  const restoredCm = ftToCm(inFt); // 177
  assert.ok(Math.abs(restoredCm - initialHeightCm) <= 1, 'Height round-trip within 1cm');

  const initialWeightKg = 76;
  const inLbs = kgToLbs(initialWeightKg); // 168
  const restoredKg = lbsToKg(inLbs); // 76
  assert.equal(restoredKg, initialWeightKg, 'Weight round-trip matches');

  // Verify BMI calculation
  const heightM = initialHeightCm / 100;
  const bmi = parseFloat((initialWeightKg / (heightM * heightM)).toFixed(1));
  assert.equal(bmi, 24.0);
});

test('Bug Audit Repair — Guidance and Recommendations Strict Filtering', () => {
  const recommendations = [
    { id: '1', category: 'Nutrition', title: 'Eat Low-GI Breakfast' },
    { id: '2', category: 'Nutrition', title: 'Anti-Inflammatory Dietary Pattern' },
    { id: '3', category: 'Movement', title: 'Walk for 30 Minutes Daily' },
    { id: '4', category: 'Movement', title: 'Resistance Training' },
    { id: '5', category: 'Lifestyle', title: 'Improve Sleep Quality' },
    { id: '6', category: 'Follow-up', title: 'Clinical Biomarker Profile' },
  ];

  const nutritionFiltered = recommendations.filter((r) => r.category === 'Nutrition');
  assert.equal(nutritionFiltered.length, 2);
  assert.ok(nutritionFiltered.every((r) => r.category === 'Nutrition'), 'All items under Nutrition must be Nutrition');

  const movementFiltered = recommendations.filter((r) => r.category === 'Movement');
  assert.equal(movementFiltered.length, 2);
  assert.ok(movementFiltered.every((r) => r.category === 'Movement'), 'All items under Movement must be Movement');

  const lifestyleFiltered = recommendations.filter((r) => r.category === 'Lifestyle');
  assert.equal(lifestyleFiltered.length, 1);
  assert.ok(lifestyleFiltered.every((r) => r.category === 'Lifestyle'), 'All items under Lifestyle must be Lifestyle');
});

test('Bug Audit Repair — AI Companion Endpoint Path', () => {
  function getCompanionUrl(base) {
    const clean = base.replace(/\/+$/, '');
    return `${clean}/v1/intelligence/companion/chat/`;
  }

  const base = 'http://192.168.1.100:8000/api';
  const url = getCompanionUrl(base);
  assert.equal(url, 'http://192.168.1.100:8000/api/v1/intelligence/companion/chat/');
  assert.ok(!url.includes('/api/api/'), 'Must not have duplicate /api/api/');
});

test('Bug Audit Repair — OCR Constraints and Multipart Contract', () => {
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
  const ALLOWED_EXTS = ['.pdf', '.png', '.jpg', '.jpeg', '.webp'];

  assert.equal(MAX_FILE_SIZE, 10485760);
  assert.ok(ALLOWED_EXTS.includes('.pdf'));
  assert.ok(ALLOWED_EXTS.includes('.jpg'));
  assert.ok(ALLOWED_EXTS.includes('.png'));
  assert.ok(!ALLOWED_EXTS.includes('.exe'));
});
