// Feature: first-slice, Property 28: NEV-3a no pause or notice wording names a clinical state
// **Validates: Requirements 8.6, 8.7, 17.14, 20.2**
//
// The NEV-3 wording test (task 4.5). Selection pauses when the board can't trust its input, and the nurse is told when
// an urgent selection was not confirmed. Neither message may name a clinical state (NEV-3): a pause message is worded
// as a position or a setup step (8.7), and an Unconfirmed_Notice reports the selection, its time and the missing
// confirm only (17.14). "Head tilted to one side. Selection is off." names a position, so it must pass.
//
// In scope: each part of every pause message the Board shows (the reason line, the detail and the whole message), the
// narrow-screen and head-held-rolled ones included; the paused-for-care message and its "Resumes by itself at" line;
// and the Unconfirmed_Notice wording for both Urgent_Targets: the Nurse_Handle text, the Nurse_Drawer line and the
// Clear control beside it. Board labels are the patient's words, not the system's, so they are out of scope: in a
// notice, the one quote of its Urgent_Target's label is taken out before the check (see ownWords()).
//
// The design marks this property as a scan of a fixed table (Property 28's generators; Testing Strategy, "Where PBT is
// not the right tool"), so every case is checked once. There is no random generation, so there is no seed to print.
// The strings that carry a time are filled in at every time the Clock_Line's HH:MM can show, "00:00" to "23:59",
// which is a finite set too.
//
// The checker is tested as well: every listed word and phrase fails it, and so do sentences such as "Patient is
// asleep."; position and setup wording passes it. This file imports only src/copy/.

import { describe, expect, it } from 'vitest';
import {
  DRAWER_CONTROLS,
  LABELS,
  PAUSE_MESSAGES,
  UNCONFIRMED_HANDLE_TEXT,
  URGENT_TARGET_IDS,
  pausedForCareMessage,
  resumesByItselfAt,
  unconfirmedDrawerLine,
  type PauseMessage,
} from './index.ts';

