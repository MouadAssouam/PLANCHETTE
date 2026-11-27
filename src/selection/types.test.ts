// Type-level checks of the shared types in the design's "Data Models" (task 3.1): the pose, the pointer sample and the
// selection types. tsc checks these assertions in `npm run typecheck` (tsconfig includes src/, tests too); at run time
// Vitest only loads the file. Imports stay inside the one-way chain: tracking and pointer come before selection.
import { describe, expectTypeOf, it } from 'vitest';
import type { BoardPosition, PointerSample, PointerSource } from '../pointer/sample.ts';
import type { HeadPose } from '../tracking/pose.ts';
import type { EngineConfig, EngineState, Level, PauseReason, UrgentId } from './types.ts';

describe('shared types', () => {
  it('a HeadPose is yaw, pitch and roll in degrees', () => {
    expectTypeOf<HeadPose>().toEqualTypeOf<{ yawDeg: number; pitchDeg: number; rollDeg: number }>();
  });

  it('a PointerSample comes from the mouse or the demo pointer, and may carry no position or no pose', () => {
    expectTypeOf<PointerSource>().toEqualTypeOf<'mouse' | 'demo'>();
    expectTypeOf<PointerSample['tMs']>().toEqualTypeOf<number>();
    expectTypeOf<PointerSample['position']>().toEqualTypeOf<BoardPosition | null>();
    expectTypeOf<PointerSample['pose']>().toEqualTypeOf<HeadPose | null>();
  });

  it('PauseReason is the seven reasons of this slice, screen too narrow and head held rolled included', () => {
    expectTypeOf<PauseReason>().toEqualTypeOf<
      | 'paused-for-care'
      | 'no-input'
      | 'face-out-of-view'
      | 'head-below-range'
      | 'screen-hidden'
      | 'screen-too-narrow'
      | 'head-held-rolled'
    >();
  });

  it('the head-held-rolled pause has its threshold and hold time in EngineConfig and its start time in EngineState', () => {
    expectTypeOf<EngineConfig['heldRollDeg']>().toEqualTypeOf<number>();
    expectTypeOf<EngineConfig['heldRollMs']>().toEqualTypeOf<number>();
    expectTypeOf<EngineState['rollHeldSinceMs']>().toEqualTypeOf<number | null>();
  });

  it('Level is 1, 2 or 3, and UrgentId is call or cant-breathe', () => {
    expectTypeOf<Level>().toEqualTypeOf<1 | 2 | 3>();
    expectTypeOf<UrgentId>().toEqualTypeOf<'call' | 'cant-breathe'>();
  });
});
