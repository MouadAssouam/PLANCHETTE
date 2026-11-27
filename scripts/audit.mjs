// UserPromptSubmit hook: prints a PASS/FAIL checklist, but only when the prompt says "pre-submit audit".
import { spawnSync } from 'node:child_process';
import { closeSync, existsSync, openSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Where the prompt comes from. Kiro IDE 1.x sends the event as JSON on stdin ({"prompt": "...", ...}) and closes it at
// once; USER_PROMPT may arrive empty, and some builds sent an empty "prompt". A person running the audit by hand sets
// USER_PROMPT. An older Kiro opened stdin and never wrote to it or closed it, so the read gives up after STDIN_TIMEOUT_MS.
const STDIN_TIMEOUT_MS = 2000;
const parse = (text) => JSON.parse(text.replace(/^\uFEFF/, ''));

// Resolves to { prompt } from the stdin JSON, or to { problem } saying why there is none.
async function promptFromStdin() {
  if (process.stdin.isTTY) return { problem: 'a terminal' };
  return new Promise((resolve) => {
    let text = '', settled = false;
    const finish = (problem) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      process.stdin.destroy(); // an open stdin would keep this process alive after the audit
      if (problem) return resolve({ problem });
      let event;
      try { event = parse(text); } catch { return resolve({ problem: text.trim() ? 'not JSON' : 'empty' }); }
      if (typeof event?.prompt === 'string' && event.prompt) return resolve({ prompt: event.prompt });
      const keys = event && typeof event === 'object' ? Object.keys(event) : [];
      resolve({ problem: event?.prompt === '' ? 'JSON with an empty "prompt"' : `JSON with no "prompt"${keys.length ? ` (keys: ${keys.join(', ')})` : ''}` });
    };
    const timer = setTimeout(() => finish(`still open after ${STDIN_TIMEOUT_MS} ms`), STDIN_TIMEOUT_MS);
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      text += chunk;
      try { parse(text); } catch { return; } // not all there yet
      finish(); // a complete JSON value is the whole event, even if stdin stays open
    });
    process.stdin.on('end', () => finish());
    process.stdin.on('error', (e) => finish(`unreadable (${e.code ?? e.message})`));
  });
}

const stdin = await promptFromStdin().catch((e) => ({ problem: `unreadable (${e?.message ?? e})` }));
const prompt = stdin.prompt ?? process.env.USER_PROMPT ?? '';
if (!prompt) {
  // Say why, so a hook that can't see prompts doesn't fail silently. Waiting for the write means exit can't cut it off.
  const warning = `[audit] WARNING: no prompt text reached the audit, so it can't tell whether it was asked for. stdin: ${stdin.problem}. USER_PROMPT: empty.`;
  await new Promise((done) => process.stdout.write(`${warning}\n`, done));
}
if (!/pre-submit audit/i.test(prompt)) process.exit(0);

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
// git writes to a temp file, not a pipe: piped child output hangs inside Kiro's shell sandbox.
function git(...args) {
  const file = join(tmpdir(), `audit-${process.pid}.txt`);
  const fd = openSync(file, 'w');
  const r = spawnSync('git', ['-C', root, ...args], { stdio: ['ignore', fd, 'ignore'], timeout: 15000, windowsHide: true });
  closeSync(fd);
  const out = readFileSync(file, 'utf8');
  rmSync(file, { force: true });
  if (r.status !== 0) throw Object.assign(new Error(`git ${args[0]} failed (${r.error?.code ?? `exit ${r.status}`})`), { status: r.status });
  return out;
}
const read = (file) => { try { return readFileSync(join(root, file), 'utf8'); } catch { return ''; } };
const lines = (text) => text.split(/\r?\n/).filter(Boolean);
const some = (items) => items.slice(0, 3).join(', ') + (items.length > 3 ? ` and ${items.length - 3} more` : '');
const results = [];
const check = (name, problems) => results.push(`${problems.length ? 'FAIL' : 'PASS'}  ${name}${problems.length ? ' - ' + problems.slice(0, 3).join('; ') : ''}`);

