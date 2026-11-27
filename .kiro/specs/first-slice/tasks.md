# Implementation Plan: First slice

## Overview

The tasks build slice 1 in the order its parts depend on each other. Pure modules come first and are tested in Node with fast-check and simulated patients. The browser layer, the end-to-end tests, the README and the final review come last.

After each top-level task, the orchestrator commits on the `testing` branch and pushes. Never push `master`.

The user approved this plan and every decision in design.md's "Decisions that need your approval" on 2026-11-27, taking the first option for decision 5 (structure.md's `scripts/` line is widened). Decision 4 was replaced: the simulation runner is `src/board/sim-runner.ts`, not a top-level `src/harness.ts`. At the same time the user asked for seven additions, now written into the tasks below; requirements.md lists them, with their criteria, under "Changes at task approval (2026-11-27)":
- a pause while the head is held rolled (8.12, 8.13, 23.12): tasks 3.1, 4.1, 4.5, 7.3, 7.10, 10.2, 10.5, 11.8 and 11.9;
- "Demo." before demo speech (13.12, 13.13): tasks 4.1, 9.4, 9.5, 10.14, 14.8 and 14.10;
- the resume time on the board during care (18.7): tasks 4.1, 4.2, 10.1, 10.2 and 10.7;
- each new sentence at doorway size (13.14, 13.15): tasks 5.1, 5.2, 10.2, 10.7 and 14.2;
- "Plain look" for Ward in text people see (16.13): tasks 4.1, 4.2, 5.1, 9.9, 9.10, 10.2 and 14.10;
- the word REST in the Rest_Zone (7.11, 7.12): tasks 4.1, 5.1, 5.2, 9.7, 9.8, 10.2, 10.9, 11.7, 14.1 and 14.2;
- tests inside the one-way chain: the new rule below, and tasks 3.9, 6.2, 6.4, 10.5, 10.10, 10.12, 10.14, 11.4 to 11.9, 12.1, 12.2 and 14.10.

## Rules for every task

- Every task and sub-task is required, tests included.
- Sub-tasks never commit or push.
- Each top-level task leaves `npm run check:task` green. The task-gate hook blocks the next task otherwise.
- No new npm packages. A task that finds it needs one stops and asks the user (structure.md).
- Test names carry the safety.md ID they check (structure.md). A property test's name starts with its label, such as `SAF-4a`.
- Property tests use fast-check with 200 runs (tech.md), print the seed on failure, and carry the comment `// Feature: first-slice, Property <n>: <label> <title>`. Where the design marks a property as scripted or as a scan of a fixed table, the test checks every case once. A counterexample is fixed in the code, never by weakening the property. If a property itself looks wrong, stop and ask the user.
- Pure code takes `now` as an input. Only `*.dom.ts` files touch browser APIs, and `main.ts` only wires modules together (structure.md).
- Every string a patient, family member or nurse sees or hears comes from `src/copy/`.
- Tests stay inside the one-way chain. A test file imports only modules at or before its own folder's place in the chain `tracking → pointer → selection → board → speech and log`. `copy/`, `skins/` and `sim/` sit outside the chain and may be imported by any stage, and `sim/` itself imports only `tracking/`, `pointer/clamp.ts` and its own files. `alert/` sits at the end with `speech/` and `log/`. A test that reads several stages lives in the folder of the latest one, and the top-level tests in `src/` import no `src/` module.

## Tasks

- [ ] 1. Set up the scripts, the folders and the Playwright config
  - [ ] 1.1 Add the npm scripts
    - In `package.json`, add `"test:safety": "vitest run src/selection src/board src/pointer src/sim"`, `"sweep": "node scripts/dwell-sweep.mjs"` and `"e2e": "playwright test"`. Change nothing else, so `package-lock.json` stays the same.
    - Check that `npm run test:safety` runs `src/pointer/clamp.test.ts` and passes.
    - _Requirements: 23.4, 23.11, 24.3_
  - [ ] 1.2 Create the evidence and experiment folders
    - Create `docs/experiments/` and `docs/evidence/screenshots/`, each with a `.gitkeep`.
    - Create `docs/evidence/counterexamples.md` with one line on what it is for, the table header `| seed | property | input | what broke | the fix |` with its separator row, and the line "No counterexamples have been found yet."
    - _Requirements: 23.4, 23.11_
  - [ ] 1.3 Write `playwright.config.ts`
    - `testDir: 'e2e'`, Chromium only, a 1366×768 viewport and `baseURL: 'http://localhost:4173'`.
    - `webServer` runs `npm run build && npx vite preview --port 4173 --strictPort`, with `reuseExistingServer: true` and a timeout long enough for the build.
    - No camera flags, because the camera never starts in this slice. Don't run `npm run e2e` yet: there are no specs until task 16.
    - _Requirements: 24.3_

- [ ] 2. Add the safety-tests hook
  - [ ] 2.1 Create `.kiro/hooks/safety-tests.json`
    - Creating a file in `.kiro/hooks/` asks the user for approval. Wait for it.
    - Content: `"version": "v1"` and one hook with `"name": "safety-tests"`, `"description": "After a .ts file in src/selection, src/board, src/pointer or src/sim is saved, runs the safety subset of the tests with npm run test:safety."`, `"trigger": "PostFileSave"`, `"matcher": "src[\\\\/](selection|board|pointer|sim)[\\\\/].*\\.ts$"`, `"action": { "type": "command", "command": "npm run test:safety" }` and `"timeout": 120`.
    - As a plain regex the matcher is `src[\\/](selection|board|pointer|sim)[\\/].*\.ts$`. In JSON every backslash is doubled, as in `copy-review.json`.
    - _Requirements: 23.11_
  - [ ] 2.2 Check the hook file with a test
    - Write `src/safety-hook.test.ts`. Read the hook file and `package.json` as text with Vite `?raw` imports, because `src/` has no Node types.
    - Assert that the JSON parses, `version` is "v1", the hook has a `name` and a `description`, the trigger is PostFileSave, the command is `npm run test:safety`, and the `test:safety` script in `package.json` is `vitest run src/selection src/board src/pointer src/sim`.
    - Compile the matcher with `new RegExp(matcher)`. It must match `src/selection/engine.ts` and `src\board\layout.ts`, and must not match `src/copy/index.ts`.
    - _Requirements: 23.11_

- [ ] 3. Write the shared types and the six simulated-patient profiles
  - [ ] 3.1 Write the shared types
    - `src/tracking/pose.ts` (`HeadPose`), `src/pointer/sample.ts` (`BoardPosition`, `PointerSource`, `PointerSample`) and `src/selection/types.ts` (`Rect`, `Level`, `ActiveTarget`, `PauseReason` with `'screen-too-narrow'` and `'head-held-rolled'`, `UrgentId`, `EngineConfig` with `heldRollDeg` and `heldRollMs`, `Alert`, `Unconfirmed`, `EngineState` with `rollHeldSinceMs`, `EngineEvent`), as in the design's Data Models. Named exports only.
    - _Requirements: 3.8, 5.1, 7.7, 8.1, 8.12_
  - [ ] 3.2 Write the profile type and its schema check
    - `src/sim/pose-types.ts`: the `GhostProfile` type in tech.md's "Ghost profile format", and `validateGhostProfile(value)`, which returns the profile or a list of problems. Write the check by hand, with no schema package.
    - _Requirements: 6.1_
  - [ ] 3.3 Write the small-range profile (run by the orchestrator with the ghost-patient-designer agent)
    - File `src/sim/profiles/small-range.json`. Description for the agent: "Small range of head movement: about 8° of turn to each side, 6° up and 5° down. No tremor, no drift, no fatigue, no dozing, and the face stays in view."
    - Also tell the agent to keep at least 6.2° of turn each way and 5.2° up (TUNE), so CALL and CAN'T BREATHE stay reachable (design, "Reachability of the urgent targets").
    - _Requirements: 6.1, 6.2_
  - [ ] 3.4 Write the tremor profile (run by the orchestrator with the ghost-patient-designer agent)
    - File `src/sim/profiles/tremor.json`. Description for the agent: "Normal range of head movement with a steady tremor of 2° at 6 Hz. No drift, no fatigue, no dozing, and the face stays in view."
    - _Requirements: 6.1, 6.2_
  - [ ] 3.5 Write the slow-drift profile (run by the orchestrator with the ghost-patient-designer agent)
    - File `src/sim/profiles/slow-drift.json`. Description for the agent: "Normal range of head movement. The resting head drifts slowly, 2° per minute. No tremor, no fatigue, no dozing, and the face stays in view."
    - _Requirements: 6.1, 6.2_
  - [ ] 3.6 Write the fatigue profile (run by the orchestrator with the ghost-patient-designer agent)
    - File `src/sim/profiles/fatigue.json`. Description for the agent: "Normal range of head movement at first, shrinking as the patient tires: 1.5% of the range is lost each minute. No tremor, no drift, no dozing, and the face stays in view."
    - Also tell the agent that after 30 minutes the range must still cover at least 6.2° of turn each way and 5.2° up (TUNE). This is the profile the Fatigue_Reach_Run uses.
    - _Requirements: 6.1, 6.2, 23.3_
  - [ ] 3.7 Write the dozing-roll profile (run by the orchestrator with the ghost-patient-designer agent)
    - File `src/sim/profiles/dozing-roll.json`. Description for the agent: "Normal range of head movement. Every 8 minutes the patient nods off for 60 seconds: the head rolls 15° to one side, then comes back. No tremor, no drift, no fatigue, and the face stays in view."
    - Also tell the agent to name the side (left or right) in `notes`, and that every 10-minute run must contain at least one doze.
    - _Requirements: 6.1, 6.2_
  - [ ] 3.8 Write the face-leaves-frame profile (run by the orchestrator with the ghost-patient-designer agent)
    - File `src/sim/profiles/face-leaves-frame.json`. Description for the agent: "Normal range of head movement. Every 5 minutes the face leaves the camera's view for 10 seconds, for example during care. No tremor, no drift, no fatigue, no dozing."
    - Also tell the agent that every 10-minute run must contain at least one face loss.
    - _Requirements: 6.1, 6.2_
  - [ ] 3.9 Write the profile loader and the schema test
    - `src/sim/profiles.ts` loads every `src/sim/profiles/*.json` with Vite's `import.meta.glob` and validates each with `validateGhostProfile`. Code that the sweep runs in plain Node (task 12) never imports it.
    - `src/sim/profiles.test.ts`: every profile file passes the schema; there are exactly six, with the names from 3.3 to 3.8, and each has exactly one behaviour on, counting a turn of 10° or less as the small-range behaviour; the reach limits in 3.3 and 3.6 hold, checked as constants (6.2° and 5.2°) so the test imports only `src/sim/` files (test name starts with `SAF-1`); no name or description contains "ghost".
    - _Requirements: 6.1, 6.2, 6.7_

