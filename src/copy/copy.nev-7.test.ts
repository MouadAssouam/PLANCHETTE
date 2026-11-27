// Feature: first-slice, Property 31: NEV-7a the board never describes itself with the forbidden terms
// **Validates: Requirements 20.3**
//
// The NEV-7 wording test (task 4.6). No Copy_Module string, and no Ghost_Profile name or description that the
// Nurse_Drawer can show in its Demo pointer list (6.7), may use "diagnose", "monitor", "clinical-grade", "detects
// pain" or "medical device", except "medical device" inside the exact disclaimer phrase "not a medical device", and
// none may contain the trademarked talking-board game name (20.3). A profile's notes are developer notes that no
// screen shows, so they are not scanned, as in copy.skn-4.test.ts. Text the patient spells never sits in the
// Copy_Module, so it is out of scope (20.4).
//
// The design marks this property as a scan of a fixed table ("a forall over the finite set"; Testing Strategy, "Where
// PBT is not the right tool"), so the test checks every copyCatalogue() string, and every profile name and
// description, once. There is no random generation, so there is no seed to print. index.test.ts checks that the
// catalogue holds every string the module exports. The strings that carry a clock time are filled in at one sample
// time: a time text is digits and a colon, so no time can make a term or hide one, and every template's own words are
// scanned.
//
// The checker is tested too: each term, in its word forms and in any case, must fail it, and the disclaimer must
// pass it. This file imports only src/copy/ and src/sim/profiles.ts; sim/ sits outside the one-way chain, so any
// stage may import it.

import { describe, expect, it } from 'vitest';
import { GHOST_PROFILE_NAMES, GHOST_PROFILES } from '../sim/profiles.ts';
import { PROTOTYPE_DISCLAIMER, copyCatalogue } from './index.ts';

/** The time the time-carrying strings are filled in with, in the Clock_Line's "HH:MM" form. */
const SAMPLE_TIME_TEXT = '03:22';

/** The six Ghost_Profiles from tasks 3.3 to 3.8, by name, in the order GHOST_PROFILES sorts them. */
const SIX_PROFILE_NAMES = ['dozing-roll', 'face-leaves-frame', 'fatigue', 'slow-drift', 'small-range', 'tremor'];

/**
 * The trademarked talking-board game name, built from parts as scripts/audit.mjs does, so the whole word never
 * appears in the repo: not in this file, not in a test name and not in a failure message (see masked()).
 */
const TRADE_NAME = ['ou', 'ija'].join('');
const TRADE_NAME_TERM = 'the trademarked talking-board game name';

// What may join the two words of a term: any mix of spaces, hyphens and the Unicode hyphens and dashes U+2010 to
// U+2015 (the en dash included), or nothing. So "clinical-grade", "clinical grade" and "clinicalgrade" all match.
const JOIN = '[\\s\\-\\u2010-\\u2015]*';

// The pattern list. Every pattern matches in any case and in each word form that still says the same thing. None is
// global, because RegExp.test() on a global pattern carries its position from one call to the next.
// - "diagnose": the stem "diagnos" anywhere in a word, so diagnose, diagnoses, diagnosed, diagnosing, diagnosis,
//   diagnostic and diagnostics, and also misdiagnosis and undiagnosed. No everyday word contains it.
// - "monitor": the stem "monitor" anywhere in a word, so monitor, monitors, monitored, monitoring and unmonitored.
//   It also matches the rare "admonitory" and "premonitory"; plain copy never uses them, and rewording is the fix.
// - "clinical-grade": "clinical" and "grade", joined as JOIN allows.
// - "detects pain": "detect" in any form (detect, detects, detected, detecting, detection), then "pain", with an
//   optional "of" between ("detection of pain"); and the reverse order ("pain detection", "pain-detecting").
//   "pain" on its own is a board label and passes.
// - "medical device": "medical" and "device", joined as JOIN allows, so "medical devices" and "medical-device" too.
//   It is allowed only inside the exact phrase "not a medical device": lower case, single spaces and whole words, as
//   the drawer disclaimer writes it. Every copy of that phrase is taken out before this one term is checked, so a
//   second, plain use beside it still fails.
// - The trademarked name: anywhere in a word, in any case, as scripts/audit.mjs checks every tracked file.
type Nev7Term = {
  /** The term as NEV-7 names it, for failure messages. */
  name: string;
  /** Matches the term in any case and word form. */
  pattern: RegExp;
  /** The one phrase the term is allowed in; each match of it is taken out before `pattern` runs. Global. */
  allowedIn?: RegExp;
};

const MEDICAL_DEVICE = new RegExp(`medical${JOIN}device`, 'i');

const NEV_7_TERMS: readonly Nev7Term[] = [
  { name: 'diagnose', pattern: /diagnos/i },
  { name: 'monitor', pattern: /monitor/i },
  { name: 'clinical-grade', pattern: new RegExp(`clinical${JOIN}grade`, 'i') },
  { name: 'detects pain', pattern: new RegExp(`detect\\w*${JOIN}(?:of${JOIN})?pain|\\bpain${JOIN}detect`, 'i') },
  { name: 'medical device', pattern: MEDICAL_DEVICE, allowedIn: /\bnot a medical device\b/g },
  { name: TRADE_NAME_TERM, pattern: new RegExp(TRADE_NAME, 'i') },
];

