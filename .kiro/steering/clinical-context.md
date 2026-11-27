---
inclusion: always
---

# Clinical context: the ICU bedside

PLANCHETTE is a hands-free talking board for awake ICU patients who can't speak and can't use their hands. Use this document whenever you design, write or review anything in this project. When a request conflicts with this document, follow this document and say so.

PLANCHETTE is a prototype. It is not a medical device, not a clinical assessment tool, and not a replacement for the hospital's nurse call system.

---

## 1. The people

### The patient
- Has a breathing tube or a tracheostomy, so no voice. Mouthing words with a tube is unreliable. **Never use mouth or lip gestures as input.**
- Often can't use their hands: muscle weakness, wrist restraints, IV lines. **Never require a touch, click or key press from the patient.**
- Lies back at 30–45° in bed. The camera sees them from the side or from below, not straight on. Head movement may be small, slow and one-sided. **Calibrate to the patient's own range; never assume a full range of motion.**
- May be drowsy, sedated or confused (delirium). **One question at a time, no time limits, no flashing, no surprises.**
- Glasses and hearing aids are often missing. **Text must be readable without glasses; never rely on sound alone.**
- May not speak the staff's language.
- Tires after a few minutes of effort. **Every extra movement costs something. Fewer selections always wins.**

### The nurse
- Has seconds, not minutes, often wears gloves, and may be outside an isolation room.
- Already hears too many alarms. **Alerts must be distinct and calm, and must stop once acknowledged.**
- **Setup must take under 30 seconds, with no login, no install and no account.**
- The nurse uses mouse and keyboard on the same screen. Every nurse control is reachable in two clicks or fewer.

### The family
- Visits scared, wants to talk with their person, and may not know how the board works.
- **Anything family-facing must be understandable without training.**

---

## 2. What patients need to say, in priority order

Most of what ventilated patients try to say is about care: physical needs, pain and the breathing tube. Feelings come up rarely, possibly because nobody asks. Thirst is the most common and most intense ICU symptom.

Board vocabulary, from most to least important:

1. **Urgent:** CALL, CAN'T BREATHE
2. **Top needs:** MOUTH DRY, PAIN, SUCTION, MOVE ME
3. **Other needs:** TOO HOT, TOO COLD, TOILET, LIGHTS, NOISE, GLASSES, HEARING AID, THE TUBE
4. **Answers:** YES, NO, NOT SURE, SOMETHING ELSE, NOT NOW
5. **About my situation:** WHERE AM I, WHAT HAPPENED, WHEN DOES THE TUBE COME OUT, AM I GETTING BETTER, WHERE IS MY FAMILY, WHAT DAY IS IT
6. **Feelings:** SCARED, LONELY, FRUSTRATED, BORED, OK, THANK YOU
7. **Family:** I LOVE YOU, TALK TO ME, HOLD MY HAND, TELL ME ABOUT HOME
8. **Letters and numbers:** A–Z, 0–10, BACK, SPACE, SPEAK

### Wording rules
- Labels are short, plain, upper case, and in the patient's voice.
- Speech is a full first-person sentence, so the listener never has to guess:
  - MOUTH DRY → "My mouth is dry."
  - SUCTION → "I need suction."
  - CAN'T BREATHE → "I can't breathe. Please come now."
  - PAIN 7, CHEST → "My pain is 7 out of 10. It's in my chest."
- Say "MOUTH DRY", not "WATER". Most patients with a breathing tube can't drink; the nurse answers with mouth care.
- No medical jargon on the patient's side. Clinical words are fine in the nurse drawer.

---

## 3. Design rules

Each rule must be testable. Prefer property-based tests or ghost-patient simulations over examples.