- [ ] 4. Write the copy module and the wording tests
  - [ ] 4.1 Write `src/copy/index.ts`
    - Every string the requirements name, as named exports that take no Skin: the board labels; the sentences in 13.5; the confirm labels in 10.3; the Visitor_Hint and the Demo_Banner; the pause messages in 8.6 and 3.8, the head-held-rolled one included; the paused-for-care message as a function of the resume time text ("Paused for care. Selection is off. Resumes by itself at 03:22."); the word "Demo." spoken before demo sentences (13.12); the word "REST" (7.11); the Alert_Panel lines; the Unconfirmed_Notice wording and "Clear"; the nurse-drawer labels and notices; the Candlelight_Offer text and its buttons "Use Candlelight" and "Keep the plain look"; "Plain look", "Nurse menu" and the disclaimer; English weekday and month names for the Clock_Line; the Level 3 demo word list.
    - No string contains the word "Ward" (16.13). The nurse drawer says "Demo pointer", never "ghost". The copy-review hook runs when this file is saved; follow it.
    - _Requirements: 3.8, 4.1, 4.3, 4.4, 5.9, 6.6, 6.7, 7.11, 8.6, 8.7, 8.12, 10.3, 11.1, 11.2, 12.2, 13.5, 13.8, 13.12, 16.8, 16.11, 16.13, 17.1, 17.3, 17.11, 17.12, 17.14, 18.1, 18.4, 18.7, 19.3, 20.1, 20.2, 20.5, 20.6, 21.1_
  - [ ] 4.2 Write the tone and starting-wording tests
    - `src/copy/copy.test.ts`: board labels are upper case; no string has an exclamation mark; no system message uses "I" as a word (patient sentences may); the strings equal the starting wording in 3.8, 7.11, 8.6, 10.3, 13.5, 13.12, 16.8, 16.11, 17.12 and 18.1, the care message with a sample time included. Test names start with `SKN-3`.
    - Also: no string contains the word "Ward" (16.13), and the plain-look labels are "Plain look" and "Keep the plain look". Those test names start with `SKN-2`.
    - _Requirements: 3.8, 7.11, 8.6, 10.3, 13.5, 13.12, 16.8, 16.11, 16.13, 17.12, 18.1, 20.2_
  - [ ] 4.3 Write the test for Property 20: SKN-4a
    - **Property 20: SKN-4a — no copy or profile text uses a forbidden topic or "ghost"**
    - In `src/copy/copy.skn-4.test.ts`: every Copy_Module string, and every profile name and description the drawer can show (from `src/sim/profiles.ts`), is free of the topics SKN-4 rules out and of the word "ghost". Spelled text is out of scope.
    - _Requirements: 20.3, 20.4_
    - Keep every counterexample fast-check finds as a named regression test beside the property (seed and shrunk input inline), and add a row to docs/evidence/counterexamples.md: seed, input, what broke, the fix.
  - [ ] 4.4 Write the test for Property 26: LNG-1a
    - **Property 26: LNG-1a — labels come from the fixed table and are never translated at runtime**
    - In `src/copy/copy.lng-1.test.ts`: over target ids and ignored skin or locale arguments, the label and sentence getters return the fixed English strings; a scan of `src/copy/`, read with `import.meta.glob(..., { query: '?raw' })`, finds no runtime translation.
    - _Requirements: 20.6, 16.3_
    - Keep every counterexample fast-check finds as a named regression test beside the property (seed and shrunk input inline), and add a row to docs/evidence/counterexamples.md: seed, input, what broke, the fix.
  - [ ] 4.5 Write the test for Property 28: NEV-3a
    - **Property 28: NEV-3a — no pause or notice wording names a clinical state**
    - In `src/copy/copy.nev-3.test.ts`: every pause message, the narrow-screen and head-held-rolled ones included, and every Unconfirmed_Notice wording is free of clinical-state words such as sleep, sedation, distress and delirium. "Head tilted to one side. Selection is off." names a position and must pass.
    - _Requirements: 8.6, 8.7, 17.14, 20.2_
    - Keep every counterexample fast-check finds as a named regression test beside the property (seed and shrunk input inline), and add a row to docs/evidence/counterexamples.md: seed, input, what broke, the fix.
  - [ ] 4.6 Write the test for Property 31: NEV-7a
    - **Property 31: NEV-7a — the board never describes itself with the forbidden terms**
    - In `src/copy/copy.nev-7.test.ts`: no string uses "diagnose", "monitor", "clinical-grade", "detects pain" or "medical device" outside the exact disclaimer "not a medical device", and none contains the trademarked talking-board game name. Build that name from parts, as `scripts/audit.mjs` does, so the word never appears in the repo.
    - _Requirements: 20.3_
    - Keep every counterexample fast-check finds as a named regression test beside the property (seed and shrunk input inline), and add a row to docs/evidence/counterexamples.md: seed, input, what broke, the fix.

- [ ] 5. Write the layout table and the geometry tests
  - [ ] 5.1 Write `src/board/layout.ts`
    - The Layout_Table from the design's "Layout geometry": for every Target and Confirm_Target, its id, its rectangle in Board_Units, its Usage_Tier, its Levels and its kind, plus the Rest_Zone. The table is anchored on the Board's centre; its only input besides the id is the Board's width in Board_Units, never a Level or a Skin.
    - Also place what the design leaves open: the Clock_Line, Visitor_Hint, Demo_Banner, Message_Strip, Spelling_Line, pause message, Alert_Panel, Candlelight_Offer, Plain look button, Nurse_Handle and Nurse_Drawer. The lines and the handle sit outside every Target and Confirm_Target; the panels and the drawer cover no part of CALL, CAN'T BREATHE, YES, NO or either Confirm_Target.
    - Place the anchor of the word "REST" at the Rest_Zone's centre (7.11).
    - Make the Message_Strip rectangle hold its text at 8vmin cap height on up to two lines (13.14): about 96 × 26 Board_Units at 1280×800 for "I can't breathe." over "Please come now." (design, "The Message_Strip at doorway size"). It stays outside every Target and Confirm_Target at every Level (4.5). If it can't fit at 1280×800, stop and ask the user.
    - Size the "YES, CAN'T BREATHE" Confirm_Target for its two-line label, "YES," over "CAN'T BREATHE", at 6vmin or more, so it stays clear of CALL.
    - Helpers: the Board width in Board_Units from CSS px, `isNarrowScreen` (under 160 Board_Units, TUNE), and the rectangles shown at a Level.
    - The design's Level 2 table breaks 1.9: MOUTH DRY and MOVE ME sit about 28 units from the rest-zone centre, nearer than YES and NO (30.5 units). Move rectangles until 1.9 holds, and update that table in design.md to match. Never weaken a rule to make it fit.
    - If everything does not fit at 1280×800 with the TUNE sizes, stop and ask the user (requirements, open question 6).
    - _Requirements: 1.1, 1.2, 1.5, 1.6, 1.7, 1.8, 1.9, 1.11, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 3.8, 4.5, 7.11, 8.11, 10.2, 11.6, 13.14, 16.10, 16.11, 17.1, 17.7_
  - [ ] 5.2 Write the geometry tests
    - `src/board/layout.test.ts`, at 1280×800, 1366×768 and 1920×1080: the smaller side of every Target and Confirm_Target; gaps of at least 2% of the Shorter_Side, a shown Confirm_Target included; the Rest_Zone's size and centre; each Confirm_Target beside its Urgent_Target; the Targets on each Level; the lines and panels from 5.1; the REST anchor at the Rest_Zone's centre; the Message_Strip rectangle tall enough for two lines at 8vmin and wide enough for the longer line of the longest fixed sentence; everything inside the Board; and `isNarrowScreen` for every portrait size and for widths just under and over 160 units. Test names start with `SAF-1` or `LAY-1`.
    - _Requirements: 1.5, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.8, 4.5, 7.11, 10.2, 13.14_
  - [ ] 5.3 Write the test for Property 9: SAF-7a
    - **Property 9: SAF-7a — urgent targets, confirms and SPEAK sit above the rest zone**
    - In `src/board/layout.saf-7.test.ts`: at each of the three viewports, the bottom edge of CALL, CAN'T BREATHE, both Confirm_Targets and SPEAK is above the Rest_Zone's top edge.
    - _Requirements: 1.7_
    - Keep every counterexample fast-check finds as a named regression test beside the property (seed and shrunk input inline), and add a row to docs/evidence/counterexamples.md: seed, input, what broke, the fix.
  - [ ] 5.4 Write the test for Property 13: LAY-1a
    - **Property 13: LAY-1a — a target keeps one rectangle across levels and skins**
    - In `src/board/layout.lay-1.test.ts`: over target ids and the Level and Skin pairs that show them, the rectangle is identical, within 1 CSS px at a fixed viewport.
    - _Requirements: 1.2, 1.4, 16.2_
    - Keep every counterexample fast-check finds as a named regression test beside the property (seed and shrunk input inline), and add a row to docs/evidence/counterexamples.md: seed, input, what broke, the fix.
  - [ ] 5.5 Write the test for Property 15: LAY-3a
    - **Property 15: LAY-3a — more-used tiers sit closer, and nothing sits in the rest zone**
    - In `src/board/layout.lay-3.test.ts`: on every Level, the farthest centre of each Usage_Tier is no farther from the rest-zone centre than the nearest centre of the next tier; YES and NO are the nearest tiered Targets; no Target comes within 2 units of the Rest_Zone.
    - _Requirements: 1.6, 1.8, 1.9, 3.5_
    - Keep every counterexample fast-check finds as a named regression test beside the property (seed and shrunk input inline), and add a row to docs/evidence/counterexamples.md: seed, input, what broke, the fix.