/** The names of the NEV-7 terms that `text` uses, in the order of NEV_7_TERMS. Empty when `text` is clean. */
function nev7TermsIn(text: string): string[] {
  return NEV_7_TERMS.filter(({ pattern, allowedIn }) => pattern.test(allowedIn ? text.replace(allowedIn, ' ') : text))
    .map(({ name }) => name);
}

const TRADE_NAME_EVERYWHERE = new RegExp(TRADE_NAME, 'gi');

/** `text` with the trademarked name replaced by a placeholder, so that no failure message ever spells it. */
function masked(text: string): string {
  return text.replace(TRADE_NAME_EVERYWHERE, '[trademarked name]');
}

describe('NEV-7a the board never describes itself with the forbidden terms (Requirement 20.3)', () => {
  it('NEV-7a every Copy_Module string is free of the NEV-7 terms and the trademarked name, "not a medical device" aside', () => {
    const { patientVoice, system } = copyCatalogue(SAMPLE_TIME_TEXT);
    const strings = [...patientVoice, ...system];
    // The scan reaches the drawer disclaimer, the one string that relies on the allowed phrase.
    expect(strings).toContain(PROTOTYPE_DISCLAIMER);
    const violations = strings
      .map((text) => ({ text: masked(text), terms: nev7TermsIn(text) }))
      .filter(({ terms }) => terms.length > 0);
    expect(violations).toEqual([]);
  });

  it('NEV-7a every Ghost_Profile name and description the nurse drawer can show is free of the NEV-7 terms and the trademarked name', () => {
    // Guard: the scan covers all six profiles, each with text in its description, so it cannot pass on a short or
    // empty list. The names are masked here too, so even a failing guard never spells the trademarked name.
    expect(GHOST_PROFILES.map(({ name }) => masked(name))).toEqual(SIX_PROFILE_NAMES);
    expect(GHOST_PROFILE_NAMES.map((name) => masked(name))).toEqual(SIX_PROFILE_NAMES);
    for (const { name, description } of GHOST_PROFILES) expect(description, masked(name)).toMatch(/\S/);
    // Each profile's name and description, which the Demo pointer list shows (6.7), and GHOST_PROFILE_NAMES. The
    // notes are left out, because no screen shows them.
    const scanned = [
      ...GHOST_PROFILES.flatMap(({ name, description }) => [
        { where: `profile "${name}": name`, text: name },
        { where: `profile "${name}": description`, text: description },
      ]),
      ...GHOST_PROFILE_NAMES.map((name) => ({ where: 'GHOST_PROFILE_NAMES', text: name })),
    ];
    const violations = scanned
      .map(({ where, text }) => ({ where: masked(where), text: masked(text), terms: nev7TermsIn(text) }))
      .filter(({ terms }) => terms.length > 0);
    expect(violations).toEqual([]);
  });
});

describe('NEV-7a the checker catches each term and lets the disclaimer through', () => {
  it('NEV-7a the checker flags each term in its word forms and in any case', () => {
    const flagged: readonly (readonly [text: string, term: string])[] = [
      ['This board monitors you.', 'monitor'],
      ['The screen is monitored.', 'monitor'],
      ['MONITORING IS ON.', 'monitor'],
      ['The board diagnoses you.', 'diagnose'],
      ['A diagnosis.', 'diagnose'],
      ['Diagnostic mode.', 'diagnose'],
      ['A clinical-grade board.', 'clinical-grade'],
      ['Clinical grade tracking.', 'clinical-grade'],
      ['A clinical\u2013grade board.', 'clinical-grade'],
      ['The board detects pain.', 'detects pain'],
      ['It can detect pain.', 'detects pain'],
      ['Pain detection is on.', 'detects pain'],
    ];
    for (const [text, term] of flagged) expect(nev7TermsIn(text), text).toEqual([term]);
  });

  it('NEV-7a the checker flags "medical device" everywhere but the exact phrase "not a medical device"', () => {
    const flagged = [
      'A medical device.',
      'Medical devices only.',
      'A medical-device board.',
      // The allowed phrase covers only itself: a plain use beside it still fails.
      'It is not a medical device. It is a medical device.',
      // "Exact" means as the disclaimer writes it, in lower case.
      'Not a medical device.',
    ];
    for (const text of flagged) expect(nev7TermsIn(text), text).toEqual(['medical device']);
  });

  it('NEV-7a the checker flags the trademarked name in any case, and its messages never spell the name', () => {
    const forms = [TRADE_NAME, TRADE_NAME.toUpperCase(), `${TRADE_NAME.charAt(0).toUpperCase()}${TRADE_NAME.slice(1)}`];
    for (const form of forms) {
      const text = `A ${form} board.`;
      expect(nev7TermsIn(text), masked(text)).toEqual([TRADE_NAME_TERM]);
      expect(masked(text)).toBe('A [trademarked name] board.');
    }
  });

  it('NEV-7a the checker passes the disclaimer and plain words close to the terms', () => {
    const clean = [
      'PLANCHETTE is a prototype. It is not a medical device.',
      PROTOTYPE_DISCLAIMER,
      "I'm in pain.",
      'Ask the medical team. The device stays on the side table.',
    ];
    for (const text of clean) expect(nev7TermsIn(text), text).toEqual([]);
    // The disclaimer passes because of the allowed phrase, not because the check misses "medical device" in it.
    expect(MEDICAL_DEVICE.test(PROTOTYPE_DISCLAIMER)).toBe(true);
  });
});