// The clinical-state word list.
//
// NEV-3 names pain, delirium and sedation level "or any other clinical state", and 8.7 names sleep, sedation and
// distress. Pause and notice wording is where the system could name one by mistake: a head below range looks like
// dozing, a held roll like sedation, a lost face like fainting, and an unconfirmed CAN'T BREATHE like distress. So the
// list covers sleep and alertness, sedation and consciousness, delirium and thinking, distress and fear (17.14 also
// rules out saying what the patient felt), pain, breathing, the body, and the condition as a whole. "awake", "oriented"
// and "recovering" are on it because SKN-2 leaves those judgements to the nurse.
//
// Each entry is a whole word or a whole phrase in one of its common forms, matched in any case, so "asleep" fails and
// "paint" does not fail for "pain". The words of a phrase match across any white space, and an apostrophe matches
// ' or ’.
//
// Left out on purpose, because the system uses them for a position, a setup step or a part of the board: "rest" (the
// Rest_Zone and its word REST), "wake" (the night-mode WAKE target), "alert" (an Alert), "weak" ("Tracking is weak.
// Press Adjust camera." is about the tracking), "orientation" (screen orientation and the orientation card), "breathe"
// on its own (CAN'T BREATHE is a board label), and position words such as tilted, below, out of view and off. Death
// and dying are SKN-4 topics, which copy.skn-4.test.ts checks in every Copy_Module string.
const CLINICAL_STATE_WORDS: Readonly<Record<string, readonly string[]>> = {
  'sleep and alertness': [
    'sleep', 'sleeps', 'sleeping', 'slept', 'asleep', 'sleepy', 'sleepiness', 'sleepless', 'insomnia',
    'nap', 'naps', 'napping', 'doze', 'dozes', 'dozed', 'dozing', 'dozy',
    'nod off', 'nods off', 'nodded off', 'nodding off', 'drowsy', 'drowsiness',
    'awake', 'alertness', 'lethargic', 'lethargy',
  ],
  'sedation and consciousness': [
    'sedation', 'sedate', 'sedated', 'sedating', 'sedative', 'sedatives',
    'conscious', 'consciousness', 'unconscious', 'unconsciousness', 'unresponsive', 'unresponsiveness',
    'coma', 'comatose', 'stupor', 'faint', 'fainted', 'fainting', 'syncope', 'passed out', 'blacked out',
  ],
  'delirium and thinking': [
    'delirium', 'delirious', 'confused', 'confusion', 'oriented', 'disoriented', 'disorientated', 'disorientation',
    'hallucinate', 'hallucinates', 'hallucinating', 'hallucination', 'hallucinations', 'psychosis', 'psychotic',
    'dementia',
  ],
  'distress and fear': [
    'distress', 'distressed', 'distressing', 'agitated', 'agitation', 'restless', 'restlessness',
    'anxious', 'anxiety', 'panic', 'panicked', 'panicking', 'panicky', 'scared', 'afraid', 'frightened', 'fearful',
    'upset', 'stressed',
  ],
  pain: [
    'pain', 'pains', 'painful', 'hurt', 'hurts', 'hurting', 'ache', 'aches', 'aching', 'sore', 'discomfort',
    'uncomfortable',
  ],
  breathing: [
    "can't breathe", 'cannot breathe', 'can not breathe', 'unable to breathe', 'breathless', 'breathlessness',
    'short of breath', 'shortness of breath', 'dyspnea', 'dyspnoea', 'hypoxia', 'hypoxic',
    'choke', 'choked', 'choking', 'suffocate', 'suffocating', 'suffocation', 'gasp', 'gasping',
  ],
  'the body': [
    'seizure', 'seizures', 'seizing', 'convulsion', 'convulsions', 'convulsing', 'stroke',
    'tremor', 'tremors', 'trembling', 'spasm', 'spasms', 'paralysed', 'paralyzed', 'paralysis', 'weakness',
    'tired', 'tiredness', 'fatigue', 'fatigued', 'exhausted', 'exhaustion', 'nausea', 'nauseous', 'nauseated',
    'vomiting',
  ],
  'the condition as a whole': [
    'unwell', 'sick', 'ill', 'illness', 'worsening', 'deteriorating', 'deterioration', 'recovering',
  ],
};

/** Every entry of the list. */
const CLINICAL_STATE_FORMS: readonly string[] = Object.values(CLINICAL_STATE_WORDS).flat();

/** One entry as a pattern: its words joined by any run of white space, and an apostrophe matching ' or ’. */
function formPattern(form: string): string {
  return form
    .split(' ')
    .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/'/g, "['\u2019]"))
    .join('\\s+');
}

/**
 * Any entry, as a whole word or a whole phrase, in any case. Longest first, so that a phrase wins over a word it
 * starts with. Global for matchAll(), which works on a copy; nothing calls test() or exec() on it, so no position
 * carries over from one call to the next.
 */
const CLINICAL_STATE_PATTERN = new RegExp(
  `\\b(?:${[...CLINICAL_STATE_FORMS].sort((a, b) => b.length - a.length).map(formPattern).join('|')})\\b`,
  'gi',
);

/** The clinical-state words and phrases in `text`, in order, in lower case with single spaces. Empty when none. */
function clinicalStateWords(text: string): string[] {
  return [...text.matchAll(CLINICAL_STATE_PATTERN)].map((match) =>
    match[0].toLowerCase().replace(/\s+/g, ' ').replace(/\u2019/g, "'"),
  );
}

/** One wording to check. */
type Wording = {
  /** Where it comes from, such as PAUSE_MESSAGES['head-held-rolled'].reason, for failure messages. */
  where: string;
  /** The text as the Board or the Nurse_Drawer shows it. */
  text: string;
  /**
   * The board label the text quotes to name its Urgent_Target (17.11, 17.12). A label is the patient's word, so this
   * one quote is taken out before the check; any other use of the same words is still checked.
   */
  quotes?: string;
};