// Text under the first heading containing `name`, up to the next heading of the same or higher level (null if no such heading).
function section(text, name) {
  let level = 0, body = '', found = false;
  for (const line of text.split(/\r?\n/)) {
    const h = /^(#{1,6})\s+(.*)/.exec(line);
    if (!found && h && new RegExp(name, 'i').test(h[2])) { found = true; level = h[1].length; continue; }
    if (found && h && h[1].length <= level) break;
    if (found) body += line + '\n';
  }
  return found ? body : null;
}

try {
  // 1. .kiro exists, git does not ignore it (check-ignore prints ignored paths; exit 1 means none), and nothing under it is uncommitted
  let ignored = [];
  try {
    ignored = git('check-ignore', '--no-index', '.kiro', '.kiro/steering/clinical-context.md', '.kiro/settings/mcp.json').split('\n').filter(Boolean);
  } catch (e) { if (e.status !== 1) throw e; }
  const committed = git('ls-files', '--', '.kiro').trim() !== ''; // check-ignore alone passes files that were never added
  const uncommitted = lines(git('status', '--porcelain', '--untracked-files=all', '--', '.kiro')).map((line) => line.slice(3));
  check('.kiro exists, is not ignored and has no uncommitted changes', [...(existsSync(join(root, '.kiro')) ? [] : ['.kiro is missing']),
    ...(committed ? [] : ['nothing under .kiro is committed yet']), ...ignored.map((p) => `ignored: ${p}`),
    ...(uncommitted.length ? [`not committed: ${some(uncommitted)}`] : [])]);

  // 2. Judges see GitHub, not this disk: the branch has an upstream, the upstream holds .kiro, and no commit waits to be pushed.
  // From the "# branch.*" lines of porcelain v2: head is the branch or "(detached)", upstream is missing when none is set,
  // and ab ("+<ahead> -<behind>") is missing when the upstream's commit isn't in the local repo.
  const branch = Object.fromEntries(lines(git('status', '--porcelain=v2', '--branch', '--untracked-files=no'))
    .map((line) => /^# branch\.(\S+) (.*)$/.exec(line)).filter(Boolean).map((m) => [m[1], m[2]]));
  const unpushed = [];
  if (!branch.upstream) unpushed.push(branch.head === '(detached)' ? 'HEAD is detached, so it has no upstream' : `${branch.head} has no upstream`);
  else if (!branch.ab) unpushed.push(`${branch.upstream} is not in the local repo`);
  else {
    if (git('ls-tree', '-r', '--name-only', '@{u}', '--', '.kiro').trim() === '') unpushed.push(`nothing under .kiro on ${branch.upstream}`);
    const ahead = Number(/^\+(\d+)/.exec(branch.ab)?.[1] ?? 0);
    if (ahead > 0) unpushed.push(`${branch.head} is ${ahead} commit${ahead === 1 ? '' : 's'} ahead of ${branch.upstream}`);
  }
  check('.kiro is pushed: the branch has an upstream, .kiro is on it, and no commit is unpushed', unpushed);

  // 3. LICENSE is MIT
  const license = ['LICENSE', 'LICENSE.md', 'LICENSE.txt'].map(read).find(Boolean) ?? '';
  check('LICENSE is MIT', /^\s*MIT License/im.test(license) ? [] : ['no MIT LICENSE file']);

  // 4 and 5. tracked files (plus new files git would add): secrets, and the trademarked game name outside scripts/
  const files = git('ls-files', '-z', '--cached', '--others', '--exclude-standard').split('\0').filter(Boolean);
  const secret = /(?<![A-Za-z0-9])sk-[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----/;
  const tradeName = new RegExp(['ou', 'ija'].join(''), 'i'); // the trademarked board-game name, split so the word never appears in the repo
  const withSecret = [], withName = [];
  for (const file of files) {
    const text = read(file);
    if (secret.test(text)) withSecret.push(file);
    if (!file.startsWith('scripts/') && tradeName.test(file + '\n' + text)) withName.push(file);
  }
  check('no secrets (sk-, AKIA, private key) in tracked files', withSecret);
  check('no trademarked game name outside scripts/', withName);

  // 6. README has a Setup section, and a Testing section that mentions mouse mode
  const readme = read('README.md');
  const testing = section(readme, 'Testing');
  check('README has a Setup section and a Testing section that mentions mouse mode', [
    ...(section(readme, 'Setup') === null ? ['no Setup section'] : []),
    ...(testing === null ? ['no Testing section'] : /mouse[ -]?mode/i.test(testing) ? [] : ['Testing section never mentions mouse mode']),
  ]);

  const failed = results.filter((r) => r.startsWith('FAIL')).length;
  console.log([`PRE-SUBMIT AUDIT: ${failed ? 'FAIL' : 'PASS'} (${results.length - failed} pass, ${failed} fail)`, ...results].join('\n'));
} catch (e) {
  console.log(`[audit] WARNING: could not finish the audit: ${e.message}`); // stderr is invisible when a hook exits 0
}
