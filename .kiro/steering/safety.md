---
inclusion: always
---

# Safety requirements (EARS)

Sources: clinical-context.md sections 3–5, the camera rules, and the icu-nurse review of 2026-11-27. If this file and clinical-context.md disagree, clinical-context.md wins.
Every requirement needs at least one test that names its ID, preferably a fast-check property or a ghost-patient simulation (tech.md). Numbers marked TUNE are starting values.

## Safety and selection
- SAF-1 The system SHALL keep CALL and CAN'T BREATHE reachable in one selection from every screen, at every level, in every skin, and within the patient's range after 30 minutes of the fatigue profile (TUNE).
- SAF-2 WHEN CALL or CAN'T BREATHE is selected, the system SHALL show a confirm target beside it, never in the same spot, SHALL speak and alert nothing until the confirm is selected, and SHALL log an unconfirmed urgent selection as "not confirmed".
- SAF-3 IF the pointer reaches a target as part of a head drop or a sideways roll, THEN the system SHALL NOT fire CALL or CAN'T BREATHE.
- SAF-4 WHILE the pointer is in the rest zone, the system SHALL select nothing and SHALL NOT charge any dwell.
- SAF-5 WHILE the face is lost, the head is below the calibrated range, night mode is asleep, the camera is unavailable, the tab is hidden or the nurse has paused for care, the system SHALL pause selection and SHALL clear partial dwell progress.
- SAF-6 The system SHALL speak only messages the patient selected.
- SAF-7 The system SHALL NOT place CALL, CAN'T BREATHE or SPEAK below the rest zone, where a dropping head lands.
- SAF-8 WHILE selection is paused for any reason other than night mode, the system SHALL show why in plain words readable from the doorway, and SHALL log when the pause starts and ends.
- SAF-9 WHILE the board is running, the system SHALL hold a screen wake lock and request it again whenever the tab becomes visible; IF the browser refuses it, THEN the system SHALL tell the nurse at setup.
- SAF-10 WHILE mouse mode or the demo pointer is on, the system SHALL show "Demo, not the patient" on every screen, SHALL mark every log entry as Demo, and SHALL leave Demo entries out of the printed handover.

