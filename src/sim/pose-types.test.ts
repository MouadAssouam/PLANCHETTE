// Unit and property tests for the hand-written Ghost_Profile schema check (task 3.2, Requirement 6.1).
//
// The six real profile shapes pass; each kind of problem is reported; and the check never throws on arbitrary JSON.
// The six profiles' values are inlined here on purpose: loading the real JSON files is task 3.9's job. This file
// imports only sim/ (and fast-check/vitest), so it stays inside the one-way chain.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { GHOST_PROFILE_LIMITS, validateGhostProfile, type GhostProfile } from './pose-types.ts';

// The six real profiles from src/sim/profiles/ (values only; descriptions and notes shortened). Typed as
// GhostProfile so the compiler also checks the inlined shapes against the type.
const REAL_PROFILES: GhostProfile[] = [
  {
    name: 'small-range',
    description: 'Small range of head movement.',
    notes: 'Only the small-range behaviour is on.',
    seed: 3301,
    rangeDeg: { left: 8, right: 8, up: 6, down: 5 },
    tremor: { amplitudeDeg: 0, frequencyHz: 0 },
    driftDegPerMin: 0,
    fatigue: { rangeLossPctPerMin: 0 },
    dozing: null,
    faceLost: null,
  },
  {
    name: 'tremor',
    description: 'Normal range with a steady tremor of 2 deg at 6 Hz.',
    notes: 'Only tremor is on.',
    seed: 3402,
    rangeDeg: { left: 25, right: 25, up: 12, down: 12 },
    tremor: { amplitudeDeg: 2, frequencyHz: 6 },
    driftDegPerMin: 0,
    fatigue: { rangeLossPctPerMin: 0 },
    dozing: null,
    faceLost: null,
  },
  {
    name: 'slow-drift',
    description: 'Normal range with a slow drift of 2 deg per minute at rest.',
    notes: 'Only drift is on.',
    seed: 3503,
    rangeDeg: { left: 25, right: 25, up: 12, down: 12 },
    tremor: { amplitudeDeg: 0, frequencyHz: 0 },
    driftDegPerMin: 2,
    fatigue: { rangeLossPctPerMin: 0 },
    dozing: null,
    faceLost: null,
  },
  {
    name: 'fatigue',
    description: 'Normal range that shrinks by 1.5% each minute.',
    notes: 'Only fatigue is on.',
    seed: 3604,
    rangeDeg: { left: 25, right: 25, up: 12, down: 12 },
    tremor: { amplitudeDeg: 0, frequencyHz: 0 },
    driftDegPerMin: 0,
    fatigue: { rangeLossPctPerMin: 1.5 },
    dozing: null,
    faceLost: null,
  },
  {
    name: 'dozing-roll',
    description: 'Normal range; the head rolls 15 deg to one side during a 60 s doze every 8 minutes.',
    notes: 'Only dozing is on. Side: right.',
    seed: 3705,
    rangeDeg: { left: 25, right: 25, up: 12, down: 12 },
    tremor: { amplitudeDeg: 0, frequencyHz: 0 },
    driftDegPerMin: 0,
    fatigue: { rangeLossPctPerMin: 0 },
    dozing: { everyMin: 8, durationS: 60, dropDeg: 15, direction: 'right' },
    faceLost: null,
  },
  {
    name: 'face-leaves-frame',
    description: 'Normal range; the face leaves view for 10 s every 5 minutes.',
    notes: 'Only face loss is on.',
    seed: 3806,
    rangeDeg: { left: 25, right: 25, up: 12, down: 12 },
    tremor: { amplitudeDeg: 0, frequencyHz: 0 },
    driftDegPerMin: 0,
    fatigue: { rangeLossPctPerMin: 0 },
    dozing: null,
    faceLost: { everyMin: 5, durationS: 10 },
  },
];

// A fresh, valid profile as a mutable record, so a test can break one field and nothing else.
function validBase(): Record<string, any> {
  return {
    name: 'test-patient',
    description: 'A valid profile.',
    notes: 'Built for the schema tests.',
    seed: 7,
    rangeDeg: { left: 10, right: 10, up: 8, down: 8 },
    tremor: { amplitudeDeg: 0, frequencyHz: 0 },
    driftDegPerMin: 0,
    fatigue: { rangeLossPctPerMin: 0 },
    dozing: null,
    faceLost: null,
  };
}

// Asserts the value is rejected and returns its problems for a closer look.
function problemsOf(value: unknown): string[] {
  const result = validateGhostProfile(value);
  expect(result.ok).toBe(false);
  return result.ok ? [] : result.problems;
}

describe('validateGhostProfile: the six real profiles', () => {
  it.each(REAL_PROFILES.map((profile) => [profile.name, profile] as const))('accepts %s', (_name, profile) => {
    const result = validateGhostProfile(profile);
    if (!result.ok) throw new Error(`expected a valid profile, got problems: ${result.problems.join('; ')}`);
    expect(result.ok).toBe(true);
    expect(result.profile).toBe(profile);
  });

  it('accepts exactly the six behaviours, with the tremor "off" form (frequency 0 at amplitude 0)', () => {
    const base = validBase();
    expect(validateGhostProfile(base).ok).toBe(true);
    base['tremor'] = { amplitudeDeg: 0, frequencyHz: 0 };
    expect(validateGhostProfile(base).ok).toBe(true);
  });
});

