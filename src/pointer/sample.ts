// Pointer types (design, "Data Models"): one Pointer_Sample per input reading, from Mouse_Mode or the Demo_Pointer.
import type { HeadPose } from '../tracking/pose.ts';

export type BoardPosition = { x: number; y: number };     // Board_Units; (0,0) top-left
export type PointerSource = 'mouse' | 'demo';
export type PointerSample = {     // the glossary's Pointer_Sample; types are PascalCase (structure.md)
  tMs: number;                       // time is an input; pure code never reads the clock
  position: BoardPosition | null;    // null when the mouse is off the board, or the face is lost
  pose: HeadPose | null;             // null in Mouse_Mode
  source: PointerSource;
};
