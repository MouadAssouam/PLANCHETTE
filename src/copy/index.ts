// The Copy_Module (task 4.1, Requirement 20): every string a patient, family member or nurse reads or hears, and the
// stable ids of every Target and Confirm_Target, which the layout table, the engine and the speech queue key off.
//
// Rules for this file:
// - Pure data and pure functions. No DOM, no clock, and no imports: any stage of the one-way chain may import it, and
//   plain Node (type stripping) imports it through the simulation runner, so it uses erasable syntax only.
// - The same strings for every skin. Nothing here takes a skin as input (20.5), and the board labels are one fixed,
//   human-reviewed English table (LNG-1, 20.6).
// - Wording follows tone.md: board labels are short, upper case and in the patient's voice; the patient's sentences
//   are full first-person sentences; system text is calm, literal and short, never speaks as "I" and never uses an
//   exclamation mark. Pause and notice wording names a position or a setup step, never a clinical state (8.7, 17.14).
// - Text people see calls the default skin "the plain look" (16.13), and calls the simulated patient's pointer
//   "Demo pointer" (6.7).
// - Strings that carry a clock time are functions of the time text ("03:22"), which src/board/clock.ts formats.
// - copyCatalogue() lists every string, for the wording tests (20.3). A new string must be added there too;
//   index.test.ts checks that every exported constant is in it.

// ---------------------------------------------------------------------------------------------------------------
// Target ids. Every Target and Confirm_Target renders with data-target="<id>" (structure.md).
// ---------------------------------------------------------------------------------------------------------------

/** YES, NO, CALL and CAN'T BREATHE: on every Level, at the same rectangles (2.1). */
export const FIXED_TARGET_IDS = ['yes', 'no', 'call', 'cant-breathe'] as const;
/** CALL and CAN'T BREATHE. The same union as UrgentId in src/selection/types.ts. */
export const URGENT_TARGET_IDS = ['call', 'cant-breathe'] as const;
/** The Confirm_Targets "YES, CALL" and "YES, CAN'T BREATHE" (10.3). */
export const CONFIRM_TARGET_IDS = ['confirm-call', 'confirm-cant-breathe'] as const;
/** The Level 2 needs, in the order of 2.3 and clinical-context.md section 2. */
export const NEED_TARGET_IDS = [
  'mouth-dry', 'pain', 'suction', 'move-me',
  'too-hot', 'too-cold', 'toilet', 'lights', 'noise', 'glasses', 'hearing-aid', 'the-tube',
] as const;
/** The Level 3 letters A to Z, in alphabetical order. */
export const LETTER_TARGET_IDS = [
  'letter-a', 'letter-b', 'letter-c', 'letter-d', 'letter-e', 'letter-f', 'letter-g', 'letter-h', 'letter-i',
  'letter-j', 'letter-k', 'letter-l', 'letter-m', 'letter-n', 'letter-o', 'letter-p', 'letter-q', 'letter-r',
  'letter-s', 'letter-t', 'letter-u', 'letter-v', 'letter-w', 'letter-x', 'letter-y', 'letter-z',
] as const;
/** SPACE, DELETE and SPEAK on Level 3 (2.4). */
export const SPELLING_TARGET_IDS = ['space', 'delete', 'speak'] as const;

export type FixedTargetId = (typeof FIXED_TARGET_IDS)[number];
export type UrgentTargetId = (typeof URGENT_TARGET_IDS)[number];
export type ConfirmTargetId = (typeof CONFIRM_TARGET_IDS)[number];
export type NeedTargetId = (typeof NEED_TARGET_IDS)[number];
export type LetterTargetId = (typeof LETTER_TARGET_IDS)[number];
export type SpellingTargetId = (typeof SPELLING_TARGET_IDS)[number];
/** Every id that is drawn with a data-target attribute: the Targets of all three Levels and both Confirm_Targets. */
export type TargetId = FixedTargetId | ConfirmTargetId | NeedTargetId | LetterTargetId | SpellingTargetId;
/** The ids that have a spoken sentence (13.1, 13.2): the Fixed_Targets and the needs. */
export type SpokenTargetId = FixedTargetId | NeedTargetId;

