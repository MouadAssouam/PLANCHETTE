// Selection types (design, "Data Models"). Plain types: no DOM, no clock.
// Units are in the names: Ms is milliseconds, Deg is degrees. Rects are in Board_Units (1 unit = 1% of the Shorter_Side).

export type Rect = { x: number; y: number; w: number; h: number };  // Board_Units, top-left + size
export type Level = 1 | 2 | 3;
export type ActiveTarget = { id: string; rect: Rect; chargeable: boolean };
export type PauseReason =
  | 'paused-for-care' | 'no-input' | 'face-out-of-view' | 'head-below-range' | 'screen-hidden'
  | 'screen-too-narrow'       // Requirement 3.8
  | 'head-held-rolled';       // Requirement 8.12
export type UrgentId = 'call' | 'cant-breathe';

export type EngineConfig = {
  dwellMs: number;            // from the Dwell_Sweep; 1500 until it has run
  restZone: Rect;
  headDropDeg: number; headDropWindowMs: number;     // 8°, 500 (TUNE)
  rollDeg: number; rollWindowMs: number;             // 10°, 500 (TUNE)
  stillDeg: number; stillWindowMs: number;           // 2°, 1000 (TUNE)
  faceGapMs: number;          // 500 (TUNE): no pose for longer => face-out-of-view
  belowRangeDeg: number;      // 3° below the Default_Range floor (TUNE)
  heldRollDeg: number; heldRollMs: number;           // 10°, 2000 (TUNE): Head_Held_Rolled (8.12)
  reArmMs: number;            // 400 (TUNE)
  selectPulseMs: number;      // 1000 (TUNE): the "selected" outline/text cue
};

export type Alert = { urgent: UrgentId; startedMs: number; lastChimeMs: number; step: number };
export type Unconfirmed = { urgent: UrgentId; selectedMs: number };

export type EngineState = {
  chargingId: string | null;
  charge: number;             // 0..1
  pauses: Set<PauseReason>;
  reArmUntilRestSinceMs: number | null;   // in Re_Arm until the pointer holds the rest zone reArmMs
  guardBlocked: boolean;                   // a drop/roll is in progress or not yet still
  rollHeldSinceMs: number | null;          // when |roll| last reached heldRollDeg; null while under it
  confirm: { urgent: UrgentId; openedMs: number } | null;
  alerts: Alert[];                         // 0..2, CAN'T BREATHE named first
  spelling: string;
  unconfirmed: Unconfirmed[];
  lastSelectionId: string | null;
  soundUnlocked: boolean;
};

export type EngineEvent =
  | { kind: 'selection'; id: string; tMs: number }
  | { kind: 'confirm-open'; urgent: UrgentId; tMs: number }
  | { kind: 'confirm-close'; urgent: UrgentId; confirmed: boolean; tMs: number }
  | { kind: 'unconfirmed'; urgent: UrgentId; selectedMs: number }
  | { kind: 'alert-start'; urgent: UrgentId; tMs: number }
  | { kind: 'alert-repeat'; urgent: UrgentId; tMs: number }
  | { kind: 'alert-ack'; tMs: number }
  | { kind: 'speak'; textKey: string; tMs: number }       // a key into copy, or spelled text
  | { kind: 'spelling'; text: string; tMs: number }
  | { kind: 'pause-start'; reason: PauseReason; tMs: number }
  | { kind: 'pause-end'; reason: PauseReason; tMs: number };
