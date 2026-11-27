// Tone and starting-wording tests for the Copy_Module (task 4.2). Requirements 3.8, 7.11, 8.6, 10.3, 13.5, 13.12,
// 16.8, 16.11, 16.13, 17.12, 18.1 and 20.2.
//
// SKN-3: board labels are upper case, no string has an exclamation mark, no system message uses "I" as a word (the
// patient's labels and sentences may), and each string below equals its starting wording. SKN-2: text that people see
// calls Ward "the plain look" and never uses the word "Ward".
//
// The expected wording is written as literal strings copied from requirements.md, never read back from the module, so
// a change to the wording fails here until the requirement changes too. The scans read copyCatalogue(), whose
// completeness index.test.ts checks. They run over fixed tables, so they are scripted checks, not fast-check
// properties (design, "Where PBT is not the right tool"). Imports only copy/.

import { describe, expect, it } from 'vitest';
import {
  CANDLELIGHT_OFFER,
  DEMO_SPOKEN_WORD,
  DRAWER_CONTROLS,
  PAUSE_MESSAGES,
  PLAIN_LOOK,
  REST_WORD,
  SPOKEN_TARGET_IDS,
  TARGET_IDS,
  copyCatalogue,
  label,
  pausedForCareMessage,
  sentence,
  unconfirmedDrawerLine,
  type PauseMessage,
  type SpokenTargetId,
} from './index.ts';

// The sample clock time for the strings that carry one, as in 8.6 and 18.1.
const SAMPLE_TIME = '03:22';
const { patientVoice, system } = copyCatalogue(SAMPLE_TIME);
const everyString = [...patientVoice, ...system];

/** "I" as a word, alone or in a contraction such as "I'm". "If" and "It" do not count. */
const I_AS_A_WORD = /\bI\b/;
/** The word "Ward" in any case. "toward" and "forward" do not count. */
const WARD_AS_A_WORD = /\bward\b/i;

// 3.8 and 8.6: each pause message is a reason line, then "Selection is off." and, where one exists, the fix or the
// resume time. The care message carries the requirement's sample resume time, 03:22 (18.7).
const PAUSE_WORDING: ReadonlyArray<{
  rule: string;
  name: string;
  message: PauseMessage;
  reason: string;
  detail: string;
  text: string;
}> = [
  {
    rule: '3.8',
    name: 'screen too narrow',
    message: PAUSE_MESSAGES['screen-too-narrow'],
    reason: 'Screen too narrow.',
    detail: 'Selection is off. Turn the screen sideways or use a wider screen.',
    text: 'Screen too narrow. Selection is off. Turn the screen sideways or use a wider screen.',
  },
  {
    rule: '8.6',
    name: 'paused for care',
    message: pausedForCareMessage('03:22'),
    reason: 'Paused for care.',
    detail: 'Selection is off. Resumes by itself at 03:22.',
    text: 'Paused for care. Selection is off. Resumes by itself at 03:22.',
  },
  {
    rule: '8.6',
    name: 'no input',
    message: PAUSE_MESSAGES['no-input'],
    reason: 'No pointer is on.',
    detail: 'Selection is off. Open the nurse menu and choose Mouse mode or Demo pointer.',
    text: 'No pointer is on. Selection is off. Open the nurse menu and choose Mouse mode or Demo pointer.',
  },
  {
    rule: '8.6',
    name: 'face out of view',
    message: PAUSE_MESSAGES['face-out-of-view'],
    reason: 'Face out of view.',
    detail: 'Selection is off.',
    text: 'Face out of view. Selection is off.',
  },
  {
    rule: '8.6',
    name: 'head below range',
    message: PAUSE_MESSAGES['head-below-range'],
    reason: 'Head below range.',
    detail: 'Selection is off.',
    text: 'Head below range. Selection is off.',
  },
  {
    rule: '8.6',
    name: 'head held rolled',
    message: PAUSE_MESSAGES['head-held-rolled'],
    reason: 'Head tilted to one side.',
    detail: 'Selection is off.',
    text: 'Head tilted to one side. Selection is off.',
  },
];

// 13.5: the label and the sentence of every Target that has a sentence, row by row as in the requirement's table.
const SENTENCE_WORDING: ReadonlyArray<{ id: SpokenTargetId; label: string; sentence: string }> = [
  { id: 'yes', label: 'YES', sentence: 'Yes.' },
  { id: 'no', label: 'NO', sentence: 'No.' },
  { id: 'call', label: 'CALL', sentence: 'I need the nurse. Please come.' },
  { id: 'cant-breathe', label: "CAN'T BREATHE", sentence: "I can't breathe. Please come now." },
  { id: 'mouth-dry', label: 'MOUTH DRY', sentence: 'My mouth is dry.' },
  { id: 'pain', label: 'PAIN', sentence: "I'm in pain." },
  { id: 'suction', label: 'SUCTION', sentence: 'I need suction.' },
  { id: 'move-me', label: 'MOVE ME', sentence: 'Please move me.' },
  { id: 'too-hot', label: 'TOO HOT', sentence: "I'm too hot." },
  { id: 'too-cold', label: 'TOO COLD', sentence: "I'm too cold." },
  { id: 'toilet', label: 'TOILET', sentence: 'I need the toilet.' },
  { id: 'lights', label: 'LIGHTS', sentence: 'Please change the lights.' },
  { id: 'noise', label: 'NOISE', sentence: 'The noise is bothering me.' },
  { id: 'glasses', label: 'GLASSES', sentence: 'I need my glasses.' },
  { id: 'hearing-aid', label: 'HEARING AID', sentence: 'I need my hearing aid.' },
  { id: 'the-tube', label: 'THE TUBE', sentence: "It's about my breathing tube." },
];

