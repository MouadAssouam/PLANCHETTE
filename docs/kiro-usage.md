# How we use Kiro to build PLANCHETTE

This is the working record of how Kiro was used to set up PLANCHETTE: what we configured, why, how we tested it, and what went wrong. It is the source material for the Kiro write-up the hackathon asks for (see `.kiro/steering/judge-criteria.md`). The raw record, one line per agent turn, is `docs/kiro-log-raw.md`, written by the turn-log hook.

Status on 2026-11-27: project setup is done. There are no app features, no specs and no commits yet.

## Surface
Kiro IDE on Windows, in one long agent chat session. We haven't used Kiro CLI, Web or Crew yet.

## Timeline
1. **MCP.** We asked Kiro to configure Context7 and Playwright. Kiro's permission rules don't let the agent write `.kiro/settings/`, so the agent supplied the JSON and we created `mcp.json` by hand.
2. **Steering.** We added `clinical-context.md`, the ICU rules everything else follows.
3. **Hooks, first try.** A write guard, a push gate and a shared helper library. It was too complex and hard to test inside Kiro's sandbox, so we scrapped it.
4. **Hooks, second try.** Three small hooks in the format the Kiro docs show: gitignore-guard, turn-log and pre-submit-audit.
5. **Project setup.** We fixed the hook problems Kiro's log reported and fact-checked the clinical evidence. Then came seven more steering files, five custom agents, the Vite + TypeScript + Vitest + fast-check skeleton, and the task-gate and copy-review hooks.
6. **Independent checks.** The verifier agent ran twice, the icu-nurse and skeptical-judge agents reviewed the product, and we applied their findings.

## Steering (`.kiro/steering/`)
| File | Inclusion | What it holds |
|---|---|---|
| clinical-context.md | always | The ICU rules: the people, the board vocabulary, 27 design rules, what the app must never do, AI limits, privacy, testing and evidence. It wins any conflict. |
| product.md | always | Problem, users, core features, scope, prior art, success measures |
| structure.md | always | Module layout, pure logic kept apart from the DOM, one-way data flow, where text lives |
| safety.md | always | The clinical rules rewritten as EARS requirements with IDs (SAF, LAY, ATT, SKN, PAIN, NGT, ALR, LNG, NEV, AI, CAM) |
| tech.md | fileMatch: `src/**/*.ts`, `**/*.test.ts`, `src/sim/**` | Stack and why, performance budgets, privacy, camera handling, testing plan, simulated-patient profile format |
| accessibility.md | fileMatch: `src/skins/**`, `src/board/**`, `src/ask/**`, `**/*.css` | Target size, contrast, motion, text size, cues that don't rely on colour or sound |
| tone.md | fileMatch: `src/copy/**`, `README.md`, `docs/**` | Wording rules, the camera explanation, the preview rule |
| judge-criteria.md | manual | Judging criteria and submission requirements from the official rules |

What made a difference:
- **One source of truth.** clinical-context.md is always included and wins every conflict. safety.md restates its rules as EARS requirements, each with an ID, so every rule can get a test that names it.
- **Guesses are labelled.** Every number we haven't measured is marked TUNE, with how we'll measure it.
- **fileMatch keeps context small.** We could see it working. Once the files existed, Kiro added them to each turn as workspace rules. The fileMatch files appeared only after matching files existed: tech.md with the first test file, and tone.md and accessibility.md with the `src/copy`, `src/board` and `src/skins` folders.
- **The evidence was checked.** Kiro checked every figure in clinical-context.md section 8 against its original source, mostly through PubMed and Europe PMC records. Most figures were confirmed. One was corrected: ICU-acquired weakness affects 40–46% of high-risk patients, not half of all ICU patients. One couldn't be verified and is now marked "don't quote". The ICU diary finding got a caveat, because a later trial found no effect.

## Agent hooks (`.kiro/hooks/`)
| Hook | Trigger | Action | Why |
|---|---|---|---|
| gitignore-guard | PostFileSave, `\.gitignore$` | Agent prompt: run `git check-ignore` on two `.kiro` paths and undo any line that ignores them | The rules say `/.kiro` must never be ignored |
| turn-log | Stop | `node scripts/log-turn.mjs` appends the time and `git diff --shortstat` to `docs/kiro-log-raw.md` | A raw record of the work for this write-up |
| pre-submit-audit | UserPromptSubmit | `node scripts/audit.mjs` prints a PASS/FAIL checklist when the prompt says "pre-submit audit" | Checks the submission requirements on demand |
| task-gate | PreTaskExec | `node scripts/task-gate.mjs` runs `npm run check:task` and exits 2 to block the task if anything is red | No spec task starts on broken code |
| task-report | PostTaskExec | `npm run check:task` | Every task ends with a test report |
| copy-review | PostFileSave, `src[\\/]copy[\\/]` | Agent prompt: review the changed text against tone.md and the wording rules | Patient-facing text stays plain and calm |