/** The wording's own words: its text with the one quote of its label taken out, or null when the label is missing. */
function ownWords({ text, quotes }: Wording): string | null {
  if (quotes === undefined) return text;
  const at = text.indexOf(quotes);
  return at < 0 ? null : `${text.slice(0, at)} ${text.slice(at + quotes.length)}`;
}

/**
 * One line for each place in `wordings` whose own words name a clinical state, or that does not quote the label it
 * should, so that taking the label out can never hide a wording that lost its name. A template filled in at every
 * time reports only its first failing time. Empty when every wording passes.
 */
function clinicalStateViolations(wordings: Iterable<Wording>): string[] {
  const lines = new Map<string, string>();
  for (const wording of wordings) {
    const { where, text, quotes } = wording;
    if (lines.has(where)) continue;
    const own = ownWords(wording);
    if (own === null) {
      lines.set(where, `${where}: "${text}" does not quote its label ${quotes}`);
      continue;
    }
    const found = clinicalStateWords(own);
    if (found.length > 0) lines.set(where, `${where}: "${text}" names ${found.join(', ')}`);
  }
  return [...lines.values()];
}

/** The parts of a pause message that the Board shows: the reason line, the detail, and the whole message (8.6). */
function pauseMessageWordings(where: string, message: PauseMessage): Wording[] {
  return [
    { where: `${where}.reason`, text: message.reason },
    { where: `${where}.detail`, text: message.detail },
    { where: `${where}.text`, text: message.text },
  ];
}

/**
 * Every time text that the care message and the drawer line can carry: the Clock_Line's hours and minutes with the
 * seconds dropped (17.12, 18.7), from "00:00" to "23:59".
 */
const EVERY_TIME_TEXT: readonly string[] = Array.from({ length: 24 * 60 }, (_, minute) =>
  [Math.floor(minute / 60), minute % 60].map((part) => String(part).padStart(2, '0')).join(':'),
);

describe('NEV-3a the clinical-state checker', () => {
  it('NEV-3a finds every listed word and phrase on its own, in lower case and in upper case', () => {
    expect(new Set(CLINICAL_STATE_FORMS).size).toBe(CLINICAL_STATE_FORMS.length);
    for (const form of CLINICAL_STATE_FORMS) {
      expect(clinicalStateWords(form), form).toEqual([form]);
      expect(clinicalStateWords(form.toUpperCase()), form.toUpperCase()).toEqual([form]);
    }
  });

  it('NEV-3a fails wording that names a clinical state, "Patient is asleep." included', () => {
    const flagged: readonly (readonly [text: string, words: readonly string[]])[] = [
      ['Patient is asleep.', ['asleep']],
      ['Patient may be sedated.', ['sedated']],
      ['Possible distress.', ['distress']],
      ['Delirium suspected.', ['delirium']],
      ['The patient is in pain.', ['pain']],
      // A position or a setup step next to a clinical state still fails.
      ['Head below range. Patient may be dozing.', ['dozing']],
      ['Head tilted to one side. Patient may be unconscious.', ['unconscious']],
      ['Face out of view. Patient may have passed out.', ['passed out']],
      ['CALL selected, not confirmed. Patient seems confused and agitated.', ['confused', 'agitated']],
      // Any case, a hyphen, a line break inside a phrase, and a typographic apostrophe.
      ['SEIZURE', ['seizure']],
      ['Half-asleep.', ['asleep']],
      ['The patient nodded\noff.', ['nodded off']],
      ['The patient can\u2019t breathe.', ["can't breathe"]],
    ];
    for (const [text, words] of flagged) expect(clinicalStateWords(text), text).toEqual(words);
  });

  it('NEV-3a passes wording about a position or a setup step, "Head tilted to one side. Selection is off." included', () => {
    const clean = [
      'Head tilted to one side. Selection is off.',
      'Head tilted to one side.',
      // Words left out of the list on purpose.
      'Tracking is weak. Press Adjust camera.',
      'REST',
      'The alert started at 03:14.',
      'Turn the screen to landscape orientation.',
      // Whole words only: "pain" inside "paint" and "ill" inside "will" do not count.
      'The paint will dry.',
    ];
    for (const text of clean) expect(clinicalStateWords(text), text).toEqual([]);
  });

  it('NEV-3a takes out only the one quoted label, and fails a wording that lost its label', () => {
    const handle = "CAN'T BREATHE selected, not confirmed";
    // Read as plain words, the label names a state; quoted as the notice's label, it is the patient's word.
    expect(clinicalStateWords(handle)).toEqual(["can't breathe"]);
    expect(clinicalStateViolations([{ where: 'handle', text: handle, quotes: "CAN'T BREATHE" }])).toEqual([]);
    // A second use next to the quote is the system's own word, and fails.
    const twice = "CAN'T BREATHE selected, not confirmed. The patient can't breathe.";
    expect(clinicalStateViolations([{ where: 'twice', text: twice, quotes: "CAN'T BREATHE" }])).toEqual([
      `twice: "${twice}" names can't breathe`,
    ]);
    // A wording without its label fails, so taking the label out never hides a wording that lost its name.
    expect(clinicalStateViolations([{ where: 'nameless', text: 'Selected, not confirmed', quotes: 'CALL' }])).toEqual([
      'nameless: "Selected, not confirmed" does not quote its label CALL',
    ]);
  });
});

