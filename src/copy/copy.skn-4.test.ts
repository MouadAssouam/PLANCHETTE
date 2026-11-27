// Feature: first-slice, Property 20: SKN-4a no copy or profile text uses a forbidden topic or "ghost"
//
// SKN-4 (safety.md) and tone.md: the system's own text uses no words about ghosts, spirits, séances, the dead, the
// beyond or the other side, and makes no joke about death or dying. Requirement 6.7 adds that no text a nurse sees
// contains the word "ghost", which is a code word only. This file is the part of the wording test in Requirement 20.3
// that covers those two rules; NEV-7's words and the board-game name are checked in copy.nev-7.test.ts (NEV-7a).
//
// Scanned: every string in copyCatalogue(), in the patient's voice and in system text, the strings made from a clock
// time included; the label() and sentence() getters; the functions that put a time into a string, called directly; and
// the name and description of every Ghost_Profile, which the Nurse_Drawer shows in its Demo pointer list (6.7). A
// profile's notes are developer notes that no screen shows, so they are not scanned. The fixed demo words are the
// system's own choice, so they are scanned.
//
// Not scanned: text the patient spells (20.4). A patient may spell AM I DYING, and those words must reach the listener
// exactly as spelled (NEV-2, 14.6). The Copy_Module holds no spelled text, so the scan never sees any.
//
// The design marks this property as a scan of a finite table (design.md, "Where PBT is not the right tool"), so every
// string is checked once, with no random generation and so no seed to print. Imports: src/copy/ and src/sim/ only.

import { describe, expect, it } from 'vitest';
import { GHOST_PROFILE_NAMES, GHOST_PROFILES } from '../sim/profiles.ts';
import {
  SPOKEN_TARGET_IDS,
  TARGET_IDS,
  URGENT_TARGET_IDS,
  alertStartedAt,
  copyCatalogue,
  label,
  pausedForCareMessage,
  resumesByItselfAt,
  sentence,
  unconfirmedDrawerLine,
} from './index.ts';

// ---------------------------------------------------------------------------------------------------------------
// The word list
// ---------------------------------------------------------------------------------------------------------------
//
// The entries are grouped by the topics SKN-4 names. Each one is matched as a whole word in folded text: plain lower
// case, with accents and other combining marks removed (séance becomes seance) and invisible format characters such as
// a soft hyphen dropped. A whole word means that no letter or digit touches the match on either side, so "die" never
// trips on "diet" or "studied", "dead" never on "deadline", "grave" never on "gravel", "tomb" never on "tomboy", "hell"
// never on HELLO and "demon" never on "Demo" or "demonstration". A stem followed by \p{L}* also catches its longer
// forms (haunt, haunted, haunting); a stem gets that only when no everyday word starts with it, and the other entries
// spell out their forms. "ghost" is the one entry matched inside any word (ghostly, ghostwriter), because no text a
// nurse sees may contain it at all (6.7). The words of a phrase may be joined by any run of spaces or hyphens.
//
// Left out on purpose, because their everyday meaning is likely in this board's text and is not about these topics:
// "side" on its own ("Head tilted to one side."), "rest" (the word REST in the Rest_Zone, 7.11; only the death idioms
// built on it are listed), "wake" (a board word in night mode, NGT-2), "medium", "summon", "pass on", "cross over",
// "kill" (it would trip "pain killer"), "skull" (anatomy), "mummy" (a word for mother) and "angel". Clinical-state
// words such as "sleep" belong to NEV-3a's list (copy.nev-3.test.ts). A word list cannot recognise a joke; it catches
// the words that jokes about death and dying are built on ("dying of thirst", "dead tired", "rest in peace").

type Topic =
  | 'ghosts'
  | 'spirits and séances'
  | 'death and dying'
  | 'burial and mourning'
  | 'the beyond and the other side';