What we learned by testing instead of guessing:
- **The real input.** Before writing any hook script, a temporary logging hook captured what Kiro sends on stdin for PreToolUse. It sends `tool_name` (`fs_write`, `str_replace` or `execute_pwsh`) and `tool_input`. `tool_input` holds `path` and `text`, or `path`, `oldStr`, `newStr` and `replace_all`, or `command`. `cwd` is the workspace root.
- **Exit codes.** Only exit 2 blocks. Exit 1 lets the action through. Output on stderr with exit 0 reaches nobody, so our scripts print warnings on stdout.
- **Matchers.** In our test, `(?i)…` never fired, but `(?i:…)` did. A matcher of `*` failed to compile ("Nothing to repeat"), which quietly stopped turn-log from ever running. Kiro's log also said matchers have no effect on Stop and UserPromptSubmit. We removed both matchers, and audit.mjs now checks the prompt text itself. It reads the prompt from the stdin JSON and falls back to `USER_PROMPT`.
- **Live tests:**
  - gitignore-guard fired on every real `.gitignore` save. When `.kiro/` was added, the check printed the ignored paths and the line was undone. When `node_modules/`, `dist/` and `e2e/clips/` were added, it printed nothing.
  - turn-log wrote its first line at the end of a turn.
  - task-gate exited 2 when the verifier added a failing test, and 0 once it was removed.
- **Not yet fired in real use:** copy-review, task-gate and task-report. There is no copy text and no spec task yet.

## Custom agents (`.kiro/agents/`)
| Agent | Tools | Steering it loads | Job |
|---|---|---|---|
| icu-nurse | read | clinical-context, safety, tone, product | Reviews specs and designs as a night-shift ICU nurse and lists concrete gaps, each with the rule it breaks and a fix |
| ghost-patient-designer | read, write | tech, clinical-context, structure | Turns a patient description into one simulation profile. Its permission rules allow writes only in `src/sim/profiles/` |
| a11y-auditor | read, @playwright | accessibility, clinical-context, structure | Opens the running app, screenshots both skins and measures them against accessibility.md |
| skeptical-judge | read | judge-criteria, product | Scores work against the judging criteria. A critic only |
| verifier | read, shell, web | all steering files and the rules | Tests a checklist from the outside and reports a table. Never fixes anything |

Custom agents don't load steering on their own, so each agent's `resources` list names the files it needs. The verifier loads 9 files, about 86,000 characters, which is under the documented limits of 32 files and 100,000 characters.

How they were used:
- **verifier.** It was given only a checklist, never a summary of the work, so it tested instead of trusting.
  - First run: 30 checks, 6 failures.
    - Two were real bugs, now fixed: task-gate blocked tasks when npm was missing, and the audit's own search pattern contained the trademarked game name.
    - Two were expected: nothing is committed yet, and the README is a placeholder.
    - One came from the verifier's own sandbox.
    - One was a decision for us: rules.txt is git-ignored but listed as a verifier resource. It stays out of the repo; where it is missing, agents use judge-criteria.md.
  - Second run: 24 checks. 21 passed, the 2 expected failures remained, and 1 was blocked by the sandbox.
- **icu-nurse.** It reviewed product.md and safety.md and found 25 gaps, 11 of them blockers. Examples: CAN'T BREATHE had no alert rule, the laptop screen could go to sleep overnight, and a demo session could log a pain score as if the patient had chosen it. Most became new or reworded requirements in safety.md, including SAF-8 to SAF-10, SKN-5, NGT-4, ALR-3 and ALR-4.
- **skeptical-judge.** It scored product.md 19 out of 50, lowest on Design (1) because no interface exists yet. It also pointed out that GitHub had none of the work. That led to an audit check that fails until `.kiro` is committed and pushed, a prior-art section in product.md, a source for one claim and the removal of another.
- **ghost-patient-designer and a11y-auditor.** Ready but not used yet. They need the simulation code and a running app.

## MCP (`.kiro/settings/mcp.json`)
- Context7 (`@upstash/context7-mcp`) and Playwright (`@playwright/mcp`), both started with npx. Neither needs an API key.
- **Context7** provided current docs before we wrote config and steering:
  - Vitest's config file and its `pool` option.
  - fast-check's `fc.assert`, `fc.property` and run options.
  - The MediaPipe Face Landmarker options: `runningMode: 'VIDEO'`, `numFaces`, `outputFacialTransformationMatrixes` and `detectForVideo`.
- **Playwright** is wired to the a11y-auditor agent through `@playwright` and `includeMcpJson`, and hasn't been used yet.

## Property-based testing
- Vitest 5 and fast-check 4 are set up. One example property proves the tooling works: `clamp` always returns a value inside the range and leaves in-range values unchanged.
- The plan in tech.md is that every safety.md ID gets a test that names it, preferably a fast-check property or a simulated-patient run. None of those tests exist yet.

## Specs
None yet. Spec 1 will be first-slice, the board without a camera (slice 1 of the build order in product.md). Spec 2 will be head tracking and calibration. The task-gate and task-report hooks are ready.

## Powers
Not used.

## Working inside Kiro's sandbox and permissions
- **What the sandbox blocked.** At first, shell commands ran in Kiro's local command sandbox. Here that meant no network (the npm registry was unreachable) and no access to some folders (`.kiro/settings/` and the OneDrive folder above the workspace junction). Child processes with piped output also hung.
- **What we changed.**
  - The hook scripts send git and npm output to a temp file instead of a pipe.
  - Vitest runs in worker threads.
  - Shell runs through the junction path use node's `--preserve-symlinks` flags.
- **Without the sandbox.** The shell now has network access: it reaches GitHub, the npm registry and Playwright's download server.
- **Installing dependencies.** `npm install --ignore-scripts --no-audit --no-fund` ran once through a temporary hook with that fixed command, and the hook was deleted right after. In our tests hook commands ran outside the sandbox: that hook reached the npm registry. Now the agent runs installs itself when we ask, as it did for `@mediapipe/tasks-vision`, `@playwright/test` and Playwright's Chromium. There are still no install hooks.
- **Permissions.** The agent can't write `.kiro/settings/` at all. Kiro's docs say writes to `.kiro/hooks/` and `.kiro/agents/` always ask for approval.
