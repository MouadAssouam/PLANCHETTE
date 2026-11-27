---
inclusion: manual
---

# Kiroween 2026: judging and submission requirements

Source: rules.txt (the official rules, kept out of the repo), sections 4 and 6. Paraphrased; check rules.txt before relying on a detail.

## Dates and category
- Submissions close **4 Dec 2026 at 2:00 pm Pacific**. No extensions, no late entries.
- Judging runs 16 Dec 2026 to 29 Jan 2027. The app must stay free and testable, without restriction, until then.
- Our category is **Costume Contest**: any app, with a haunting interface that is polished and unforgettable, whose spooky design elements enhance the app's function.

## Stage One (pass/fail)
The project reasonably fits the theme and reasonably applies the required tools (Kiro).

## Stage Two: five criteria, equal weight, 10 points each
1. **Potential Impact:** a credible case for solving a real problem for a real audience; the solution addresses it in what is demonstrated; useful, intuitive and accessible; would someone actually use it?
2. **Technological Implementation:** how thoroughly and skillfully Kiro was used; a thoughtful strategy for AI-assisted development; a variety of Kiro tools used to real effect; deep understanding of Kiro features; experimentation.
3. **Design:** a complete, coherent product experience, not just a technical proof of concept; intuitive, polished and intentional.
4. **Innovation / Idea:** creative and novel, different from existing concepts; unusual technologies or public resources combined in a unique way.
5. **Presentation:** the video shows the project working end to end; the pitch says what problem is solved, for whom, and why it matters; easy to follow; creative and memorable.

The category prize goes to the highest Stage Two score in the category. Ties are re-scored from scratch on a larger scale. Best Demo goes to the top Presentation score among the top 10% of entries overall. Judges may score from the description, images and video alone, without testing the app.

## Submission requirements
- A working project built with Kiro that fits the category. It must install and run consistently, and work as shown in the video and the description.
- A URL to the working app, with login details if any are needed (ours needs none).
- A text description of the features and functionality.
- A demo video under 3 minutes, showing the project running on its intended device, public on YouTube. No third-party trademarks, and no copyrighted music or other material without permission.
- A public GitHub repo (not GitLab or Bitbucket) with all the source, assets and instructions needed to run the project, and an open source license file that shows in the repo's About section (ours: MIT).
- The /.kiro directory at the repo root, showing specs, hooks and steering. Never add /.kiro or any of its sub-folders to .gitignore; that can disqualify the entry.
- The category, and any bonus categories, named in the submission.
- A write-up of how Kiro was used: which surfaces (IDE, CLI, Web, Crew), custom agents, agent hooks, spec-driven development, steering, MCP, property-based testing and powers, and what each changed.
- All materials in English, or with English translations.
- New work only, built during the submission period; disclose any pre-existing code. Third-party SDKs, APIs and data must be used within their licenses.

## Checks the pre-submit audit can't do
- The video, voiceover, YouTube title and thumbnail, and the Devpost text contain no trademarked board-game name. Check them by hand.
- Every feature the description or video shows works as shown; anything unbuilt is labelled as planned.
- The GitHub About section shows MIT. The audit checks that /.kiro is committed and pushed to the current branch's upstream; check that this branch is GitHub's default branch.
