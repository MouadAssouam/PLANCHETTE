---
inclusion: always
---

# Product: PLANCHETTE

## Problem
Awake ICU patients with a breathing tube can't speak, and many can't use their hands. About half of ventilated patients are alert enough to use a communication aid. Yet in a video study of usual care in two ICUs, no communication board was seen in use: patients nodded, mouthed words and gestured, and more than a third of exchanges about pain failed (Happ et al. 2011). Thirst is the most common and most intense ICU symptom. Sources and caveats: clinical-context.md section 8.

## What PLANCHETTE is
A hands-free talking board that runs in a web browser on a laptop or tablet at the bedside. The patient moves their head; the board spells, answers and speaks for them. A nurse can ask a question from the same screen, and the patient answers on the board.
PLANCHETTE is a prototype. It is not a medical device, not a clinical assessment tool, and not a replacement for the hospital's nurse call system.

## Users
- **Patient:** awake, can't speak, often can't use their hands, lying back at 30–45°. May be weak, drowsy or confused, may lack glasses or hearing aids, may not speak the staff's language.
- **Nurse:** sets it up in under 30 seconds with no login, asks questions, acknowledges alerts, reads and prints the bedside log. Uses mouse and keyboard, often with gloves on.
- **Family:** talks with their person without any training. Every board screen shows one line for visitors: "Ask a yes or no question. Watch the board."

## Core features
1. Calibration to the patient's own range of head movement. One click skips it (a small default range at Level 1); one click in the nurse drawer recalibrates.
2. Smoothed head pointer, tracked on the device with MediaPipe Face Landmarker.
3. Dwell selection with a visible charge ring. No countdowns.
4. A rest zone in the center that selects nothing.
5. Ability levels: 1 = YES / NO / CALL, 2 = needs, 3 = letters. CALL and CAN'T BREATHE sit on every level in the same places, so Level 1 shows YES, NO, CALL and CAN'T BREATHE. Calibration recommends a level; the nurse changes it in one click.
6. Urgent alerts: CALL and CAN'T BREATHE, each behind a confirm step. A confirmed alert names itself on screen and chimes gently, repeating until someone presses Acknowledge in the nurse drawer. Both times go in the log. A Test sound button checks the volume at setup.
7. Pain flow: how much (0–10) → where (body map) → optional what kind. The sentence is spoken right after "where", so PAIN 7, CHEST takes 3 selections; the kind is a follow-up. Every step can be skipped, and BACK fixes a wrong number.
8. Ask mode: the nurse picks a preset question or types one; the patient answers from offered choices, which always include NOT SURE or SOMETHING ELSE, and NOT NOW. The AI service may suggest choices to the nurse, who sends them with one click; without it, local defaults appear within 2 seconds. Choices never change once the patient sees them.
9. Speech output: the patient's selection spoken as a full first-person sentence and shown in the message strip.
10. Wake-up orientation card, always in Ward style: where the patient is, the day and time, and why they can't speak. Shown at start, on every wake from night mode, and after WHERE AM I or WHAT DAY IS IT.
11. Bedside log on the device, printable for handover, cleared after 24 hours. Not a medical record.
12. Pause for care: one click pauses selection during mouth care, suction or turning; it resumes by itself after 10 minutes (TUNE).
13. Mouse mode and the demo pointer ("ghost" in code), for setup, demos, tests and judges without a camera. Never patient input: every screen says "Demo, not the patient", and demo entries are marked and left out of the printed handover.
14. Two skins with identical geometry: Séance (dark wood, brass letters, candlelight) and Ward (high contrast, calm, no motion). Ward is the default.

## Build order
All three levels and every core feature ship by 4 Dec. They are built in four slices, in this order, and each slice is deployed as soon as it is done:
1. The board at all three levels, selection, urgent alerts, speech, both skins, mouse mode and the demo pointer, pause for care.
2. Camera and calibration.
3. Pain flow, Ask mode, orientation card, bedside log.
4. Night mode (NGT-1–4), the Nurse link (clinical-context.md section 6), board labels in more than one language (LNG-1–2), AI suggestions, offline use.

The Nurse link gets its own spec: no database, no accounts, no names. The description and the video show only what is built; anything else is labelled as planned.

## Why the spooky skin earns its place (Costume Contest)
A talking board already works like a head pointer: the planchette glides to a letter and rests there. Séance makes that visible. The pointer is the planchette, the dwell ring is a candle flame filling, the letters are brass. The nurse offers Séance once the patient is alert and oriented, and the patient or family chooses it. Words, speech and safety messages stay plain in every skin.

## Prior art and what is different
Webcam head pointers exist: Camera Mouse (Boston College, a Windows program) and Google's open-source Project Gameface, which uses MediaPipe and clicks with facial gestures such as opening the mouth. Both replace a mouse for general computer use. PLANCHETTE is built for the ICU bed: dwell only, no mouth gestures (a breathing tube rules them out), an ICU vocabulary, safety rules for dozing heads and urgent calls, nurse Ask mode, and nothing to install.

## Out of scope
Eye tracking, blink selection, mouth or lip input, accounts and logins, databases, native apps, multi-bed dashboards, and anything that detects, assesses or diagnoses a clinical state.

## Success measures (TUNE)
Measured with healthy volunteers set up like a patient (clinical-context.md section 7):
- Setup: under 30 s from opening the page to the first selection, calibration included, by a first-time user wearing gloves (stopwatch, median of 5 setups).
- Saying "PAIN 7, CHEST": 3 selections, under 60 s at Level 2 (stopwatch, median of 5 tries).
- Accidental output while resting: no urgent alert and nothing spoken in 60 minutes of rest, waking from a doze included (volunteer sessions plus hour-long ghost runs).

## Deadline
Submissions close 4 Dec 2026 at 2:00 pm Pacific. The demo must stay online and free to test until judging ends on 29 Jan 2027 (judge-criteria.md).