## Layout
- LAY-1 The system SHALL give each target the same position across levels, skins and the printed board.
- LAY-2 WHEN calibration finishes, the system SHALL recommend a level (1 YES / NO / CALL plus CAN'T BREATHE, 2 needs, 3 letters). WHEN the nurse picks a level, skips calibration (small default range, Level 1) or recalibrates, the system SHALL do it with one click.
- LAY-3 The system SHALL place the most-used targets nearest the rest zone, and never inside it.

## Attention and delirium
- ATT-1 The system SHALL show one question at a time.
- ATT-2 The system SHALL NOT show countdowns, impose answer time limits, flash, or play sudden sounds.
- ATT-3 WHEN a question is shown, the system SHALL offer NOT SURE or SOMETHING ELSE, and NOT NOW.
- ATT-4 The system SHALL show the day and time on every screen.

## Skins and tone
- SKN-1 WHEN the orientation card is shown, the system SHALL show it in Ward style.
- SKN-2 The system SHALL start in Ward, and SHALL switch to Séance only after the nurse offers it and the patient or family chooses it.
- SKN-3 The system SHALL keep spoken output, the message strip, the orientation card and every safety message plain and literal in every skin.
- SKN-4 The system SHALL NOT include jokes about death, ghosts or spirits in any text the patient or family reads or hears.
- SKN-5 The system SHALL show the orientation card at start and on every wake from night mode, and SHALL switch back to Ward when night mode starts.

## Pain
- PAIN-1 The system SHALL record a pain score only from a number the patient selected, and SHALL NOT infer or fill in a score.
- PAIN-2 The pain flow SHALL be amount (0–10) → location (body map) → optional kind. The sentence SHALL be spoken after the location step, every step SHALL be skippable, and BACK SHALL return to the amount before anything is spoken or logged.
- PAIN-3 WHEN the nurse starts a pain re-check, the system SHALL ask with the approved gentle wording from src/copy/ and SHALL log the answer with its time.

## Night
- NGT-1 WHILE night mode is on, the system SHALL dim the screen to low, warm light.
- NGT-2 WHILE night mode is asleep, the system SHALL show a dim WAKE target where a dropping or rolling head does not land, SHALL charge no other target, and SHALL wake only when the pointer holds still on WAKE for 2 s (TUNE).
- NGT-3 WHILE night mode is asleep, the system SHALL keep CALL and CAN'T BREATHE one wake gesture away.
- NGT-4 WHEN the nurse turns night mode on, the system SHALL check that the face is still tracked at night brightness, and IF it is not, THEN SHALL tell the nurse before night mode starts.

## Alerts
- ALR-1 WHEN CALL or CAN'T BREATHE is confirmed, the system SHALL name which one in words on screen, and SHALL play a chime that is distinct from monitor and ventilator alarms, starts gently and repeats until a caregiver acknowledges it, then stops.
- ALR-2 The system SHALL state on every alert screen that it does not replace the hospital's call system.
- ALR-3 The system SHALL offer Acknowledge only in the nurse drawer, never as a board target, and SHALL log when each alert started and when it was acknowledged.
- ALR-4 WHEN setup finishes, the system SHALL offer a Test sound button that plays the chime once at its starting level.

## Languages
- LNG-1 The system SHALL take board labels from the fixed, human-reviewed translation table, and SHALL NOT machine-translate urgent labels at runtime.
- LNG-2 WHEN free text is AI-translated, the system SHALL show the original text next to the translation.

## Never
- NEV-1 The system SHALL NOT answer medical questions; it SHALL route questions about the patient's condition to staff.
- NEV-2 The system SHALL NOT decide what the patient meant.
- NEV-3 The system SHALL NOT detect, assess or diagnose pain, delirium, sedation level or any other clinical state.
- NEV-4 The system SHALL NOT record, store, upload or log camera frames.
- NEV-5 The system SHALL NOT send the patient's name, the orientation card or the bedside log to the AI service.
- NEV-6 The core board SHALL work with no account, no login and no internet connection.
- NEV-7 The system's own text SHALL NOT describe it with "diagnose", "monitor", "clinical-grade" or "detects pain", or as a medical device (the disclaimer "not a medical device" is allowed), and SHALL NOT use the trademarked talking-board game name.

## AI service
- AI-1 The system SHALL use the AI service only to suggest Ask-mode answer options, suggest word or sentence completions, and translate free text.
- AI-2 The system SHALL show AI-suggested Ask-mode choices to the nurse first and to the patient only after the nurse sends them; it SHALL show every AI suggestion as a choice, and SHALL NOT act on it or speak it unless the patient selects it.
- AI-3 IF the AI service has not answered within 2 seconds, THEN the system SHALL use the local fallback and drop the late answer. Choices on the patient's screen SHALL NOT change once shown.
- AI-4 The system SHALL send only text to the AI service, and SHALL strip names before sending.

## Camera
- CAM-1 The system SHALL make the first camera request of a session only after the nurse presses the camera button, shown with the text "The camera only follows head movement. Nothing is recorded or sent anywhere."
- CAM-2 IF the page is not served over https:// or from localhost, THEN the system SHALL show a calm message with the fix instead of requesting the camera.
- CAM-3 WHEN the camera state is not asked, denied, no camera, busy or lost, the system SHALL show a calm message and a fix for that state; WHILE the camera is lost in a session the nurse started, the system SHALL retry every 5 s (TUNE).
- CAM-4 The system SHALL let the nurse choose which camera to use, and SHALL request 640×480 video (TUNE).
- CAM-5 WHILE the camera is on, the system SHALL show a "camera on" sign.
- CAM-6 The system SHALL show the live preview only during setup and when the nurse presses Adjust camera, never by itself, and never on the orientation card or an alert screen. WHILE tracking is weak, the system SHALL show the words "Tracking is weak. Press Adjust camera."
- CAM-7 End-to-end tests SHALL use Chromium's fake camera with recorded head-movement clips, and face clips SHALL NOT be committed to the public repo.