/** Every Target and Confirm_Target id, each once. */
export const TARGET_IDS: readonly TargetId[] = [
  ...FIXED_TARGET_IDS, ...CONFIRM_TARGET_IDS, ...NEED_TARGET_IDS, ...LETTER_TARGET_IDS, ...SPELLING_TARGET_IDS,
];
/** Every id with a sentence in SENTENCES. */
export const SPOKEN_TARGET_IDS: readonly SpokenTargetId[] = [...FIXED_TARGET_IDS, ...NEED_TARGET_IDS];

/** The Confirm_Target that a selection of each Urgent_Target opens (10.1). */
export const CONFIRM_TARGET_FOR: Readonly<Record<UrgentTargetId, ConfirmTargetId>> = {
  call: 'confirm-call',
  'cant-breathe': 'confirm-cant-breathe',
};
/** The Urgent_Target whose Alert each Confirm_Target starts (10.5). */
export const URGENT_TARGET_FOR: Readonly<Record<ConfirmTargetId, UrgentTargetId>> = {
  'confirm-call': 'call',
  'confirm-cant-breathe': 'cant-breathe',
};

const TARGET_ID_SET: ReadonlySet<string> = new Set<string>(TARGET_IDS);
const SPOKEN_TARGET_ID_SET: ReadonlySet<string> = new Set<string>(SPOKEN_TARGET_IDS);

/** True when `value` is a Target or Confirm_Target id. Nurse controls such as Acknowledge are never one (ALR-3). */
export function isTargetId(value: string): value is TargetId {
  return TARGET_ID_SET.has(value);
}

/**
 * True when `value` is the id of a Target with a sentence. The engine's speak event carries such an id or the spelled
 * text; spelled text is upper-case letters and spaces, and every id is lower case, so the two never collide.
 */
export function isSpokenTargetId(value: string): value is SpokenTargetId {
  return SPOKEN_TARGET_ID_SET.has(value);
}

// ---------------------------------------------------------------------------------------------------------------
// Board labels and the patient's sentences.
// ---------------------------------------------------------------------------------------------------------------