- [ ] 6. Write the pointer mapper and the smoothing
  - [ ] 6.1 Write `src/pointer/mapper.ts`
    - Map a head pose to a Board position with the Default_Range (10° of yaw and 8° of pitch each way, TUNE), and back again with `poseForPosition` for the simulation runner. Poses outside the range clamp to the Board edge. The Board width in Board_Units is an input.
    - _Requirements: 5.4, 5.5_
  - [ ] 6.2 Test the mapper
    - `src/pointer/mapper.test.ts` with fast-check: 0° of yaw and pitch maps to the Board's centre, (W/2, 50), where 1.5 puts the Rest_Zone; the range edges map to the Board edges; poses outside the range clamp; `map(poseForPosition(p))` gives back `p` for every point on the Board. The test imports nothing from `board/`. Test names start with `SAF-4` for the neutral pose and `SAF-1` for the edges.
    - _Requirements: 5.5_
  - [ ] 6.3 Write `src/pointer/smoothing.ts`
    - One-euro-style smoothing of the mapped position, and slow-drift recentring: a neutral-pose estimate (exponential average, τ about 60 s, TUNE) that moves only while the head is still and near neutral, so a reach or a dwell hold is never learned as neutral. Time is an input.
    - _Requirements: 5.4, 7.6, 23.1_
  - [ ] 6.4 Test the smoothing
    - `src/pointer/smoothing.test.ts`, the pointer-only part: a reach of 6° within 1 s brings the smoothed position to the mapped goal within 1 s; a 1.5 s hold 6° off neutral leaves the neutral estimate where it was.
    - `src/board/smoothing.saf-4.test.ts`, the part that reads the Rest_Zone and the Targets from `board/layout.ts`: at rest, a drift of 2° per minute keeps the pointer inside the Rest_Zone for 60 simulated minutes; the tremor profile's 2° at 6 Hz keeps it inside too; a reach of 6° within 1 s gets to its Target.
    - Test names start with `SAF-4`.
    - _Requirements: 7.6, 23.1_

- [ ] 7. Write the selection engine
  - [ ] 7.1 Write the geometry helpers
    - `src/selection/geometry.ts` (point in rectangle and rectangle overlap, with `Rect` from `selection/types.ts`) and `src/selection/geometry.test.ts` with fast-check: edges, touching rectangles and the symmetry of overlap.
    - _Requirements: 1.11, 7.3, 10.10_
  - [ ] 7.2 Write the dwell core of `src/selection/engine.ts`
    - `step(state, sample, active, config, env)` returns `{ state, events }` and is pure. While the pointer stays in one chargeable Target, moving or not, the Charge grows with elapsed time; at 1 the engine emits exactly one Selection and resets. Leaving the Target (for another Target, the Rest_Zone, a gap or off the Board) resets the Charge. One Target charges at a time, the selected Target does not charge again until the pointer leaves it, and nothing charges in the Rest_Zone or on a Target marked not chargeable. A Level change sets the Charge to zero.
    - The default Dwell_Time is one exported constant: 1500 ms until task 12.2 changes it.
    - Unit tests in `src/selection/engine.test.ts`; names start with `SAF-4` where they cover the Rest_Zone.
    - _Requirements: 1.11, 2.7, 5.11, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.10_
  - [ ] 7.3 Add pauses to the engine
    - The Pause_Reasons, from `env` and the samples: screen hidden; screen too narrow; no input; paused for care, which ends by itself after 10 minutes (TUNE); Face_Out_Of_View after 500 ms with no pose, with the Charge held, not grown, up to then; Head_Below_Range; Head_Held_Rolled, while the roll has stayed at least 10° from 0° (TUNE), either way, for at least 2 s (TUNE), ending on the first sample back under 10°, and never without a head pose.
    - A Pause sets the Charge to zero, charges and selects nothing, emits `pause-start` and `pause-end`, and closes an open Confirm_Offer as not confirmed.
    - Unit tests in `src/selection/engine.test.ts`; names start with `SAF-5`, or `SAF-3` for Head_Held_Rolled: the 2 s boundary, both sides, the end under 10°, and none in Mouse_Mode.
    - _Requirements: 3.8, 5.12, 8.1, 8.2, 8.3, 8.4, 8.12, 8.13, 10.8, 18.1, 18.2, 18.3_
  - [ ] 7.4 Add the head-drop and roll guard, and Re_Arm
    - Head_Drop (pitch falls 8° within 500 ms), Sideways_Roll (roll changes 10° within 500 ms) and Head_Still (pitch and roll each change less than 2° over 1000 ms), all TUNE. A drop or a roll sets the Charge to zero and blocks every Target until Head_Still holds. Samples with no head pose are not guarded.
    - Re_Arm (9.6): after a Pause ends, the Head_Held_Rolled pause included, or after a drop or roll ends, nothing charges until the pointer has stayed in the Rest_Zone for 400 ms (TUNE). In Mouse_Mode only the end of a Pause starts Re_Arm.
    - Unit tests in `src/selection/engine.test.ts`; names start with `SAF-3`.
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.6_
  - [ ] 7.5 Add the Confirm_Offer and the Unconfirmed_Notices
    - Selecting CALL or CAN'T BREATHE opens its Confirm_Offer, with no speech, no Alert and no time limit. The offer closes on its Confirm_Target (which starts the Alert), on any other Selection (which goes ahead; the other Urgent_Target opens its own offer) or on a Pause. It stays open through Level and Skin changes.
    - Each close without the confirm emits a `confirm-close` event marked not confirmed, which the log records as "not confirmed" (task 9.1), and raises an Unconfirmed_Notice with the Urgent_Target and the time it was selected. Notices stay through Level changes, Skin changes, Pauses, Alerts and Acknowledge until the nurse clears that one notice. A notice makes no sound, no speech and no Alert.
    - Unit tests in `src/selection/engine.test.ts`; names start with `SAF-2`.
    - _Requirements: 2.8, 10.1, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 10.11, 10.12, 10.13, 17.13_
  - [ ] 7.6 Add Alerts to the engine
    - Selecting a Confirm_Target starts the Alert for its Urgent_Target and speaks its sentence. There is one Alert per Urgent_Target: a repeat confirm keeps it, speaks again and emits `alert-repeat`, which the log records. With both active, CAN'T BREATHE comes first. Acknowledge ends every Alert.
    - Alerts stay active through every Pause, care and a hidden screen included, and a Confirm_Offer can still open during an Alert.
    - Unit tests in `src/selection/engine.test.ts`; names start with `ALR-1` or `SAF-2`.
    - _Requirements: 10.5, 11.1, 11.9, 11.12, 11.13, 11.14, 11.16, 11.17, 18.5_
  - [ ] 7.7 Add spelling to the engine
    - A letter adds itself to the Spelling_Line, SPACE adds one space and DELETE removes the last character (nothing when the line is empty). SPEAK with at least one letter emits the text for speech exactly as held and empties the line; SPEAK with no letter does nothing. Letters, SPACE and DELETE are never spoken. The text survives Level changes.
    - Unit tests in `src/selection/engine.test.ts`; names start with `SAF-6` or `NEV-2`.
    - _Requirements: 13.3, 13.4, 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7_
  - [ ] 7.8 Write the test for Property 3: SAF-2a
    - **Property 3: SAF-2a — an alert follows only a confirm of its own urgent target**
    - In `src/selection/confirm.saf-2.test.ts`: over generated target rectangles and pointer paths with urgent approaches, Pauses and head drops at random times and Dwell_Times, every `alert-start` comes right after a Selection of its Urgent_Target and then of that target's Confirm_Target, with no other Selection and no Pause between.
    - _Requirements: 10.1, 10.4, 10.5, 23.6_
    - Keep every counterexample fast-check finds as a named regression test beside the property (seed and shrunk input inline), and add a row to docs/evidence/counterexamples.md: seed, input, what broke, the fix.
  - [ ] 7.9 Write the test for Property 4: SAF-2b
    - **Property 4: SAF-2b — an unconfirmed urgent selection is silent and surfaced**
    - Add to `src/selection/confirm.saf-2.test.ts` (after 7.8): streams that select an Urgent_Target and then select another Target or pause before the confirm raise exactly one Unconfirmed_Notice, with no `speak`, no `alert-start` and no `alert-repeat` from it. The notice survives Level, Skin, Pause, Alert and Acknowledge events until it is cleared.
    - _Requirements: 10.6, 10.7, 10.8, 10.9, 10.10, 10.11, 10.12, 10.13, 11.16, 11.17_
    - Keep every counterexample fast-check finds as a named regression test beside the property (seed and shrunk input inline), and add a row to docs/evidence/counterexamples.md: seed, input, what broke, the fix.
  - [ ] 7.10 Write the test for Property 7: SAF-5a
    - **Property 7: SAF-5a — a pause clears the charge and blocks selection**
    - In `src/selection/pause.saf-5.test.ts`: over timelines that turn each Pause_Reason on and off at random times, Head_Held_Rolled included, laid over a pointer path that would otherwise select, the Charge is zero at every `pause-start` and no Selection happens while any Pause holds. The pose-based reasons come from the samples: no pose for more than 500 ms, pitch below range, and a roll held at 10° or more for 2 s or more. The test uses its own rectangles and imports nothing from `board/`.
    - _Requirements: 8.1, 8.2, 8.3, 8.12, 8.13, 5.12, 23.9_
    - Keep every counterexample fast-check finds as a named regression test beside the property (seed and shrunk input inline), and add a row to docs/evidence/counterexamples.md: seed, input, what broke, the fix.
  - [ ] 7.11 Write the test for Property 14: LAY-2a
    - **Property 14: LAY-2a — a level control acts in one step and resets the charge**
    - In `src/selection/level.lay-2.test.ts`: for every Level and any starting Charge, one Level change gives that Level at once, with the Charge at zero.
    - _Requirements: 2.6, 2.7_
    - Keep every counterexample fast-check finds as a named regression test beside the property (seed and shrunk input inline), and add a row to docs/evidence/counterexamples.md: seed, input, what broke, the fix.

