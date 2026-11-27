# Requirements Document

## Introduction

This spec covers slice 1 of the build order in product.md: the first version of PLANCHETTE that a judge can drive from start to finish without a camera, in both skins.

The slice contains:
- the board at all three levels, drawn from one layout table;
- one pointer stream, fed by mouse mode or by the demo pointer (a simulated patient, "ghost" in code);
- dwell selection with a charge ring, the rest zone, pause rules, the head-drop guard and the confirm step;
- the urgent flow: confirm, alert screen, gentle repeating chime, Acknowledge in the nurse drawer;
- the message strip, spoken first-person sentences and spelling at Level 3;
- an in-memory session log;
- the screen wake lock and pause for care;
- the Ward and Candlelight skins;
- the nurse drawer;
- the simulation checks that prove the safety rules.

Not in this spec: the camera, calibration, the pain flow, Ask mode, the orientation card, the log screen, night mode, the Nurse link, languages other than English, and AI. In this slice the camera never starts, so every session that has pointer input is a demo session.

PLANCHETTE is a prototype. It is not a medical device and does not replace the hospital's call system.

Numbers marked TUNE are starting values. The default dwell time is chosen by the dwell sweep in Requirement 23. Rule IDs in **Covers** lines refer to .kiro/steering/safety.md. Every safety test names its ID (tech.md).

## Glossary