/** The board label of every Target and Confirm_Target: short, plain, upper case, in the patient's voice. */
export const LABELS: Readonly<Record<TargetId, string>> = {
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

/**
 * The sentence shown in the Message_Strip and spoken for each Target (13.5), as a full first-person sentence.
 * CALL's and CAN'T BREATHE's sentences are shown and spoken only after their Confirm_Target is selected (13.2, SAF-2).
 * Letters, SPACE and DELETE have none; SPEAK speaks the spelled text exactly as spelled (13.3, 14.6).
 */
export const SENTENCES: Readonly<Record<SpokenTargetId, string>> = {
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

/** The board label of a Target or Confirm_Target. Takes no skin and no language: the table is fixed (20.5, 20.6). */
export function label(id: TargetId): string {
  return LABELS[id];
}

/** The sentence of a Target that has one (13.5). Takes no skin and no language (20.5, 20.6). */
export function sentence(id: SpokenTargetId): string {
  return SENTENCES[id];
}

const LETTER_TARGET_BY_LETTER: ReadonlyMap<string, LetterTargetId> = new Map(
  LETTER_TARGET_IDS.map((id): [string, LetterTargetId] => [LABELS[id], id]),
);

/** The letter Target for one upper-case letter, "A" to "Z", or undefined for any other text. */
export function letterTargetId(letter: string): LetterTargetId | undefined {
  return LETTER_TARGET_BY_LETTER.get(letter);
}

// ---------------------------------------------------------------------------------------------------------------
// Lines on the board.
// ---------------------------------------------------------------------------------------------------------------

/** The Visitor_Hint, shown while selection is on (4.3). */
export const VISITOR_HINT = 'Ask a yes or no question. Watch the board.';
/** The Demo_Banner, shown on every screen of a Demo_Session (4.4, SAF-10). */
export const DEMO_BANNER = 'Demo, not the patient.';
/** The word at the centre of the Rest_Zone (7.11). Never a Target and never spoken (7.12). */
export const REST_WORD = 'REST';
/** The on-board button and the nurse-drawer control that show the plain look again in one click (16.11). */
export const PLAIN_LOOK = 'Plain look';

// ---------------------------------------------------------------------------------------------------------------
// Speech and the demo pointer.
// ---------------------------------------------------------------------------------------------------------------

/**
 * Spoken as its own utterance before each sentence in a Demo_Session, spelled text included (13.12). The one system
 * word that may be spoken (13.4). The Message_Strip and the Session_Log never carry it (13.13).
 */
export const DEMO_SPOKEN_WORD = 'Demo.';

/**
 * The fixed demo word list (6.6): Level 3's demo script spells one of these with the letter Targets, then selects
 * SPEAK. Plain, everyday words, upper case, letters only.
 */
export const DEMO_WORDS = ['HELLO', 'THANKS', 'HOME'] as const;
export type DemoWord = (typeof DEMO_WORDS)[number];

// ---------------------------------------------------------------------------------------------------------------
// Pause messages (8.5, 8.6, 3.8, 18.1). The Board shows the reason line at doorway size, then the detail.
// ---------------------------------------------------------------------------------------------------------------

/** The line that follows every pause reason (8.6). */
export const SELECTION_IS_OFF = 'Selection is off.';

/** A pause message: the reason line, then "Selection is off." and the fix or the resume time where there is one. */
export type PauseMessage = {
  /** The reason line, shown with a cap height of at least 8vmin (8.6). */
  reason: string;
  /** "Selection is off." and, where one exists, the fix or the resume time. */
  detail: string;
  /** The whole message: the reason line, then the detail. */
  text: string;
};

/**
 * The Pause_Reasons whose message has no time in it. Paused for care carries its resume time, so its message comes
 * from pausedForCareMessage(). Screen hidden has no message, because it cannot be seen (8.5).
 */
export type PauseMessageReason =
  | 'screen-too-narrow' | 'no-input' | 'face-out-of-view' | 'head-below-range' | 'head-held-rolled';

function pauseMessage(reason: string, fix: string | null): PauseMessage {
  const detail = fix === null ? SELECTION_IS_OFF : `${SELECTION_IS_OFF} ${fix}`;
  return { reason, detail, text: `${reason} ${detail}` };
}

/** The pause message for each Pause_Reason with a fixed message (3.8, 8.6, 8.12). */
export const PAUSE_MESSAGES: Readonly<Record<PauseMessageReason, PauseMessage>> = {
  'screen-too-narrow': pauseMessage('Screen too narrow.', 'Turn the screen sideways or use a wider screen.'),
  'no-input': pauseMessage('No pointer is on.', 'Open the nurse menu and choose Mouse mode or Demo pointer.'),
  'face-out-of-view': pauseMessage('Face out of view.', null),
  'head-below-range': pauseMessage('Head below range.', null),
  'head-held-rolled': pauseMessage('Head tilted to one side.', null),
};

/**
 * "Resumes by itself at 03:22.": the clock time at which a care pause ends by itself, in the pause message (18.7) and
 * in the Nurse_Drawer (18.4). The time is fixed when care starts, so it never counts down (ATT-2).
 */
export function resumesByItselfAt(resumeTimeText: string): string {
  return `Resumes by itself at ${resumeTimeText}.`;
}

/** "Paused for care. Selection is off. Resumes by itself at 03:22." (8.6, 18.1). */
export function pausedForCareMessage(resumeTimeText: string): PauseMessage {
  return pauseMessage('Paused for care.', resumesByItselfAt(resumeTimeText));
}

// ---------------------------------------------------------------------------------------------------------------
// The Alert_Panel (11.1, 11.2, 11.13).
// ---------------------------------------------------------------------------------------------------------------

/** The name of each Alert, in words, as on its board label (11.1). */
export const ALERT_NAMES: Readonly<Record<UrgentTargetId, string>> = {
  call: LABELS.call,
  'cant-breathe': LABELS['cant-breathe'],
};

/** "Started at 03:14.": the time an Alert started, under its name (11.2). */
export function alertStartedAt(startTimeText: string): string {
  return `Started at ${startTimeText}.`;
}

/** Where the nurse acknowledges an Alert (11.2, 11.8). */
export const ALERT_ACKNOWLEDGE_HINT = 'Acknowledge in the nurse menu.';
/** Shown on every alert screen (11.2, ALR-2). */
export const CALL_SYSTEM_DISCLAIMER = "This board does not replace the hospital's call system.";

// ---------------------------------------------------------------------------------------------------------------
// The Candlelight_Offer (16.8, 16.9).
// ---------------------------------------------------------------------------------------------------------------

/** The offer panel: one plain sentence and two buttons for the patient's or the family's choice. */
export const CANDLELIGHT_OFFER = {
  text: 'The board can look like dark wood with warm light. The words stay the same.',
  useCandlelight: 'Use Candlelight',
  keepPlainLook: 'Keep the plain look',
} as const;

// ---------------------------------------------------------------------------------------------------------------
// The Nurse_Handle and the Nurse_Drawer (17).
// ---------------------------------------------------------------------------------------------------------------

/** The Nurse_Handle's label (17.1). */
export const NURSE_MENU = 'Nurse menu';

/** The Level controls (17.3, 2.6). */
export const LEVEL_LABELS: Readonly<Record<1 | 2 | 3, string>> = {
  1: 'Level 1',
  2: 'Level 2',
  3: 'Level 3',
};

/** The other drawer controls (17.3). The Demo pointer list shows each profile's own name and description (6.7). */
export const DRAWER_CONTROLS = {
  offerCandlelight: 'Offer Candlelight',
  plainLook: PLAIN_LOOK,
  mouseMode: 'Mouse mode',
  demoPointer: 'Demo pointer',
  pauseForCare: 'Pause for care',
  resume: 'Resume',
  acknowledge: 'Acknowledge',
  testSound: 'Test sound',
  clear: 'Clear',
} as const;

/** Shown in the drawer after Test sound is pressed (12.2). */
export const TEST_SOUND_HINT = 'If you did not hear a chime, turn the volume up.';

/** The drawer's disclaimer line (17.3). */
export const PROTOTYPE_DISCLAIMER =
  "PLANCHETTE is a prototype. It is not a medical device and does not replace the hospital's call system.";

/** The notices that wait in the drawer and raise the handle's notice mark (17.3, 17.9). */
export type NoticeId = 'unknown-demo-pointer' | 'speech-unavailable' | 'wake-lock-refused' | 'sound-blocked';

/** Each notice as the drawer shows it (5.9, 13.8, 19.3, 21.1). */
export const DRAWER_NOTICES: Readonly<Record<NoticeId, string>> = {
  'unknown-demo-pointer': 'No demo pointer has that name. Choose one from the list.',
  'speech-unavailable': 'Speech is not available on this device. Sentences show on screen only.',
  'wake-lock-refused': 'This screen may turn off by itself. Change the power settings so it stays on.',
  'sound-blocked': 'Sound is off until someone clicks this page. Click anywhere to turn it on.',
};

/** Each notice as the text beside the handle's notice mark, so it reads without opening the drawer (17.9). */
export const HANDLE_NOTICES: Readonly<Record<NoticeId, string>> = {
  'unknown-demo-pointer': 'Demo pointer not found',
  'speech-unavailable': 'Speech not available',
  'wake-lock-refused': 'Screen may turn off',
  'sound-blocked': 'Sound off until a click',
};

/**
 * The handle text for each Urgent_Target with an Unconfirmed_Notice not yet cleared (17.11). It reports the selection
 * and the missing confirm only (17.14).
 */
export const UNCONFIRMED_HANDLE_TEXT: Readonly<Record<UrgentTargetId, string>> = {
  call: 'CALL selected, not confirmed',
  'cant-breathe': "CAN'T BREATHE selected, not confirmed",
};

const UNCONFIRMED_DRAWER_LINES: Readonly<Record<UrgentTargetId, (selectedTimeText: string) => string>> = {
  call: (time) => `CALL was selected at ${time} and not confirmed.`,
  'cant-breathe': (time) => `CAN'T BREATHE was selected at ${time} and not confirmed.`,
};

/**
 * "CALL was selected at 03:14 and not confirmed.": the drawer line of one Unconfirmed_Notice, shown beside its Clear
 * control (17.12). It reports the selection, its time and the missing confirm only (17.14).
 */
export function unconfirmedDrawerLine(urgent: UrgentTargetId, selectedTimeText: string): string {
  return UNCONFIRMED_DRAWER_LINES[urgent](selectedTimeText);
}

// ---------------------------------------------------------------------------------------------------------------
// The Clock_Line (4.1). src/board/clock.ts builds the line from these names.
// ---------------------------------------------------------------------------------------------------------------

/** English weekday names, indexed like Date's getUTCDay(): 0 is Sunday. */
export const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
/** English month names, indexed like Date's getUTCMonth(): 0 is January. */
export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

// ---------------------------------------------------------------------------------------------------------------
// Every string, for the wording tests (20.3).
// ---------------------------------------------------------------------------------------------------------------

/** Every string in this module, split by voice, each once. */
export type CopyCatalogue = {
  /** Board labels, the patient's sentences and the demo words: the patient's voice, where "I" belongs. */
  patientVoice: readonly string[];
  /** Every other string: system text, which never speaks as "I" (20.2). */
  system: readonly string[];
};

function pauseMessageParts(message: PauseMessage): string[] {
  return [message.reason, message.detail, message.text];
}

/**
 * Every string in this module. The strings that carry a clock time are filled in with `sampleTimeText`, such as
 * "03:22". A string added to this module must be added here too.
 */
export function copyCatalogue(sampleTimeText: string): CopyCatalogue {
  const patientVoice = [...Object.values(LABELS), ...Object.values(SENTENCES), ...DEMO_WORDS];
  const system = [
    VISITOR_HINT,
    DEMO_BANNER,
    REST_WORD,
    PLAIN_LOOK,
    DEMO_SPOKEN_WORD,
    SELECTION_IS_OFF,
    ...Object.values(PAUSE_MESSAGES).flatMap(pauseMessageParts),
    ...pauseMessageParts(pausedForCareMessage(sampleTimeText)),
    resumesByItselfAt(sampleTimeText),
    ...Object.values(ALERT_NAMES),
    alertStartedAt(sampleTimeText),
    ALERT_ACKNOWLEDGE_HINT,
    CALL_SYSTEM_DISCLAIMER,
    ...Object.values(CANDLELIGHT_OFFER),
    NURSE_MENU,
    ...Object.values(LEVEL_LABELS),
    ...Object.values(DRAWER_CONTROLS),
    TEST_SOUND_HINT,
    PROTOTYPE_DISCLAIMER,
    ...Object.values(DRAWER_NOTICES),
    ...Object.values(HANDLE_NOTICES),
    ...Object.values(UNCONFIRMED_HANDLE_TEXT),
    ...URGENT_TARGET_IDS.map((urgent) => unconfirmedDrawerLine(urgent, sampleTimeText)),
    ...WEEKDAY_NAMES,
    ...MONTH_NAMES,
  ];
  return { patientVoice: [...new Set(patientVoice)], system: [...new Set(system)] };
}