describe('validateGhostProfile: each kind of problem is reported', () => {
  it('reports a missing field', () => {
    const base = validBase();
    delete base['seed'];
    const problems = problemsOf(base);
    expect(problems.join(' ')).toContain('seed');
    expect(problems.join(' ')).toContain('missing');
  });

  it('reports a wrong type', () => {
    const base = validBase();
    base['name'] = 123;
    const problems = problemsOf(base);
    expect(problems.join(' ')).toContain('name');
    expect(problems.join(' ')).toContain('string');
  });

  it('reports a bad dozing direction', () => {
    const base = validBase();
    base['dozing'] = { everyMin: 8, durationS: 60, dropDeg: 15, direction: 'up' };
    const problems = problemsOf(base);
    expect(problems.join(' ')).toContain('dozing.direction');
  });

  it('reports a negative value', () => {
    const base = validBase();
    base['rangeDeg'].left = -5;
    const problems = problemsOf(base);
    expect(problems.join(' ')).toContain('rangeDeg.left');
    expect(problems.join(' ')).toContain('at least 0');
  });

  it('reports a non-integer seed', () => {
    const base = validBase();
    base['seed'] = 1.5;
    const problems = problemsOf(base);
    expect(problems.join(' ')).toContain('seed');
    expect(problems.join(' ')).toContain('integer');
  });

  it('reports an extra unknown field', () => {
    const base = validBase();
    base['extra'] = true;
    const problems = problemsOf(base);
    expect(problems.join(' ')).toContain('extra');
    expect(problems.join(' ')).toContain('unknown');
  });

  it('reports a turn beyond the plausible limit', () => {
    const base = validBase();
    base['rangeDeg'].left = GHOST_PROFILE_LIMITS.turnMaxDeg + 10;
    const problems = problemsOf(base);
    expect(problems.join(' ')).toContain('rangeDeg.left');
    expect(problems.join(' ')).toContain(`at most ${GHOST_PROFILE_LIMITS.turnMaxDeg}`);
  });

  it('reports a tremor frequency outside 3-12 Hz while the tremor is on', () => {
    const tooFast = validBase();
    tooFast['tremor'] = { amplitudeDeg: 2, frequencyHz: 20 };
    expect(problemsOf(tooFast).join(' ')).toContain('tremor.frequencyHz');

    const tooSlow = validBase();
    tooSlow['tremor'] = { amplitudeDeg: 2, frequencyHz: 2 };
    expect(problemsOf(tooSlow).join(' ')).toContain('tremor.frequencyHz');
  });

  it('reports a NaN and a non-finite number', () => {
    const nan = validBase();
    nan['driftDegPerMin'] = Number.NaN;
    expect(problemsOf(nan).join(' ')).toContain('driftDegPerMin');

    const infinite = validBase();
    infinite['driftDegPerMin'] = Number.POSITIVE_INFINITY;
    expect(problemsOf(infinite).join(' ')).toContain('driftDegPerMin');
  });

  it('rejects a non-object, including null and an array', () => {
    expect(problemsOf(null).join(' ')).toContain('object');
    expect(problemsOf(42).join(' ')).toContain('object');
    expect(problemsOf([]).join(' ')).toContain('object');
  });

  it('collects several problems at once', () => {
    const broken = validBase();
    delete broken['name'];
    broken['seed'] = 1.5;
    broken['rangeDeg'].up = -1;
    expect(problemsOf(broken).length).toBeGreaterThanOrEqual(3);
  });
});

describe('validateGhostProfile: the nullable behaviours', () => {
  it('accepts a dozing object and a faceLost object', () => {
    const base = validBase();
    base['dozing'] = { everyMin: 8, durationS: 60, dropDeg: 15, direction: 'left' };
    base['faceLost'] = { everyMin: 5, durationS: 10 };
    expect(validateGhostProfile(base).ok).toBe(true);
  });

  it('rejects a dozing value that is neither an object nor null', () => {
    const base = validBase();
    base['dozing'] = 5;
    expect(problemsOf(base).join(' ')).toContain('dozing');
  });
});

describe('validateGhostProfile: never throws on arbitrary JSON', () => {
  // Not a numbered design property; a plain robustness check. Binary-unit strings keep fast-check on its v4 API
  // (fullUnicodeString was removed). 200 runs per the project rules; fast-check prints the seed on failure.
  it('returns a well-formed result for any JSON value, without throwing', () => {
    fc.assert(
      fc.property(fc.anything({ stringUnit: 'binary' }), (value) => {
        const result = validateGhostProfile(value);
        if (result.ok) {
          expect(result.profile).toBe(value);
        } else {
          expect(Array.isArray(result.problems)).toBe(true);
          expect(result.problems.length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 200 },
    );
  });
});