- [ ] 8. Checkpoint: run `npm run check:task` and `npm run test:safety`; stop and ask the user if anything is red

- [ ] 9. Write the log, the speech queue, the chime and the skins
  - [ ] 9.1 Write `src/log/log.ts`
    - The Session_Log, in memory only, with nothing written to storage or the network. Each entry is `{ tMs, kind, about, demo }` and nothing else; any other field on an event is dropped.
    - It records every kind in 15.3: Selections; urgent selected, confirmed and not confirmed; Alert start and acknowledgement; Pause_Reason start and end; care on and off, with whether it ended by Resume or by itself; Level changes; Candlelight offer, choice, return to Ward and "Candlelight from the address (demo)"; input source on and off; Test sound; wake lock refusals; cleared Unconfirmed_Notices. While a Demo_Session is on, every new entry is marked Demo.
    - Unit tests in `src/log/log.test.ts`; names start with `SAF-8`, `SAF-10` or `ALR-3`.
    - _Requirements: 8.10, 10.9, 11.10, 11.12, 12.3, 15.1, 15.2, 15.3, 15.4, 15.5, 18.6, 19.3, 25.2_
  - [ ] 9.2 Write the test for Property 25: PAIN-1a
    - **Property 25: PAIN-1a — PAIN records no score**
    - In `src/log/log.pain-1.test.ts`: over streams that select PAIN among other Targets, the PAIN entry is `{ tMs, kind: 'selection', about: 'pain', demo }` and no entry holds a pain score.
    - _Requirements: 13.6, 15.5_
    - Keep every counterexample fast-check finds as a named regression test beside the property (seed and shrunk input inline), and add a row to docs/evidence/counterexamples.md: seed, input, what broke, the fix.
  - [ ] 9.3 Write the test for Property 29: NEV-4a
    - **Property 29: NEV-4a — the log stores no frame, pose, landmark or pain score**
    - In `src/log/log.nev-4.test.ts`: over events carrying extra pose, landmark, frame or score fields, every stored entry has exactly the keys `tMs`, `kind`, `about` and `demo`. A scan of `src/`, read with `import.meta.glob(..., { query: '?raw' })`, finds no log call that passes a pose, a landmark or a frame.
    - _Requirements: 15.1, 15.5_
    - Keep every counterexample fast-check finds as a named regression test beside the property (seed and shrunk input inline), and add a row to docs/evidence/counterexamples.md: seed, input, what broke, the fix.
  - [ ] 9.4 Write `src/speech/speech.ts`
    - A pure speech queue: engine events and the Demo_Session flag in, the ordered `SpeechItem`s to speak out. Only the sentences of 13.1 to 13.3 are queued, from `src/copy/`, with spelled text passed through unchanged. An urgent sentence stops the current one, drops the queue and goes first. Demo selections are spoken like any other, except that in a Demo_Session a separate "Demo." item from `src/copy/` goes before each sentence, spelled text and urgent sentences included, and the sentence item itself is unchanged. The Message_Strip and the Session_Log never get the "Demo." item.
    - Unit tests in `src/speech/speech.test.ts`; names start with `SAF-6`, or `SAF-10` for the "Demo." item.
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.7, 13.11, 13.12, 13.13, 14.6_
  - [ ] 9.5 Write the test for Property 8: SAF-6a
    - **Property 8: SAF-6a — speech is exactly the selected sentences, in order**
    - In `src/speech/speech.saf-6.test.ts`: over random engine runs that mix needs, urgent confirms and Level 3 spelling with SPEAK, with the Demo_Session flag on or off, the spoken list equals the sentences of the Selections named in 13.1 to 13.3, in order. In a Demo_Session each spoken item is "Demo." followed by the sentence; outside a Demo_Session it is the sentence alone, and "Demo." never appears. Letters, SPACE, DELETE, other system text, pause messages, "REST" and Alert names never appear.
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.7, 13.11, 13.12, 14.4, 23.7_
    - Keep every counterexample fast-check finds as a named regression test beside the property (seed and shrunk input inline), and add a row to docs/evidence/counterexamples.md: seed, input, what broke, the fix.
  - [ ] 9.6 Write `src/alert/chime.ts`
    - The chime as data: two notes falling from about 587 Hz to 440 Hz, 300 ms each with a 50 ms raised-cosine attack and a 120 ms release, 150 ms apart (TUNE).
    - `nextChimeTimes(startedAtMs, now, config)` returns the note times due in the next window: the first within 1 s, a repeat every 6 s, and one small gain step at 30 s and at 60 s, up to a ceiling (TUNE). Test sound is one pattern at the starting level.
    - Unit tests in `src/alert/chime.test.ts`; names start with `ALR-1` or `ALR-4`.
    - _Requirements: 11.3, 11.4, 11.5, 11.14, 12.2_
  - [ ] 9.7 Write `src/skins/tokens.ts`
    - Each Skin's colour tokens as data (the design's starting values), with the background each foreground is shown on, the token for the word "REST" included (`#8E9BA8` in Ward, `#A88B5C` in Candlelight, on the board background); the CSS custom-property names the stylesheets use; the fade duration (at least 300 ms); and the Candlelight light drift (at most 10% in luminance, with a period of at least 3 s).
    - _Requirements: 7.11, 16.6, 22.1, 22.4_
  - [ ] 9.8 Write the contrast test
    - `src/skins/tokens.test.ts`: for each Skin, compute the WCAG relative-luminance contrast ratio of every token against its background. Require at least 7:1 for board labels and the Message_Strip, 4.5:1 for all other text, the word "REST" included, and 3:1 for the pointer, the Charge_Ring, focus outlines and Target borders (accessibility.md).
    - Also check the fade duration and the light-drift limits; those test names start with `ATT-2`.
    - _Requirements: 7.11, 16.6, 22.1, 22.4_
  - [ ] 9.9 Write `src/skins/skin.ts`
    - The pure Skin_Manager: Ward at the start, with Candlelight from the address only in a Demo_Session; Candlelight only after Offer Candlelight and then "Use Candlelight"; Ward while any Alert is active, and afterwards until a new offer and choice; "Plain look" returns to Ward in one step, and so does "Keep the plain look" on the offer.
    - _Requirements: 11.7, 11.11, 16.1, 16.8, 16.9, 16.11, 25.2_
  - [ ] 9.10 Write the test for Property 18: SKN-2a
    - **Property 18: SKN-2a — Ward is default, alerts force Ward, Candlelight needs an offer**
    - In `src/skins/skin.skn-2.test.ts`: over arrays of skin inputs (offer, "Use Candlelight", "Keep the plain look", Alert start and end, address switch in a Demo_Session, "Plain look"), replayed through `skin.ts`, all four rules hold at every step.
    - _Requirements: 16.1, 16.8, 16.9, 16.10, 16.11, 11.7, 11.11, 25.2_
    - Keep every counterexample fast-check finds as a named regression test beside the property (seed and shrunk input inline), and add a row to docs/evidence/counterexamples.md: seed, input, what broke, the fix.

