// The Ghost_Profile type and its hand-written schema check (task 3.2, Requirement 6.1).
//
// Shape: tech.md's "Ghost profile format" and design.md's "Data Models". A behaviour is turned off with a
// zero value or null: tremor { amplitudeDeg: 0, frequencyHz: 0 }, driftDegPerMin 0, fatigue { rangeLossPctPerMin: 0 },
// dozing null, faceLost null. Frequency 0 is accepted when the tremor amplitude is 0.
//
// Physically plausible caps come from the ghost-patient-designer agent (all TUNE): turn <= 60 deg each way,
// up and down <= 40 deg, tremor <= 5 deg at 3-12 Hz while on, drift <= 5 deg per minute. Every number must be
// finite and non-negative, and the seed must be an integer.
//
// Problem strings are developer-facing (they are never shown to a patient or a nurse), so they live here, not in
// src/copy/. The check is written by hand, with no schema package. This file uses no Vite-only feature, so the
// dwell sweep (scripts/dwell-sweep.mjs, task 12.1) can import it in plain Node.

export type DozingDirection = 'down' | 'left' | 'right';

export type GhostProfile = {
  name: string;
  description: string;
  notes: string;
  seed: number;
  rangeDeg: { left: number; right: number; up: number; down: number };
  tremor: { amplitudeDeg: number; frequencyHz: number };
  driftDegPerMin: number;
  fatigue: { rangeLossPctPerMin: number };
  dozing: { everyMin: number; durationS: number; dropDeg: number; direction: DozingDirection } | null;
  faceLost: { everyMin: number; durationS: number } | null;
};

/** The discriminated result of {@link validateGhostProfile}: the typed profile, or the list of problems. */
export type GhostProfileResult =
  | { ok: true; profile: GhostProfile }
  | { ok: false; problems: string[] };

/** Physically plausible limits (all TUNE until there are volunteer recordings). */
export const GHOST_PROFILE_LIMITS = {
  turnMaxDeg: 60,
  pitchMaxDeg: 40,
  tremorAmplitudeMaxDeg: 5,
  tremorFrequencyMinHz: 3,
  tremorFrequencyMaxHz: 12,
  driftMaxDegPerMin: 5,
};

const DOZING_DIRECTIONS: string[] = ['down', 'left', 'right'];