describe('NEV-3a no pause or notice wording names a clinical state (Requirements 8.7, 17.14)', () => {
  it('NEV-3a the scan reaches every pause message, the narrow-screen and head-held-rolled ones included', () => {
    expect(Object.keys(PAUSE_MESSAGES)).toEqual(
      expect.arrayContaining(['screen-too-narrow', 'no-input', 'face-out-of-view', 'head-below-range', 'head-held-rolled']),
    );
  });

  it.each(Object.entries(PAUSE_MESSAGES))('NEV-3a the %s pause message names no clinical state', (reason, message) => {
    expect(clinicalStateViolations(pauseMessageWordings(`PAUSE_MESSAGES['${reason}']`, message))).toEqual([]);
  });

  it('NEV-3a the paused-for-care message and its resume line name no clinical state, at every HH:MM', () => {
    expect(new Set(EVERY_TIME_TEXT).size).toBe(24 * 60);
    expect(EVERY_TIME_TEXT).toEqual(expect.arrayContaining(['00:00', '03:22', '23:59']));
    const wordings = EVERY_TIME_TEXT.flatMap((time): Wording[] => [
      ...pauseMessageWordings('pausedForCareMessage(time)', pausedForCareMessage(time)),
      { where: 'resumesByItselfAt(time)', text: resumesByItselfAt(time) },
    ]);
    expect(clinicalStateViolations(wordings)).toEqual([]);
  });

  it('NEV-3a the Unconfirmed_Notice wording names no clinical state, for both Urgent_Targets at every HH:MM', () => {
    expect(URGENT_TARGET_IDS).toEqual(expect.arrayContaining(['call', 'cant-breathe']));
    const wordings = URGENT_TARGET_IDS.flatMap((urgent): Wording[] => [
      { where: `UNCONFIRMED_HANDLE_TEXT['${urgent}']`, text: UNCONFIRMED_HANDLE_TEXT[urgent], quotes: LABELS[urgent] },
      ...EVERY_TIME_TEXT.map((time): Wording => ({
        where: `unconfirmedDrawerLine('${urgent}', time)`,
        text: unconfirmedDrawerLine(urgent, time),
        quotes: LABELS[urgent],
      })),
    ]);
    wordings.push({ where: 'DRAWER_CONTROLS.clear', text: DRAWER_CONTROLS.clear });
    expect(clinicalStateViolations(wordings)).toEqual([]);
  });
});
