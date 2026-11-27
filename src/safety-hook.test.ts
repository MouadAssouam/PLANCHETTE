// Checks the safety-tests hook (.kiro/hooks/safety-tests.json) and the npm script it runs (Requirement 23.11).
// src/ has no Node types, so both files are read as text with Vite's ?raw imports. This test imports no src/ module.
import { describe, expect, it } from 'vitest';
import hookFileText from '../.kiro/hooks/safety-tests.json?raw';
import packageJsonText from '../package.json?raw';

type HookFile = { version?: unknown; hooks?: unknown };
type Hook = {
  name?: unknown;
  description?: unknown;
  trigger?: unknown;
  matcher?: unknown;
  action?: { type?: unknown; command?: unknown };
};
type PackageJson = { scripts?: Record<string, unknown> };

function parseHookFile(): HookFile {
  return JSON.parse(hookFileText) as HookFile;
}

function theHook(): Hook {
  const { hooks } = parseHookFile();
  expect(Array.isArray(hooks)).toBe(true);
  expect(hooks).toHaveLength(1);
  return (hooks as Hook[])[0] as Hook;
}

function compiledMatcher(): RegExp {
  const { matcher } = theHook();
  expect(matcher).toBeTypeOf('string');
  return new RegExp(matcher as string);
}

describe('safety-tests hook', () => {
  it('the hook file parses as JSON, with version "v1" and one hook', () => {
    expect(() => JSON.parse(hookFileText)).not.toThrow();
    expect(parseHookFile().version).toBe('v1');
    theHook();
  });

  it('the hook has a name and a description', () => {
    const hook = theHook();
    expect(hook.name).toMatch(/\S/);
    expect(hook.description).toMatch(/\S/);
  });

  it('the hook runs the command npm run test:safety after a file is saved', () => {
    const hook = theHook();
    expect(hook.trigger).toBe('PostFileSave');
    expect(hook.action?.type).toBe('command');
    expect(hook.action?.command).toBe('npm run test:safety');
  });

  it('the test:safety script in package.json runs src/selection, src/board, src/pointer and src/sim', () => {
    expect(() => JSON.parse(packageJsonText)).not.toThrow();
    const { scripts } = JSON.parse(packageJsonText) as PackageJson;
    expect(scripts?.['test:safety']).toBe('vitest run src/selection src/board src/pointer src/sim');
  });

  it.each(['src/selection/engine.ts', 'src\\board\\layout.ts'])('the matcher matches %s', (path) => {
    expect(compiledMatcher().test(path)).toBe(true);
  });

  it('the matcher does not match src/copy/index.ts', () => {
    expect(compiledMatcher().test('src/copy/index.ts')).toBe(false);
  });
});
