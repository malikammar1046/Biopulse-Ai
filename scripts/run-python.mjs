import { spawn, execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const rootDir = resolve(__dirname, '..');

// Prioritize virtual environments
const candidates = [
  join(rootDir, 'backend', 'venv', 'Scripts', 'python.exe'),
  join(rootDir, 'backend', 'venv', 'bin', 'python'),
  join(rootDir, 'venv', 'Scripts', 'python.exe'),
  join(rootDir, 'venv', 'bin', 'python'),
];

let pythonExe = 'python';
for (const cand of candidates) {
  if (existsSync(cand)) {
    try {
      execSync(`"${cand}" -c "pass"`, { stdio: 'ignore' });
      pythonExe = cand;
      break;
    } catch {
      // Stale or broken venv pointer on this machine
    }
  }
}

if (pythonExe === 'python') {
  try {
    const lookupCmd = process.platform === 'win32' ? 'where python' : 'which python';
    const stdout = execSync(lookupCmd, { encoding: 'utf8' });
    const lines = stdout.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (existsSync(line)) {
        pythonExe = line;
        break;
      }
    }
  } catch {
    // Keep 'python' as fallback
  }
}

const args = process.argv.slice(2);

const child = spawn(pythonExe, args, {
  cwd: rootDir,
  stdio: 'inherit',
  shell: false,
});

child.on('exit', (code, signal) => {
  process.exit(code ?? (signal ? 1 : 0));
});

process.on('SIGINT', () => {
  child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  child.kill('SIGTERM');
});
