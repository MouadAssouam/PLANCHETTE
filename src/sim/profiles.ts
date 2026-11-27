// The Ghost_Profile loader (task 3.9, Requirements 6.1, 6.7).
//
// Loads every src/sim/profiles/*.json with Vite's import.meta.glob, validates each with validateGhostProfile, and
// exposes the validated profiles for the Nurse_Drawer's Demo pointer list (Requirement 6.7), the start-switch parser
// (src/board/switches.ts, task 13.1) and the SKN-4a wording scan (task 4.3): a readonly array sorted by name, the
// names on their own, and a lookup by name. Each profile carries its own name and description for the drawer.
//
// An invalid file throws here, at load, with the file path and the problems, so a broken profile can never reach the
// app or a test silently. The validation and sort live in the pure buildGhostProfiles(modules), so the throw can be
// tested without putting a bad file on disk.
//
// import.meta.glob is a Vite-only feature. The dwell sweep runs in plain Node (scripts/dwell-sweep.mjs, task 12.1) and
// reads and validates the JSON itself with node:fs, so it never imports this file. This file imports only src/sim/.

import { validateGhostProfile, type GhostProfile } from './pose-types.ts';

/**
 * Validates every module in `modules` (a map of file path to parsed JSON, the shape import.meta.glob returns) and
 * returns the profiles sorted by name. Throws on the first invalid file, by path order, naming its path and every
 * problem, so a bad profile fails loudly at load instead of reaching the app. Pure: it reads only its argument, so a
 * test can hand it a crafted record.
 */
export function buildGhostProfiles(modules: Record<string, unknown>): GhostProfile[] {
  const profiles: GhostProfile[] = [];
  for (const path of Object.keys(modules).sort()) {
    const result = validateGhostProfile(modules[path]);
    if (!result.ok) {
      throw new Error(`Invalid ghost profile ${path}: ${result.problems.join('; ')}`);
    }
    profiles.push(result.profile);
  }
  return profiles.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
}

const modules: Record<string, unknown> = import.meta.glob('./profiles/*.json', {
  eager: true,
  import: 'default',
});

/** The six validated Ghost_Profiles, sorted by name. Built at module load; a bad file throws before this is set. */
export const GHOST_PROFILES: readonly GhostProfile[] = buildGhostProfiles(modules);

/** The profile names, sorted, for the start-switch parser (task 13.1) and the drawer's Demo pointer list. */
export const GHOST_PROFILE_NAMES: readonly string[] = GHOST_PROFILES.map((profile) => profile.name);

const BY_NAME: ReadonlyMap<string, GhostProfile> = new Map(
  GHOST_PROFILES.map((profile) => [profile.name, profile]),
);

/** The profile with this name, or undefined when none has it (for example an unknown `?ghost=` switch, 5.9). */
export function getGhostProfile(name: string): GhostProfile | undefined {
  return BY_NAME.get(name);
}
