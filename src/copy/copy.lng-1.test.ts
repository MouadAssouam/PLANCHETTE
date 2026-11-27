// Feature: first-slice, Property 26: LNG-1a labels come from the fixed table and are never translated at runtime
//
// LNG-1 (safety.md) and Requirements 20.6 and 16.3: the board takes its labels and sentences from one fixed,
// human-reviewed English table and translates nothing at runtime. This test proves that in two ways.
//
// 1. The getters are fixed. `label(id)` and `sentence(id)` take only the id. The design's Property 26 entry allows a
//    skin or locale argument to be passed and requires it to be ignored, so the getters are called through a widened
//    function type with a skin ('ward' | 'candlelight') and an arbitrary locale string, and the result is compared
//    against a hand-pinned English table. The pinned strings are copied by hand from requirements.md (13.5 for
//    sentences, 10.3 for the confirm labels, Requirement 2 for the fixed targets and needs, 2.4 for letters and
//    SPACE/DELETE/SPEAK), so the test anchors on the requirements, not only on the module comparing with itself.
//
// 2. There is no runtime-translation path. A scan reads every non-test .ts file in src/copy/ as raw text and asserts
//    none of them reaches for a runtime translation or network mechanism (fetch/XHR/WebSocket/beacon, an /api/ call,
//    Intl.* or toLocale* locale formatting, navigator.language, a "translate"/i18n helper, or a dynamic import()).
//    import.meta.glob with { query: '?raw' } is a Vite feature typed by tsconfig's "types": ["vite/client"].
//
// The scan reads only non-test files, so the forbidden words that appear in this test file (fetch, Intl, translate,
// navigator.language, /api/, import(, ...) are never scanned and never match themselves.
//
// This file imports only src/copy/, so it stays inside the one-way chain (copy/ sits outside it and may be imported by
// anyone). fast-check runs 200 times and prints the seed on failure (project rule); binary-unit strings keep it on the
// v4 API.

import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  label,
  sentence,
  SPOKEN_TARGET_IDS,
  TARGET_IDS,
  type SpokenTargetId,
  type TargetId,
} from './index.ts';

// ---------------------------------------------------------------------------------------------------------------
// The fixed English table, pinned by hand from requirements.md. If the module's wording ever drifts from the
// human-reviewed requirements, these literals catch it; Record<...> makes a missing or extra id a compile error.
// ---------------------------------------------------------------------------------------------------------------

// Board labels: YES/NO/CALL/CAN'T BREATHE (Requirement 2.1, 13.5), the needs (2.3), the Confirm_Targets (10.3), the
// letters A-Z (2.4) and SPACE/DELETE/SPEAK (2.4).
const EXPECTED_LABELS: Record<TargetId, string> = {
  yes: 'YES',
  no: 'NO',
  call: 'CALL',
  'cant-breathe': "CAN'T BREATHE",
  'confirm-call': 'YES, CALL',
  'confirm-cant-breathe': "YES, CAN'T BREATHE",
  'mouth-dry': 'MOUTH DRY',
  pain: 'PAIN',
  suction: 'SUCTION',
  'move-me': 'MOVE ME',
  'too-hot': 'TOO HOT',
  'too-cold': 'TOO COLD',
  toilet: 'TOILET',
  lights: 'LIGHTS',
  noise: 'NOISE',
  glasses: 'GLASSES',
  'hearing-aid': 'HEARING AID',
  'the-tube': 'THE TUBE',
  'letter-a': 'A',
  'letter-b': 'B',
  'letter-c': 'C',
  'letter-d': 'D',
  'letter-e': 'E',
  'letter-f': 'F',
  'letter-g': 'G',
  'letter-h': 'H',
  'letter-i': 'I',
  'letter-j': 'J',
  'letter-k': 'K',
  'letter-l': 'L',
  'letter-m': 'M',
  'letter-n': 'N',
  'letter-o': 'O',
  'letter-p': 'P',
  'letter-q': 'Q',
  'letter-r': 'R',
  'letter-s': 'S',
  'letter-t': 'T',
  'letter-u': 'U',
  'letter-v': 'V',
  'letter-w': 'W',
  'letter-x': 'X',
  'letter-y': 'Y',
  'letter-z': 'Z',
  space: 'SPACE',
  delete: 'DELETE',
  speak: 'SPEAK',
};

// The spoken first-person sentences, copied verbatim from the Requirement 13.5 table.
const EXPECTED_SENTENCES: Record<SpokenTargetId, string> = {
  yes: 'Yes.',
  no: 'No.',
  call: 'I need the nurse. Please come.',
  'cant-breathe': "I can't breathe. Please come now.",
  'mouth-dry': 'My mouth is dry.',
  pain: "I'm in pain.",
  suction: 'I need suction.',
  'move-me': 'Please move me.',
  'too-hot': "I'm too hot.",
  'too-cold': "I'm too cold.",
  toilet: 'I need the toilet.',
  lights: 'Please change the lights.',
  noise: 'The noise is bothering me.',
  glasses: 'I need my glasses.',
  'hearing-aid': 'I need my hearing aid.',
  'the-tube': "It's about my breathing tube.",
};

// The getters take only the id. Widen their type so a skin and a locale can be passed and shown to be ignored, as the
// design's Property 26 entry describes (`label(id, anySkin) === label(id)`).
const labelWithExtras = label as (...args: unknown[]) => string;
const sentenceWithExtras = sentence as (...args: unknown[]) => string;