- [ ] 10. Write the clock and the screen model
  - [ ] 10.1 Write `src/board/clock.ts`
    - `clockText(tMs, utcOffsetMin)` returns the full weekday name, the day of the month, the month as a word and HH:MM, from the English tables in `src/copy/`. The time-zone offset is an input, so the function stays pure.
    - Also `timeText(tMs, utcOffsetMin)`: the same HH:MM with the seconds dropped, for the care message's resume time (18.7) and the Unconfirmed_Notice times (17.12).
    - _Requirements: 4.1, 4.2, 17.12, 18.7_
  - [ ] 10.2 Write the board part of `src/board/model.ts`
    - From the engine state, the Level, the Skin, the Board size, the overlays and the flags (Demo_Session, sound blocked, speech not available, Narrow_Screen, the 1 s selected-Target cue), build what is on screen: each shown Target at its Layout_Table rectangle, with its Charge only as an arc fraction; which overlays cover what; the Clock_Line; the Visitor_Hint while selection is on; the Demo_Banner; the word "REST" at the Rest_Zone's centre, in both Skins, as a text node that is not a Target; the Message_Strip; the Spelling_Line; the Alert_Panel lines, CAN'T BREATHE first; the Candlelight_Offer and the Plain look button; and the list of rendered text nodes.
    - The Message_Strip's size, from a pure reducer that holds the text and the time it appeared: 8vmin until 8 s (TUNE) after a new sentence appeared, then 5vmin; 8vmin the whole time while speech is not available; a new sentence restarts the 8 s. Spelled text too long for two lines at the asked size gets the largest size that fits on two lines, and at least 5vmin (13.15). The model gives the strip only its text and its cap height, never a remaining time.
    - The pause message: one at a time, by priority (screen too narrow, paused for care, no input, Face_Out_Of_View, Head_Below_Range, Head_Held_Rolled), shown for at least 2 s and faded over 300 ms by a pure reducer. On a Narrow_Screen it takes the place of the Targets. The paused-for-care message carries the resume time from `timeText` (10.1), fixed when care starts.
    - `activeTargets(...)`: a separate, cheap function that the model also uses and that `src/board/sim-runner.ts` calls on every simulated sample. A Target with any overlay on it is not chargeable, a Target under a shown Confirm_Target is hidden, and the word "REST" is never an active target.
    - Unit tests in `src/board/model.test.ts`; names carry the IDs they check. They cover the strip at 7.9 s and 8.1 s after a sentence, a new sentence restarting the 8 s, speech not available, long spelled text, the care message's time equal to the resume time, and REST present in both Skins and absent from `activeTargets`.
    - _Requirements: 1.3, 1.11, 3.8, 4.3, 4.4, 4.5, 7.8, 7.9, 7.11, 7.12, 8.5, 8.6, 8.8, 8.9, 8.11, 8.12, 10.10, 11.1, 11.2, 11.6, 11.13, 11.15, 13.9, 13.14, 13.15, 14.8, 16.8, 16.10, 16.11, 18.1, 18.7, 21.4_
  - [ ] 10.3 Add the Nurse_Handle and the Nurse_Drawer to the model
    - The handle's notice mark, with text naming each waiting notice and each Urgent_Target with an Unconfirmed_Notice not yet cleared. The drawer: every control from 17.3; Acknowledge enabled and first only during an Alert; Test sound unavailable during an Alert; one Unconfirmed_Notice line per notice, with its Clear control; the resume time while paused for care; the Level controls acting at once; every notice and the disclaimer. The drawer covers no part of CALL, CAN'T BREATHE, YES, NO or either Confirm_Target.
    - Unit tests in `src/board/model.test.ts`; names carry the IDs they check.
    - _Requirements: 2.6, 12.1, 12.4, 17.3, 17.7, 17.9, 17.10, 17.11, 17.12, 18.4, 19.3, 19.5, 21.1_
  - [ ] 10.4 Write the test for Property 1: SAF-1a
    - **Property 1: SAF-1a — urgent targets and a shown confirm are always placed and never covered**
    - In `src/board/model.saf-1.test.ts`: over every Level, Skin, Confirm_Offer, set of active Alerts, open or closed drawer, shown or hidden Candlelight_Offer and pause-message phase, on a Board that is not a Narrow_Screen, CALL, CAN'T BREATHE and any shown Confirm_Target sit at their Layout_Table rectangles, no overlay touches them, and they are chargeable exactly when no Pause holds.
    - _Requirements: 1.7, 1.11, 2.1, 8.11, 11.6, 16.10, 17.7, 23.10_
    - Keep every counterexample fast-check finds as a named regression test beside the property (seed and shrunk input inline), and add a row to docs/evidence/counterexamples.md: seed, input, what broke, the fix.
  - [ ] 10.5 Write the test for Property 10: SAF-8a
    - **Property 10: SAF-8a — one pause message by priority, every pause logged**
    - In `src/board/model.saf-8.test.ts`: over sets of Pause_Reasons, Head_Held_Rolled included, the model shows the highest-priority message or none, with Head_Held_Rolled last, and the narrow-screen message takes the place of the Targets. In `src/log/pause.saf-8.test.ts` (it reads the log, so it lives in `src/log/`): over timelines that turn reasons on and off, screen hidden and Head_Held_Rolled included, the log holds a `pause-start` and a `pause-end` with its time for every change.
    - _Requirements: 3.8, 8.5, 8.6, 8.10, 8.12, 15.3, 18.6_
    - Keep every counterexample fast-check finds as a named regression test beside the property (seed and shrunk input inline), and add a row to docs/evidence/counterexamples.md: seed, input, what broke, the fix.
  - [ ] 10.6 Write the test for Property 12: SAF-10a
    - **Property 12: SAF-10a — the demo banner shows and demo entries are marked**
    - In `src/board/model.saf-10.test.ts`: in every Demo_Session screen state, the model shows "Demo, not the patient." In `src/log/log.saf-10.test.ts`: over streams with mouse or demo input on, every new entry has `demo === true`.
    - _Requirements: 4.4, 15.4, 25.2, 25.3_
    - Keep every counterexample fast-check finds as a named regression test beside the property (seed and shrunk input inline), and add a row to docs/evidence/counterexamples.md: seed, input, what broke, the fix.
  - [ ] 10.7 Write the test for Property 16: ATT-2a
    - **Property 16: ATT-2a — the model carries no countdown or timer**
    - In `src/board/model.att-2.test.ts`: over model states, an active Charge and an active Alert included, the model has no remaining-time or countdown field, and the only Charge value is an arc fraction in [0, 1].
    - Over care pauses started at random times, with ticks during them, the pause message shows the resume time, `timeText` of the press time plus 10 minutes (TUNE), and that time is the same at every tick. Over strip sentences at random ages, the strip carries only its text and a cap height, never the time left at 8vmin.
    - _Requirements: 7.8, 13.14, 18.4, 18.7, 22.3_
    - Keep every counterexample fast-check finds as a named regression test beside the property (seed and shrunk input inline), and add a row to docs/evidence/counterexamples.md: seed, input, what broke, the fix.
  - [ ] 10.8 Write the test for Property 17: ATT-4a
    - **Property 17: ATT-4a — the day and time are on every screen**
    - In `src/board/clock.att-4.test.ts`: over a wide range of times and offsets, `clockText` gives the weekday name, the day, the month as a word and HH:MM; over model states, the Clock_Line is present and not empty, on a Narrow_Screen too.
    - _Requirements: 4.1, 4.2_
    - Keep every counterexample fast-check finds as a named regression test beside the property (seed and shrunk input inline), and add a row to docs/evidence/counterexamples.md: seed, input, what broke, the fix.
  - [ ] 10.9 Write the test for Property 19: SKN-3a
    - **Property 19: SKN-3a — the same words show in both skins**
    - In `src/board/model.skn-3.test.ts`: over model states, the rendered text nodes are the same with Ward and with Candlelight, and both hold the word "REST".
    - _Requirements: 7.11, 16.3, 20.5_
    - Keep every counterexample fast-check finds as a named regression test beside the property (seed and shrunk input inline), and add a row to docs/evidence/counterexamples.md: seed, input, what broke, the fix.
  - [ ] 10.10 Write the test for Property 21: ALR-1a
    - **Property 21: ALR-1a — the chime is a soft two-note pattern, and an alert names itself**
    - In `src/alert/chime.alr-1.test.ts`: the first note is due within 1 s of an Alert start; the pattern has two notes, each at least 250 ms with an attack of at least 50 ms, the second lower than the first, and no train of pulses shorter than 100 ms. In `src/board/alert.alr-1.test.ts` (it reads the model, so it lives in `src/board/`): over which Urgent_Targets start, the Alert_Panel names each one.
    - _Requirements: 11.1, 11.2, 11.3, 11.5_
    - Keep every counterexample fast-check finds as a named regression test beside the property (seed and shrunk input inline), and add a row to docs/evidence/counterexamples.md: seed, input, what broke, the fix.
  - [ ] 10.11 Write the test for Property 22: ALR-2a
    - **Property 22: ALR-2a — every alert screen carries the call-system disclaimer**
    - In `src/board/model.alr-2.test.ts`: over CALL, CAN'T BREATHE and both, the Alert_Panel includes "This board does not replace the hospital's call system." from the Copy_Module.
    - _Requirements: 11.2_
    - Keep every counterexample fast-check finds as a named regression test beside the property (seed and shrunk input inline), and add a row to docs/evidence/counterexamples.md: seed, input, what broke, the fix.
  - [ ] 10.12 Write the test for Property 23: ALR-3a
    - **Property 23: ALR-3a — Acknowledge lives only in the drawer, and alert times are logged**
    - In `src/log/alert.alr-3.test.ts` (it reads the model and the log, so it lives in `src/log/`): over model states, no Target or active target is Acknowledge; over streams that start and acknowledge Alerts, the log holds an `alert-start` and an `alert-ack` with times for each.
    - _Requirements: 11.8, 11.10, 17.10, 15.3_
    - Keep every counterexample fast-check finds as a named regression test beside the property (seed and shrunk input inline), and add a row to docs/evidence/counterexamples.md: seed, input, what broke, the fix.
  - [ ] 10.13 Write the test for Property 24: ALR-4a
    - **Property 24: ALR-4a — Test sound plays once and starts no alert**
    - In `src/alert/chime.alr-4.test.ts`, as a scripted test: pressing Test sound with no Alert schedules one chime at the starting level, logs one `test-sound` entry and starts no Alert; during an Alert the drawer model shows Test sound as unavailable.
    - _Requirements: 12.1, 12.2, 12.3, 12.4_
    - Keep every counterexample fast-check finds as a named regression test beside the property (seed and shrunk input inline), and add a row to docs/evidence/counterexamples.md: seed, input, what broke, the fix.
  - [ ] 10.14 Write the test for Property 27: NEV-2a
    - **Property 27: NEV-2a — the patient's spelled text is carried unchanged**
    - Split by stage, so that each part lives with the latest stage it reads. In each part, strings over A to Z and space are typed through letter, SPACE and DELETE Selections and then SPEAK; for full Unicode, use `fc.string({ unit: 'binary' })` and start from a Spelling_Line that already holds the text, to show that nothing on the way changes it.
    - `src/board/spelling.nev-2.test.ts`: the Message_Strip in the model shows the text unchanged.
    - `src/speech/spelling.nev-2.test.ts`: the speech queue holds the text unchanged, with the Demo_Session flag on or off; when it is on, a separate "Demo." item comes first and the text item is still unchanged.
    - `src/log/spelling.nev-2.test.ts`: the Session_Log holds the text unchanged, with no "Demo." in front of it.
    - _Requirements: 13.12, 13.13, 14.6_
    - Keep every counterexample fast-check finds as a named regression test beside the property (seed and shrunk input inline), and add a row to docs/evidence/counterexamples.md: seed, input, what broke, the fix.