// 18.1: the care message with the resume time in place of 03:22.
const CARE_WORDING: ReadonlyArray<{ time: string; text: string }> = [
  { time: '03:22', text: 'Paused for care. Selection is off. Resumes by itself at 03:22.' },
  { time: '14:05', text: 'Paused for care. Selection is off. Resumes by itself at 14:05.' },
];

describe('SKN-3 tone (Requirement 20.2, tone.md)', () => {
  it('SKN-3 every board label is upper case', () => {
    const notUpperCase = TARGET_IDS.filter((id) => label(id) !== label(id).toUpperCase() || !/[A-Z]/.test(label(id)))
      .map((id) => `${id}: ${label(id)}`);
    expect(notUpperCase).toEqual([]);
  });

  it('SKN-3 no string has an exclamation mark', () => {
    expect(everyString.filter((text) => text.includes('!'))).toEqual([]);
  });

  it('SKN-3 no system message uses "I" as a word; the patient\'s labels and sentences may', () => {
    // The check finds "I" alone and in a contraction, and not at the start of a longer word.
    expect(I_AS_A_WORD.test('I need suction.') && I_AS_A_WORD.test("I'm in pain.")).toBe(true);
    expect(I_AS_A_WORD.test('If you did not hear a chime, turn the volume up.') || I_AS_A_WORD.test('It is a prototype.'))
      .toBe(false);
    expect(patientVoice.some((text) => I_AS_A_WORD.test(text))).toBe(true);
    expect(system.filter((text) => I_AS_A_WORD.test(text))).toEqual([]);
  });
});

describe('SKN-3 starting wording (requirements.md)', () => {
  for (const row of PAUSE_WORDING) {
    it(`SKN-3 ${row.rule}: the ${row.name} pause message is "${row.text}"`, () => {
      const { reason, detail, text } = row.message;
      expect({ reason, detail, text }).toEqual({ reason: row.reason, detail: row.detail, text: row.text });
    });
  }

  it('SKN-3 7.11: the word at the centre of the Rest_Zone is "REST"', () => {
    expect(REST_WORD).toBe('REST');
  });

  it('SKN-3 10.3: the Confirm_Targets are labelled "YES, CALL" and "YES, CAN\'T BREATHE"', () => {
    expect(label('confirm-call')).toBe('YES, CALL');
    expect(label('confirm-cant-breathe')).toBe("YES, CAN'T BREATHE");
  });

  for (const row of SENTENCE_WORDING) {
    it(`SKN-3 13.5: ${row.label} says "${row.sentence}"`, () => {
      expect({ label: label(row.id), sentence: sentence(row.id) }).toEqual({ label: row.label, sentence: row.sentence });
    });
  }

  it('SKN-3 13.5: the table covers every Target that has a sentence', () => {
    expect(SENTENCE_WORDING.map((row) => row.id).sort()).toEqual([...SPOKEN_TARGET_IDS].sort());
  });

  it('SKN-3 13.12: the word spoken before each demo sentence is "Demo."', () => {
    expect(DEMO_SPOKEN_WORD).toBe('Demo.');
  });

  it('SKN-3 16.8: the Candlelight_Offer is one plain sentence and two buttons', () => {
    expect(CANDLELIGHT_OFFER).toEqual({
      text: 'The board can look like dark wood with warm light. The words stay the same.',
      useCandlelight: 'Use Candlelight',
      keepPlainLook: 'Keep the plain look',
    });
  });

  it('SKN-3 16.11: the on-board button and the drawer control both say "Plain look"', () => {
    expect(PLAIN_LOOK).toBe('Plain look');
    expect(DRAWER_CONTROLS.plainLook).toBe('Plain look');
  });

  it('SKN-3 17.12: each Unconfirmed_Notice line names its target and time, beside a "Clear" control', () => {
    expect(unconfirmedDrawerLine('cant-breathe', '03:14')).toBe("CAN'T BREATHE was selected at 03:14 and not confirmed.");
    expect(unconfirmedDrawerLine('call', '03:14')).toBe('CALL was selected at 03:14 and not confirmed.');
    expect(DRAWER_CONTROLS.clear).toBe('Clear');
  });

  for (const row of CARE_WORDING) {
    it(`SKN-3 18.1: the care message with the resume time ${row.time} is "${row.text}"`, () => {
      expect(pausedForCareMessage(row.time).text).toBe(row.text);
    });
  }
});

describe('SKN-2 the plain look (Requirements 16.8, 16.11, 16.13)', () => {
  it('SKN-2 16.13: no string contains the word "Ward"', () => {
    // The check finds the word in any case, as in the old button "Back to Ward", and not inside a longer word.
    expect(WARD_AS_A_WORD.test('Back to Ward') && WARD_AS_A_WORD.test('WARD')).toBe(true);
    expect(WARD_AS_A_WORD.test('Look toward the board.') || WARD_AS_A_WORD.test('Move forward.')).toBe(false);
    expect(everyString.filter((text) => WARD_AS_A_WORD.test(text))).toEqual([]);
  });

  it('SKN-2 the plain-look labels are "Plain look" and "Keep the plain look"', () => {
    expect(PLAIN_LOOK).toBe('Plain look');
    expect(DRAWER_CONTROLS.plainLook).toBe('Plain look');
    expect(CANDLELIGHT_OFFER.keepPlainLook).toBe('Keep the plain look');
  });
});