const targetIdArb = fc.constantFrom<TargetId>(...TARGET_IDS);
const spokenIdArb = fc.constantFrom<SpokenTargetId>(...SPOKEN_TARGET_IDS);
// A skin is only ever 'ward' or 'candlelight' (Requirement 16); the getters must ignore it (20.5).
const skinArb = fc.constantFrom('ward', 'candlelight');
// A locale: realistic BCP-47 tags plus arbitrary binary-unit strings, all of which the getters must ignore.
const localeArb = fc.oneof(
  fc.constantFrom('en', 'en-US', 'en-GB', 'fr', 'fr-FR', 'es', 'de', 'ar', 'zh-Hans', 'ja', 'pt-BR', ''),
  fc.string({ unit: 'binary' }),
);

describe('Property 26: LNG-1a - the getters return the fixed English table regardless of skin or locale', () => {
  it('LNG-1a: label(id, skin, locale) ignores the extra arguments and returns the fixed English label', () => {
    fc.assert(
      fc.property(targetIdArb, skinArb, localeArb, (id, skin, locale) => {
        const expected = EXPECTED_LABELS[id];
        // The extra skin/locale arguments change nothing: the result equals the no-argument call and the pinned label.
        expect(labelWithExtras(id, skin, locale)).toBe(expected);
        expect(label(id)).toBe(expected);
      }),
      { numRuns: 200 },
    );
  });

  it('LNG-1a: sentence(id, skin, locale) ignores the extra arguments and returns the fixed English sentence', () => {
    fc.assert(
      fc.property(spokenIdArb, skinArb, localeArb, (id, skin, locale) => {
        const expected = EXPECTED_SENTENCES[id];
        expect(sentenceWithExtras(id, skin, locale)).toBe(expected);
        expect(sentence(id)).toBe(expected);
      }),
      { numRuns: 200 },
    );
  });

  it('LNG-1a: every label equals its hand-pinned English string, for every target id', () => {
    for (const id of TARGET_IDS) {
      expect(label(id)).toBe(EXPECTED_LABELS[id]);
    }
    // The pinned table covers exactly the target ids, so no id slips the invariance check above.
    expect(Object.keys(EXPECTED_LABELS).sort()).toEqual([...TARGET_IDS].sort());
  });

  it('LNG-1a: every sentence equals its Requirement 13.5 string, for every spoken id', () => {
    for (const id of SPOKEN_TARGET_IDS) {
      expect(sentence(id)).toBe(EXPECTED_SENTENCES[id]);
    }
    expect(Object.keys(EXPECTED_SENTENCES).sort()).toEqual([...SPOKEN_TARGET_IDS].sort());
  });
});

// ---------------------------------------------------------------------------------------------------------------
// The source scan: no runtime-translation path anywhere in src/copy/.
// ---------------------------------------------------------------------------------------------------------------

// Each pattern names a way a label could be translated or fetched at runtime. A label must come from the fixed table
// (LNG-1, 20.6), so none of these may appear in a copy source file. The list follows the design's Property 26
// assertion ("no translate/Intl runtime-translation call") and the task's "or similar": network calls that could pull
// a translation, platform locale formatting, and a dynamic import of a locale bundle.
const FORBIDDEN_PATTERNS: readonly { readonly name: string; readonly pattern: RegExp }[] = [
  // Network fetches: the core board is offline (NEV-6) and labels are never fetched.
  { name: 'fetch(', pattern: /\bfetch\s*\(/ },
  { name: 'XMLHttpRequest', pattern: /\bXMLHttpRequest\b/ },
  { name: 'WebSocket', pattern: /\bWebSocket\b/ },
  { name: 'EventSource', pattern: /\bEventSource\b/ },
  { name: 'sendBeacon', pattern: /\bsendBeacon\b/ },
  // A call to the suggest/translate endpoint: /api/ must never drive a board label (LNG-1, AI-4).
  { name: 'an /api/ call', pattern: /\/api\// },
  // Platform locale/translation: Intl.*, any toLocale* method, and navigator.language.
  { name: 'Intl. API', pattern: /\bIntl\s*\./ },
  { name: 'a toLocale* method', pattern: /\btoLocale[A-Z]\w*\s*\(/ },
  { name: 'navigator.language', pattern: /\bnavigator\s*\.\s*language/ },
  // The word "translate" in any form, and common i18n helpers: a label is never translated at runtime.
  { name: 'translate / translation', pattern: /translat(?:e|es|ed|ing|ion|or)/i },
  { name: 'an i18n/l10n helper', pattern: /\b(?:i18n|l10n|gettext|formatMessage)\b/i },
  // A dynamic import() could load a locale bundle at runtime; the table must stay static. Does not match a static
  // `import ... from` (no parenthesis follows `import`) nor `import.meta` (a dot follows `import`).
  { name: 'a dynamic import()', pattern: /\bimport\s*\(/ },
];

// Every .ts file in src/copy/, read as raw text, with the test files (this one included) filtered out below.
const rawCopyFiles: Record<string, string> = import.meta.glob('./*.ts', {
  query: '?raw',
  import: 'default',
  eager: true,
});
const nonTestCopyFiles = Object.entries(rawCopyFiles).filter(([path]) => !path.endsWith('.test.ts'));

describe('Property 26: LNG-1a - src/copy holds no runtime-translation path (source scan)', () => {
  it('LNG-1a: the scan finds the copy source files, including index.ts', () => {
    expect(nonTestCopyFiles.length).toBeGreaterThanOrEqual(1);
    expect(nonTestCopyFiles.some(([path]) => path.endsWith('/index.ts'))).toBe(true);
  });

  it.each(nonTestCopyFiles)('LNG-1a: %s uses no runtime-translation mechanism', (path, text) => {
    for (const { name, pattern } of FORBIDDEN_PATTERNS) {
      expect(pattern.test(text), `${path} must not use ${name}`).toBe(false);
    }
  });
});
