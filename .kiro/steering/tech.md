---
inclusion: fileMatch
fileMatchPattern: ["src/**/*.ts", "**/*.test.ts", "src/sim/**"]
---

# Tech

## Stack and why
- **Vite + TypeScript, no UI framework.** The board is a fixed grid, a pointer and a few panels updated on every video frame. Plain TypeScript with small `*.dom.ts` modules keeps the frame loop predictable and the bundle small; a framework would add re-render timing we would have to work around. Revisit only if the nurse drawer grows past a few simple forms.
- **MediaPipe Face Landmarker** (`@mediapipe/tasks-vision`) in the browser: `FilesetResolver.forVisionTasks('/models/wasm')`, then `FaceLandmarker.createFromOptions` with `runningMode: 'VIDEO'`, `numFaces: 1` (enables temporal smoothing), `delegate: 'GPU'` with a CPU fallback, and `outputFacialTransformationMatrixes: true` for head pose. Call `detectForVideo(video, now)` once per new video frame from `requestAnimationFrame`. The model (`face_landmarker.task`) and the WASM files are self-hosted in public/models/; nothing loads from a CDN.
- **Vitest + fast-check** for unit tests and properties; Playwright for end-to-end tests.
- **speechSynthesis** for speech. Prefer a local voice (`localService: true`). If no voice exists, show the sentence large; never block a selection on speech.
- **One serverless function, /api/suggest:** text in, suggestions out. The provider key lives in a server environment variable, never in the client.
- **Hosting:** HTTPS on Vercel (or Netlify), because the camera needs a secure context.
- **Offline PWA:** a service worker caches the app shell, the model and the WASM files, so the core board works with no network. Only /api/suggest needs the network.

## Performance budgets (TUNE)
Measured in a dev overlay with `performance.now()`, on a 5-year-old laptop at 640×480:
- Tracking at ≥ 20 frames per second. Skip a frame rather than queue it.
- Camera frame to pointer paint ≤ 100 ms.
- First load ≤ 3 s on a throttled "Fast 4G" profile; cached reload ≤ 1 s; app code ≤ 150 KB gzipped, model excluded.

## Privacy
- Frames stay in the video element and the GPU. No `toDataURL`, `toBlob` or `getImageData` on camera frames, no MediaRecorder, and no frames or landmarks in logs, errors or network requests. No analytics.
- The bedside log stores selections and times only, in localStorage, and drops entries older than 24 hours on every load and every hour.
- /api/suggest receives text only, with names stripped; the client gives up after 2 s and uses the local fallback.

## Camera handling
- Check `window.isSecureContext` first. Call `getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } })` only after the nurse presses Start camera next to the explanation in tone.md.
- Map errors to states: `NotAllowedError` → denied; `NotFoundError` or `OverconstrainedError` → no camera; `NotReadableError` or `AbortError` → busy; track `ended` → lost. Each state has calm copy and a fix in src/copy/.
- Camera picker from `enumerateDevices()` (labels appear after permission); remember the choice in localStorage.
- Tab hidden (`visibilitychange`) → pause selection. Face missing for more than 500 ms (TUNE) → tracking is weak: pause selection and show the weak-tracking message. The preview never opens by itself; it shows only during setup and when the nurse presses Adjust camera (CAM-6).
- Camera lost in a session the nurse started → retry `getUserMedia` with the same device every 5 s (TUNE), showing the lost message meanwhile (CAM-3).
- Screen wake lock: `navigator.wakeLock.request('screen')` when the board starts, again on `visibilitychange` back to visible; if refused or unsupported, tell the nurse at setup (SAF-9).
- `numFaces: 1` tracks one face only, so a nurse's face close to the patient's may be followed instead; Pause for care covers this until we test it.

## Testing
- **Every requirement in safety.md has a test named with its ID.** Prefer fast-check properties: generate pointer paths, layouts, levels, skins, camera-state sequences and timings, and assert the requirement for all of them. 200 runs by default (TUNE: raise until `npm run check:task` nears 60 s). Print the seed on failure and keep failing seeds as regression cases.
- **Ghost-patient simulations** in src/sim/ drive the pure modules with synthetic head pose over time. Every selection-related safety property runs against all profiles, which together must cover: small range (≤ 10° of turn), tremor (1–3° at 4–8 Hz), slow drift (≤ 2° per minute), fatigue (range shrinks over minutes), dozing (the head drops, or rolls left or right), and the face leaving the frame. All values TUNE until we have volunteer recordings.
- **Ghost profile format** (src/sim/profiles/<name>.json): `name`, `description`, `notes`, `seed`, `rangeDeg { left, right, up, down }`, `tremor { amplitudeDeg, frequencyHz }`, `driftDegPerMin`, `fatigue { rangeLossPctPerMin }`, `dozing { everyMin, durationS, dropDeg, direction: "down" | "left" | "right" }`, `faceLost { everyMin, durationS }`. Zero or null turns a behaviour off. A schema test validates every profile.
- **Test switches** (URL parameters for demos and tests): `?skin=ward|candlelight`, `?level=1|2|3`, `?mouse=1`, `?ghost=<profile>`, `?night=1`. They never skip the orientation card, a confirm step or the camera explanation.
- **End-to-end:** Playwright with Chromium flags `--use-fake-ui-for-media-stream --use-fake-device-for-media-stream --use-file-for-fake-video-capture=<clip>.y4m`. Clips come from consenting volunteers and stay in e2e/clips/ (git-ignored). Without clips, the same flows run in mouse mode and with the ghost pointer.
- `npm run check:task` (typecheck plus all tests) must stay green; the task-gate hook blocks a spec task while it is red.
