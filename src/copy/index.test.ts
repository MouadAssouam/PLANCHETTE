// Smoke tests for the Copy_Module's structure (task 4.1): the target ids, the total lookups, and copyCatalogue(),
// which the wording tests (tasks 4.2 to 4.6) scan. The wording itself is checked by those tests. Imports only copy/.
import { describe, expect, it } from 'vitest';
import * as copy from './index.ts';
import {
  ALERT_ACKNOWLEDGE_HINT,
  ALERT_NAMES,
  CONFIRM_TARGET_FOR,
  CONFIRM_TARGET_IDS,
  DEMO_WORDS,
  DRAWER_CONTROLS,
  LABELS,
  LETTER_TARGET_IDS,
  NURSE_MENU,
  PAUSE_MESSAGES,
  SENTENCES,
  SPOKEN_TARGET_IDS,
  TARGET_IDS,
  UNCONFIRMED_HANDLE_TEXT,
  URGENT_TARGET_FOR,
  URGENT_TARGET_IDS,
  alertStartedAt,
  copyCatalogue,
  isSpokenTargetId,
  isTargetId,
  letterTargetId,
  pausedForCareMessage,
  resumesByItselfAt,
  unconfirmedDrawerLine,
} from './index.ts';

// Exports that hold ids, not text that people read or hear.
const ID_EXPORTS = new Set([
  'FIXED_TARGET_IDS', 'URGENT_TARGET_IDS', 'CONFIRM_TARGET_IDS', 'NEED_TARGET_IDS', 'LETTER_TARGET_IDS',
  'SPELLING_TARGET_IDS', 'TARGET_IDS', 'SPOKEN_TARGET_IDS', 'CONFIRM_TARGET_FOR', 'URGENT_TARGET_FOR',
]);

function leafStrings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(leafStrings);
  if (typeof value === 'object' && value !== null) return Object.values(value).flatMap(leafStrings);
  return [];
}

describe('target ids', () => {
  it('every id is unique, and LABELS and SENTENCES hold exactly the ids, each with non-empty text', () => {
    expect(new Set(TARGET_IDS).size).toBe(TARGET_IDS.length);
    expect(TARGET_IDS).toHaveLength(4 + 2 + 12 + 26 + 3);
    expect(Object.keys(LABELS).sort()).toEqual([...TARGET_IDS].sort());
    expect(Object.keys(SENTENCES).sort()).toEqual([...SPOKEN_TARGET_IDS].sort());
    for (const id of TARGET_IDS) expect(copy.label(id)).toMatch(/\S/);
    for (const id of SPOKEN_TARGET_IDS) expect(copy.sentence(id)).toMatch(/\S/);
  });

  it('each Urgent_Target and its Confirm_Target point at each other', () => {
    for (const urgent of URGENT_TARGET_IDS) expect(URGENT_TARGET_FOR[CONFIRM_TARGET_FOR[urgent]]).toBe(urgent);
    expect(Object.values(CONFIRM_TARGET_FOR).sort()).toEqual([...CONFIRM_TARGET_IDS].sort());
  });

  it('ALR-3: the id guards accept the ids only, and Acknowledge is never a Target id', () => {
    for (const id of TARGET_IDS) expect(isTargetId(id)).toBe(true);
    for (const id of SPOKEN_TARGET_IDS) expect(isSpokenTargetId(id)).toBe(true);
    for (const value of ['acknowledge', '', 'YES', 'HELLO', 'toString', 'rest']) {
      expect(isTargetId(value)).toBe(false);
      expect(isSpokenTargetId(value)).toBe(false);
    }
    expect(isSpokenTargetId('letter-a')).toBe(false);
    expect(isSpokenTargetId('confirm-call')).toBe(false);
  });

  it('each letter maps back to its letter Target, and every demo word is spelled with letter Targets only', () => {
    for (const id of LETTER_TARGET_IDS) expect(letterTargetId(LABELS[id])).toBe(id);
    expect(letterTargetId('a')).toBeUndefined();
    expect(letterTargetId(' ')).toBeUndefined();
    for (const word of DEMO_WORDS) {
      expect(word).toMatch(/^[A-Z]+$/);
      for (const letter of word) expect(letterTargetId(letter)).toBeDefined();
    }
  });
});

describe('copyCatalogue', () => {
  it('holds every string constant the module exports, and the strings made from a time', () => {
    const { patientVoice, system } = copyCatalogue('03:22');
    const all = new Set([...patientVoice, ...system]);
    for (const [name, value] of Object.entries(copy)) {
      if (ID_EXPORTS.has(name) || typeof value === 'function') continue;
      for (const text of leafStrings(value)) expect(all, `${name}: ${text}`).toContain(text);
    }
    expect(all).toContain(pausedForCareMessage('03:22').text);
    expect(all).toContain(resumesByItselfAt('03:22'));
    expect(all).toContain(alertStartedAt('03:22'));
    for (const urgent of URGENT_TARGET_IDS) expect(all).toContain(unconfirmedDrawerLine(urgent, '03:22'));
  });

  it('puts the labels, sentences and demo words in the patient voice, and nothing else there', () => {
    const { patientVoice } = copyCatalogue('03:22');
    const expected = new Set([...Object.values(LABELS), ...Object.values(SENTENCES), ...DEMO_WORDS]);
    expect(new Set(patientVoice)).toEqual(expected);
  });

  it('the strings made from a time carry the time they are given', () => {
    expect(pausedForCareMessage('14:05').text).toContain('14:05');
    expect(pausedForCareMessage('14:05').detail).toContain(resumesByItselfAt('14:05'));
    expect(alertStartedAt('14:05')).toContain('14:05');
    for (const urgent of URGENT_TARGET_IDS) expect(unconfirmedDrawerLine(urgent, '14:05')).toContain('14:05');
  });
});

describe('cross-references', () => {
  it('the no-input and alert lines name the nurse controls by their exact labels', () => {
    expect(PAUSE_MESSAGES['no-input'].detail).toContain(DRAWER_CONTROLS.mouseMode);
    expect(PAUSE_MESSAGES['no-input'].detail).toContain(DRAWER_CONTROLS.demoPointer);
    expect(PAUSE_MESSAGES['no-input'].detail.toLowerCase()).toContain(NURSE_MENU.toLowerCase());
    expect(ALERT_ACKNOWLEDGE_HINT).toContain(DRAWER_CONTROLS.acknowledge);
    expect(ALERT_ACKNOWLEDGE_HINT.toLowerCase()).toContain(NURSE_MENU.toLowerCase());
  });

  it('alert names and unconfirmed notices name the Urgent_Target by its board label', () => {
    for (const urgent of URGENT_TARGET_IDS) {
      expect(ALERT_NAMES[urgent]).toBe(LABELS[urgent]);
      expect(UNCONFIRMED_HANDLE_TEXT[urgent].startsWith(`${LABELS[urgent]} `)).toBe(true);
      expect(unconfirmedDrawerLine(urgent, '03:14').startsWith(`${LABELS[urgent]} `)).toBe(true);
    }
  });
});
