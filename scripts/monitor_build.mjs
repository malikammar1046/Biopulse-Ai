import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const TOKEN = 'lZHhBkZQVfCFeprWDYL5dEo1Ul_-GK6cHHTJx48V';
const BUILD_ID = 'a528ef3a-cff6-40fd-9536-65d06f0a4f56';
const ROOT_DIR = path.resolve('..');

async function getBuildStatus() {
  const query = `
    query GetBuild($id: ID!) {
      builds {
        byId(buildId: $id) {
          id
          status
          artifacts {
            buildUrl
            applicationArchiveUrl
          }
          error {
            message
            errorCode
          }
        }
      }
    }
  `;

  const res = await fetch('https://api.expo.dev/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`
    },
    body: JSON.stringify({ query, variables: { id: BUILD_ID } })
  });

  const data = await res.json();
  return data.data.builds.byId;
}

async function downloadAndDeploy(apkUrl) {
  console.log(`Downloading fresh APK from: ${apkUrl}...`);
  const res = await fetch(apkUrl);
  if (!res.ok) throw new Error(`Download failed with HTTP ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const webPublic = path.join(ROOT_DIR, 'apps', 'web', 'public');
  const downloadsDir = path.join(webPublic, 'downloads');

  const pLatest = path.join(downloadsDir, 'biopulse-ai-latest.apk');
  const pV1 = path.join(downloadsDir, 'biopulse-ai-v1.0.0.apk');
  const pRoot = path.join(webPublic, 'biopulse-ai-latest.apk');

  fs.writeFileSync(pLatest, buffer);
  fs.writeFileSync(pV1, buffer);
  fs.writeFileSync(pRoot, buffer);

  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  const sizeBytes = buffer.length;
  const sizeMb = `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;

  console.log(`Saved APK to web public directories! Size: ${sizeBytes} (${sizeMb}), SHA-256: ${hash}`);

  // Update release-info.json
  const relInfoPath = path.join(downloadsDir, 'release-info.json');
  if (fs.existsSync(relInfoPath)) {
    const relInfo = JSON.parse(fs.readFileSync(relInfoPath, 'utf8'));
    relInfo.fileSizeBytes = sizeBytes;
    relInfo.fileSizeFormatted = sizeMb;
    relInfo.sha256 = hash;
    fs.writeFileSync(relInfoPath, JSON.stringify(relInfo, null, 2), 'utf8');
    console.log(`Updated release-info.json`);
  }

  // Update AppDownloadPage.tsx
  const pagePath = path.join(ROOT_DIR, 'apps', 'web', 'src', 'pages', 'public', 'AppDownloadPage.tsx');
  if (fs.existsSync(pagePath)) {
    let content = fs.readFileSync(pagePath, 'utf8');
    content = content.replace(/fileSizeFormatted:\s*'[^']*'/, `fileSizeFormatted: '${sizeMb}'`);
    content = content.replace(/sha256:\s*'[^']*'/, `sha256: '${hash}'`);
    fs.writeFileSync(pagePath, content, 'utf8');
    console.log(`Updated AppDownloadPage.tsx`);
  }

  console.log('=== BUILD DEPLOYMENT FULLY COMPLETE ===');
}

async function loop() {
  console.log(`Starting monitor for EAS Build ${BUILD_ID}...`);
  while (true) {
    try {
      const build = await getBuildStatus();
      console.log(`[${new Date().toLocaleTimeString()}] Build status: ${build.status}`);
      if (build.status === 'FINISHED') {
        const url = build.artifacts?.applicationArchiveUrl || build.artifacts?.buildUrl;
        if (!url) {
          console.error('Finished but no artifact URL found!');
          process.exit(1);
        }
        await downloadAndDeploy(url);
        process.exit(0);
      } else if (build.status === 'ERRORED' || build.status === 'CANCELED') {
        console.error(`Build failed with status: ${build.status}`);
        console.error(build.error);
        process.exit(1);
      }
    } catch (e) {
      console.error('Error checking status:', e.message);
    }
    await new Promise((r) => setTimeout(r, 20000));
  }
}

loop();