- **Board**: the patient-facing screen. It shows the Targets of the current Level, the Rest_Zone, the pointer, the Message_Strip, the Clock_Line, the Visitor_Hint and, in a Demo_Session, the Demo_Banner.
- **Shorter_Side**: the shorter of the Board's width and height, in CSS px. Target sizes and gaps are fractions of it (accessibility.md).
- **Board_Unit**: a position on the Board that does not depend on screen pixels. The Layout_Table stores rectangles in Board_Units; the Board converts them to CSS px.
- **Narrow_Screen**: a Board narrower than the Layout_Table needs: less than 160 Board_Units wide at the starting sizes (TUNE). Every portrait screen is a Narrow_Screen, because its width is its Shorter_Side, 100 Board_Units. Added by the design; see Requirement 3.8.
- **Layout_Table**: the one table in src/board/ that gives every Target and Confirm_Target its id, rectangle, usage tier and the Levels that show it. It is the only source of positions.
- **Target**: a selectable rectangle on the Board with an id, a label and an action. Rendered with `data-target="<id>"`.
- **Fixed_Target**: YES, NO, CALL or CAN'T BREATHE. Shown on every Level at the same rectangle.
- **Urgent_Target**: CALL or CAN'T BREATHE.
- **Confirm_Target**: the target shown beside an Urgent_Target after that Urgent_Target is selected. Selecting it starts an Alert.
- **Confirm_Offer**: the state in which a Confirm_Target is shown and waiting.
- **Unconfirmed_Notice**: a notice for the nurse that reports one selection of an Urgent_Target whose Confirm_Offer closed without its Confirm_Target being selected. It names the Urgent_Target and the clock time of that selection, and stays until the nurse clears it. It is not an Alert.
- **Level**: 1 (YES, NO, CALL, CAN'T BREATHE), 2 (adds the needs) or 3 (adds letters, SPACE, DELETE, SPEAK).
- **Rest_Zone**: the area at the center of the Board that selects nothing.
- **Usage_Tier**: a rank in the Layout_Table that orders non-urgent Targets from most used to least used, following clinical-context.md section 2.
- **Pointer_Sample**: one input reading: a time in ms, a Board position or none, a head pose (yaw, pitch and roll in degrees) or none, and its source (mouse or demo pointer).
- **Pointer_Stream**: the time-ordered sequence of Pointer_Samples that the Selection_Engine reads. In this slice its source is Mouse_Mode or the Demo_Pointer. The camera joins it in spec 2.
- **Mouse_Mode**: input from the mouse, turned on by `?mouse=1` or in the Nurse_Drawer. It carries positions and no head pose.
- **Demo_Pointer**: input from the Ghost_Simulator, turned on by `?ghost=<name>` or in the Nurse_Drawer. Nurse-facing text calls it "Demo pointer".
- **Demo_Session**: any time during which Mouse_Mode or the Demo_Pointer is on. In this slice every session with pointer input is a Demo_Session.
- **Ghost_Profile**: a simulated-patient profile in src/sim/profiles/<name>.json, in the format given in tech.md.
- **Ghost_Simulator**: pure code in src/sim/ that turns a Ghost_Profile, a seed and simulated time into head poses.
- **Default_Range**: the head-pose range that the Pointer_Mapper maps to the full Board while calibration does not exist: 10° of yaw to the left and to the right, and 8° of pitch up and down (TUNE). It is the "small default range" that LAY-2 uses when calibration is skipped.
- **Pointer_Mapper**: pure code in src/pointer/ that turns head pose into a Board position using the Default_Range, with smoothing.
- **Selection_Engine**: pure code in src/selection/ that reads the Pointer_Stream and the time, and decides Charge, Selections, Pauses and the Confirm_Offer.
- **Dwell_Time**: how long the pointer must stay on one Target to select it. The default is chosen by the Dwell_Sweep (TUNE; 1500 ms until the sweep has run).
- **Charge**: the time the pointer has spent on the current Target, as a fraction of the Dwell_Time, from 0 to 1.
- **Charge_Ring**: the drawing of the Charge on the Board.
- **Selection**: the event emitted when a Charge reaches 1.
- **Pause**: a state in which the Selection_Engine charges nothing and selects nothing.
- **Pause_Reason**: why a Pause holds. In this slice: face out of view, head below range, head held rolled, screen hidden, no input, paused for care, and screen too narrow (Requirement 3.8). Night mode is added in slice 4, and the camera states in spec 2.
- **Face_Out_Of_View**: the Pointer_Stream from a head-pose source has carried no head pose for more than 500 ms (TUNE).
- **Head_Below_Range**: the head pitch is more than 3° (TUNE) below the lowest pitch of the Default_Range.
- **Head_Held_Rolled**: the head roll has stayed at least 10° (TUNE) from neutral, in either direction, for at least 2 seconds (TUNE). It ends as soon as the roll is back under 10°. Neutral roll is 0° in this slice; calibration sets it in spec 2. It needs a head pose, so it never holds in Mouse_Mode. Added at task approval; see Requirement 8.12.
- **Head_Drop**: in the Pointer_Stream, the head pitch moves downward by 8° (TUNE) or more within any 500 ms (TUNE).
- **Sideways_Roll**: in the Pointer_Stream, the head roll changes by 10° (TUNE) or more, in either direction, within any 500 ms (TUNE).
- **Head_Still**: over the last 1000 ms (TUNE), the head pitch and the head roll have each changed by less than 2° (TUNE).
- **Head_Drop_Guard**: the part of the Selection_Engine that blocks charging during and after a Head_Drop or a Sideways_Roll.
- **Re_Arm**: the state, after a Pause ends or after a Head_Drop or a Sideways_Roll ends, in which the Selection_Engine charges no Target until the pointer has stayed inside the Rest_Zone for the Re_Arm_Time. It makes the pointer pass back through the center before anything charges, so a head waking through the lower Targets, or a head parked rolled over one Target, selects nothing. Added by the design; see Requirement 9.6.
- **Re_Arm_Time**: how long the pointer must stay inside the Rest_Zone to end Re_Arm: 400 ms (TUNE).
- **Alert**: the state that starts when a Confirm_Target is selected and ends when the nurse presses Acknowledge.
- **Alert_Manager**: the code that starts, tracks and ends Alerts.
- **Alert_Panel**: the part of the screen that names the active Alert or Alerts in words while any Alert is active.
- **Chime**: the alert sound, built in code, played through the device speaker.
- **Speech_Output**: the speechSynthesis wrapper in src/speech/. It speaks only what the patient selected.
- **Message_Strip**: the line on the Board that shows the latest sentence.
- **Spelling_Line**: the line on Level 3 that shows the text spelled so far.
- **Session_Log**: the in-memory log module in src/log/. The log screen and storage come in slice 3.
- **Skin**: Ward or Candlelight. A skin changes colour tokens and CSS, never positions or sizes. "Ward" is the skin's name in the specs, the steering files and the code; text that a patient, family member or nurse sees calls it "the plain look" (Requirement 16.13).
- **Skin_Manager**: the code that decides which Skin is shown.
- **Candlelight_Offer**: the panel that appears when the nurse presses Offer Candlelight, where the patient's or the family's choice is entered.
- **Nurse_Drawer**: the nurse's control panel, opened from the Nurse_Handle. It is never a Target.
- **Nurse_Handle**: the always-visible button labelled "Nurse menu" that opens and closes the Nurse_Drawer.
- **Copy_Module**: src/copy/. It holds every string a patient, family member or nurse sees or hears.
- **Clock_Line**: the day, date and time shown on every screen.
- **Visitor_Hint**: the line "Ask a yes or no question. Watch the board."
- **Demo_Banner**: the line "Demo, not the patient."
- **Wake_Lock_Keeper**: the code that holds the screen wake lock.
- **Rest_Run**, **Active_Use_Run**, **Fatigue_Reach_Run**, **Dwell_Sweep**: the simulation checks in Requirement 23.
- **Accidental_Selection**: in a simulation check, any Selection during an aim other than the first Selection of the Target being aimed at. A Selection of any other Target counts, and so does a second or later Selection of the aimed Target, so a dwell that fires the aimed Target twice is counted. In rest mode the Ghost_Simulator aims at no Target, so every Selection in a Rest_Run is an Accidental_Selection.

## Requirements

### Requirement 1: One layout table for every target

**Covers:** LAY-1 (printed board: later slice), LAY-3, SAF-7, SAF-1 (placement part)

**User Story:** As a patient, I want every target to stay where I learned it, so that I can find it again without searching.

#### Acceptance Criteria

1. THE Layout_Table SHALL hold, for every Target and every Confirm_Target, its id, its rectangle in Board_Units, its Usage_Tier and the Levels that show it.
2. THE Layout_Table SHALL give each Target exactly one rectangle, and SHALL take no Level and no Skin as input when it returns that rectangle.
3. THE Board SHALL draw every Target and every Confirm_Target at the rectangle that the Layout_Table gives for it.
4. WHEN the Level or the Skin changes, THE Board SHALL keep every Target that is shown before and after the change at the same on-screen rectangle, within 1 CSS px.
5. THE Layout_Table SHALL place the Rest_Zone at the center of the Board.
6. THE Layout_Table SHALL keep every Target and every Confirm_Target outside the Rest_Zone, with a gap of at least 2% of the Shorter_Side between them and the Rest_Zone.
7. THE Layout_Table SHALL place CALL, CAN'T BREATHE, both Confirm_Targets and SPEAK entirely above the top edge of the Rest_Zone.
8. THE Layout_Table SHALL assign Usage_Tiers in this order: tier 1 YES and NO; tier 2 MOUTH DRY, PAIN, SUCTION and MOVE ME; tier 3 the other Level 2 needs; on Level 3, the letters, SPACE, DELETE and SPEAK share the tier after YES and NO. CALL and CAN'T BREATHE SHALL have no Usage_Tier; Requirements 1.7, 3 and 23.3 place them.
9. FOR each Level, THE Layout_Table SHALL place the center of every Target in a more-used Usage_Tier no farther from the center of the Rest_Zone than the center of any Target in a less-used Usage_Tier on that Level.
10. THE Board SHALL render every Target and every Confirm_Target with a `data-target` attribute equal to its id.
11. WHILE an overlay covers any part of a Target, THE Selection_Engine SHALL hold that Target's Charge at zero and SHALL charge it no further. An overlay is the Alert_Panel, a pause message while it is shown or fading, the Candlelight_Offer, the Nurse_Drawer, or a shown Confirm_Target. This states, as one rule for every overlay, what criteria 8.11, 10.10, 11.6, 16.10 and 17.7 state for single overlays, so that no Target can charge beneath a panel that hides it.

### Requirement 2: Three levels

**Covers:** LAY-2 (the nurse picks a level; calibration and its recommendation: spec 2), SAF-1

**User Story:** As a nurse, I want to choose how many targets the board shows, so that the patient gets targets they can reach.

#### Acceptance Criteria

1. THE Board SHALL show YES, NO, CALL and CAN'T BREATHE on every Level, at the same rectangles.
2. WHILE Level 1 is shown, THE Board SHALL show YES, NO, CALL and CAN'T BREATHE as its only Targets.
3. WHILE Level 2 is shown, THE Board SHALL show the Fixed_Targets and MOUTH DRY, PAIN, SUCTION, MOVE ME, TOO HOT, TOO COLD, TOILET, LIGHTS, NOISE, GLASSES, HEARING AID and THE TUBE.
4. WHILE Level 3 is shown, THE Board SHALL show the Fixed_Targets, the letters A to Z, SPACE, DELETE and SPEAK, and the Spelling_Line.
5. WHEN a session starts without a valid `?level=` switch, THE Board SHALL show Level 1.
6. WHEN the nurse presses a Level control in the Nurse_Drawer, THE Board SHALL show that Level after that single click, with no confirmation step.
7. WHEN the Level changes, THE Selection_Engine SHALL set the Charge to zero.
8. WHEN the Level changes while a Confirm_Offer is open, THE Board SHALL keep the Confirm_Offer open, because the Urgent_Targets and the Confirm_Targets have the same rectangles on every Level.

### Requirement 3: Target size and spacing

**Covers:** SAF-1 (reachable targets); SAF-8 for criterion 8 (the narrow-screen pause is shown and logged). Source: accessibility.md "Target size".

**User Story:** As a patient with small, slow head movements, I want large, well-spaced targets, so that I can hit the one I mean.

#### Acceptance Criteria

1. THE Layout_Table SHALL give each Fixed_Target and each Confirm_Target a smaller side of at least 25% of the Shorter_Side (TUNE).
2. THE Layout_Table SHALL give each Level 2 need a smaller side of at least 15% of the Shorter_Side (TUNE).
3. THE Layout_Table SHALL give each Level 3 letter, SPACE, DELETE and SPEAK a smaller side of at least 9% of the Shorter_Side (TUNE).
4. THE Layout_Table SHALL keep a gap of at least 2% of the Shorter_Side between any two Targets that are shown at the same time, including a Confirm_Target while it is shown.
5. THE Layout_Table SHALL make the Rest_Zone at least 20% of the Shorter_Side across.
6. THE Board SHALL meet criteria 1 to 5 at the viewports 1280×800, 1366×768 and 1920×1080 (TUNE).
7. THE Board SHALL make every nurse control, the Nurse_Handle and every Candlelight_Offer button at least 44 × 44 CSS px.
8. WHILE the Board is a Narrow_Screen, THE Selection_Engine SHALL hold a Pause with the Pause_Reason "screen too narrow", and THE Board SHALL show its pause message in place of the Targets and of any other pause message, keeping the Clock_Line, the Nurse_Handle, the Demo_Banner in a Demo_Session and the Alert_Panel of any active Alert. Starting wording: "Screen too narrow. Selection is off. Turn the screen sideways or use a wider screen." Like every Pause_Reason, its start and end go into the Session_Log (8.10). (Added by the design for portrait and narrow screens, and approved by the user on 2026-11-27; see "Changes after the ICU nurse review" and the design.)

### Requirement 4: What every screen shows

**Covers:** ATT-4, SAF-10 (banner part)

**User Story:** As a patient who may be confused, I want the day and time always in view, and as a visitor I want one line telling me how to use the board, so that nobody has to guess.

#### Acceptance Criteria

1. THE Clock_Line SHALL show the full weekday name, the day of the month, the month as a word, and the time in hours and minutes, on every screen.
2. WHEN the minute changes, THE Clock_Line SHALL show the new time within 1 second, with a change that does not flash.
3. WHILE selection is on, THE Board SHALL show the Visitor_Hint "Ask a yes or no question. Watch the board."
4. WHILE a Demo_Session is on, THE Board SHALL show the Demo_Banner "Demo, not the patient." on every screen: every Level, a Confirm_Offer, an Alert, a Pause, the Candlelight_Offer, and with the Nurse_Drawer open.
5. THE Board SHALL place the Clock_Line, the Visitor_Hint, the Demo_Banner, the Message_Strip and the Spelling_Line outside every Target and Confirm_Target rectangle.

### Requirement 5: One pointer stream from mouse mode or the demo pointer

**Covers:** SAF-10 (what makes a session a demo), SAF-5 (the "camera unavailable" clause, as "no input" in this slice)

**User Story:** As a judge or a nurse without a camera, I want to drive the board with the mouse or watch a simulated patient drive it, so that I can see every feature work.

#### Acceptance Criteria

1. THE Pointer_Stream SHALL carry Pointer_Samples from exactly one source at a time: Mouse_Mode or the Demo_Pointer.
2. WHILE Mouse_Mode is on, THE Pointer_Stream SHALL carry the latest mouse position at least 20 times per second (TUNE), whether or not the mouse moves, with no head pose.
3. WHILE Mouse_Mode is on and the mouse is outside the Board, THE Pointer_Stream SHALL carry samples with no position.
4. WHILE the Demo_Pointer is on, THE Pointer_Stream SHALL carry the head pose from the Ghost_Simulator for the chosen Ghost_Profile, and the Board position that the Pointer_Mapper gives for that pose.
5. THE Pointer_Mapper SHALL map a head pose of 0° yaw and 0° pitch to the center of the Rest_Zone, SHALL map the edges of the Default_Range to the edges of the Board, and SHALL clamp any head pose outside the Default_Range to the Board edge.
6. WHEN the page opens with `?mouse=1`, THE Board SHALL start with Mouse_Mode on.
7. WHEN the page opens with `?ghost=<name>` and a Ghost_Profile with that name exists, THE Board SHALL start with the Demo_Pointer on, using that Ghost_Profile.
8. IF the page opens with both `?mouse=1` and `?ghost=<name>`, THEN THE Board SHALL start with Mouse_Mode on and the Demo_Pointer off.
9. IF the page opens with `?ghost=<name>` and no Ghost_Profile has that name, THEN THE Board SHALL start with no input and THE Nurse_Drawer SHALL show "No demo pointer has that name. Choose one from the list."
10. WHEN the nurse turns Mouse_Mode on in the Nurse_Drawer, THE Board SHALL turn the Demo_Pointer off; WHEN the nurse turns the Demo_Pointer on, THE Board SHALL turn Mouse_Mode off.
11. WHILE Mouse_Mode is on, THE Board SHALL select by dwell only, and a mouse click on the Board SHALL select nothing.
12. WHILE neither Mouse_Mode nor the Demo_Pointer is on, THE Selection_Engine SHALL hold a Pause with the Pause_Reason "no input".

### Requirement 6: Simulated patients

**Covers:** SAF-1 (fatigue clause, with Requirement 23.3); the test inputs for SAF-3, SAF-4 and SAF-5

**User Story:** As a developer, I want reproducible simulated patients, so that every safety rule can be tested against small range, tremor, drift, fatigue, head drops and lost faces.

#### Acceptance Criteria

1. THE Ghost_Profiles in src/sim/profiles/ SHALL use the "Ghost profile format" in tech.md, and a schema test SHALL validate every profile file.
2. THE Ghost_Profiles SHALL be exactly six, with one behaviour each: a small range (10° of turn or less), tremor (1–3° at 4–8 Hz), slow drift (2° per minute or less), fatigue (range that shrinks over minutes), dozing with the head rolling to one side (the tech.md format allows one dozing direction per profile), and the face leaving the frame. The fatigue profile SHALL be the one that Requirement 23.3 uses. Together the six meet tech.md's coverage list, which asks for dozing as "the head drops, or rolls left or right". Head_Drops, and Sideways_Rolls to the left and to the right, are still tested by the fast-check generators for SAF-3 (Requirement 9.5).
3. THE Ghost_Simulator SHALL return the same head poses for the same Ghost_Profile, seed, goals and sample times.
4. THE Ghost_Simulator SHALL offer a rest mode, in which the head stays at its neutral position with the profile's tremor, drift, fatigue, head drops, rolls and face losses applied.
5. THE Ghost_Simulator SHALL offer an aim mode, in which the head moves toward a given goal Target, within the profile's range at that moment, and holds there with the profile's behaviours applied.
6. WHILE the Demo_Pointer is on, THE Ghost_Simulator SHALL alternate rest and aim, aiming only at the Targets in a fixed demo script for the current Level. The scripts SHALL contain no Urgent_Target and no Confirm_Target, and Level 3's script SHALL spell a word from a fixed demo word list and then select SPEAK.
7. THE Nurse_Drawer SHALL show each Ghost_Profile by its name and description, and no text shown to a nurse SHALL contain the word "ghost".

### Requirement 7: Dwell selection and the charge ring

**Covers:** SAF-4, ATT-2 (no countdown)

**User Story:** As a patient who cannot use my hands, I want to select a target by holding the pointer on it with small head movements, so that I can choose without touching anything.

#### Acceptance Criteria

1. WHILE the pointer stays inside one Target that may charge, THE Selection_Engine SHALL grow that Target's Charge in proportion to the elapsed time, whether or not the pointer moves.
2. WHEN a Charge reaches 1, THE Selection_Engine SHALL emit exactly one Selection of that Target and SHALL set the Charge to zero.
3. WHEN the pointer leaves the Target it is charging, THE Selection_Engine SHALL set that Charge to zero. Leaving includes moving onto another Target, into the Rest_Zone, into a gap, or off the Board.
4. THE Selection_Engine SHALL charge at most one Target at a time.
5. WHEN a Selection is emitted, THE Selection_Engine SHALL not charge the selected Target again until the pointer has left that Target.
6. WHILE the pointer is inside the Rest_Zone, THE Selection_Engine SHALL charge no Target and emit no Selection.
7. THE Selection_Engine SHALL run in Node without a browser, and SHALL take the time only from its inputs.
8. THE Charge_Ring SHALL show the Charge as an arc that fills around the Target, with no numbers and no countdown, in both Skins.
9. WHEN a Selection is emitted, THE Board SHALL mark the selected Target with a thick outline and a change in its text for 1 second (TUNE), so that the cue does not rely on colour.
10. THE Selection_Engine SHALL use the Dwell_Time chosen by the Dwell_Sweep (Requirement 23.4 and 23.5), and 1500 ms (TUNE) until the Dwell_Sweep has run.
11. THE Board SHALL show the single word "REST", from the Copy_Module, at the centre of the Rest_Zone in both Skins, with a contrast of at least 4.5:1 against what is behind it (Requirement 22.1, "all other text"). (Added at task approval; nurse review item 9.)
12. THE Board SHALL draw the word "REST" with no Target border, no tile, no Charge_Ring and no `data-target` attribute, and THE Selection_Engine SHALL charge and select nothing because of it, so that it never looks like or acts as a Target. Like every system message, it is never spoken (13.4).

### Requirement 8: Pauses

**Covers:** SAF-5 (night mode: slice 4; camera states: spec 2), SAF-8 (night mode: slice 4), NEV-3, SAF-1 (criterion 11), SAF-3 (criteria 12 and 13: a head held rolled pauses selection)

**User Story:** As a nurse, I want selection to stop whenever the board can't trust its input, and to see why from the doorway, so that nothing is said by accident and I know what to fix.

#### Acceptance Criteria

1. WHILE any Pause_Reason holds, THE Selection_Engine SHALL hold a Pause. The Pause_Reasons are: Face_Out_Of_View, Head_Below_Range, Head_Held_Rolled (criterion 12), screen hidden (the tab is not visible), no input, and paused for care, plus screen too narrow (3.8).
2. WHEN a Pause starts, THE Selection_Engine SHALL set the Charge to zero.
3. WHILE a Pause holds, THE Selection_Engine SHALL charge no Target and emit no Selection.
4. WHILE a head-pose source has carried no head pose for 500 ms (TUNE) or less, THE Selection_Engine SHALL hold the current Charge without growing it.
5. WHILE a Pause holds for any reason other than screen hidden, THE Board SHALL show the message for one Pause_Reason, chosen in this order: paused for care, no input, Face_Out_Of_View, Head_Below_Range, Head_Held_Rolled. (Screen too narrow comes before all of them, 3.8.)
6. THE Board SHALL show each pause message as a reason line with a cap height of at least 8vmin (TUNE), readable from the doorway, followed by "Selection is off." and, where one exists, the fix or the resume time. Starting wording:
   - paused for care: "Paused for care. Selection is off. Resumes by itself at 03:22.", where 03:22 stands for the clock time of the automatic resume (18.7)
   - no input: "No pointer is on. Selection is off. Open the nurse menu and choose Mouse mode or Demo pointer."
   - Face_Out_Of_View: "Face out of view. Selection is off."
   - Head_Below_Range: "Head below range. Selection is off."
   - Head_Held_Rolled: "Head tilted to one side. Selection is off."
7. THE Copy_Module SHALL word every pause message in terms of position or setup, and SHALL name no clinical state such as sleep, sedation or distress.
8. WHILE a pause message is shown, THE Board SHALL keep every Target at its rectangle, and SHALL show the pause message in place of the Visitor_Hint.
9. WHEN a pause message appears or goes, THE Board SHALL fade it over at least 300 ms, and SHALL keep it shown for at least 2 seconds (TUNE), so that a reason that flickers cannot make the screen flash.
10. WHEN a Pause_Reason starts or ends, THE Session_Log SHALL record the reason and the time, including screen hidden, which cannot be shown while the tab is hidden.
11. WHILE a pause message is shown or fading, THE Board SHALL cover no part of CALL, CAN'T BREATHE, YES, NO or the rectangle of either Confirm_Target with it, because the message can stay on screen after the Pause ends (criterion 9), when a Confirm_Offer can open again.
12. WHILE Head_Held_Rolled holds, THE Selection_Engine SHALL hold a Pause with the Pause_Reason Head_Held_Rolled. Like every Pause, it sets the Charge to zero (2), selects nothing (3), is logged when it starts and ends (10), and closes an open Confirm_Offer as not confirmed (10.8); when it ends, Re_Arm applies (9.6). It catches a slow roll that parks the pointer over a Target, which the Sideways_Roll guard (9.1 to 9.3) does not see. (Added at task approval; nurse review item 3.)
13. WHERE the Pointer_Stream carries no head pose (Mouse_Mode), THE Selection_Engine SHALL leave the Pause_Reason Head_Held_Rolled off.

### Requirement 9: Head-drop and roll guard

**Covers:** SAF-3

**User Story:** As a patient who may nod off, I want a falling or rolling head to select nothing, so that no call goes out and nothing is said while I doze.

#### Acceptance Criteria

1. WHEN the Pointer_Stream shows a Head_Drop or a Sideways_Roll, THE Head_Drop_Guard SHALL set the Charge to zero.
2. WHILE a Head_Drop or a Sideways_Roll is in progress, and until Head_Still holds afterwards, THE Head_Drop_Guard SHALL keep every Target from charging.
3. IF the pointer reaches CALL, CAN'T BREATHE, a Confirm_Target or SPEAK during a Head_Drop or a Sideways_Roll, THEN THE Head_Drop_Guard SHALL keep that Target from charging until Head_Still holds, so that its Charge starts from zero after the head is still.
4. WHERE the Pointer_Stream carries no head pose (Mouse_Mode), THE Head_Drop_Guard SHALL leave charging to the rules in Requirements 7 and 8.
5. FOR every Pointer_Stream that contains Head_Drops and Sideways_Rolls at any times, THE Selection_Engine SHALL emit no Selection of CALL, CAN'T BREATHE or a Confirm_Target whose Charge began during a Head_Drop or a Sideways_Roll, or before Head_Still held afterwards.
6. WHEN a Pause ends, or WHEN a Head_Drop or a Sideways_Roll ends, THE Selection_Engine SHALL enter Re_Arm and SHALL charge no Target until the pointer has stayed inside the Rest_Zone for the Re_Arm_Time (400 ms, TUNE). WHERE the Pointer_Stream carries no head pose (Mouse_Mode), only the end of a Pause SHALL start Re_Arm. (Added by the design to make the dozing-roll Rest_Run pass and to stop a waking head from charging the lower Targets, and approved by the user on 2026-11-27; see "Changes after the ICU nurse review" and the design.)

### Requirement 10: Confirm step for CALL and CAN'T BREATHE

**Covers:** SAF-2, ATT-2, SAF-1

**User Story:** As a patient, I want an urgent call to need a second, deliberate choice, so that a call never goes out by accident and I am never rushed to confirm.

#### Acceptance Criteria

1. WHEN CALL or CAN'T BREATHE is selected, THE Selection_Engine SHALL open a Confirm_Offer for that Urgent_Target, and THE Board SHALL show its Confirm_Target at the rectangle that the Layout_Table gives for it.
2. THE Layout_Table SHALL place each Confirm_Target beside its Urgent_Target, with no overlap and a gap of at least 2% of the Shorter_Side.
3. THE Copy_Module SHALL label the Confirm_Targets "YES, CALL" and "YES, CAN'T BREATHE" (starting wording).
4. WHILE a Confirm_Offer is open, THE Speech_Output SHALL speak nothing for the Urgent_Target and THE Alert_Manager SHALL start no Alert for it, until its Confirm_Target is selected.
5. WHEN a Confirm_Target is selected, THE Alert_Manager SHALL start the Alert for its Urgent_Target (Requirement 11).
6. THE Selection_Engine SHALL keep a Confirm_Offer open, with no time limit and no countdown, until its Confirm_Target is selected, another Target is selected, or a Pause starts.
7. WHEN another Target is selected while a Confirm_Offer is open, THE Selection_Engine SHALL close the Confirm_Offer and SHALL carry out the new Selection as usual. IF the new Selection is the other Urgent_Target, THEN THE Selection_Engine SHALL open a Confirm_Offer for that Urgent_Target.
8. WHEN a Pause starts while a Confirm_Offer is open, THE Selection_Engine SHALL close the Confirm_Offer.
9. WHEN a Confirm_Offer closes without its Confirm_Target being selected, THE Session_Log SHALL record the Urgent_Target as "not confirmed", with the time.
10. WHILE a Confirm_Offer is open, THE Board SHALL hide, and THE Selection_Engine SHALL not charge, any Target whose rectangle overlaps the Confirm_Target. THE Board SHALL keep CALL, CAN'T BREATHE, YES and NO shown and selectable.
11. WHEN a Confirm_Offer closes without its Confirm_Target being selected, whether it was for CALL or for CAN'T BREATHE, THE Board SHALL raise a new Unconfirmed_Notice that names the Urgent_Target and the clock time at which that Urgent_Target was selected, and SHALL keep every Unconfirmed_Notice raised before it. Requirement 17.11 and 17.12 show them.
12. WHILE the nurse has not cleared an Unconfirmed_Notice (Requirement 17.13), THE Board SHALL keep that Unconfirmed_Notice through Level changes, Skin changes, Pauses, Alerts and Acknowledge.
13. WHEN an Unconfirmed_Notice is raised, THE Chime SHALL play nothing, THE Speech_Output SHALL speak nothing and THE Alert_Manager SHALL start no Alert because of it, so that nothing is spoken or alerted until a Confirm_Target is selected (SAF-2).

### Requirement 11: Alerts

**Covers:** ALR-1, ALR-2, ALR-3, SKN-2 (alert screen part), SAF-1, SAF-2 (criteria 16 and 17)

**User Story:** As a nurse, I want a confirmed call to name itself on screen and chime gently until I acknowledge it, so that I know what the patient needs and the sound stops when I have answered.

#### Acceptance Criteria

1. WHEN a Confirm_Target is selected, THE Alert_Manager SHALL start an Alert for its Urgent_Target, and THE Board SHALL show the Alert_Panel, which names the Urgent_Target in words ("CALL" or "CAN'T BREATHE") with a cap height of at least 8vmin (TUNE).
2. THE Alert_Panel SHALL show the time the Alert started, "Acknowledge in the nurse menu." and "This board does not replace the hospital's call system." (starting wording).
3. WHEN an Alert starts, THE Chime SHALL play its first chime within 1 second (TUNE) at its starting level, whether or not speech succeeds.
4. WHILE an Alert is active, THE Chime SHALL repeat every 6 seconds (TUNE). IF the Alert is still active after 30 seconds and after 60 seconds (TUNE), THEN THE Chime SHALL rise one step each time, up to a ceiling level (TUNE).
5. THE Chime SHALL be a soft two-note pattern with a gentle attack, defined as data in code, and different from the pulse-burst alarm signals of patient monitors and ventilators. The exact pattern is chosen in the design.
6. WHILE an Alert is active, THE Board SHALL keep CALL, CAN'T BREATHE, YES and NO shown and selectable, and the Alert_Panel SHALL cover no part of CALL, CAN'T BREATHE, YES, NO or the rectangle of either Confirm_Target, whether or not that Confirm_Target is shown.
7. WHILE an Alert is active, THE Skin_Manager SHALL show the whole screen in Ward, whatever Skin was chosen, with every Target at its rectangle.
8. THE Board SHALL offer Acknowledge only in the Nurse_Drawer, and never as a Target.
9. WHEN the nurse presses Acknowledge, THE Alert_Manager SHALL end every active Alert, THE Chime SHALL stop within 200 ms, and THE Board SHALL fade out the Alert_Panel over at least 300 ms.
10. THE Session_Log SHALL record, for each Alert, which Urgent_Target it was for, the time it started and the time it was acknowledged.
11. WHEN an Alert ends in a session whose chosen Skin was Candlelight, THE Skin_Manager SHALL keep Ward until the nurse offers Candlelight again and the patient or family chooses it.
12. WHEN CALL or CAN'T BREATHE is confirmed while an Alert for the same Urgent_Target is active, THE Alert_Manager SHALL keep a single Alert for it, THE Speech_Output SHALL speak its sentence again, and THE Session_Log SHALL record the repeat.
13. WHILE Alerts for both Urgent_Targets are active, THE Alert_Panel SHALL name both, CAN'T BREATHE first.
14. WHILE an Alert is active and the screen is hidden, THE Alert_Manager SHALL keep the Alert active and THE Chime SHALL keep repeating.
15. IF the Chime cannot play, THEN THE Board SHALL still show the Alert_Panel until Acknowledge, and THE Nurse_Handle SHALL show the sound notice in Requirement 21.
16. WHILE an Alert is active, WHEN CALL or CAN'T BREATHE is selected, THE Selection_Engine SHALL open a Confirm_Offer for that Urgent_Target as in Requirement 10, whether it is the other Urgent_Target or the one already alerting (criterion 12).
17. WHILE an Alert is active and a Confirm_Offer is open, THE Board SHALL show its Confirm_Target at its Layout_Table rectangle with no part covered, and THE Selection_Engine SHALL let that Confirm_Target charge under Requirements 7 to 9.

### Requirement 12: Test sound

**Covers:** ALR-4 (in this slice the button lives in the Nurse_Drawer, because there is no setup screen yet)

**User Story:** As a nurse, I want to check that the chime can be heard, so that I can turn the volume up before it matters.

#### Acceptance Criteria

1. WHILE no Alert is active, THE Nurse_Drawer SHALL offer a Test sound control.
2. WHEN the nurse presses Test sound, THE Chime SHALL play once at its starting level, and THE Nurse_Drawer SHALL show "If you did not hear a chime, turn the volume up."
3. WHEN the nurse presses Test sound, THE Alert_Manager SHALL start no Alert, and THE Session_Log SHALL record the test as a test, never as an Alert.
4. WHILE an Alert is active, THE Nurse_Drawer SHALL show the Test sound control as unavailable.

### Requirement 13: Message strip and speech

**Covers:** SAF-6, NEV-2, PAIN-1, SKN-3, SAF-10 (criteria 12 and 13: demo speech starts with "Demo."), ATT-2 (criterion 14: the doorway size is a display time, not a countdown)

**User Story:** As a patient, I want each choice shown and spoken as a full sentence in my voice, so that the person with me never has to guess what I meant.

#### Acceptance Criteria

1. WHEN a Level 1 or Level 2 Target other than an Urgent_Target is selected, THE Message_Strip SHALL show that Target's sentence from the Copy_Module, and THE Speech_Output SHALL speak the same sentence.
2. WHEN a Confirm_Target is selected, THE Message_Strip SHALL show its Urgent_Target's sentence, and THE Speech_Output SHALL speak it.
3. WHEN SPEAK is selected while the Spelling_Line holds text, THE Message_Strip SHALL show that text and THE Speech_Output SHALL speak it, exactly as spelled (Requirement 14).
4. THE Speech_Output SHALL speak only the sentences in criteria 1 to 3 and, in a Demo_Session, the word "Demo." before each of them (criterion 12). "Demo." is the one system word that may be spoken. Other system messages, pause messages, Alert names, the word "REST", letters, SPACE and DELETE SHALL be shown and never spoken.
5. THE Copy_Module SHALL hold these labels and sentences (starting wording, for the icu-nurse review):

   | Target | Sentence |
   |---|---|
   | YES | "Yes." |
   | NO | "No." |
   | CALL (after YES, CALL) | "I need the nurse. Please come." |
   | CAN'T BREATHE (after YES, CAN'T BREATHE) | "I can't breathe. Please come now." |
   | MOUTH DRY | "My mouth is dry." |
   | PAIN | "I'm in pain." |
   | SUCTION | "I need suction." |
   | MOVE ME | "Please move me." |
   | TOO HOT | "I'm too hot." |
   | TOO COLD | "I'm too cold." |
   | TOILET | "I need the toilet." |
   | LIGHTS | "Please change the lights." |
   | NOISE | "The noise is bothering me." |
   | GLASSES | "I need my glasses." |
   | HEARING AID | "I need my hearing aid." |
   | THE TUBE | "It's about my breathing tube." |

