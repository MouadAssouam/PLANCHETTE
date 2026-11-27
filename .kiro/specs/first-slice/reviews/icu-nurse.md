# ICU nurse review: first-slice requirements
*2026-11-27*

1. **At the bedside:** The patient dwells on CAN'T BREATHE and the head drops before they can hold the confirm target. Req 10.8 closes the offer; Req 10.9/15.1–15.3 log it "not confirmed" in memory only, and there is no log screen until slice 3. From the glass I see only "Head below range. Selection is off." — nothing tells me the patient just reached for CAN'T BREATHE. (This is the spec's own open question 1; my answer is yes, surface it, and louder than the drawer.)
   **Rule:** Req 10.8, 10.9, 15.1–15.3; SAF-2, SAF-8; clinical-context §3 rule 1.
   **Fix:** When a confirm offer closes unconfirmed, raise a notice mark on the Nurse_Handle and a drawer line "Patient reached for CAN'T BREATHE, not confirmed, 03:14." That reports a selection, it does not assess a state (NEV-3 safe). **Severity:** BLOCKER.

2. **At the bedside:** CALL is chiming and the patient now needs CAN'T BREATHE. They select CAN'T BREATHE and a confirm offer opens, but Req 11.6 only guarantees the Alert_Panel covers no part of CALL, CAN'T BREATHE, YES and NO — not the two Confirm_Targets, and Req 10.10 only moves other *Targets*, not the panel. The panel can sit on top of the confirm target, so the patient cannot confirm the more urgent call.
   **Rule:** Req 11.6, 10.1, 10.2, 10.10, 11.13; SAF-1, SAF-2; clinical-context §3 rules 1–2.
   **Fix:** Add both Confirm_Targets to the "Alert_Panel (and Nurse_Drawer, 17.7) covers no part of" list, and require the confirm target to stay visible and chargeable during an active alert. **Severity:** BLOCKER.

3. **At the bedside:** The patient dozes with the head lolled to one side and holds still. Req 9 guards only while the head is moving and releases once Head_Still returns (9.2); there is no pause for a head *held* rolled or parked off-centre, and drift (open question 7) walks the resting pointer off the Rest_Zone. The pointer settles on a need or a letter, dwell-charges, and speaks a sentence while the patient sleeps — breaking "nothing spoken while resting, waking from a doze included."
   **Rule:** Req 9.2–9.3, 8.1, 23.1; SAF-3, SAF-4; clinical-context §3 rule 4; product "Success measures."
   **Fix:** Add a Pause_Reason for a head held in roll beyond a threshold (e.g. roll > 10° sustained > 2 s), mirroring Head_Below_Range for pitch, so a lolled head pauses instead of charging. **Severity:** SHOULD.

4. **At the bedside:** Someone runs mouse mode at an occupied bedside, dwells CAN'T BREATHE and confirms; the board speaks "I can't breathe. Please come now." and plays the real chime. The screen shows "Demo, not the patient" (SAF-10), but the *sound* is identical to a real alert, so a nurse passing the door cannot tell demo from patient and may leave a real patient. (Open question 3; my answer is mark the audio.)
   **Rule:** Req 13.11, 11.3–11.5; SAF-10 (visual mark only), SAF-6; clinical-context §1 nurse ("alerts must be distinct").
   **Fix:** In a Demo_Session, prefix spoken output with "Demo." and make the demo chime clearly distinct (or quieter) from the real alert chime. **Severity:** SHOULD.

5. **At the bedside:** I pause for care to turn the patient; ten minutes pass while I am still turning and Req 18.3 brings selection back by itself. The resume time shows only in the Nurse_Drawer (18.4), which is closed during care, so there is no doorway cue that the board went live again mid-handling, and a long turn outlasts the 10-minute default.
   **Rule:** Req 18.3, 18.4; SAF-5, SAF-8; clinical-context §3 (pause for care), product feature 12.
   **Fix:** Keep auto-resume, but show the resume clock time on the board itself while paused, keep Pause for care one click to re-pause, and raise the default (TUNE) to fit a turn. **Severity:** SHOULD.

6. **At the bedside:** From the isolation-room glass I want to see what the patient said. The Alert_Panel is 8vmin and doorway-readable (11.1), but the Message_Strip is only ≥5vmin (22.2), so a non-urgent need like "I need suction." may be unreadable from the door and I have to gown up and enter to find out.
   **Rule:** Req 13.9, 22.2; clinical-context §1 nurse ("may be outside an isolation room"); accessibility "readable from the doorway."
   **Fix:** Echo the last sentence at doorway size (≥8vmin) for a few seconds on selection, or add a "last said" line in the Nurse_Drawer I can read from the glass. **Severity:** SHOULD.

7. **At the bedside:** A relative finds the glowing Candlelight board unsettling and wants it plain; the patient wants it off but can't click. Req 16.11 does give a one-click "Back to Ward" button on the board (good), but "Ward" is staff jargon and the Visitor_Hint never says the look can be changed, so a frightened visitor may not know what the button does. (Scenario is handled; the wording is the gap.)
   **Rule:** Req 16.11, 16.8, 4.3; clinical-context §1 family ("understandable without training"); tone.md.
   **Fix:** Relabel in plain words, e.g. "Plain look", and keep it visible whenever Candlelight is on. **Severity:** SHOULD.

8. **At the bedside:** A dozing, confused patient, a monitor already alarming nearby; the alert chime rising a step at 30 s and 60 s (11.4) risks becoming loud and startling (no sudden sounds) and blurring into the other alarms. (Open question 2; my answer is keep the rise but bound it.)
   **Rule:** Req 11.4, 11.5; ALR-1, ATT-2; clinical-context §3 rules 11, 24.
   **Fix:** Keep a gentle rise with small steps and no abrupt jump, cap it well below monitor/ventilator loudness, and keep the distinct two-note pattern (11.5). **Severity:** NICE.

9. **At the bedside:** A confused patient needs to know the centre is a safe place that says nothing; the Rest_Zone is shown only as an outline with no word. (Open question 11; my answer is yes, a word helps.)
   **Rule:** Req 7.6, 1.5; clinical-context §3 rule 3.
   **Fix:** Put a single plain word "REST" in the centre, not styled like a Target, no `data-target`, never charged or spoken. **Severity:** NICE.

10. **At the bedside:** The confirm button must read at a glance as "press this to confirm the call." "YES, CALL" and "YES, CAN'T BREATHE" do read as confirmation (the leading YES is what does it), but "YES, CAN'T BREATHE" is long and may wrap or shrink below 6vmin on the button. (Open question 5.)
    **Rule:** Req 10.3, 22.2; accessibility "Text size."
    **Fix:** Keep the wording; size the Confirm_Target so the full label holds ≥6vmin without wrapping. Enlarge the target rather than abbreviate CAN'T BREATHE. **Severity:** NICE.

11. **At the bedside:** LIGHTS → "Please change the lights.", NOISE → "The noise is bothering me.", THE TUBE → "It's about my breathing tube.", CALL → "I need the nurse. Please come." all read plainly, and none decides what the patient meant, so I still have to ask — which is right. (Open question 4; my answer is keep all four.)
    **Rule:** Req 13.5; NEV-2; clinical-context §2 wording.
    **Fix:** Keep all four as written; "Please change the lights." is slightly stiff but no safer reworded. **Severity:** NICE.

Fix these three first: 1, 2, 3.

## What was applied

- Blockers 1 and 2 were applied to requirements.md on 2026-11-27, before the design. See "Changes after the ICU nurse review" in the requirements' notes.
- At task approval the user also adopted items 3, 4, 5, 6, 7 and 9. See "Changes at task approval (2026-11-27)" in the requirements' notes.
  - Item 3, a head held rolled: a pause while the roll stays 10° or more from neutral for 2 s (Head_Held_Rolled; 8.1, 8.5, 8.6, 8.12, 8.13), checked by 23.12. Re_Arm (9.6) stays.
  - Item 4, demo speech: "Demo." is spoken before each demo sentence (13.4, 13.11, 13.12, 13.13). The chime is unchanged.
  - Item 5, care resume time: the board shows "Resumes by itself at 03:22" during pause for care (8.6, 18.1, 18.7). The drawer line (18.4) and the 10-minute default (TUNE) stay.
  - Item 6, doorway size: each new sentence shows at 8vmin or more for 8 s, then at 5vmin or more (13.9, 13.14, 13.15).
  - Item 7, plain words: "Back to Ward" became "Plain look" and "Keep Ward" became "Keep the plain look" (16.8, 16.9, 16.11, 16.13, 17.3).
  - Item 9, REST: the word "REST" at the centre of the Rest_Zone, never charged, selected or spoken (7.11, 7.12, 16.3).
- Item 8 matches the design's small, capped chime rise. Item 10 is the two-line confirm label (design decision 9). Item 11 needed no change.
