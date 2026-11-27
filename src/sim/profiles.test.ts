// Schema and shape test for the Ghost_Profile loader (task 3.9, Requirements 6.1, 6.2, 6.7).
//
// Checks: every profile file passes the hand-written schema; there are exactly six, with the names from tasks 3.3–3.8;
// each has exactly one behaviour on (a turn of 10° or less counting as the small-range behaviour); the reach limits
// that keep CALL and CAN'T BREATHE selectable (design, "Reachability of the urgent targets") hold for the small-range
// and fatigue profiles; and no name or description uses the word "ghost" (Requirement 6.7).
//
// These are scans over the fixed six files, so they are scripted, not fast-check properties (design, "Where PBT is not
// the right tool"). The reach limits are inlined as constants (6.2° of turn, 5.2° up), so this file imports nothing
// from board/ and stays inside the one-way chain: only src/sim/ modules, the profile JSON, and vitest.

import { describe, expect, it } from 'vitest';
import { buildGhostProfiles, getGhostProfile, GHOST_PROFILES, GHOST_PROFILE_NAMES } from './profiles.ts';
import { validateGhostProfile, type GhostProfile } from './pose-types.ts';

// The six names from tasks 3.3–3.8, in the order GHOST_PROFILES sorts them (by name).
const EXPECTED_NAMES = [
  'dozing-roll',
  'face-leaves-frame',
  'fatigue',
  'slow-drift',
  'small-range',
  'tremor',
] as const;

// A turn of 10° or less is the small-range behaviour (Requirement 6.2; glossary "small range").
const SMALL_RANGE_TURN_DEG = 10;

// Reach floor from the design: at the binding viewport CALL/CAN'T BREATHE need ~6.13° of turn and ~5.12° up, so the
// profiles keep at least these (TUNE). Inlined as constants so this test needs nothing from board/layout.ts.
const REACH_TURN_MIN_DEG = 6.2;
const REACH_UP_MIN_DEG = 5.2;
// The Fatigue_Reach_Run checks reach after 30 simulated minutes (Requirement 23.3); the loss is linear.
const FATIGUE_REACH_MINUTES = 30;

// A profile's "on" behaviours, by the rule the design uses: a max turn of 10° or less is small range; a positive
// tremor amplitude, drift or fatigue loss is that behaviour; a non-null dozing or faceLost is that one. Each profile's
// single behaviour shares the profile's name (tasks 3.3–3.8), so the one behaviour on should equal the name.
function behavioursOn(profile: GhostProfile): string[] {
  const on: string[] = [];
  if (Math.max(profile.rangeDeg.left, profile.rangeDeg.right) <= SMALL_RANGE_TURN_DEG) on.push('small-range');
  if (profile.tremor.amplitudeDeg > 0) on.push('tremor');
  if (profile.driftDegPerMin > 0) on.push('slow-drift');
  if (profile.fatigue.rangeLossPctPerMin > 0) on.push('fatigue');
  if (profile.dozing !== null) on.push('dozing-roll');
  if (profile.faceLost !== null) on.push('face-leaves-frame');
  return on;
}

// Raw file text, parsed independently of the loader, so the schema test validates the files themselves and not only
// the loader's already-validated output.
const rawFiles: Record<string, string> = import.meta.glob('./profiles/*.json', {
  query: '?raw',
  import: 'default',
  eager: true,
});

describe('ghost profile files pass the schema (Requirement 6.1)', () => {
  const rawEntries = Object.entries(rawFiles).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

  it('the glob finds exactly six profile files', () => {
    expect(rawEntries).toHaveLength(6);
  });

  it.each(rawEntries)('%s is valid JSON and passes validateGhostProfile', (path, text) => {
    const parsed: unknown = JSON.parse(text);
    const result = validateGhostProfile(parsed);
    if (!result.ok) throw new Error(`${path}: ${result.problems.join('; ')}`);
    expect(result.ok).toBe(true);
  });
});