6. WHEN PAIN is selected, THE Session_Log SHALL record PAIN with no pain score, and no part of this slice SHALL record, infer or fill in a pain score.
7. THE Speech_Output SHALL speak sentences in the order they were selected. WHEN an Urgent_Target's sentence is due, THE Speech_Output SHALL stop any sentence being spoken, drop the queued ones, and speak the urgent sentence at once.
8. IF speech fails or the device has no voice, THEN THE Message_Strip SHALL still show the sentence, selection SHALL go on without waiting, and THE Nurse_Drawer SHALL show "Speech is not available on this device. Sentences show on screen only."
9. WHILE speech is not available, THE Message_Strip SHALL show each sentence with a cap height of at least 8vmin (TUNE) for as long as the sentence is shown. While speech is available, criterion 14 sets the size.
10. THE Speech_Output SHALL prefer a local English voice.
11. WHILE a Demo_Session is on, THE Message_Strip SHALL show demo selections in the same way as any other selection, and THE Speech_Output SHALL speak them in the same way, with "Demo." first (criterion 12).
12. WHILE a Demo_Session is on, THE Speech_Output SHALL say "Demo." before each sentence it speaks, spelled text included. "Demo." is spoken as its own utterance, so the sentence and any spelled text that follow it are spoken unchanged (14.6). (Added at task approval; nurse review item 4.)
13. WHILE a Demo_Session is on, THE Message_Strip and THE Session_Log SHALL carry each sentence and each spelled text without "Demo." in front of it, because the Demo_Banner already marks the screen and the Demo mark marks the log.
14. WHEN a sentence appears in the Message_Strip while speech is available, THE Message_Strip SHALL show it with a cap height of at least 8vmin (TUNE) for 8 seconds (TUNE), and with a cap height of at least 5vmin after that, so that it can be read from the doorway. The 8 seconds are a display time: nothing on screen counts them (ATT-2). (Added at task approval; nurse review item 6.)
15. IF spelled text does not fit the Message_Strip on two lines at the cap height that criterion 9 or 14 asks for, THEN THE Message_Strip SHALL show it at the largest cap height at which it fits on two lines, and at least 5vmin. (Added at task approval so that 14 can be met for long spelled text.)

