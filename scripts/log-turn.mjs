// Stop hook: append "<local time> | <git diff --shortstat>" to docs/kiro-log-raw.md.
import { spawnSync } from 'node:child_process';
import { appendFileSync, closeSync, existsSync, mkdirSync, openSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const log = join(root, 'docs', 'kiro-log-raw.md');
try {
  // git writes to a temp file, not a pipe: piped child output hangs inside Kiro's shell sandbox.
  const out = join(tmpdir(), `turn-log-${process.pid}.txt`);
  const fd = openSync(out, 'w');
  const r = spawnSync('git', ['-C', root, 'diff', '--shortstat'], { stdio: ['ignore', fd, 'ignore'], timeout: 10000, windowsHide: true });
  closeSync(fd);
  const stat = readFileSync(out, 'utf8').trim();
  rmSync(out, { force: true });
  if (r.status !== 0) throw new Error(`git diff --shortstat failed (${r.error?.code ?? `exit ${r.status}`})`);
  mkdirSync(dirname(log), { recursive: true });
  if (!existsSync(log)) writeFileSync(log, '# Kiro log (raw): one line per agent turn, written by the Stop hook\n');
  appendFileSync(log, `- ${new Date().toLocaleString('sv-SE')} | ${stat || 'no changes to tracked files'}\n`);
} catch (e) {
  console.log(`[turn-log] WARNING: ${e.message.split('\n')[0]}`); // stderr is invisible when a hook exits 0
}
