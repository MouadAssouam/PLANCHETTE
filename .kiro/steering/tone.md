---
inclusion: fileMatch
fileMatchPattern: ["src/copy/**", "README.md", "docs/**"]
---

# Tone: the words patients, families and nurses read or hear

## Patient text
- Labels are short, plain, upper case, and in the patient's voice: MOUTH DRY, MOVE ME, CAN'T BREATHE.
- Speech is a full first-person sentence, so the listener never has to guess. MOUTH DRY → "My mouth is dry." PAIN 7, CHEST → "My pain is 7 out of 10. It's in my chest."
- Say MOUTH DRY, not WATER. No medical jargon on the patient's side; clinical words are fine in the nurse drawer.
- One idea per screen. A yes/no question never contains "or"; split it into two questions.

## System messages
- Calm, literal, short. Say what is happening, then what to do. No exclamation marks, no "Oops", no blame.
- The system never says "I"; "I" belongs to the patient's labels. Example: "Tracking is weak. Press Adjust camera."
- Every safety message stays plain in every skin.

## The two skins
- Candlelight changes only the look: dark wood, brass letters, candle glow and a planchette for the pointer. The words are exactly the same as in Ward.
- Call the product a "talking board" only. Never use the trademarked board-game name.
- No words about spirits, séances, the dead, the beyond or the other side, and no jokes or puns about death or dying, in anything a patient, family member or nurse reads or hears, or in the README, the write-up, the Devpost description or the video. This covers the system's own words; a message the patient spells is never filtered or changed.
- "Ghost" is a code word only, for the simulated patient that moves the demo pointer. Patients, families and nurses never see it: the nurse drawer says "Demo pointer", and public text (README, write-up, Devpost description, video) says "simulated patient".
- Never call PLANCHETTE a medical device, a monitor or clinical-grade, or say it diagnoses or detects pain. The disclaimer reads: "PLANCHETTE is a prototype. It is not a medical device and does not replace the hospital's call system."

## The camera
- The nurse sees this before the camera starts, next to the Start camera button:
  "The camera only follows head movement. Nothing is recorded or sent anywhere."
- While the camera runs, a sign always says "Camera on".
- Each camera state gets a calm message and a fix. Starting wording:
  - Not asked: "The camera is off. Press Start camera when the patient is ready."
  - Denied: "Camera access is blocked. Click the camera icon in the address bar, choose Allow, then press Start camera."
  - No camera: "No camera found. Plug one in, or use mouse mode."
  - Busy: "Another app is using the camera. Close it, then press Start camera."
  - Lost: "The camera stopped. Check the cable, then press Start camera."

## The preview
- The live picture of the patient shows only during setup and when the nurse presses Adjust camera, never by itself. Seeing your own face with a breathing tube can be upsetting.
- When tracking is weak, the nurse sees words, not the face: "Tracking is weak. Press Adjust camera."
- When the preview appears, say why: "Showing the camera so it can be adjusted. It will hide again."
- Never show the preview on the orientation card or on an alert screen.

## Other starting wording
- Demo banner (mouse mode and the demo pointer): "Demo, not the patient."
- Paused for care: "Paused for care. Selection is off. Resumes by itself at 03:22." The time is the clock time of the automatic resume, never a countdown.
- Test sound: "If you did not hear a chime, turn the volume up."
- Wake lock refused: "This screen may turn off by itself. Change the power settings so it stays on."

## Family text
- Understandable without training. Every board screen shows one line: "Ask a yes or no question. Watch the board."

## Translations
- Board labels come from the fixed, human-reviewed table in src/copy/. Never machine-translate urgent labels at runtime.
- AI-translated free text always shows the original next to it.