### Requirement 14: Spelling at Level 3

**Covers:** NEV-2, SKN-4 (the patient's words are never changed), SAF-6

**User Story:** As a patient who can reach small targets, I want to spell my own words and have them spoken exactly as I spelled them, so that I can say things no target offers.

#### Acceptance Criteria

1. WHEN a letter is selected, THE Spelling_Line SHALL add that letter at the end of its text.
2. WHEN SPACE is selected, THE Spelling_Line SHALL add one space at the end of its text.
3. WHEN DELETE is selected, THE Spelling_Line SHALL remove the last character of its text. WHILE the text is empty, DELETE SHALL change nothing.
4. WHEN SPEAK is selected while the Spelling_Line holds at least one letter, THE Speech_Output SHALL speak the text character for character as the Spelling_Line holds it, THE Session_Log SHALL record it, and THE Spelling_Line SHALL become empty.
5. WHEN SPEAK is selected while the Spelling_Line holds no letter, THE Board SHALL speak nothing, show nothing new and log nothing.
6. THE Speech_Output, the Message_Strip and the Session_Log SHALL carry spelled text with no filtering, correction, completion or change of any kind.
7. WHEN the Level changes, THE Spelling_Line SHALL keep its text, and SHALL show it again when Level 3 returns.
8. THE Board SHALL show the Spelling_Line with a cap height of at least 5vmin (TUNE) and a visible mark where the next letter goes.

### Requirement 15: Session log in memory

**Covers:** SAF-2 (logging "not confirmed"), SAF-8 (pause start and end), SAF-10 (Demo mark), ALR-3 (alert times), PAIN-1, NEV-4 (log part)

**User Story:** As a nurse, I want every selection, alert and pause recorded with its time, so that the log screen in slice 3 can show what happened.

#### Acceptance Criteria

1. THE Session_Log SHALL keep its entries in memory only, and SHALL write nothing to storage or the network in this slice.
2. THE Session_Log SHALL give each entry a time, a kind, what it was about (a Target id, a Pause_Reason, an Alert or spelled text), and a Demo mark.
3. THE Session_Log SHALL record: every Selection; every Urgent_Target selected, confirmed or "not confirmed"; every Alert start and acknowledgement; every Pause_Reason start and end; pause for care on and off, and whether it ended by Resume or by itself; every Level change; every Candlelight offer, choice and return to Ward; every input source turned on or off; every Test sound; every wake lock refusal; and every Unconfirmed_Notice that the nurse clears, with the time it was cleared.
4. WHILE a Demo_Session is on, THE Session_Log SHALL mark every new entry as Demo.
5. THE Session_Log SHALL store no camera frame, no head pose, no landmark and no pain score.

### Requirement 16: Ward and Candlelight

**Covers:** SKN-2, SKN-3, LAY-1 (skins part), ATT-2

**User Story:** As a patient or family member, I want to be offered a warm wooden-board look that I can leave in one click, so that the board can feel less clinical without ever being frightening.

#### Acceptance Criteria

1. THE Skin_Manager SHALL start every session in Ward, except where Requirement 25.2 allows Candlelight from the address in a Demo_Session.
2. THE Skins SHALL change only colour tokens and CSS, and SHALL leave every Target, Confirm_Target, Rest_Zone and text rectangle the same.
3. THE Board SHALL show exactly the same words in both Skins: labels, sentences, the Message_Strip, the Spelling_Line, the Clock_Line, the Visitor_Hint, the Demo_Banner, the word "REST", pause messages, the Alert_Panel and the Nurse_Drawer.
4. WHILE Ward is shown, THE Board SHALL show a plain high-contrast pointer and no decorative motion; only the pointer and the Charge_Ring move.
5. WHILE Candlelight is shown, THE Board SHALL show dark wood, brass-coloured labels, a warm, calm light, a planchette-shaped pointer whose aiming point is the same point as in Ward, and the Charge_Ring drawn as a filling arc of candle-flame light.
6. WHILE Candlelight is shown, THE Board SHALL vary the candle light by no more than 10% in luminance, with a period of at least 3 seconds (TUNE), and SHALL stop that change WHILE the device asks for reduced motion.
7. THE Skins SHALL draw words in a heavy, plain sans-serif with a weight of at least 600, and SHALL use no imagery about the topics that SKN-4 rules out.
8. WHEN the nurse presses Offer Candlelight, THE Board SHALL show the Candlelight_Offer: one plain sentence ("The board can look like dark wood with warm light. The words stay the same.") and two buttons, "Use Candlelight" and "Keep the plain look", for the patient's or the family's choice.
9. WHEN "Use Candlelight" is pressed, THE Skin_Manager SHALL show Candlelight; WHEN "Keep the plain look" is pressed, THE Board SHALL close the Candlelight_Offer and keep Ward.
10. WHILE the Candlelight_Offer is shown, THE Board SHALL keep every Target selectable except those it covers, which SHALL not charge, and SHALL cover no part of CALL, CAN'T BREATHE, YES, NO or the rectangle of either Confirm_Target, whether or not that Confirm_Target is shown.
11. WHILE Candlelight is shown, THE Board SHALL show a "Plain look" button outside every Target and Confirm_Target rectangle, and one click on it SHALL show Ward. THE Nurse_Drawer SHALL offer the same control, also labelled "Plain look".
12. WHEN the Skin changes, THE Board SHALL fade between the Skins over at least 300 ms.
13. THE Copy_Module SHALL call Ward "the plain look" in every string that a patient, family member or nurse sees or hears, and SHALL use the word "Ward" in none of them. (Added at task approval; nurse review item 7.)

### Requirement 17: Nurse drawer

**Covers:** LAY-2 (picking a level), ALR-3, ALR-4, SKN-2 (offer and return to Ward), SAF-9 and SAF-10 (where nurse notices appear), SAF-2, NEV-2 and NEV-3 (the Unconfirmed_Notice, criteria 11 to 14). Source: accessibility.md "Nurse controls", clinical-context.md section 1.

**User Story:** As a nurse wearing gloves, I want every control in one drawer that opens with one click, so that I can change the board in two clicks without the patient ever selecting a nurse control.

#### Acceptance Criteria

1. THE Board SHALL show the Nurse_Handle, labelled "Nurse menu", at a fixed place on the screen edge, outside every Target and Confirm_Target rectangle, on every screen.
2. WHEN the Nurse_Handle is clicked, or focused and activated with Enter or Space, THE Nurse_Drawer SHALL open; WHEN the Nurse_Handle is activated again or Escape is pressed, THE Nurse_Drawer SHALL close.
3. THE Nurse_Drawer SHALL show all of its controls as soon as it opens, with no sub-menus: Level 1, Level 2, Level 3; Offer Candlelight and Plain look; Mouse mode; Demo pointer with the list of Ghost_Profiles; Pause for care or Resume; Acknowledge; Test sound; the notices from Requirements 5.9, 13.8, 19.3 and 21.1, and one line for each Unconfirmed_Notice with its Clear control (criterion 12); and the line "PLANCHETTE is a prototype. It is not a medical device and does not replace the hospital's call system."
4. THE Nurse_Drawer SHALL let the nurse carry out any of its controls with at most two clicks from any screen: one on the Nurse_Handle and one on the control.
5. THE Nurse_Drawer SHALL make every control reachable with the Tab key, give it a text label, and show a visible focus outline with a contrast of at least 3:1.
6. THE Selection_Engine SHALL never charge the Nurse_Handle, a Nurse_Drawer control or a Candlelight_Offer button, and none of them SHALL carry a `data-target` attribute.
7. WHILE the Nurse_Drawer is open, THE Nurse_Drawer SHALL cover no part of CALL, CAN'T BREATHE, the Confirm_Targets, YES or NO, and THE Selection_Engine SHALL not charge any Target that the Nurse_Drawer covers.
8. THE Nurse_Drawer SHALL show its text at 16 CSS px or larger.
9. WHILE a notice from criterion 3 is waiting, THE Nurse_Handle SHALL show a visible notice mark with text, so that the nurse sees it without opening the drawer.
10. WHILE an Alert is active, THE Nurse_Drawer SHALL show Acknowledge enabled and first in the Tab order; WHILE no Alert is active, THE Nurse_Drawer SHALL show Acknowledge as unavailable.
11. WHILE at least one Unconfirmed_Notice has not been cleared, THE Nurse_Handle SHALL show its notice mark with text that names each Urgent_Target that has an Unconfirmed_Notice not yet cleared, so that the nurse can read it without opening the Nurse_Drawer. Starting wording: "CAN'T BREATHE selected, not confirmed" and "CALL selected, not confirmed".
12. WHILE at least one Unconfirmed_Notice has not been cleared, THE Nurse_Drawer SHALL show one line for each such Unconfirmed_Notice, naming its Urgent_Target and the clock time at which that Urgent_Target was selected, with a Clear control beside the line. Starting wording: "CAN'T BREATHE was selected at 03:14 and not confirmed.", "CALL was selected at 03:14 and not confirmed." and "Clear".
13. WHEN the nurse presses the Clear control beside an Unconfirmed_Notice line, THE Nurse_Drawer SHALL clear that Unconfirmed_Notice, and only that one, with no confirmation step.
14. THE Copy_Module SHALL word the Unconfirmed_Notice text on the Nurse_Handle and in the Nurse_Drawer as a report of the selection, its time and the missing confirm only, and SHALL say nothing about what the patient meant or felt and name no clinical state (NEV-2, NEV-3).

### Requirement 18: Pause for care

**Covers:** SAF-5 (pause for care), SAF-8, ATT-2

**User Story:** As a nurse doing mouth care, suction or a turn, I want to stop selection in one click and have it come back by itself, so that my care movements say nothing and I can't forget to turn it back on.

#### Acceptance Criteria

1. WHEN the nurse presses Pause for care, THE Selection_Engine SHALL start a Pause with the Pause_Reason "paused for care", and THE Board SHALL show "Paused for care. Selection is off. Resumes by itself at 03:22.", with the resume time of criterion 7 in place of 03:22.
2. WHEN the nurse presses Resume, THE Selection_Engine SHALL end the "paused for care" Pause_Reason.
3. WHEN 10 minutes (TUNE) have passed since Pause for care was pressed, THE Selection_Engine SHALL end the "paused for care" Pause_Reason by itself.
4. WHILE paused for care, THE Nurse_Drawer SHALL show the clock time at which selection resumes by itself (for example "Resumes by itself at 03:22"), and THE Board SHALL show no countdown and no remaining time.
5. WHILE paused for care, THE Alert_Manager SHALL keep any active Alert active and THE Chime SHALL keep repeating, until Acknowledge.
6. WHEN paused for care ends, THE Session_Log SHALL record whether it ended by Resume or by itself.
7. WHILE paused for care, THE Board SHALL show in the pause message the clock time at which selection resumes by itself (criterion 3), in the Clock_Line's hours-and-minutes format with the seconds dropped, so that the automatic resume happens during the minute shown. The time SHALL stay the same for the whole Pause: it is the time of the resume, never a countdown or a remaining time (ATT-2). (Added at task approval; nurse review item 5. The drawer line in criterion 4 stays.)

### Requirement 19: Screen wake lock

**Covers:** SAF-9 (the warning appears in the Nurse_Drawer and on the Nurse_Handle, because this slice has no setup screen)

**User Story:** As a nurse, I want the screen to stay on all night, or to be told plainly that it may not, so that the board doesn't go dark while the patient needs it.

#### Acceptance Criteria

1. WHEN the Board starts, THE Wake_Lock_Keeper SHALL request a screen wake lock.
2. WHEN the tab becomes visible again, THE Wake_Lock_Keeper SHALL request the screen wake lock again.
3. IF the browser refuses the screen wake lock or does not support it, THEN THE Nurse_Drawer SHALL show "This screen may turn off by itself. Change the power settings so it stays on.", THE Nurse_Handle SHALL show its notice mark, and THE Session_Log SHALL record the refusal.
4. WHEN the browser releases the wake lock while the tab is visible, THE Wake_Lock_Keeper SHALL request it again.
5. WHEN a later request succeeds, THE Nurse_Drawer SHALL remove the notice from criterion 3.

### Requirement 20: Words and where they live

**Covers:** SKN-3, SKN-4, NEV-7, NEV-3, LNG-1 (fixed English labels only), SAF-10

**User Story:** As a patient, family member or nurse, I want every word on the board to be plain, calm and literal, so that nothing confuses or frightens anyone.

#### Acceptance Criteria

1. THE Copy_Module SHALL hold every string that a patient, family member or nurse sees or hears; every rendered text node SHALL come from the Copy_Module, the Clock_Line or the Spelling_Line.
2. THE Copy_Module SHALL follow tone.md: labels upper case and in the patient's voice; system messages calm, literal and short, with no exclamation marks; and no system message that speaks as "I".
3. A wording test SHALL check every Copy_Module string, and every Ghost_Profile name and description that the Nurse_Drawer can show, against the topics SKN-4 rules out, the word "ghost", the words NEV-7 rules out (allowing "not a medical device") and the trademarked board-game name.
4. THE wording test SHALL not apply to text the patient spells.
5. THE Copy_Module SHALL return the same strings for both Skins, and SHALL take no Skin as input.
6. THE Copy_Module SHALL hold the board labels as a fixed, human-reviewed English table, and THE Board SHALL translate nothing at runtime.

### Requirement 21: Sound and speech readiness

**Covers:** ALR-1 (the chime must be able to play), SAF-6 (a speech failure never blocks)

**User Story:** As a judge or a nurse, I want to know when the browser is holding back sound, so that a silent chime or silent speech is never a surprise.

#### Acceptance Criteria

1. IF the browser blocks sound or speech until someone interacts with the page, THEN THE Nurse_Handle SHALL show its notice mark and THE Nurse_Drawer SHALL show "Sound is off until someone clicks this page. Click anywhere to turn it on."
2. WHEN someone clicks or presses a key anywhere on the page, THE Board SHALL enable the Chime and the Speech_Output and SHALL remove the notice in criterion 1.
3. WHEN a click enables sound, THE Selection_Engine SHALL select nothing because of that click.
4. WHILE sound is blocked, THE Board SHALL still show every Alert_Panel and every sentence in the Message_Strip.

### Requirement 22: Contrast, text size and motion

**Covers:** ATT-2, SKN-3. Source: accessibility.md.

**User Story:** As a patient lying back without glasses, I want text I can read from 1–1.5 m and a screen that never flashes, so that I can use the board when I am tired or confused.

#### Acceptance Criteria

1. A contrast test over each Skin's colour tokens SHALL compute the WCAG relative-luminance contrast ratio and SHALL require at least 7:1 for board labels and the Message_Strip, at least 4.5:1 for all other text, and at least 3:1 for the pointer, the Charge_Ring, focus outlines and Target borders, each against what is behind it.
2. THE Board SHALL show board labels with a cap height of at least 6vmin (TUNE), the Message_Strip at least 5vmin, the Clock_Line at least 4vmin, and the reason line of pause messages and the Alert_Panel at least 8vmin (TUNE).
3. THE Board SHALL show nothing that flashes, blinks or strobes, and no countdown, in either Skin.
4. WHEN a screen changes (a Level, a Skin, a Confirm_Offer, an Alert_Panel, a pause message, the Candlelight_Offer or the Nurse_Drawer), THE Board SHALL fade the change over at least 300 ms (TUNE).
5. THE Board SHALL give every state a cue besides colour: the Charge_Ring fills as an arc, a selected Target gets a thick outline and a text change, and the Urgent_Targets have their own positions and labels.
6. THE Board SHALL stay readable, with every state distinguishable, in a greyscale screenshot of each Skin at each Level.

### Requirement 23: Simulation checks

**Covers:** SAF-1, SAF-2, SAF-3, SAF-4, SAF-5, SAF-6. Source: product.md "Success measures", tech.md "Testing".

**User Story:** As the team, I want long simulated sessions on every simulated patient, so that we know the board says nothing by accident before a volunteer ever uses it.

#### Acceptance Criteria

1. FOR every Ghost_Profile and every Level, a Rest_Run of 60 simulated minutes in rest mode, at the default Dwell_Time, SHALL produce no Selection, no speech and no Alert.
2. FOR every Ghost_Profile and every Level, an Active_Use_Run of 10 simulated minutes in aim mode, aiming only at non-urgent Targets, SHALL report every Accidental_Selection (any Selection of a Target other than the one being aimed at), and SHALL start no Alert without its Confirm_Target having been selected.
3. FOR the fatigue Ghost_Profile, after 30 simulated minutes (TUNE) of its fatigue, a Fatigue_Reach_Run under the Default_Range SHALL select CALL and then YES, CALL within 10 seconds (TUNE) of aiming at each, and SHALL do the same for CAN'T BREATHE and YES, CAN'T BREATHE, at every Level.
4. THE Dwell_Sweep SHALL run Rest_Runs and Active_Use_Runs on every Ghost_Profile at each candidate Dwell_Time of 600, 800, 1000, 1200 and 1500 ms (TUNE), and SHALL write the results to `docs/experiments/dwell-sweep.md` as a table with one row per Ghost_Profile and candidate, giving: the Accidental_Selections in Rest_Runs, the Accidental_Selections in Active_Use_Runs, the Alerts started without their Confirm_Target having been selected, and the median time to select in Active_Use_Runs.
5. THE Dwell_Sweep SHALL choose as the default Dwell_Time the shortest candidate whose rows show, for every Ghost_Profile: no Accidental_Selection in any Rest_Run, no Alert started without its Confirm_Target having been selected, a median time to select of 3 seconds or less (TUNE), and no more Accidental_Selections per 10 minutes of active use than a limit chosen in the design (TUNE). THE Dwell_Sweep SHALL state the chosen default and the reason for it in the report. IF no candidate meets this rule, THEN THE Dwell_Sweep SHALL say so in the report and SHALL leave the default Dwell_Time at 1500 ms.
6. FOR every generated Pointer_Stream, every Alert start SHALL follow a Selection of its Urgent_Target and then a Selection of that Urgent_Target's Confirm_Target, with no other Selection and no Pause in between (SAF-2).
7. FOR every generated Pointer_Stream, the list of spoken sentences SHALL equal, in order, the sentences of the Selections that Requirement 13.1 to 13.3 names (SAF-6).
8. FOR every generated Pointer_Stream that stays inside the Rest_Zone, THE Selection_Engine SHALL charge nothing and select nothing (SAF-4).
9. FOR every generated sequence of Pause_Reasons at random times, the Charge SHALL be zero at the start of each Pause, and no Selection SHALL occur while a Pause holds (SAF-5).
10. FOR every generated Level, Skin, open Confirm_Offer for either Urgent_Target, active Alert for either or both Urgent_Targets, open Nurse_Drawer, shown Candlelight_Offer and shown or fading pause message, THE Board SHALL show CALL, CAN'T BREATHE and any shown Confirm_Target at their Layout_Table rectangles, uncovered and able to charge whenever no Pause holds (SAF-1, SAF-2).
11. THE fast-check properties SHALL run at least 100 times each (200 by default, as in tech.md), SHALL print the seed on failure, and SHALL carry the safety.md ID in the test name.
12. FOR every generated Pointer_Stream in rest mode that adds slow rolls, which change the roll by less than the Sideways_Roll size within any 500 ms, reach at least the Head_Held_Rolled size in either direction, and start and are held at random times, THE Selection_Engine SHALL emit no Selection and no speech (SAF-3, SAF-4). (Added at task approval with 8.12. The design expects the starting TUNE values to fail this check; see "Changes at task approval".)

### Requirement 24: No account and no network

**Covers:** NEV-6 (offline reload with a service worker: slice 4)

**User Story:** As a nurse, I want the board to work with no login and no internet, so that setup takes seconds and a network outage changes nothing.

#### Acceptance Criteria

1. THE Board SHALL show no account, sign-in or login screen.
2. WHEN the page has loaded, THE Board SHALL make no network request; fonts, images and sounds SHALL come with the app or from the device.
3. WHILE the network is disconnected after the page has loaded, THE Board SHALL carry out every requirement in this spec.

### Requirement 25: Address switches for demos and tests

**Covers:** SKN-2 (the `?skin=candlelight` exception), SAF-10, SAF-2

**User Story:** As a judge, I want a link that opens the board at a chosen level, skin and input, so that I can see each part without setting it up by hand.

#### Acceptance Criteria

1. THE Board SHALL read the switches `?level=1|2|3`, `?skin=ward|candlelight`, `?mouse=1` and `?ghost=<name>` when the page opens, and SHALL ignore unknown switches and unknown values.
2. WHERE `?skin=candlelight` is given together with `?mouse=1` or a valid `?ghost=<name>`, THE Skin_Manager SHALL start in Candlelight, and THE Session_Log SHALL record "Candlelight from the address (demo)". WHERE `?skin=candlelight` is given without either, THE Skin_Manager SHALL start in Ward.
3. THE switches SHALL skip no Confirm_Offer, start no Alert and hide no Demo_Banner.
4. THE Board SHALL ignore `?night=1` in this slice, because night mode comes in slice 4.

## Coverage

| safety.md ID | Requirements | Status | Why |
|---|---|---|---|
| SAF-1 | 1, 2, 3, 4, 8, 10, 11, 16, 17, 23 | In scope | The fatigue clause uses the Default_Range, because calibration comes in spec 2 (23.3). No panel, line or button covers CALL, CAN'T BREATHE or a Confirm_Target (4.5, 8.11, 11.6, 16.10, 16.11, 17.7); 23.10 checks it. |
| SAF-2 | 10, 11, 15, 17, 23 | In scope | An unconfirmed urgent selection is shown to the nurse, with no sound and no speech, until the nurse clears it (10.11 to 10.13, 17.11 to 17.14). During an Alert, a Confirm_Offer still opens and stays uncovered (11.16, 11.17). |
| SAF-3 | 8, 9, 23 | In scope | Mouse mode carries no head pose, so only demo-pointer input is guarded. A head held rolled pauses selection (8.12, 8.13); 23.12 checks slow rolls in rest mode. A slow roll smaller than 10° is not caught (see "Changes at task approval"). |
| SAF-4 | 7, 23 | In scope | The Rest_Zone shows the word REST, which never charges (7.11, 7.12). |
| SAF-5 | 5, 8, 18, 23 | Partly | Night mode asleep: slice 4. "Camera unavailable" is "no input" in this slice; the camera states: spec 2. Head_Held_Rolled is one more Pause_Reason (8.12). |
| SAF-6 | 13, 14, 21, 23 | In scope | "Demo." is the one system word that may be spoken, and only in a Demo_Session (13.4, 13.12). |
| SAF-7 | 1 | In scope | Extended to the Confirm_Targets. |
| SAF-8 | 3, 8, 15, 18 | Partly | Night mode, the exception in SAF-8, comes in slice 4. The narrow-screen pause (3.8) and the held-roll pause (8.12) are shown and logged like the others. The paused-for-care message shows the resume time (18.7). When a Pause closes a Confirm_Offer, the Nurse_Handle also names the Urgent_Target that was not confirmed (10.11, 17.11). |
| SAF-9 | 17, 19 | In scope | The warning shows in the Nurse_Drawer and on the Nurse_Handle, because there is no setup screen yet. |
| SAF-10 | 4, 5, 13, 15, 25 | Partly | The banner and the Demo mark are in scope. Demo speech also starts with "Demo." (13.12, 13.13). Leaving Demo entries out of the printed handover: slice 3 (no print view yet). |
| LAY-1 | 1, 16 | Partly | The printed board comes in a later slice; it will read the same Layout_Table. |
| LAY-2 | 2, 17 | Partly | Picking a level in one click is in scope. The level recommendation, skipping calibration and recalibrating: spec 2. |
| LAY-3 | 1 | In scope | Urgent_Targets have no Usage_Tier; safety rules place them. |
| ATT-1 | none | Out of scope | No question is shown in this slice. Ask mode: slice 3. |
| ATT-2 | 7, 8, 10, 13, 16, 18, 22 | In scope | The care resume time is a clock time (18.7), and the doorway-size sentence lasts a display time (13.14); neither counts down. |
| ATT-3 | none | Out of scope | No question is shown in this slice. Ask mode: slice 3. |
| ATT-4 | 4 | In scope | |
| SKN-1 | none | Out of scope | Orientation card: slice 3. |
| SKN-2 | 11, 16, 17, 25 | Partly | The orientation card and night mode parts: slices 3 and 4. Text calls Ward "the plain look" (16.8, 16.11, 16.13). |
| SKN-3 | 13, 16, 20, 22 | Partly | The orientation card part: slice 3. |
| SKN-4 | 14, 16, 20 | In scope | |
| SKN-5 | none | Out of scope | Orientation card: slice 3. Night mode: slice 4. |
| PAIN-1 | 13, 15 | Partly | PAIN records no score. The pain flow: slice 3. |
| PAIN-2 | none | Out of scope | Pain flow: slice 3. |
| PAIN-3 | none | Out of scope | Pain re-check: slice 3. |
| NGT-1 to NGT-4 | none | Out of scope | Night mode: slice 4. |
| ALR-1 | 11, 21 | In scope | |
| ALR-2 | 11 | In scope | |
| ALR-3 | 11, 15, 17 | In scope | The times are recorded now; the log screen comes in slice 3. |
| ALR-4 | 12, 17 | Partly | Test sound lives in the Nurse_Drawer. Offering it when setup finishes: spec 2, which adds the setup screen. |
| LNG-1 | 20 | Partly | Labels come from a fixed English table. Other languages: slice 4. |
| LNG-2 | none | Out of scope | AI translation: slice 4. |
| NEV-1 | none | Out of scope | Nothing in this slice answers a question. |
| NEV-2 | 13, 14, 17 | In scope | |
| NEV-3 | 8, 17, 20 | In scope | |
| NEV-4 | 15 | Partly | The Session_Log stores no frame, pose or landmark. The camera: spec 2. |
| NEV-5 | none | Out of scope | No AI service in this slice. |
| NEV-6 | 24 | Partly | No account and no runtime network use are in scope. Reloading offline with a service worker: slice 4. |
| NEV-7 | 20 | In scope | |
| AI-1 to AI-4 | none | Out of scope | AI service: slice 4. |
| CAM-1 to CAM-7 | none | Out of scope | Camera: spec 2. |

## Notes and open questions

### Conflicts and ambiguities between the scope and the steering files

1. **DELETE instead of BACK.** clinical-context.md section 2 lists BACK for letters; the scope asks for DELETE, and this spec uses DELETE. DELETE removes the last letter; BACK in the pain flow (PAIN-2, slice 3) goes back a step, so two words keep two actions apart. Suggest adding DELETE to clinical-context.md section 2. If clinical-context.md must win, rename DELETE to BACK; no other requirement changes.
2. **No numbers on Level 3.** clinical-context.md section 2 lists 0–10 with the letters. This slice has none, so a Level 3 patient cannot spell a number yet. The numbers arrive with the pain flow in slice 3.
3. **"Every selection is spoken."** The scope says every selection is spoken; SAF-6 and SAF-2 narrow it. Letters, SPACE and DELETE are shown, not spoken; the spelled text is spoken on SPEAK. CALL and CAN'T BREATHE are spoken only after their confirm.
4. **YES and NO on every level.** product.md says "2 = needs, 3 = letters" and only promises CALL and CAN'T BREATHE on every level. This spec keeps YES and NO on every level too, at the same place, because the Visitor_Hint on every board screen asks visitors for yes or no questions. Without YES and NO, a Level 2 patient could not answer one.
5. **Level 3 has no needs.** The scope gives Level 3 letters, SPACE, DELETE and SPEAK only. A Level 3 patient must spell MOUTH DRY (10 selections) or be moved to Level 2, which works against "fewer selections always wins" (clinical-context.md section 1). Open question: put the tier 2 needs on Level 3 too, if the geometry allows.
6. **`?skin=candlelight` and SKN-2.** SKN-2 says the board starts in Ward and shows Candlelight only after the nurse offers it. This spec honours `?skin=candlelight` only in a Demo_Session (with `?mouse=1` or a valid `?ghost=`), logs it, and keeps every other Candlelight rule. In spec 2, a session with camera input must always start in Ward.
7. **SAF-1 "every screen" and SAF-5.** Read as every screen on which selection is on. During a Pause nothing can be selected (SAF-5); CALL and CAN'T BREATHE stay at their rectangles and can charge again as soon as the Pause ends.
8. **SAF-3 is stricter here.** SAF-3 protects only CALL and CAN'T BREATHE. The Head_Drop_Guard here blocks every Target during and after a Head_Drop or a Sideways_Roll, so that product.md's measure ("nothing spoken while resting, waking from a doze included") can hold.
9. **SAF-7 is wider here.** SAF-7 names CALL, CAN'T BREATHE and SPEAK. The Confirm_Targets are added, because selecting one starts an Alert (clinical-context.md rule 6, high-consequence targets). "Below the rest zone" is read strictly: these targets sit entirely above the top edge of the Rest_Zone.
10. **SAF-9 "at setup" and ALR-4 "when setup finishes".** There is no setup screen in this slice. The wake lock warning shows in the Nurse_Drawer with a notice mark on the Nurse_Handle, and Test sound lives in the Nurse_Drawer. Spec 2's setup screen should show both at the end of setup.
11. **LAY-2 "one click".** Read as: the level control acts on one click, with no confirmation, once the Nurse_Drawer is open. That is two clicks from the board, matching the two-click rule in clinical-context.md section 1.
12. **Charge ring in Candlelight.** The scope asks for "the charge ring drawn as a candle flame filling"; accessibility.md says "the charge ring fills as an arc". In Candlelight the ring stays a filling arc, drawn in candle-flame light, so the shape cue is the same in both skins.
13. **Visitor_Hint during a Pause.** product.md says every board screen shows the Visitor_Hint. This spec replaces it with the pause message while a Pause holds, because the board cannot answer then. Open question for the icu-nurse review.
14. **"ghost" in the address.** tone.md says nurses never see the word, but tech.md's switch `?ghost=<name>` shows in the address bar. Kept as tech.md defines it. Suggest an alias such as `?demo=<name>` later.
15. **`?night=1`.** tech.md lists it as a test switch. It is ignored in this slice.

### Decisions on the 14 points

1. **IDs in scope.** All IDs the scope lists are covered (see Coverage). Also touched: LNG-1 (labels from a fixed English table, no runtime translation) and NEV-4 (the Session_Log stores no frame, pose or landmark). ATT-1 and ATT-3 do not apply: no question is shown. The confirm step is a labelled target, not a question, and the Candlelight_Offer is a pair of mouse buttons for the patient's or the family's choice, not a board question.
2. **SAF-1 fatigue clause.** The Pointer_Mapper uses the Default_Range (10° yaw each way, 8° pitch up and down, TUNE). The Fatigue_Reach_Run (23.3) aims the fatigue profile at CALL, CAN'T BREATHE and both Confirm_Targets after 30 simulated minutes, at every Level. The result depends on the profile's loss rate and the Default_Range, both TUNE. In spec 2 the run should use the calibrated range.
3. **When the confirm offer ends.** It ends when the Confirm_Target is selected (Alert), when another Target is selected (that selection happens; the urgent one is logged "not confirmed"), or when a Pause starts (logged "not confirmed"). It never ends on time, on resting in the Rest_Zone, or on a Level or Skin change. Trade-off: closing on a Pause costs one extra selection after the Pause, but no confirm target waits through a doze for a waking movement to land on it.
4. **Head drop and roll.** Defined from the head pose in the Pointer_Stream: a Head_Drop is a pitch fall of 8° or more within 500 ms; a Sideways_Roll is a roll change of 10° or more within 500 ms; Head_Still is less than 2° of pitch and roll change over 1000 ms (all TUNE). The guard clears the Charge and blocks every Target until Head_Still holds. Samples without head pose (Mouse_Mode) are not guarded.
5. **`?skin=candlelight`.** See conflict 6.
6. **Alert in a Candlelight session.** While any Alert is active, the whole screen is Ward, with every Target in place and CALL, CAN'T BREATHE, YES and NO uncovered. After Acknowledge the board stays in Ward until the nurse offers Candlelight again and the patient or family chooses it, as SKN-2 asks after a wake from night mode. An Alert may mean the patient's situation has changed, and the nurse judges that, not the system.
7. **Pause messages.** One message at a time, by priority (care, no input, face out of view, head below range), with a reason line of at least 8vmin. The wording names a position or a setup step, never a clinical state. Screen hidden cannot be shown; its start and end times go into the Session_Log.
8. **Wake lock warning.** See conflict 10.
9. **Test sound.** See conflict 10. It is unavailable while an Alert is active, and it never starts or logs an Alert.
10. **DELETE and numbers.** See conflicts 1 and 2.
11. **Demo input.** Demo selections are shown, spoken and chimed exactly like patient selections, so the demo shows real behaviour. The Demo_Banner shows on every screen. While a Demo_Session is on, every Session_Log entry carries the Demo mark. Entries made while no input is on (for example the "no input" Pause) carry no Demo mark, because SAF-10 ties the mark to mouse mode or the demo pointer being on; none of them is a patient selection.
12. **Nurse drawer.** Opened by the "Nurse menu" handle (click, Enter or Space; Escape closes). Every control is visible on open, at least 44 × 44 CSS px, reachable by Tab with a visible focus outline, and acts on the second click at most. The drawer and its controls are never Targets, and the drawer never covers CALL, CAN'T BREATHE, the Confirm_Targets, YES or NO.
13. **Copy.** Every string lives in src/copy/ and follows tone.md. The sentences are in Requirement 13.5, using clinical-context.md's examples where they exist.
14. **Verification.** Requirement 23: Rest_Runs (60 simulated minutes, nothing selected, spoken or alerted), Active_Use_Runs (10 simulated minutes, no Alert), the Fatigue_Reach_Run, the Dwell_Sweep that chooses the default Dwell_Time from data, and fast-check properties for SAF-1, SAF-2, SAF-4, SAF-5 and SAF-6. Requirement 22.1 is the contrast test over each Skin's colour tokens.

### Open questions for the icu-nurse review and the design

1. **Unconfirmed CAN'T BREATHE.** If the patient selects CAN'T BREATHE and the offer closes unconfirmed (for example the head drops), only the Session_Log records it, and the log has no screen until slice 3. Should the Nurse_Drawer show the last "not confirmed" urgent selection? **Settled** by blocker 1 of the review: yes. Every unconfirmed urgent selection now shows on the Nurse_Handle and in the Nurse_Drawer until the nurse clears it (10.11 to 10.13, 17.11 to 17.14). See "Changes after the ICU nurse review".
2. **Chime rising.** ALR-1 says only "starts gently and repeats". Rising one step after 30 s and 60 s (11.4) is a proposal.
3. **Demo speech.** Demo speech sounds like patient speech; only the screen says "Demo, not the patient." At a real bedside, a demo "I can't breathe. Please come now." could be mistaken for the patient. Should demo speech be marked? **Settled** at task approval: yes, demo speech starts with "Demo." (13.12); the chime is unchanged.
4. **Sentences that commit to a meaning.** LIGHTS, NOISE and THE TUBE are ambiguous labels. The chosen sentences try not to decide what the patient meant (NEV-2). CALL has no example in clinical-context.md; "I need the nurse. Please come." is a proposal.
5. **Confirm labels.** "YES, CAN'T BREATHE" is long for a label at 6vmin cap height. Shorter options need the nurse's view. **Answered** in `reviews/icu-nurse.md`, item 10: the nurse keeps the wording and asks that the Confirm_Target be large enough to hold the full label at 6vmin or more without wrapping, rather than shortening CAN'T BREATHE. Sizing is left to the design.
6. **Geometry.** Level 2's twelve two-word labels at 6vmin cap height, the four Fixed_Targets at 25% of the Shorter_Side and two Confirm_Targets nearly fill a 16:9 board. 4:3 screens and tablets in portrait are not covered by 3.6. The design must check this geometry first; if it does not fit, the TUNE sizes change with the nurse's agreement.
7. **Slow drift.** With a fixed Default_Range, drift of up to 2° per minute moves a resting pointer off the Rest_Zone within minutes, so the Rest_Runs (23.1) will fail unless the Pointer_Mapper absorbs slow drift. The design must solve this here, and spec 2's calibration must keep it.
8. **Hidden tabs.** Browsers slow timers in hidden tabs, which may stretch the chime's repeat (11.14). The design should schedule the sound ahead and check it.
9. **Browser sound rules.** Whether Chrome needs a click before speech and Web Audio can play is a design research item (Requirement 21).
10. **Dwell time per patient.** There is no nurse control for the Dwell_Time in this slice. Spec 2 may set it per patient.
11. **Rest_Zone label.** The Rest_Zone is shown as an outline with no word. Would a label help a confused patient? **Settled** at task approval: the word "REST" sits at its centre (7.11, 7.12).
12. **Letter order.** Letters are alphabetical within one Usage_Tier, because they are easier to find for a confused patient, rather than ordered by letter frequency.
13. **Run time.** Sixty-minute Rest_Runs on every profile and Level may not fit `npm run check:task`'s budget of about 60 s. The design chooses fixed seeds and the number of random seeds (TUNE).
14. **Demo scripts.** The demo word for Level 3 (for example HELLO) comes from a fixed, reviewed list and must pass the wording test (20.3).

### Changes after the ICU nurse review

The ICU nurse review of 2026-11-27 is saved verbatim in `reviews/icu-nurse.md`. Blockers 1 and 2 are applied as listed below, together with three changes that align the spec with the user's task list. Items 3 to 11 of the review (SHOULD and NICE) are not applied; they wait for the user's decision. Where an earlier note differs, this subsection wins.

**Blocker 1: the nurse sees an unconfirmed urgent selection.**
- Glossary: new term Unconfirmed_Notice.
- 10.11 to 10.13 (new): when a Confirm_Offer closes unconfirmed, the Board raises an Unconfirmed_Notice that names the Urgent_Target and the time it was selected. Each one stays until the nurse clears it. It plays no sound, speaks nothing and starts no Alert (SAF-2).
- 17.11 to 17.14 (new): the Nurse_Handle names the Urgent_Target next to its notice mark; the Nurse_Drawer shows one line per Unconfirmed_Notice with a Clear control; one press clears one notice; the wording reports the selection only (NEV-2, NEV-3). The size of the handle text is left to the design.
- 17.3 (changed): the Unconfirmed_Notice lines join the drawer's notices, so the notice mark in 17.9 applies to them too.
- 15.3 (changed): the Session_Log records each clearing.
- The Covers line of Requirement 17 and the Coverage rows for SAF-2, SAF-8, NEV-2 and NEV-3 are updated.

**Blocker 2: nothing covers a Confirm_Target.**
- 11.6 (changed): the Alert_Panel covers no part of either Confirm_Target's rectangle, shown or not.
- 16.10 (changed): the same for the Candlelight_Offer.
- 8.11 (new): the same for the pause message, while it is shown or fading.
- 4.5 (changed): the Spelling_Line joins the lines placed outside every Target and Confirm_Target. It was the one strip that 4.5 did not list.
- 16.11 (changed): the Back to Ward button sits outside the Confirm_Target rectangles too.
- 17.7 is unchanged; it already listed the Confirm_Targets.
- 11.16 and 11.17 (new): during an Alert, selecting either Urgent_Target opens a Confirm_Offer as usual, and its Confirm_Target stays shown, uncovered and able to charge.
- 23.10 (changed): the SAF-1 property also checks any shown Confirm_Target. Its generated states now include a Confirm_Offer for either Urgent_Target, Alerts for one or both, and a shown or fading pause message.
- The Covers lines of Requirements 8 and 11 and the Coverage rows for SAF-1 and SAF-2 are updated.

**Alignment with the user's task list.**
- 6.2 (changed): exactly six Ghost_Profiles, one behaviour each (small range, tremor, drift, fatigue, dozing with the head rolling to one side, and the face leaving the frame), made with the ghost-patient-designer agent. No profile has a forward head drop, so the Rest_Runs no longer include one; Head_Drops and rolls to both sides are tested by the SAF-3 generators (9.5).
- 23.2 (changed): an Active_Use_Run reports every Accidental_Selection, and starts no Alert without its Confirm_Target having been selected. Glossary: new term Accidental_Selection.
- 23.4 and 23.5 (changed): the candidates are 600, 800, 1000, 1200 and 1500 ms. The report is `docs/experiments/dwell-sweep.md`, with one row per profile and candidate. The choice rule adds "no Alert without a confirm" and a limit on Accidental_Selections per 10 minutes of active use (chosen in the design), and applies the median and the limit to every profile. The report states the chosen default and why. If no candidate meets the rule, the default stays 1500 ms, the value 7.10 uses until the sweep has run.

**Two gaps found while applying the review (design pass of 2026-11-27).**
- 1.11 (new): no Target charges while any overlay covers any part of it. The per-overlay rules 8.11, 10.10, 11.6, 16.10 and 17.7 each stopped one overlay from covering the protected Targets, but none stopped an ordinary Target from charging under a panel that hid it (for example a need under the Alert_Panel). 1.11 states the rule once for every overlay. Covers SAF-1, SAF-4.
- Accidental_Selection (glossary, changed): the term now counts a second or later Selection of the aimed Target, not only Selections of other Targets. Without this, a dwell that fired "Yes." twice during one aim was not counted, and the Dwell_Sweep (23.2, 23.4, 23.5) would have missed double-fires. No numbered criterion changes; 23.2's parenthetical still describes the common case.

**Re-arm after a Pause, drop or roll (design pass; needs the user's approval).**
- Glossary: new terms Re_Arm and Re_Arm_Time (400 ms, TUNE).
- 9.6 (new): after a Pause ends, or after a Head_Drop or a Sideways_Roll ends, nothing charges until the pointer has stayed inside the Rest_Zone for the Re_Arm_Time. In Mouse_Mode (no head pose) only the end of a Pause starts Re_Arm.
- Why: the dozing-roll Ghost_Profile can leave the head parked rolled over one Target once it stops moving. The Head_Drop_Guard (9.2, 9.3) releases as soon as Head_Still holds, so the parked pointer would charge and speak while the patient dozes, failing the Rest_Run (23.1). The same rule stops a head waking from below range (a Head_Below_Range Pause ending) from charging the lower Targets as the pointer rises through them. This is the design's answer to nurse review item 3 (a head held in roll), chosen over a sustained-roll Pause because one rule covers waking and parked-roll together and never names a clinical state. The trade-off and the comparison are in the design. Reversible: remove 9.6, Re_Arm and Re_Arm_Time to drop it.

**Narrow screens (design pass; needs the user's approval).**
- Glossary: new term Narrow_Screen (under 160 Board_Units wide, TUNE; every portrait screen is one). The Pause_Reason entry adds screen too narrow.
- 3.8 (new): on a Narrow_Screen, selection pauses with the Pause_Reason "screen too narrow", and the Board shows "Screen too narrow. Selection is off. Turn the screen sideways or use a wider screen." in place of the Targets. The Clock_Line, the Nurse_Handle, the Demo_Banner and any Alert_Panel stay on screen. 8.10 logs the start and the end, as for every Pause_Reason. The string lives in src/copy/ (20.1).
- Why: the Layout_Table needs 160 Board_Units of width for Level 2's outer needs, so a portrait screen or a 4:3 screen cannot show the Targets at their rectangles. The design showed a message there with no requirement behind it; 3.8 is that requirement. While it holds, 3.8 takes the place of 8.5's choice of message and of 8.8's "every Target at its rectangle", because the Targets do not fit. CALL and CAN'T BREATHE are off screen, as in every Pause (conflict 7).
- Reversible: remove 3.8, Narrow_Screen and the reason. Portrait screens then show a broken layout.

### Changes at task approval (2026-11-27)

The user approved tasks.md and every decision in design.md's "Decisions that need your approval", taking the first option for decision 5 (structure.md's `scripts/` line is widened). So 3.8 and 9.6 are no longer pending: their "needs the user's approval" notes, the Covers line of Requirement 3, the Pause_Reason entry and the SAF-8 Coverage row are updated. At the same time the user adopted nurse review items 3, 4, 5, 6, 7 and 9, and asked that tests stay inside the one-way chain. This replaces the line "Items 3 to 11 of the review ... are not applied" above. Where an earlier note differs, this subsection wins.

**A head held rolled pauses selection (nurse item 3).**
- Glossary: new term Head_Held_Rolled (10° of roll from neutral, either way, for 2 s, both TUNE); Pause_Reason (changed).
- 8.1, 8.5 and 8.6 (changed): the new reason, last in the message order, with the wording "Head tilted to one side. Selection is off." It names a position, not a clinical state (8.7, NEV-3).
- 8.12 and 8.13 (new): the Pause, and none in Mouse_Mode. It works like every other Pause, and Re_Arm follows its end (9.6).
- 23.12 (new): the SAF-3b check over slow rolls in rest mode.
- The Covers line of Requirement 8 and the Coverage rows for SAF-3 and SAF-5 are updated.
- Why: Re_Arm only follows a fast roll (a Sideways_Roll, 10° within 500 ms). A slow roll that parks the pointer over a Target starts neither the guard nor Re_Arm. The held-roll pause catches it once it has lasted 2 s. 9.6 stays.
- Residual risk: a slow roll smaller than 10°, parked over YES or NO, is not caught. The simulator couples about 0.6° of yaw and 0.3° of pitch to each degree of roll (TUNE). At 1280×800 that moves the pointer about 4.8 Board_Units sideways and 1.9 up or down per degree of roll. So the pointer leaves the Rest_Zone at about 3° of roll and sits on YES or NO from about 3.3° to 7.5°. Held there for one Dwell_Time, it selects and speaks "Yes." or "No.". On Levels 2 and 3 a nearby need or letter can be hit the same way.
- Expected failure of 23.12 with the starting values. A slow roll on its way to 10° crosses YES or NO. Slower than about 2.8° per second at a 1500 ms Dwell_Time (faster for a shorter one), it selects one of them on the way. Also, a right roll of about 9.6° to 13° parks the pointer on the lower edge of CAN'T BREATHE, so CAN'T BREATHE is selected before the 2 s hold is over. That opens a Confirm_Offer, which the held-roll pause then closes as not confirmed, with an Unconfirmed_Notice. Nothing is spoken and no Alert starts, so SAF-2 and SAF-3 still hold, but 23.12's "no Selection" does not. Task 11.9 stops and asks the user if this happens. Options: stop charging as soon as the roll reaches 10° and start the Pause after 2 s; lower the held-roll size toward 3°, which pauses a patient who rests slightly rolled; change the coupling only from volunteer recordings, never to pass a test.

**Demo speech starts with "Demo." (nurse item 4).**
- 13.4 (changed): "Demo." is the one system word that may be spoken, and only in a Demo_Session.
- 13.11 (changed), 13.12 and 13.13 (new): demo speech says "Demo." first, as its own utterance, spelled text included; the Message_Strip and the Session_Log keep the sentence as it is.
- The Covers line of Requirement 13 and the Coverage rows for SAF-6 and SAF-10 are updated. Open question 3 is settled.
- Decision 11 under "Decisions on the 14 points" changes: demo selections are still shown and chimed like patient selections, but their speech starts with "Demo.". The chime is unchanged.
- SAF-6 says the system speaks only what the patient selected. In a Demo_Session no patient is selecting, and "Demo." says so out loud (SAF-10).

**The board shows when care ends (nurse item 5).**
- 8.6 and 18.1 (changed): "Paused for care. Selection is off. Resumes by itself at 03:22.", with the resume time in place of 03:22.
- 18.7 (new): the time is the clock time of the automatic resume, in the Clock_Line's hours-and-minutes format, and it stays the same for the whole Pause. It is never a countdown or a remaining time (ATT-2).
- The drawer line (18.4) stays, and so does the 10-minute default (TUNE). The Coverage rows for SAF-8 and ATT-2 are updated.
- tone.md gives "Paused for care. Selection is off." as the starting wording; this spec adds the resume time. Suggest updating tone.md to match.

**Each sentence first shows at doorway size (nurse item 6).**
- 13.9 (changed): without speech, the sentence stays at 8vmin for as long as it is shown.
- 13.14 (new): with speech, a new sentence shows at 8vmin or more for 8 s (TUNE), then at 5vmin or more. The 8 s are a display time; nothing on screen counts them.
- 13.15 (new): spelled text too long for two lines at the asked size shows at the largest size that fits on two lines, and at least 5vmin. Added so that 13.14 can be met for long spelled text.
- The Covers line of Requirement 13 and the Coverage row for ATT-2 are updated.
- Task 5.1 places a Message_Strip rectangle that holds the 8vmin text on two lines, outside every Target and Confirm_Target (4.5). If it can't fit at 1280×800, the task stops and asks the user.
- Open: spelled text that does not fit on two lines even at 5vmin has no rule yet. The Spelling_Line has the same limit.

**"Plain look" instead of "Ward" in text people see (nurse item 7).**
- 16.8, 16.9, 16.11 and 17.3 (changed): "Back to Ward" becomes "Plain look", and "Keep Ward" becomes "Keep the plain look". The drawer control is "Plain look" too.
- 16.13 (new): no string a patient, family member or nurse sees or hears contains the word "Ward". Glossary: Skin (changed).
- "Ward" stays the skin's name in the specs, the steering files and the code. The Coverage row for SKN-2 is updated. When the log screen arrives in slice 3, it must show "return to Ward" entries (15.3) in Copy_Module wording, which says "plain look".

**REST in the Rest_Zone (nurse item 9).**
- 7.11 and 7.12 (new): the word "REST" at the Rest_Zone's centre, in both Skins, at 4.5:1 or more, never styled like a Target, never charged, selected or spoken.
- 13.4 and 16.3 (changed): "REST" is never spoken, and it is the same in both Skins.
- The Coverage row for SAF-4 is updated. Open question 11 is settled.

**Tests stay inside the one-way chain.**
- No criterion changes. design.md and tasks.md move the simulation runner from `src/harness.ts` to `src/board/sim-runner.ts`, and move every test that read a later stage into the folder of the latest stage it reads.
- structure.md adds `src/alert/` to its folder list, widens the `scripts/` line, and ends the data-flow rule with "speech, log and alert".
