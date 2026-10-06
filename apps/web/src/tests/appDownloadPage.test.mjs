/**
 * apps/web/src/tests/appDownloadPage.test.mjs
 *
 * Automated verification test suite for BioPulse AI Dedicated Mobile App Page & Authentic APK Download.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const thisDir = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(thisDir, '..', '..');

test('1. Authentic APK binary and release metadata exist and pass integrity checks', () => {
  const apkPath = path.join(webRoot, 'public', 'downloads', 'biopulse-ai-v1.0.0.apk');
  const latestPath = path.join(webRoot, 'public', 'downloads', 'biopulse-ai-latest.apk');
  const rootLatestPath = path.join(webRoot, 'public', 'biopulse-ai-latest.apk');
  const releaseInfoPath = path.join(webRoot, 'public', 'downloads', 'release-info.json');

  assert.ok(fs.existsSync(apkPath), 'biopulse-ai-v1.0.0.apk must exist in public/downloads/');
  assert.ok(fs.existsSync(latestPath), 'biopulse-ai-latest.apk must exist in public/downloads/');
  assert.ok(fs.existsSync(rootLatestPath), 'biopulse-ai-latest.apk must exist in public root');
  assert.ok(fs.existsSync(releaseInfoPath), 'release-info.json must exist');

  const apkBuffer = fs.readFileSync(apkPath);
  assert.ok(apkBuffer.length > 50000, `APK size must be substantial (>50KB), got: ${apkBuffer.length} bytes`);

  // Verify ZIP archive magic header: PK\x03\x04
  const magic = apkBuffer.subarray(0, 4).toString('hex');
  assert.equal(magic, '504b0304', 'APK must be a valid zip archive with PK header');

  // Verify APK internal contents
  const apkString = apkBuffer.toString('binary');
  assert.ok(apkString.includes('AndroidManifest.xml'), 'APK must contain AndroidManifest.xml');
  assert.ok(apkString.includes('classes.dex'), 'APK must contain classes.dex bytecode');
  assert.ok(apkString.includes('resources.arsc'), 'APK must contain resources.arsc table');

  // Verify SHA-256 matches release-info.json
  const computedSha = crypto.createHash('sha256').update(apkBuffer).digest('hex');
  const releaseInfo = JSON.parse(fs.readFileSync(releaseInfoPath, 'utf8'));
  assert.equal(releaseInfo.sha256, computedSha, 'release-info.json SHA-256 must match actual APK file hash');
});

test('2. Dedicated AppDownloadPage.tsx implements all required interactive components', () => {
  const pagePath = path.join(webRoot, 'src', 'pages', 'public', 'AppDownloadPage.tsx');
  assert.ok(fs.existsSync(pagePath), 'AppDownloadPage.tsx must exist');

  const content = fs.readFileSync(pagePath, 'utf8');

  // Direct APK download button and handler
  assert.ok(
    content.includes('handleDirectDownload') && content.includes('Download APK Direct'),
    'Must provide a direct APK download action button'
  );

  // Scannable QR Code generation with qrcode library
  assert.ok(
    content.includes('QRCode.toDataURL') && content.includes('qrCodeDataUrl'),
    'Must dynamically generate scannable QR Code using QRCode library'
  );

  // SHA-256 checksum card and copy button
  assert.ok(
    content.includes('SHA-256 Cryptographic Checksum') && content.includes('handleCopySha'),
    'Must display SHA-256 checksum and one-click copy button'
  );

  // 5-step Android installation walkthrough
  assert.ok(
    content.includes('How to Install the BioPulse AI APK on Android') &&
      content.includes('Download anyway') &&
      content.includes('Allow from this source'),
    'Must include 5-step Android installation guide with unknown source guidance'
  );

  // iOS PWA instructions
  assert.ok(
    content.includes('Apple iOS') &&
      content.includes('Add to Home Screen') &&
      content.includes('Safari'),
    'Must provide iOS Safari Add to Home Screen instructions'
  );

  // Interactive phone preview
  assert.ok(
    content.includes('activeScreenIndex') &&
      content.includes('MOBILE_SCREENS') &&
      content.includes('Dual-Pathway Dashboard'),
    'Must include interactive smartphone preview with screen switcher'
  );
});

test('3. Routes, App.tsx, Navbar, and Footer wire the mobile download page', () => {
  // Routes constant
  const routesPath = path.join(webRoot, 'src', 'constants', 'routes.ts');
  const routesContent = fs.readFileSync(routesPath, 'utf8');
  assert.ok(routesContent.includes('APP_DOWNLOAD'), 'ROUTES must export APP_DOWNLOAD');
  assert.ok(routesContent.includes('DOWNLOAD'), 'ROUTES must export DOWNLOAD');

  // App.tsx router
  const appPath = path.join(webRoot, 'src', 'App.tsx');
  const appContent = fs.readFileSync(appPath, 'utf8');
  assert.ok(appContent.includes('AppDownloadPage'), 'App.tsx must import AppDownloadPage');
  assert.ok(appContent.includes('ROUTES.APP_DOWNLOAD'), 'App.tsx must map route for ROUTES.APP_DOWNLOAD');
  assert.ok(appContent.includes('ROUTES.DOWNLOAD'), 'App.tsx must map route for ROUTES.DOWNLOAD');

  // Navbar.tsx
  const navbarPath = path.join(webRoot, 'src', 'components', 'navigation', 'Navbar.tsx');
  const navbarContent = fs.readFileSync(navbarPath, 'utf8');
  assert.ok(navbarContent.includes('ROUTES.APP_DOWNLOAD'), 'Navbar.tsx must link to ROUTES.APP_DOWNLOAD');
  assert.ok(navbarContent.includes('Mobile App'), 'Navbar.tsx must render Mobile App navigation link');

  // Footer.tsx
  const footerPath = path.join(webRoot, 'src', 'components', 'navigation', 'Footer.tsx');
  const footerContent = fs.readFileSync(footerPath, 'utf8');
  assert.ok(footerContent.includes('ROUTES.APP_DOWNLOAD'), 'Footer.tsx must link to ROUTES.APP_DOWNLOAD');
  assert.ok(footerContent.includes('Download Mobile App (APK)'), 'Footer.tsx must render Download Mobile App (APK) link');
});