- [ ] 11. Write the simulator, the demo scripts, the simulation runner and the simulation checks
  - [ ] 11.1 Write `src/sim/ghost.ts`
    - A pure simulator: profile, seed, mode (rest or aim), goal pose and time give a head pose, or no pose during a face loss. It applies the range after fatigue loss, tremor, drift, dozing (a roll of the profile's size within 500 ms, with roll-to-yaw and roll-to-pitch coupling of about 0.6 and 0.3, TUNE) and face loss. The same profile, seed, goals and times always give the same poses. It imports only `tracking/pose.ts`, `pointer/clamp.ts` and `sim/pose-types.ts`.
    - Unit tests in `src/sim/ghost.test.ts`: fast-check for determinism, and each profile's behaviour at its stated size and timing. Names start with `SAF-3` for dozing and `SAF-5` for face loss.
    - _Requirements: 6.2, 6.3, 6.4, 6.5_
  - [ ] 11.2 Write `src/sim/demo.ts`
    - Alternates rest and aim over a list of goal poses, never Target ids, and holds each aim long enough to select at the current Dwell_Time.
    - Unit tests in `src/sim/demo.test.ts`.
    - _Requirements: 6.5, 6.6_
  - [ ] 11.3 Write the demo scripts
    - `src/board/demo-script.ts`: a fixed list of Target ids per Level, with no Urgent_Target and no Confirm_Target. Level 3 spells a word from the copy's demo word list, then selects SPEAK.
    - Tests in `src/board/demo-script.test.ts`; names start with `SAF-2`.
    - _Requirements: 6.6_
  - [ ] 11.4 Write `src/board/sim-runner.ts`
    - The simulation runner is a board module. It imports `sim/`, `pointer/`, `selection/` and `board/` only, never `speech/`, `log/` or `alert/`.
    - Turn Target ids into goal poses through the layout and `poseForPosition`. Drive the simulator through the mapper and the smoothing into the engine at 30 Hz (TUNE), with `activeTargets` and the pause-message reducer from the model on every sample, and collect the events.
    - Export `restRun`, `activeUseRun` and `fatigueReachRun`. They take the profiles as arguments, count Accidental_Selections as the glossary defines them (a second Selection of the aimed Target counts), report the median time to select, and count what would be spoken or alerted from the engine's own `speak` and `alert-start` events. Also export the runtime demo pointer for `main.ts`.
    - Nothing on the runner's import path may use Vite-only features (`import.meta.glob`, `?raw`, CSS imports), so that `scripts/dwell-sweep.mjs` can run it in plain Node.
    - Unit tests in `src/board/sim-runner.test.ts`: goals land inside their Targets, and a double fire of the aimed Target counts as accidental.
    - _Requirements: 5.4, 5.7, 6.6, 23.1, 23.2, 23.3_
  - [ ] 11.5 Write the test for Property 2: SAF-1b
    - **Property 2: SAF-1b — the urgent targets stay reachable under small range and fatigue**
    - In `src/board/reach.saf-1.test.ts` (it drives the runner, so it lives in `src/board/`): on every Level, with a small jitter in the aim start, the small-range profile and the fatigue profile after 30 simulated minutes select CALL, then "YES, CALL", then CAN'T BREATHE, then "YES, CAN'T BREATHE", each within 10 s of its aim.
    - _Requirements: 23.3_
    - Keep every counterexample fast-check finds as a named regression test beside the property (seed and shrunk input inline), and add a row to docs/evidence/counterexamples.md: seed, input, what broke, the fix.
  - [ ] 11.6 Write the test for Property 5: SAF-3a
    - **Property 5: SAF-3a — a dropping or rolling head never fires an urgent target**
    - In `src/board/guard.saf-3.test.ts` (it drives the runner, so it lives in `src/board/`): over streams from all six profiles, aimed at the urgent targets, with head drops (8° within 500 ms) and rolls to both sides (10° within 500 ms) added at random times, no Selection of CALL, CAN'T BREATHE or a Confirm_Target has a Charge that began during a drop or roll, or before Head_Still held afterwards.
    - _Requirements: 9.1, 9.2, 9.3, 9.5_
    - Keep every counterexample fast-check finds as a named regression test beside the property (seed and shrunk input inline), and add a row to docs/evidence/counterexamples.md: seed, input, what broke, the fix.
  - [ ] 11.7 Write the test for Property 6: SAF-4a
    - **Property 6: SAF-4a — the rest zone charges nothing**
    - In `src/board/rest-zone.saf-4.test.ts` (it drives the runner and reads the layout, so it lives in `src/board/`): over pointer positions inside the Rest_Zone, with extra weight on the word "REST" at its centre, and over the slow-drift and tremor profiles in rest mode, the Charge is zero at every sample and no Selection happens. `activeTargets` never lists the word "REST", at any Level or Skin.
    - _Requirements: 7.6, 7.11, 7.12, 23.8_
    - Keep every counterexample fast-check finds as a named regression test beside the property (seed and shrunk input inline), and add a row to docs/evidence/counterexamples.md: seed, input, what broke, the fix.
  - [ ] 11.8 Write the simulation runs on every profile
    - In `src/board/simulation-runs.test.ts` (it drives the runner, so it lives in `src/board/`), at the default Dwell_Time and with fixed seeds, for all six profiles at all three Levels:
      - a Rest_Run of 60 simulated minutes in rest mode, which must select nothing, speak nothing and start no Alert, counted from the engine's `selection`, `speak` and `alert-start` events (names start with `SAF-4`). The dozing-roll profile's dozes now also hold the Head_Held_Rolled pause, and its Rest_Runs must still be silent;
      - an Active_Use_Run of 10 simulated minutes in aim mode, aiming in a seeded order at every non-urgent Target of the Level, which reports every Accidental_Selection and must start no Alert without its Confirm_Target having been selected (names start with `SAF-2`).
    - After the runs, print one table with a row per profile: the Accidental_Selections in its Rest_Runs and in its Active_Use_Runs, summed over the three Levels. The sweep in task 12 calls the same functions with the same seeds, so its numbers at the chosen default equal this table.
    - Give each run its own test, with a timeout above Vitest's 5-second default where a run needs it.
    - _Requirements: 8.12, 23.1, 23.2_
  - [ ] 11.9 Write the test for Property 32: SAF-3b
    - **Property 32: SAF-3b — a slowly rolled head held to one side selects nothing**
    - In `src/board/held-roll.saf-3.test.ts` (it drives the runner, so it lives in `src/board/`): over the six profiles in rest mode, on every Level, with slow rolls added that change by less than 10° within any 500 ms, reach at least 10° to either side, and start and are held at random times, the run has no `selection` and no `speak` event, and the Head_Held_Rolled pause holds from 2 s after the roll reached 10° until it is back under 10°.
    - The design expects this property to fail with the starting TUNE values: on the slow ramp across YES or NO, and on a right roll parked on CAN'T BREATHE before the 2 s hold ends (design, "Will SAF-3b pass with the starting values?"). If it fails that way, record the counterexample and stop and ask the user. Don't change the coupling, the held-roll values or the generators to make it pass.
    - _Requirements: 8.12, 8.13, 23.12_
    - Keep every counterexample fast-check finds as a named regression test beside the property (seed and shrunk input inline), and add a row to docs/evidence/counterexamples.md: seed, input, what broke, the fix.

- [ ] 12. Run the dwell experiment and set the default Dwell_Time
  - [ ] 12.1 Write and run the Dwell_Sweep
    - `scripts/dwell-sweep.mjs`, run by `npm run sweep`. It imports the run functions from `src/board/sim-runner.ts` (Node strips the types), reads and validates `src/sim/profiles/*.json` with `node:fs`, and runs Rest_Runs and Active_Use_Runs for all six profiles at all three Levels at 600, 800, 1000, 1200 and 1500 ms, with the seeds of task 11.8.
    - It writes `docs/experiments/dwell-sweep.md` with: a table with one row per profile and candidate, giving the Accidental_Selections in Rest_Runs, the Accidental_Selections in Active_Use_Runs, the Alerts started without their Confirm_Target, and the median time to select; the default it chose by the design's rule (TUNE): the shortest candidate for which every profile has no Accidental_Selection at rest, no Alert without its confirm, a median time to select of 3 s or less, and at most 2 Accidental_Selections per 10 minutes of active use; the reason for the choice; and the per-profile numbers at the chosen default. If no candidate qualifies, the report says so and the default stays 1500 ms.
    - Run `npm run sweep`.
    - _Requirements: 23.4, 23.5_
  - [ ] 12.2 Set the default Dwell_Time from the report
    - Set the engine's default Dwell_Time constant to the value the report chose, and run `npm run check:task` until it is green. Check that the table `src/board/simulation-runs.test.ts` prints equals the report's numbers at that value.
    - Record the value and the reason in requirements.md, in a new "Dwell_Sweep result" note under "Notes and open questions". If the new default turns a test red, stop and ask the user.
    - _Requirements: 7.10, 23.5_

- [ ] 13. Write the address switches
  - [ ] 13.1 Write `src/board/switches.ts`
    - A pure parse of the query string and the profile names into the start config. `?level=1|2|3`, else Level 1. `?skin=ward|candlelight`, with Candlelight only together with `?mouse=1` or a valid `?ghost=`, logged "Candlelight from the address (demo)". `?mouse=1`, which wins over `?ghost=<name>`. An unknown profile name starts with no input and the drawer notice. Unknown switches and values, and `?night=1`, are ignored.
    - The config has no field that could skip a Confirm_Offer, start an Alert or hide the Demo_Banner.
    - _Requirements: 2.5, 5.6, 5.7, 5.8, 5.9, 25.1, 25.2, 25.3, 25.4_
  - [ ] 13.2 Test the switches
    - `src/board/switches.test.ts` with fast-check over arbitrary query strings: nothing throws; unknown switches change nothing; Candlelight starts only in a Demo_Session (name starts with `SKN-2`); `?mouse=1` wins over `?ghost=` (name starts with `SAF-10`); an unknown profile name gives no input and the notice.
    - _Requirements: 2.5, 5.6, 5.7, 5.8, 5.9, 25.1, 25.2, 25.3, 25.4_

- [ ] 14. Build the DOM layer and wire the app
  - [ ] 14.1 Write the skin stylesheets
    - `src/skins/ward.css` and `src/skins/candlelight.css`, with colours only through the custom properties named in `src/skins/tokens.ts`, and no geometry.
    - Ward: high contrast and no decorative motion. Candlelight: dark wood, brass labels, a warm light that drifts within the token limits and stops under `prefers-reduced-motion`, a planchette pointer with the same aiming point as Ward's, and the Charge_Ring as a filling arc of candle-flame light.
    - Both: a heavy, plain sans-serif from the device (weight 600 or more, no font files), no imagery on the topics SKN-4 rules out, and nothing that flashes.
    - The word "REST" in both: the REST token colour, no Target border, no tile and no Charge_Ring, so it never looks like a Target.
    - _Requirements: 7.11, 7.12, 16.2, 16.4, 16.5, 16.6, 16.7, 22.3, 22.5, 24.2_
  - [ ] 14.2 Write the board renderer
    - `src/board/board.dom.ts`, with shared sizes and fades in `src/board/board.css`. It draws the screen model: every Target and Confirm_Target at its rectangle with `data-target="<id>"`; the Charge_Ring as an arc with no numbers; the selected cue (a thick outline and changed text for 1 s); the cap heights (labels 6vmin, Message_Strip at the model's 8vmin or 5vmin on up to two lines, easing between the two over at least 300 ms, Clock_Line 4vmin, reason lines 8vmin, Spelling_Line 5vmin with a caret); the word "REST" at the Rest_Zone's centre with no `data-target`; "YES, CAN'T BREATHE" on two lines, never shrunk or shortened; a fade of at least 300 ms on every screen change; the Narrow_Screen view; the skin's custom properties from `src/skins/tokens.ts`; and the chime state as `data-chime` on the board root, for the end-to-end test.
    - Also here, because only `*.dom.ts` files may touch browser APIs: the frame loop, the visibility and resize listeners, and the first click or key press, which unlocks sound and speech and selects nothing.
    - _Requirements: 1.3, 1.10, 3.8, 4.1, 4.3, 4.4, 4.5, 7.8, 7.9, 7.11, 7.12, 8.6, 8.8, 8.9, 11.1, 11.2, 13.9, 13.14, 13.15, 14.8, 16.11, 16.12, 21.2, 21.3, 21.4, 22.2, 22.3, 22.4, 22.5_
  - [ ] 14.3 Add the Nurse_Handle and the Nurse_Drawer to the renderer
    - In `src/board/board.dom.ts`: the "Nurse menu" handle at a fixed place on the screen edge, with its notice mark and text; click, Enter or Space opens and closes the drawer, and Escape closes it. Every control shows on open, with no sub-menus, is at least 44 × 44 CSS px, has a text label, is reachable with Tab and shows a focus outline. Drawer text is 16 px or larger.
    - No nurse control and no Candlelight_Offer button has a `data-target`. Acknowledge is enabled and first in Tab order only during an Alert. The Demo pointer list shows each profile's name and description. Also: Test sound and its hint, the Unconfirmed_Notice lines with Clear, the resume time while paused for care, every notice and the disclaimer.
    - _Requirements: 3.7, 5.10, 6.7, 11.8, 12.1, 12.2, 12.4, 16.8, 16.9, 16.11, 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7, 17.8, 17.9, 17.10, 17.11, 17.12, 17.13, 18.1, 18.2, 18.4, 19.3_
  - [ ] 14.4 Write `src/pointer/mouse.dom.ts`
    - Sample the latest mouse position at least 20 times per second, whether or not the mouse moves, with no position while it is outside the Board and no head pose. A click on the Board selects nothing.
    - _Requirements: 5.2, 5.3, 5.11_
  - [ ] 14.5 Write `src/board/clock.dom.ts`
    - Refresh the Clock_Line within 1 s of each minute change, with no flash, passing the device's time-zone offset to `clockText`.
    - _Requirements: 4.1, 4.2_
  - [ ] 14.6 Write the wake lock keeper
    - `src/board/wake-lock.ts`: a pure state machine over start, hidden, visible, released, refused, unsupported and granted, which says when to request the lock, whether to show the warning and the handle mark, and when to log a refusal. `src/board/wake-lock.dom.ts`: the adapter over `navigator.wakeLock` and `visibilitychange`.
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_
  - [ ] 14.7 Write the test for Property 11: SAF-9a
    - **Property 11: SAF-9a — the wake lock is requested, re-requested and its refusal surfaced**
    - In `src/board/wake-lock.saf-9.test.ts`, as a scripted test with a fake API: drive `wake-lock.ts` through start, hide, show, release, refuse and succeed events; the requests, the warning, the handle mark and the state machine's "log a refusal" outputs follow the script. The test reads `wake-lock.ts`'s outputs, not `src/log/`, so it stays in `src/board/`.
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_
    - Keep every counterexample fast-check finds as a named regression test beside the property (seed and shrunk input inline), and add a row to docs/evidence/counterexamples.md: seed, input, what broke, the fix.
  - [ ] 14.8 Write `src/speech/speech.dom.ts`
    - Speak the queue from `speech.ts` with `speechSynthesis`, preferring a local English voice, one utterance per `SpeechItem`, so that "Demo." is its own utterance before the sentence in a Demo_Session. For an urgent sentence, cancel and speak at once, the "Demo." item first in a Demo_Session. If speech fails or there is no voice, carry on and report it for the drawer notice; never block a selection.
    - Take the speech object as an argument, so that `src/speech/speech.dom.test.ts` can check the urgent interrupt, the "Demo." utterance and the failure path with a fake. Names start with `SAF-6`, or `SAF-10` for the "Demo." utterance.
    - _Requirements: 13.7, 13.8, 13.10, 13.12, 21.1, 21.2_
  - [ ] 14.9 Write `src/alert/chime.dom.ts`
    - Schedule `chime.ts`'s notes on the `AudioContext` clock, so that the repeat holds in a hidden tab. Create and resume the context on the first gesture, stop within 200 ms of Acknowledge, play Test sound once, and report when sound cannot play.
    - Take the audio context as an argument, so that `src/alert/chime.dom.test.ts` can check the scheduling, the stop and Test sound with a fake. Names start with `ALR-1`.
    - _Requirements: 11.3, 11.4, 11.9, 11.14, 11.15, 12.2, 21.1, 21.2_
  - [ ] 14.10 Wire `index.html` and `src/main.ts`
    - `main.ts` connects the modules and touches no browser API itself. It reads the switches and builds one input source at a time: the mouse, or the demo pointer from `src/board/sim-runner.ts` for the chosen profile. On each frame it steps the engine with `activeTargets`, sends the events to the log, the speech and the chime, rebuilds the model and renders it. It passes the Demo_Session flag to the speech queue, so that demo speech starts with "Demo.".
    - It turns nurse controls into engine inputs and log entries: Level, Pause for care and Resume, Acknowledge, Test sound, the Candlelight offer and its "Use Candlelight" and "Keep the plain look" choices, Plain look, Mouse mode and Demo pointer, and Clear.
    - `index.html` loads nothing from the network and shows no login.
    - _Requirements: 2.5, 2.6, 5.1, 5.6, 5.7, 5.8, 5.9, 5.10, 5.12, 12.3, 13.12, 15.3, 15.4, 16.9, 16.11, 18.3, 18.6, 24.1, 24.2, 25.1, 25.2, 25.3_

- [ ] 15. Checkpoint: run `npm run check:task` and `npm run test:safety`; stop and ask the user if anything is red

- [ ] 16. Write the network scan and the end-to-end tests
  - [ ] 16.1 Write the test for Property 30: NEV-6a
    - **Property 30: NEV-6a — the board makes no network call after load**
    - In `src/nev-6.network-scan.test.ts`: no non-test `.ts` file under `src/`, read with `import.meta.glob(..., { query: '?raw' })`, uses `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource` or a dynamic `import()`. In `e2e/offline.spec.ts`: open `?mouse=1`, go offline once the page has loaded, dwell on YES, and expect "Yes." in the Message_Strip and no request after the load.
    - Run `npm run e2e`. If Playwright's Chromium is missing, stop and ask the user to install it by hand.
    - _Requirements: 24.2, 24.3_
    - Keep every counterexample fast-check finds as a named regression test beside the property (seed and shrunk input inline), and add a row to docs/evidence/counterexamples.md: seed, input, what broke, the fix.
  - [ ] 16.2 Write the judge path
    - `e2e/judge-path.spec.ts`, in mouse mode with no camera: (1) open `?mouse=1`, dwell on YES and expect "Yes." in the Message_Strip; (2) dwell on CALL and then on "YES, CALL", expect the Alert_Panel to name CALL, open the nurse menu, press Acknowledge, and expect the panel to fade out and `data-chime` to read stopped; (3) open `?skin=candlelight&mouse=1` and expect every `[data-target]` rectangle to equal its Ward rectangle. Test names start with `SAF-2`, `ALR-3` and `LAY-1`.
    - Run `npm run e2e`.
    - _Requirements: 1.4, 5.6, 7.1, 7.2, 10.1, 11.1, 11.8, 11.9, 13.1, 16.2, 25.2_

- [ ] 17. Write the README
  - Sections: Setup, Testing, What works today and What doesn't work yet. Keep the License section.
  - Setup: Node 22.18 or later, because `npm run sweep` runs TypeScript files directly; `npm install`; `npm run dev`; then open `http://localhost:5173/?mouse=1`.
  - Testing: mouse mode (`?mouse=1`); a simulated patient with `?ghost=<profile>`, listing the six profile names; `?skin=candlelight`, which works only with mouse mode or a simulated patient; `?level=1`, `2` or `3`; `npm test`; `npm run test:safety`; `npm run sweep` and its report in `docs/experiments/dwell-sweep.md`; `npm run e2e`.
  - What works today: only what the tests and the end-to-end run show. What doesn't work yet: the camera, calibration, the pain flow, Ask mode, the orientation card, the log screen, night mode, the Nurse link, languages other than English, AI suggestions, offline reload, and portrait screens and other screens narrower than 16:10.
  - Follow tone.md: say "simulated patient", never "ghost", except inside the literal switch `?ghost=`; call PLANCHETTE a talking board; include the disclaimer "PLANCHETTE is a prototype. It is not a medical device and does not replace the hospital's call system."; use no words on the topics SKN-4 rules out, and never the trademarked game name. The Testing section must say "mouse mode", which the pre-submit audit checks.
  - _Requirements: 5.6, 5.7, 20.3, 25.1, 25.2_

- [ ] 18. Final review
  - [ ] 18.1 Start the dev server (orchestrator step)
    - Start `npm run dev` as a background process, not a blocking command, and wait until `http://localhost:5173/` loads.
    - _Requirements: 22.6_
  - [ ] 18.2 Audit both skins at all three levels (run by the orchestrator with the a11y-auditor agent)
    - Ask it to audit `?skin=ward&mouse=1` and `?skin=candlelight&mouse=1` (Candlelight from the address needs a Demo_Session) at `?level=1`, `2` and `3`, at its two viewports and at 1280×800, plus one portrait size for the narrow-screen message.
    - The agent never writes files. Save its table verbatim to `.kiro/specs/first-slice/reviews/a11y.md`, and copy its screenshots to `docs/evidence/screenshots/`.
    - _Requirements: 3.6, 3.7, 16.4, 16.6, 17.5, 17.8, 22.1, 22.2, 22.3, 22.5, 22.6_
  - [ ] 18.3 Fix every FAIL from the audit, each in its own sub-task
    - When 18.2 is done, the orchestrator adds one sub-task per FAIL in `reviews/a11y.md` right after this one, numbered 18.4, 18.5 and so on, each naming the check, the element, the measured value and the required value. It renumbers the re-audit and the judge's review to follow them, and updates the Task Dependency Graph.
    - Each fix leaves `npm run check:task` green. If the audit has no FAIL, mark this done.
    - _Requirements: 22.1, 22.2, 22.3, 22.5, 22.6_
  - [ ] 18.4 Re-audit until there are no FAILs (run by the orchestrator with the a11y-auditor agent)
    - Repeat the audit from 18.2 after the fixes. Each new FAIL gets its own fix sub-task in the same way. When no FAIL is left, replace `reviews/a11y.md` with the final table and refresh the screenshots.
    - _Requirements: 22.6_
  - [ ] 18.5 Run the judge's review (run by the orchestrator with the skeptical-judge agent)
    - The agent can only read files, so give it the running slice's evidence: README.md, this spec, `reviews/a11y.md`, the screenshots, `docs/experiments/dwell-sweep.md`, `docs/evidence/counterexamples.md` and the latest `npm run e2e` output.
    - Save its review verbatim to `.kiro/specs/first-slice/reviews/skeptical-judge.md`, then stop the dev server.
    - _Requirements: 22.6, 23.11, 24.3_

## Notes

- Facts the tasks rely on, checked on this machine on 2026-11-27:
  - Node is 26.13. Node runs `.ts` files directly (type stripping, on by default since Node 22.18), so `scripts/dwell-sweep.mjs` can import `src/` modules. They use only erasable syntax (`erasableSyntaxOnly` in tsconfig.json) and import with `.ts` extensions.
  - fast-check is 4.11. It has no `fc.fullUnicodeString`; use `fc.string({ unit: 'binary' })`.
  - There is no `@types/node` and no DOM library for Vitest. Tests in `src/` read files with Vite's `?raw` imports or `import.meta.glob(..., { query: '?raw', import: 'default', eager: true })`, not with `node:fs`. DOM adapters take their browser objects as arguments, so Node tests can pass fakes; the rest of the DOM layer is checked by the end-to-end tests and the final audit.
  - Playwright's Chromium is installed.
  - `scripts/audit.mjs` fails the pre-submit audit if the trademarked talking-board game name appears anywhere outside `scripts/`. Tests build the name from parts.
- Sub-tasks in the same wave write different files. If a test sub-task finds a bug in a source file that another sub-task of its wave also tests, it records the counterexample, and the orchestrator applies the fixes one at a time after the wave.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2"] },
    { "id": 3, "tasks": ["3.1", "3.3", "3.4", "3.5", "3.6", "3.7", "3.8"] },
    { "id": 4, "tasks": ["3.2"] },
    { "id": 5, "tasks": ["3.9"] },
    { "id": 6, "tasks": ["4.1"] },
    { "id": 7, "tasks": ["4.2", "4.3", "4.4", "4.5", "4.6"] },
    { "id": 8, "tasks": ["5.1"] },
    { "id": 9, "tasks": ["5.2", "5.3", "5.4", "5.5"] },
    { "id": 10, "tasks": ["6.1", "6.3"] },
    { "id": 11, "tasks": ["6.2", "6.4"] },
    { "id": 12, "tasks": ["7.1"] },
    { "id": 13, "tasks": ["7.2"] },
    { "id": 14, "tasks": ["7.3"] },
    { "id": 15, "tasks": ["7.4"] },
    { "id": 16, "tasks": ["7.5"] },
    { "id": 17, "tasks": ["7.6"] },
    { "id": 18, "tasks": ["7.7"] },
    { "id": 19, "tasks": ["7.8", "7.10", "7.11"] },
    { "id": 20, "tasks": ["7.9"] },
    { "id": 21, "tasks": ["8"] },
    { "id": 22, "tasks": ["9.1", "9.4", "9.6", "9.7", "9.9"] },
    { "id": 23, "tasks": ["9.2", "9.3", "9.5", "9.8", "9.10"] },
    { "id": 24, "tasks": ["10.1"] },
    { "id": 25, "tasks": ["10.2"] },
    { "id": 26, "tasks": ["10.3"] },
    { "id": 27, "tasks": ["10.4", "10.5", "10.6", "10.7", "10.8", "10.9", "10.10", "10.11", "10.12", "10.13", "10.14"] },
    { "id": 28, "tasks": ["11.1", "11.3"] },
    { "id": 29, "tasks": ["11.2"] },
    { "id": 30, "tasks": ["11.4"] },
    { "id": 31, "tasks": ["11.5", "11.6", "11.7", "11.8", "11.9"] },
    { "id": 32, "tasks": ["12.1"] },
    { "id": 33, "tasks": ["12.2"] },
    { "id": 34, "tasks": ["13.1"] },
    { "id": 35, "tasks": ["13.2"] },
    { "id": 36, "tasks": ["14.1", "14.2", "14.4", "14.5", "14.6", "14.8", "14.9"] },
    { "id": 37, "tasks": ["14.3", "14.7"] },
    { "id": 38, "tasks": ["14.10"] },
    { "id": 39, "tasks": ["15"] },
    { "id": 40, "tasks": ["16.1"] },
    { "id": 41, "tasks": ["16.2"] },
    { "id": 42, "tasks": ["17"] },
    { "id": 43, "tasks": ["18.1"] },
    { "id": 44, "tasks": ["18.2"] },
    { "id": 45, "tasks": ["18.3"] },
    { "id": 46, "tasks": ["18.4"] },
    { "id": 47, "tasks": ["18.5"] }
  ]
}
```