/** Patterns in plain lower case. wholeWord() wraps each one before use; [\s-]+ joins the words of a phrase. */
const FORBIDDEN: Readonly<Record<Topic, readonly RegExp[]>> = {
  ghosts: [
    /[\p{L}\p{N}]*ghost[\p{L}\p{N}]*/u, // inside any word too (6.7)
    /phantom\p{L}*|spook\p{L}*|haunt\p{L}*/u,
    /spect(?:re|res|er|ers|ral)/u,
    /apparitions?|wraiths?|poltergeists?|ghouls?|ghoulish/u,
    /boo/u, // what a ghost says in a joke
  ],
  'spirits and séances': [
    /spirit\p{L}*|soul\p{L}*/u,
    /seances?/u, // séance, once its accent is removed
    /occult\p{L}*|paranormal\p{L}*|supernatural\p{L}*|psychics?/u,
    /demons?|demonic|exorci[sz]\p{L}*/u,
  ],
  'death and dying': [
    /dead|deadly|undead|death\p{L}*/u,
    /die|dies|died|dying/u,
    /deceased|demise|lifeless|corpses?|cadavers?/u,
    /fatal\p{L}*|lethal\p{L}*|mortal\p{L}*|perish(?:es|ed|ing)?/u, // "fatal" even in "fatal error"
    /zombi\p{L}*|vampir\p{L}*|skeletons?|reapers?/u,
    /flat[\s-]*lin\p{L}*/u,
    // Death idioms, the ones a pun on the word REST would make included.
    /rest(?:s|ed|ing)?[\s-]+in[\s-]+peace|r\.?i\.?p\.?|laid[\s-]+to[\s-]+rest|eternal[\s-]+(?:rest|sleep)/u,
    /(?:last|final)[\s-]+breaths?|pass(?:es|ed|ing)?[\s-]+away/u,
    /kick(?:s|ed|ing)?[\s-]+the[\s-]+bucket|six[\s-]+(?:feet|foot)[\s-]+under/u,
    /push(?:es|ed|ing)?[\s-]+up[\s-]+(?:the[\s-]+)?daisies|bit(?:e|es|ing|ten)?[\s-]+the[\s-]+dust/u,
  ],
  'burial and mourning': [
    /grave(?:s|yards?|stones?|side|diggers?)?|tomb(?:s|stones?)?/u,
    /coffins?|caskets?|crypts?|hearses?|cemeter(?:y|ies)|morgues?|mortuar(?:y|ies)/u,
    /funer\p{L}*|burials?|cremat\p{L}*|undertakers?/u,
    /obituar(?:y|ies)|epitaphs?|condolences?|mourn\p{L}*|bereave\p{L}*/u,
  ],
  'the beyond and the other side': [
    // Listed even as a plain preposition: on a talking board it reads as "the beyond". "Past" or "outside" say it plainly.
    /beyond/u,
    // Listed even for a side of the bed, for the same reason. "The opposite side" says it plainly.
    /the[\s-]+other[\s-]*sides?/u,
    /after[\s-]*li(?:fe|ves)|hereafter|(?:nether|under|other)world\p{L}*/u,
    /heaven\p{L}*|hell(?:s|ish)?/u,
  ],
};

/** Plain lower case, with accents and other combining marks removed and invisible format characters dropped. */
function fold(text: string): string {
  return text.normalize('NFKD').replace(/[\p{M}\p{Cf}]/gu, '').toLowerCase();
}

/** The pattern as a whole word: no letter or digit may touch a match on either side. */
function wholeWord(pattern: RegExp): RegExp {
  return new RegExp(`(?<![\\p{L}\\p{N}])(?:${pattern.source})(?![\\p{L}\\p{N}])`, 'giu');
}

const MATCHERS: readonly { readonly topic: Topic; readonly regex: RegExp }[] = (
  Object.keys(FORBIDDEN) as Topic[]
).flatMap((topic) => FORBIDDEN[topic].map((pattern) => ({ topic, regex: wholeWord(pattern) })));

type Hit = { readonly topic: Topic; readonly word: string };

/** Every forbidden word or phrase in `text`, with its topic. Empty when the text is free of them. */
function forbiddenWordsIn(text: string): Hit[] {
  const folded = fold(text);
  return MATCHERS.flatMap(({ topic, regex }) =>
    [...folded.matchAll(regex)].map((match): Hit => ({ topic, word: match[0] })),
  );
}

// ---------------------------------------------------------------------------------------------------------------
// What is scanned
// ---------------------------------------------------------------------------------------------------------------

