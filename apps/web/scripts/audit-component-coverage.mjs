import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.resolve(__dirname, '../src');

function walkDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'tests' && file !== 'node_modules' && file !== 'dist') {
        walkDir(fullPath, fileList);
      }
    } else if (file.endsWith('.tsx')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const allTsx = walkDir(srcDir);
console.log(`Found ${allTsx.length} .tsx files in apps/web/src\n`);

let usingI18n = [];
let notUsingI18n = [];

for (const f of allTsx) {
  const content = fs.readFileSync(f, 'utf8');
  const hasI18n = content.includes('useTranslation') || content.includes('i18next.t(') || content.includes('t(');
  const relPath = path.relative(srcDir, f).replace(/\\/g, '/');

  if (hasI18n) {
    usingI18n.push(relPath);
  } else {
    notUsingI18n.push(relPath);
  }
}

console.log(`Components using i18n / t(): ${usingI18n.length}`);
console.log(`Components NOT using i18n: ${notUsingI18n.length}\n`);

console.log('--- Components NOT using i18n in pages/ ---');
const pagesNotUsing = notUsingI18n.filter(f => f.startsWith('pages/'));
pagesNotUsing.forEach(f => console.log('  ', f));

console.log('\n--- Components NOT using i18n in components/ ---');
const compNotUsing = notUsingI18n.filter(f => f.startsWith('components/'));
compNotUsing.slice(0, 30).forEach(f => console.log('  ', f));
if (compNotUsing.length > 30) {
  console.log(`  ... and ${compNotUsing.length - 30} more`);
}
