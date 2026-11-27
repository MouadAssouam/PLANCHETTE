---
inclusion: fileMatch
fileMatchPattern: ["src/skins/**", "src/board/**", "src/ask/**", "**/*.css"]
---

# Accessibility

The patient reads the board from 1–1.5 m away, lying back at 30–45°, often without glasses, sometimes drowsy or confused. Both skins must pass every rule below. Skins change looks, never positions or sizes.

## Target size (TUNE)
- Level 1 (YES / NO / CALL / CAN'T BREATHE): each target ≥ 25% of the board's shorter side.
- Level 2 (needs): each target ≥ 15% of the shorter side. Level 3 (letters): ≥ 9%.
- Gap between targets ≥ 2% of the shorter side. The rest zone is centered and ≥ 20% of the shorter side.
- Nurse controls ≥ 44 × 44 CSS px, for gloved hands on a mouse.
- How we tune: with volunteers set up as patients (clinical-context.md section 7), shrink targets only while accidental selections stay at zero and the median time to select stays under 3 s (TUNE).

## Contrast
- Board labels and the message strip: ≥ 7:1 against their background in both skins (WCAG AAA). Brass on dark wood must meet this too.
- All other text: ≥ 4.5:1. Pointer, charge ring, focus outline and target borders: ≥ 3:1 against what is behind them.
- Checked by a unit test over each skin's colour tokens (WCAG relative luminance), and by the a11y-auditor agent on screenshots.

## No flashing, calm motion
- Nothing flashes, blinks or strobes, in either skin. No countdowns.
- In Candlelight, the candle glow is a slow brightness drift only: ≤ 10% luminance change with a period of at least 3 s (TUNE). It stops under `prefers-reduced-motion`. Night mode always switches to Ward (SKN-5).
- Ward has no decorative motion. Only the pointer and the charge ring move.
- Screen changes fade over at least 300 ms (TUNE); nothing appears suddenly.

## Text size
- Board labels: cap height ≥ 1.5 cm on the bedside screen viewed from 1 m (about 6vmin on a 13–15" laptop; TUNE with volunteers who leave their glasses off).
- Message strip ≥ 5vmin; day and time ≥ 4vmin; nurse drawer ≥ 16 px.
- The Ask-mode question and the orientation card text: at least board-label size. The reason on pause and alert screens: ≥ 8vmin, readable from the doorway (TUNE).
- Labels use a heavy, plain sans-serif (weight ≥ 600). No thin or decorative fonts for words in either skin; Candlelight's decoration lives in borders, textures and light.

## Colour is never the only cue
- Every state has a second cue: shape, text or position. The charge ring fills as an arc; a selected target gets a thick outline and a text change; urgent targets have their own position and label, not just red.
- Every screen stays readable in greyscale and with red–green colour blindness (check screenshots in greyscale).

## Usable without sound
- Every spoken sentence also appears in the message strip.
- The CALL alert stays on screen until acknowledged; the chime is extra, never the only signal.
- A speech failure or a muted device never blocks a selection.

## Nurse controls
- Every nurse control is reachable by keyboard, has a visible focus outline and a text label, and is at most two clicks away.
