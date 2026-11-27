// PreTaskExec hook: runs "npm run check:task" and exits 2 (blocking the spec task) with the failing output if anything
// is red, so no task starts on broken code. If the check can't run at all (npm missing, dependencies not installed,
// or the check times out), it warns on stdout and exits 0, so a broken environment never blocks every task.
import { spawnSync } from 'node:child_process';
import { closeSync, existsSync, openSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHECK_TIMEOUT_MS = 170_000; // below the hook's own 180 s timeout
const warn = (message) => console.log(`[task-gate] WARNING: ${message} The task was not blocked.`);

// Runs a shell command with its output in a temp file, not a pipe: piped child output hangs inside Kiro's shell sandbox.
function run(command, timeout) {
  const file = join(tmpdir(), `task-gate-${process.pid}-${Date.now()}.txt`);
  const fd = openSync(file, 'w');
  let result;
  try {
    result = spawnSync(command, { cwd: root, shell: true, stdio: ['ignore', fd, fd], timeout, windowsHide: true });
  } finally {
    closeSync(fd);
  }
  const output = readFileSync(file, 'utf8').replace(/\x1b\[[0-9;]*m/g, '');
  rmSync(file, { force: true });
  return { status: result.status, problem: result.error?.code ?? result.signal, output };
}

function main() {
  if (!existsSync(join(root, 'node_modules', '.bin'))) {
    warn('the dependencies are not installed, so the check could not run. Run npm install.');
    return 0;
  }
  const npm = run('npm --version', 30_000);
  if (npm.status !== 0) {
    warn(`npm could not be started (${npm.problem ?? `exit ${npm.status}`}: ${npm.output.trim().split(/\r?\n/)[0] ?? ''}).`);
    return 0;
  }
  const check = run('npm run check:task', CHECK_TIMEOUT_MS);
  if (check.status === null) {
    warn(`npm run check:task did not finish (${check.problem}).`);
    return 0;
  }
  if (check.status !== 0) {
    const tail = check.output.trim().split(/\r?\n/).slice(-60).join('\n');
    process.stderr.write(`[task-gate] npm run check:task is red (exit ${check.status}). Fix it before starting this task.\n${tail}\n`);
    return 2;
  }
  console.log('[task-gate] npm run check:task passed.');
  return 0;
}

try {
  process.exitCode = main();
} catch (e) {
  warn(`could not run npm run check:task (${e.message}).`);
  process.exitCode = 0;
}
