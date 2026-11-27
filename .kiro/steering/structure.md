---
inclusion: always
---

# Structure

## Folders
```text
src/
  tracking/     camera, MediaPipe Face Landmarker, head pose per frame. The only module that touches the camera.
  pointer/      calibration and smoothing: head pose → board position.
  selection/    dwell, charge-ring progress, rest zone, confirm step, pause rules.
  board/        target layout (the one source of truth for positions), levels, rendering.
  ask/          nurse Ask mode: the question, answer choices, NOT SURE / SOMETHING ELSE / NOT NOW.
  speech/       speechSynthesis wrapper. Speaks only what the patient selected.
  log/          bedside log: on the device, 24-hour expiry, print view.
  skins/        Séance and Ward: CSS and visuals only, never geometry.
  predict/      word and sentence completion: local first, optional AI suggestions.
  sim/          ghost patients: simulated head movement for demos and tests.
    profiles/   ghost-patient profiles as JSON (format in tech.md).
  copy/         every string a patient, family member or nurse reads or hears, plus the fixed translation tables.
  api/          client for /api/suggest: text only, 2-second timeout, local fallback.
  main.ts       wiring only.
api/            serverless function /api/suggest (Vercel: api/suggest.ts serves /api/suggest).
public/models/  self-hosted MediaPipe model and WASM files.
e2e/            end-to-end tests with Chromium's fake camera. e2e/clips/ is git-ignored.
scripts/        hook scripts: plain Node .mjs files, no dependencies.
docs/           write-up material. kiro-log-raw.md is appended by the turn-log hook.
.kiro/          steering/ (markdown), hooks/ (JSON), agents/ (markdown), specs/.
```

## Rules
- **Pure logic is separate from the DOM.** Only files named `*.dom.ts` may touch `document`, `window`, `navigator`, timers, media, storage or speech APIs. Everything else in src/ is plain TypeScript that runs in Node, so fast-check properties and ghost simulations can drive it.
- **Time is an input.** Pure code takes `now` in milliseconds as a parameter and never reads the clock itself.
- **Data flows one way:** tracking → pointer → selection → board → speech and log. A module never imports from a module later in that chain.
- **Positions live in one place.** src/board/ owns the layout table; skins, levels and the printed board read from it and never move a target.
- **User-facing text lives in src/copy/.** No string a patient, family member or nurse will see or hear is written anywhere else.
- **Targets are findable.** Every board target renders with `data-target="<id>"`, so tests and the a11y-auditor agent can measure it.
- **Tests sit next to the code:** `foo.ts` → `foo.test.ts`. A safety test puts its requirement ID from safety.md in its name.
- **Hooks** are JSON in .kiro/hooks/; their scripts live in scripts/. Each hook command is a single `node scripts/<name>.mjs` or `npm run <script>` call.
- **Installs** are run by hand. No hook installs packages, and a task that needs a new package stops and asks for it.
- **Agents** are markdown files with YAML front matter in .kiro/agents/.
- **Paths:** this folder can be opened through a Windows junction. Compare paths only after resolving both with `fs.realpathSync.native`.
- **Names:** files in kebab-case, types in PascalCase, named exports only in src/.