type Scanned = { readonly where: string; readonly text: string };
type Violation = Scanned & Hit;

// The time text is digits and a colon, which no entry can match. These cover midnight, the copy's own example and the
// last minute of the day.
const SAMPLE_TIMES = ['00:00', '03:22', '23:59'] as const;

/** Every Copy_Module string: the catalogue, the getters, and the strings made from a time, called directly. */
function copyModuleTexts(): Scanned[] {
  const scanned: Scanned[] = [];
  for (const time of SAMPLE_TIMES) {
    const { patientVoice, system } = copyCatalogue(time);
    for (const text of patientVoice) scanned.push({ where: `copyCatalogue('${time}').patientVoice`, text });
    for (const text of system) scanned.push({ where: `copyCatalogue('${time}').system`, text });
    const care = pausedForCareMessage(time);
    for (const part of ['reason', 'detail', 'text'] as const) {
      scanned.push({ where: `pausedForCareMessage('${time}').${part}`, text: care[part] });
    }
    scanned.push({ where: `resumesByItselfAt('${time}')`, text: resumesByItselfAt(time) });
    scanned.push({ where: `alertStartedAt('${time}')`, text: alertStartedAt(time) });
    for (const urgent of URGENT_TARGET_IDS) {
      scanned.push({ where: `unconfirmedDrawerLine('${urgent}', '${time}')`, text: unconfirmedDrawerLine(urgent, time) });
    }
  }
  for (const id of TARGET_IDS) scanned.push({ where: `label('${id}')`, text: label(id) });
  for (const id of SPOKEN_TARGET_IDS) scanned.push({ where: `sentence('${id}')`, text: sentence(id) });
  return scanned;
}

/** Every profile name and description the Nurse_Drawer can show in its Demo pointer list (6.7). */
function profileTexts(): Scanned[] {
  const scanned: Scanned[] = [];
  for (const profile of GHOST_PROFILES) {
    scanned.push({ where: `profile "${profile.name}": name`, text: profile.name });
    scanned.push({ where: `profile "${profile.name}": description`, text: profile.description });
  }
  for (const name of GHOST_PROFILE_NAMES) scanned.push({ where: 'GHOST_PROFILE_NAMES', text: name });
  return scanned;
}

/** Every hit in the scanned strings, each string checked once, where it was first found. */
function violationsIn(scanned: readonly Scanned[]): Violation[] {
  const firstSeen = new Map<string, Scanned>();
  for (const item of scanned) if (!firstSeen.has(item.text)) firstSeen.set(item.text, item);
  return [...firstSeen.values()].flatMap((item) => forbiddenWordsIn(item.text).map((hit) => ({ ...item, ...hit })));
}

// ---------------------------------------------------------------------------------------------------------------
// Property 20
// ---------------------------------------------------------------------------------------------------------------