### Safety and selection
1. CALL and CAN'T BREATHE are reachable in one selection from every screen, at every level, in every skin.
2. CALL and CAN'T BREATHE need a confirm step, and never fire from a head-drop movement.
3. The center of the board is a rest zone. Resting the head there selects nothing.
4. Selection pauses when the face is lost, when the head drops below the calibrated range (dozing), and while night mode is asleep.
5. Nothing is spoken unless the patient selected it.
6. High-consequence targets (CALL, CAN'T BREATHE, SPEAK) are never placed where a dropping head lands.

### Layout
7. A target keeps the same position across levels, skins and the printed board. Skins change looks, never positions.
8. Levels: Level 1 is YES / NO / CALL / CAN'T BREATHE; Level 2 is needs; Level 3 is letters. Calibration recommends a level; the nurse can change it in one click.
9. The most-used targets sit closest to the rest zone, but never on it.

### Thinking and attention (delirium)
10. One question on screen at a time.
11. No countdowns, no time limits on answers, no flashing, no sudden sounds.
12. Every question offers NOT SURE or SOMETHING ELSE, and NOT NOW.
13. The day and time are visible on every screen.

### Skins and tone
14. The **wake-up orientation card is always plain (Ward style)**. A confused patient waking up must never see Candlelight first.
15. The nurse offers the Candlelight skin only when the patient is awake, oriented and recovering, and the patient or family chooses it. The nurse or family can switch back to Ward in one click at any time. Candlelight never shows on first wake, on the orientation card, on an alert screen or in night mode. Some patients will enjoy it; others will find it frightening.
16. Candlelight's style lives only in visuals. Spoken output, the message strip, the orientation card and every safety message are always plain, calm and literal.
17. Never use words about ghosts, spirits, séances, the dead, the beyond or the other side, and never joke about death or dying, in any text a patient, family member or nurse reads or hears. A message the patient spells is never filtered or changed.

### Pain
18. Pain is self-report only: a 0–10 number the patient chose. Never infer pain from facial expression, and never fill a pain score in for the patient.
19. The pain flow is: how much (0–10) → where (body map) → optional what kind (sharp, burning, aching, pressure). Every step can be skipped.
20. Pain re-checks are started by the nurse, ask gently, and log the answer with its time.

### Night
21. Night mode dims the screen to low, warm light.
22. The wake gesture is holding the pointer still on a dim WAKE target for 2 seconds (TUNE). WAKE sits where a dropping or rolling head doesn't land, so normal movement in sleep does nothing.
23. Urgent targets stay one wake gesture away.

### Alerts
24. The CALL chime is distinct from monitor and ventilator alarms, starts gently, repeats until a caregiver acknowledges it, and then stops.
25. Every alert screen says it does not replace the hospital's call system.

### Languages
26. Board labels come from a fixed, human-reviewed translation table. Never machine-translate urgent labels at runtime.
27. AI translation is only for free text, and the original text is always shown next to it.

---

## 4. What PLANCHETTE must never do

- Answer a medical question. Questions about the patient's condition always go to staff.
- Decide what the patient meant, or speak anything they didn't select.
- Detect, assess or diagnose pain, delirium, sedation level or any other clinical state.
- Store or send camera frames. Video never leaves the device.
- Send the patient's name, the orientation card or the bedside log to the AI service.
- Require an account, a login or an internet connection for the core board.
- Use words like "diagnose", "monitor", "clinical-grade", "detects pain" or "medical device" about itself.
- Use the name of a trademarked talking-board game. Say "talking board".

---

## 5. The AI service

- The AI may only: suggest answer options for a nurse's Ask-mode question, suggest word or sentence completions, and translate free text.
- Every AI suggestion is a choice for the patient, never an action.
- Hard timeout of 2 seconds, then the local fallback. The board must be fully usable with the AI offline.
- Send text only. Strip names before sending.

---

## 6. Privacy and the bedside log

- The log stays on the device, clears itself after 24 hours, and has a clear button in the nurse drawer.
- The log is printable for shift handover. It is not a medical record and must say so.
- The Nurse link uses a random room code and carries no names or medical details. Messages are deleted when the session ends.

---

## 7. Testing in ICU conditions

- **Never test on real ICU patients.** That needs hospital and ethics approval.
- Test with healthy volunteers set up like a patient: lying back at 30–45°, hands under a blanket, neck movement limited, dim light, the device on a side table or an angled stand.
- Measure: setup time, time to say "PAIN 7, CHEST", and accidental selections.
- Ghost-patient simulations must include: small range of motion, tremor, slow drift, fatigue over time, dozing off (head drop), and the face leaving the frame.

---

## 8. Evidence behind this document

Verify each figure in the original paper before quoting it publicly. Each line below was checked against its source on 2026-11-27.

- **Confirmed.** About 54% of 2,671 screened ventilated patients met basic criteria to communicate with assistive tools: 1,440 of 2,671 (53.9%), six ICUs in two hospitals of one US academic health system (Happ et al., Heart & Lung 2015;44:45–49).
- **Confirmed.** More than a third (37.7%) of pain-related exchanges with ventilated patients failed in usual care: the usual-care cohort of the SPEACS study, 30 patients and 10 nurses in two ICUs (Happ et al., Am J Crit Care 2011;20:e28–e40).
- **Confirmed.** Thirst was the most prevalent (64%) and most intense (mean 6.05 of 10) symptom over 7 days in 353 self-reporting ICU patients in Norway (Saltnes-Lillegård et al., Intensive Care Med 2023;49:1370–1382).
- **Couldn't verify; don't quote.** In nurse–intubated-patient exchanges, physical needs were about half of the content, pain about a quarter, tube questions about a sixth, emotions about 1%. No published source found. Happ et al. 2011 say only that most exchanges were about care, and cite an unpublished 2008 conference paper (Garrett) for the topic breakdown.
- **Confirmed.** Patients who died on ventilators still started conversations about home, family and their condition; head nods, mouthing words, gestures and writing were the main methods (Happ et al., Am J Crit Care 2004;13:210–218).
- **Confirmed (secondary source).** Self-report is the reference standard for pain when a patient can give one, and the 0–10 numeric rating scale, spoken or shown, is valid and feasible (SCCM PADIS guideline, Crit Care Med 2018, as restated in the KSCCM 2021 guideline; the original full text was not reachable).
- **Wrong, fixed.** ICU-acquired weakness affects about 40–46% of high-risk ICU patients (sepsis, multi-organ failure or long ventilation), not about half of all ICU patients: 46% of 1,421 patients in 24 studies (Stevens et al., Intensive Care Med 2007) and 40% of 2,686 patients (Appleton et al., J Intensive Care Soc 2015). **Confirmed:** 374 of 711 (53%) ventilated adults in 51 Canadian ICUs were physically restrained (Luk et al., Crit Care 2014;18:R46).
- **Partly confirmed (secondary sources).** Reorientation, glasses and hearing aids, and sleep protection are core parts of multicomponent non-drug delirium prevention, such as the Hospital Elder Life Program. Interpreters: couldn't verify in these sources.
- **Confirmed, with a caveat.** ICU diaries written by staff, with family contributing, reduced new PTSD from 13% to 5% in a trial of 352 patients in 12 ICUs in six European countries (Jones et al., Crit Care 2010;14:R168). A later trial in 35 French ICUs (657 patients) found no significant effect (Garrouste-Orgeas et al., JAMA 2019;322:229–239), so call the evidence mixed.