const TOP_LEVEL_KEYS: string[] = [
  'name', 'description', 'notes', 'seed',
  'rangeDeg', 'tremor', 'driftDegPerMin', 'fatigue', 'dozing', 'faceLost',
];
const RANGE_KEYS: string[] = ['left', 'right', 'up', 'down'];
const TREMOR_KEYS: string[] = ['amplitudeDeg', 'frequencyHz'];
const FATIGUE_KEYS: string[] = ['rangeLossPctPerMin'];
const DOZING_KEYS: string[] = ['everyMin', 'durationS', 'dropDeg', 'direction'];
const FACE_LOST_KEYS: string[] = ['everyMin', 'durationS'];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function describeType(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function describeValue(value: unknown): string {
  if (typeof value === 'string') return JSON.stringify(value);
  return describeType(value);
}

type NumberBounds = { min?: number; max?: number; integer?: boolean };

// Validates a required number field in `obj`, pushing any problems (missing, wrong type, NaN, non-finite,
// non-integer, below min, above max). Collects every problem rather than stopping at the first.
function checkNumber(
  obj: Record<string, unknown>,
  key: string,
  path: string,
  bounds: NumberBounds,
  problems: string[],
): void {
  if (!(key in obj)) {
    problems.push(`${path}: missing`);
    return;
  }
  const value = obj[key];
  if (typeof value !== 'number') {
    problems.push(`${path}: expected a number, got ${describeType(value)}`);
    return;
  }
  if (Number.isNaN(value)) {
    problems.push(`${path}: must be a real number, got NaN`);
    return;
  }
  if (!Number.isFinite(value)) {
    problems.push(`${path}: must be finite, got ${value}`);
    return;
  }
  if (bounds.integer && !Number.isInteger(value)) {
    problems.push(`${path}: expected an integer, got ${value}`);
  }
  if (bounds.min !== undefined && value < bounds.min) {
    problems.push(`${path}: must be at least ${bounds.min}, got ${value}`);
  }
  if (bounds.max !== undefined && value > bounds.max) {
    problems.push(`${path}: must be at most ${bounds.max}, got ${value}`);
  }
}

function checkString(obj: Record<string, unknown>, key: string, path: string, problems: string[]): void {
  if (!(key in obj)) {
    problems.push(`${path}: missing`);
    return;
  }
  if (typeof obj[key] !== 'string') {
    problems.push(`${path}: expected a string, got ${describeType(obj[key])}`);
  }
}

// Reads a required, non-null object field. Returns it for further checks, or null (after pushing a problem) when it
// is missing or is not an object.
function requireObject(
  obj: Record<string, unknown>,
  key: string,
  path: string,
  problems: string[],
): Record<string, unknown> | null {
  if (!(key in obj)) {
    problems.push(`${path}: missing`);
    return null;
  }
  const value = obj[key];
  if (!isObject(value)) {
    problems.push(`${path}: expected an object, got ${describeType(value)}`);
    return null;
  }
  return value;
}

function checkUnknownKeys(obj: Record<string, unknown>, allowed: string[], prefix: string, problems: string[]): void {
  for (const key of Object.keys(obj)) {
    if (!allowed.includes(key)) {
      problems.push(`${prefix}${key}: unknown field`);
    }
  }
}

function checkRange(value: Record<string, unknown>, problems: string[]): void {
  const { turnMaxDeg, pitchMaxDeg } = GHOST_PROFILE_LIMITS;
  checkNumber(value, 'left', 'rangeDeg.left', { min: 0, max: turnMaxDeg }, problems);
  checkNumber(value, 'right', 'rangeDeg.right', { min: 0, max: turnMaxDeg }, problems);
  checkNumber(value, 'up', 'rangeDeg.up', { min: 0, max: pitchMaxDeg }, problems);
  checkNumber(value, 'down', 'rangeDeg.down', { min: 0, max: pitchMaxDeg }, problems);
  checkUnknownKeys(value, RANGE_KEYS, 'rangeDeg.', problems);
}

function checkTremor(value: Record<string, unknown>, problems: string[]): void {
  const { tremorAmplitudeMaxDeg, tremorFrequencyMinHz, tremorFrequencyMaxHz } = GHOST_PROFILE_LIMITS;
  checkNumber(value, 'amplitudeDeg', 'tremor.amplitudeDeg', { min: 0, max: tremorAmplitudeMaxDeg }, problems);
  checkNumber(value, 'frequencyHz', 'tremor.frequencyHz', { min: 0 }, problems);
  // The frequency band applies only while the tremor is on. Amplitude 0 (tremor off) accepts any frequency, so the
  // "off" form { amplitudeDeg: 0, frequencyHz: 0 } passes.
  const amplitude = value['amplitudeDeg'];
  const frequency = value['frequencyHz'];
  const tremorOn = typeof amplitude === 'number' && Number.isFinite(amplitude) && amplitude > 0;
  if (tremorOn && typeof frequency === 'number' && Number.isFinite(frequency)) {
    if (frequency < tremorFrequencyMinHz || frequency > tremorFrequencyMaxHz) {
      problems.push(
        `tremor.frequencyHz: must be between ${tremorFrequencyMinHz} and ${tremorFrequencyMaxHz} ` +
          `when amplitudeDeg > 0, got ${frequency}`,
      );
    }
  }
  checkUnknownKeys(value, TREMOR_KEYS, 'tremor.', problems);
}

function checkDozing(obj: Record<string, unknown>, problems: string[]): void {
  if (!('dozing' in obj)) {
    problems.push('dozing: missing');
    return;
  }
  const value = obj['dozing'];
  if (value === null) return; // dozing off
  if (!isObject(value)) {
    problems.push(`dozing: expected an object or null, got ${describeType(value)}`);
    return;
  }
  checkNumber(value, 'everyMin', 'dozing.everyMin', { min: 0 }, problems);
  checkNumber(value, 'durationS', 'dozing.durationS', { min: 0 }, problems);
  checkNumber(value, 'dropDeg', 'dozing.dropDeg', { min: 0 }, problems);
  if (!('direction' in value)) {
    problems.push('dozing.direction: missing');
  } else {
    const direction = value['direction'];
    if (typeof direction !== 'string' || !DOZING_DIRECTIONS.includes(direction)) {
      problems.push(`dozing.direction: expected "down", "left" or "right", got ${describeValue(direction)}`);
    }
  }
  checkUnknownKeys(value, DOZING_KEYS, 'dozing.', problems);
}

function checkFaceLost(obj: Record<string, unknown>, problems: string[]): void {
  if (!('faceLost' in obj)) {
    problems.push('faceLost: missing');
    return;
  }
  const value = obj['faceLost'];
  if (value === null) return; // face loss off
  if (!isObject(value)) {
    problems.push(`faceLost: expected an object or null, got ${describeType(value)}`);
    return;
  }
  checkNumber(value, 'everyMin', 'faceLost.everyMin', { min: 0 }, problems);
  checkNumber(value, 'durationS', 'faceLost.durationS', { min: 0 }, problems);
  checkUnknownKeys(value, FACE_LOST_KEYS, 'faceLost.', problems);
}

/**
 * Checks that `value` is a well-formed {@link GhostProfile}. Returns the typed profile when it is, or the full list of
 * problems when it is not. It never throws, whatever `value` is. Problem strings are developer-facing.
 */
export function validateGhostProfile(value: unknown): GhostProfileResult {
  if (!isObject(value)) {
    return { ok: false, problems: [`profile: expected an object, got ${describeType(value)}`] };
  }

  const problems: string[] = [];

  checkString(value, 'name', 'name', problems);
  checkString(value, 'description', 'description', problems);
  checkString(value, 'notes', 'notes', problems);
  checkNumber(value, 'seed', 'seed', { integer: true }, problems);

  const range = requireObject(value, 'rangeDeg', 'rangeDeg', problems);
  if (range) checkRange(range, problems);

  const tremor = requireObject(value, 'tremor', 'tremor', problems);
  if (tremor) checkTremor(tremor, problems);

  checkNumber(value, 'driftDegPerMin', 'driftDegPerMin', { min: 0, max: GHOST_PROFILE_LIMITS.driftMaxDegPerMin }, problems);

  const fatigue = requireObject(value, 'fatigue', 'fatigue', problems);
  if (fatigue) {
    checkNumber(fatigue, 'rangeLossPctPerMin', 'fatigue.rangeLossPctPerMin', { min: 0 }, problems);
    checkUnknownKeys(fatigue, FATIGUE_KEYS, 'fatigue.', problems);
  }

  checkDozing(value, problems);
  checkFaceLost(value, problems);

  checkUnknownKeys(value, TOP_LEVEL_KEYS, '', problems);

  if (problems.length > 0) return { ok: false, problems };
  return { ok: true, profile: value as unknown as GhostProfile };
}