describe('SKN-4a: no copy or profile text uses a forbidden topic or "ghost" (Property 20)', () => {
  it('SKN-4a every Copy_Module string is free of the topics SKN-4 rules out and of the word "ghost"', () => {
    const scanned = copyModuleTexts();
    const { patientVoice, system } = copyCatalogue('03:22');
    expect(patientVoice.length).toBeGreaterThan(0);
    expect(system.length).toBeGreaterThan(0);
    expect(scanned.map(({ text }) => text)).toEqual(expect.arrayContaining([...patientVoice, ...system]));
    expect(violationsIn(scanned)).toEqual([]);
  });

  it('SKN-4a every profile name and description the nurse drawer shows is free of the SKN-4 topics and of "ghost"', () => {
    const scanned = profileTexts();
    expect(GHOST_PROFILES.length).toBeGreaterThan(0);
    for (const profile of GHOST_PROFILES) {
      expect(profile.name).toMatch(/\S/);
      expect(profile.description).toMatch(/\S/);
    }
    const texts = scanned.map(({ text }) => text);
    expect(texts).toEqual(expect.arrayContaining(GHOST_PROFILES.flatMap(({ name, description }) => [name, description])));
    expect(violationsIn(scanned)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------------------------------------------
// The word list itself, so that the scan above cannot pass because the list matches nothing
// ---------------------------------------------------------------------------------------------------------------

/** For each topic, text that the list must flag under that topic. */
const CAUGHT: Readonly<Record<Topic, readonly string[]>> = {
  ghosts: [
    'Ghost', 'GHOSTS', 'ghostly', 'Demo ghost pointer', 'ghost-patient', 'gh\u00ADost',
    'phantom', 'spooky', 'haunted', 'spectre', 'specter', 'spectral',
    'apparition', 'wraith', 'poltergeist', 'ghoulish', 'Boo.',
  ],
  'spirits and séances': [
    'spirit', 'Spirits', 'spiritual', 'séance', 'SÉANCES', 'se\u0301ance', 'soul',
    'occult', 'paranormal', 'supernatural', 'psychic', 'demon', 'exorcist',
  ],
  'death and dying': [
    'dead', 'Dead tired.', 'deadly', 'undead', 'death', "death's door", 'deathly',
    'die', 'dies', 'died', 'dying', 'Dying of thirst.',
    'deceased', 'demise', 'lifeless', 'corpse', 'fatal', 'lethal', 'mortality', 'perished',
    'zombie', 'vampire', 'skeleton', 'reaper', 'flatline', 'flat-lined',
    'Rest in peace.', 'R.I.P.', 'RIP', 'laid to rest', 'eternal rest', 'last breath', 'final breath',
    'passed away', 'kicked the bucket', 'six feet under', 'pushing up daisies', 'bit the dust',
  ],
  'burial and mourning': [
    'grave', 'graveyard', 'gravestone', 'tomb', 'tombstone', 'coffin', 'casket', 'crypt', 'cemetery',
    'funeral', 'burial', 'cremation', 'morgue', 'mortuary', 'hearse', 'undertaker',
    'obituary', 'epitaph', 'mourning', 'bereaved', 'condolences',
  ],
  'the beyond and the other side': [
    'beyond', 'The great beyond.', 'the other side', 'THE OTHER SIDE', 'the  other\nside', 'the other-side',
    'afterlife', 'after-life', 'after life', 'hereafter', 'underworld', 'netherworld', 'otherworldly',
    'heaven', 'heavenly', 'hell', 'hellish',
  ],
};

/** Everyday text that the list must leave alone: words that hold a listed word inside them, and the words left out. */
const EVERYDAY: readonly string[] = [
  'Head tilted to one side.',
  'Turn the screen sideways or use a wider screen.',
  'About 8° of turn to each side.',
  'On the other hand.',
  'Move the other one.',
  "I can't breathe. Please come now.",
  'HELLO',
  'Demo, not the patient.',
  'A demonstration.',
  'diet, studied, audience, soldier, indie, diesel',
  'deadline',
  'gravel, gravity, gravy, engraved',
  'tomboy',
  'encrypted, crypto',
  'rehearse',
  'respect, spectrum, spectator',
  'book, boot',
  'trip, strip',
  'psychiatric',
  'passageway',
  'REST',
  'Rest in the middle.',
  'WAKE',
  'medium',
  'Pass on the message.',
];

describe('SKN-4a: the word list', () => {
  it('SKN-4a the word list catches each topic in its common forms', () => {
    const missed = (Object.keys(CAUGHT) as Topic[]).flatMap((topic) =>
      CAUGHT[topic]
        .filter((text) => !forbiddenWordsIn(text).some((hit) => hit.topic === topic))
        .map((text) => `${topic}: ${JSON.stringify(text)}`),
    );
    expect(missed).toEqual([]);
  });

  it('SKN-4a the word list matches whole words only, so everyday words pass', () => {
    const flagged = EVERYDAY.flatMap((text) =>
      forbiddenWordsIn(text).map((hit) => `${JSON.stringify(text)} matched ${JSON.stringify(hit.word)}`),
    );
    expect(flagged).toEqual([]);
  });

  it('SKN-4a the word list flags words a patient may spell, such as AM I DYING, so it never runs on spelled text (20.4)', () => {
    expect(forbiddenWordsIn('AM I DYING')).toEqual([{ topic: 'death and dying', word: 'dying' }]);
  });
});