describe('the loader exposes exactly the six expected profiles (Requirement 6.2)', () => {
  it('there are exactly six profiles, named as in tasks 3.3–3.8, sorted by name', () => {
    expect(GHOST_PROFILES).toHaveLength(6);
    expect(GHOST_PROFILES.map((profile) => profile.name)).toEqual([...EXPECTED_NAMES]);
    expect(GHOST_PROFILE_NAMES).toEqual([...EXPECTED_NAMES]);
  });

  it('getGhostProfile looks a profile up by name, and returns undefined for an unknown name', () => {
    for (const name of EXPECTED_NAMES) {
      expect(getGhostProfile(name)?.name).toBe(name);
    }
    expect(getGhostProfile('no-such-profile')).toBeUndefined();
  });

  it('every loaded profile still passes the schema', () => {
    for (const profile of GHOST_PROFILES) {
      expect(validateGhostProfile(profile).ok).toBe(true);
    }
  });
});

describe('each profile has exactly one behaviour on (Requirement 6.2)', () => {
  it.each(GHOST_PROFILES.map((profile) => [profile.name, profile] as const))(
    '%s has one behaviour on, matching its name',
    (name, profile) => {
      expect(behavioursOn(profile)).toEqual([name]);
    },
  );
});

describe('SAF-1: the urgent targets stay reachable under small range and fatigue (Requirements 6.2, 23.3)', () => {
  it('SAF-1 the small-range profile keeps at least 6.2° of turn each way and 5.2° up', () => {
    const profile = getGhostProfile('small-range');
    expect(profile).toBeDefined();
    if (!profile) return;
    expect(profile.rangeDeg.left).toBeGreaterThanOrEqual(REACH_TURN_MIN_DEG);
    expect(profile.rangeDeg.right).toBeGreaterThanOrEqual(REACH_TURN_MIN_DEG);
    expect(profile.rangeDeg.up).toBeGreaterThanOrEqual(REACH_UP_MIN_DEG);
  });

  it('SAF-1 the fatigue profile, after 30 minutes of linear loss, still covers 6.2° of turn each way and 5.2° up', () => {
    const profile = getGhostProfile('fatigue');
    expect(profile).toBeDefined();
    if (!profile) return;
    // range × (1 − rangeLossPctPerMin × 30 / 100), the design's linear fatigue model.
    const factor = 1 - (profile.fatigue.rangeLossPctPerMin * FATIGUE_REACH_MINUTES) / 100;
    expect(factor).toBeGreaterThan(0);
    expect(profile.rangeDeg.left * factor).toBeGreaterThanOrEqual(REACH_TURN_MIN_DEG);
    expect(profile.rangeDeg.right * factor).toBeGreaterThanOrEqual(REACH_TURN_MIN_DEG);
    expect(profile.rangeDeg.up * factor).toBeGreaterThanOrEqual(REACH_UP_MIN_DEG);
  });
});

describe('no profile name or description contains "ghost" (Requirement 6.7)', () => {
  it.each(GHOST_PROFILES.map((profile) => [profile.name, profile] as const))(
    '%s name and description are free of "ghost"',
    (_name, profile) => {
      expect(profile.name.toLowerCase()).not.toContain('ghost');
      expect(profile.description.toLowerCase()).not.toContain('ghost');
    },
  );
});

describe('buildGhostProfiles rejects an invalid file at load (Requirement 6.1)', () => {
  it('throws, naming the file path and a problem, so a bad profile cannot load silently', () => {
    const bad: Record<string, unknown> = { './profiles/broken.json': { name: 'broken' } };
    expect(() => buildGhostProfiles(bad)).toThrow(/broken\.json/);
    expect(() => buildGhostProfiles(bad)).toThrow(/missing/);
  });

  it('accepts a record of valid profiles and returns them sorted by name', () => {
    const record: Record<string, unknown> = {};
    for (const profile of [...GHOST_PROFILES].reverse()) {
      record[`./profiles/${profile.name}.json`] = profile;
    }
    expect(buildGhostProfiles(record).map((profile) => profile.name)).toEqual([...EXPECTED_NAMES]);
  });
});
