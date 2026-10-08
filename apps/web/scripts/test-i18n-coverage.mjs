import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const enDir = path.resolve(__dirname, '../src/i18n/locales/en');
const urDir = path.resolve(__dirname, '../src/i18n/locales/ur');

function getAllKeys(obj, prefix = '') {
  let keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys = keys.concat(getAllKeys(v, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

function getVal(obj, keyPath) {
  const parts = keyPath.split('.');
  let curr = obj;
  for (const p of parts) {
    if (!curr || typeof curr !== 'object') return undefined;
    curr = curr[p];
  }
  return curr;
}

console.log('=== BioPulse i18n Parity & Coverage Audit ===\n');

const enFiles = fs.readdirSync(enDir).filter(f => f.endsWith('.json')).sort();
const urFiles = fs.readdirSync(urDir).filter(f => f.endsWith('.json')).sort();

let totalKeysCount = 0;
let errorsCount = 0;

console.log(`Found namespaces: ${enFiles.map(f => f.replace('.json', '')).join(', ')}\n`);

for (const file of enFiles) {
  const ns = file.replace('.json', '');
  const enPath = path.join(enDir, file);
  const urPath = path.join(urDir, file);

  if (!fs.existsSync(urPath)) {
    console.error(`❌ [${ns}] Missing corresponding Urdu file: ${urPath}`);
    errorsCount++;
    continue;
  }

  const enContent = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  const urContent = JSON.parse(fs.readFileSync(urPath, 'utf8'));

  const enKeys = getAllKeys(enContent);
  const urKeys = getAllKeys(urContent);
  totalKeysCount += enKeys.length;

  const missingInUr = enKeys.filter(k => !urKeys.includes(k));
  const missingInEn = urKeys.filter(k => !enKeys.includes(k));

  let emptyUrKeys = [];
  for (const k of urKeys) {
    const v = getVal(urContent, k);
    if (v === '' || v === null || v === undefined) {
      emptyUrKeys.push(k);
    }
  }

  if (missingInUr.length === 0 && missingInEn.length === 0 && emptyUrKeys.length === 0) {
    console.log(`✅ [${ns}] 100% Parity (${enKeys.length} keys)`);
  } else {
    if (missingInUr.length > 0) {
      console.error(`❌ [${ns}] ${missingInUr.length} keys missing in Urdu:`, missingInUr.slice(0, 5));
      errorsCount += missingInUr.length;
    }
    if (missingInEn.length > 0) {
      console.error(`❌ [${ns}] ${missingInEn.length} keys missing in English:`, missingInEn.slice(0, 5));
      errorsCount += missingInEn.length;
    }
    if (emptyUrKeys.length > 0) {
      console.error(`❌ [${ns}] ${emptyUrKeys.length} empty values in Urdu:`, emptyUrKeys);
      errorsCount += emptyUrKeys.length;
    }
  }
}

console.log(`\n========================================`);
console.log(`Total translation keys per language: ${totalKeysCount}`);
console.log(`Total namespace files: ${enFiles.length} en + ${urFiles.length} ur = ${enFiles.length + urFiles.length}`);
console.log(`Status: ${errorsCount === 0 ? 'ALL NAMESPACES PASS 100% PARITY' : `FAILED WITH ${errorsCount} ISSUES`}`);
console.log(`========================================\n`);

if (errorsCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
