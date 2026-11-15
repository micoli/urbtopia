# Guided demonstrations for interiors

Status: overall scope approved; Factory Simple pilot implemented for visual validation.

## Purpose

Explain how interiors work through reproducible scenarios with detailed steps.
The UI term proposed in French is « démonstration guidée »; the domain term is
Guided demonstration, recorded in CONTEXT.md.

## Format and learning levels

- Playback uses the game engine as its primary format. Exporting a video is a
  possible later extension, not an initial deliverable.
- Each demonstration runs in a separate demonstration interior with a known
  initial state. It does not modify the player's City or consume its resources.
- Each interior has one to three demonstrations. Simple teaches the basic
  functioning and a first useful layout; Intermediate teaches combinations and
  constraints; Advanced teaches optimization and diagnosis. A demonstration is
  omitted when its learning level adds no value. These levels are independent
  of building Tiers.
- Scenarios are authored as scripts versioned in the repository. Regenerating
  a demonstration means rerunning the scenario with the current game version,
  without manually repeating all clicks.
- Playback must offer play, pause and previous step. Every step must be
  explained in detail.

## Steps and playback

- Each step has one main action and explains its objective, the action shown,
  why it is appropriate, and its expected visible result and indicators.
- Explanations use text and visual highlights. Recorded voice is outside the
  first version.
- Playback starts in step-by-step mode. Next advances explicitly. Autoplay
  chains steps with enough time to read and observe; its reading delay never
  prevents the player from advancing immediately.
- Pause freezes both scenario actions and the demonstration's simulation.
- Previous step restores the beginning of the preceding step, including layout,
  Staff, stocks, breakdowns, indicators, text and the scripted camera state.
  Elapsed viewing time must not change that restored state.
- The first version is watch-only: the script places and rotates Fixtures and
  hires Staff. The player may inspect the scene and navigate playback, but does
  not perform gameplay actions. An exercise mode is outside this version.

## Scope and access

- Cover all four interior families: Venues, Production interiors, Service
  interiors and Home interiors. Each type receives one to three demonstrations
  according to the richness of its mechanics.
- Start with the Simple demonstration of the Factory interior, validate it
  together with the user, then extend coverage. This sequence is a delivery
  order, not a reduction of the target coverage.
- Launch voluntarily from a Demonstrations button in the Management view and
  the corresponding codex page. The selection lists available learning levels
  and each demonstration's objective. Do not launch automatically.
- Preserve existing layout examples as quick references.
- Freeze the player's City for the whole consultation. On exit, restore it to
  the point of entry without Catch-up for time spent viewing the demonstration.
  The demonstration has its own simulation.
- Support French and English, phone, tablet and desktop from the first version.
  Explanations and controls must work with touch without depending on hover.

## Authoring and maintenance

- Scripts express semantic game actions, such as placing a Motor at a known
  cell with an explicit orientation, rather than recording screen coordinates
  or clicks. Explanations, highlights and camera cues belong to the scenario.
- Provide a command to replay and verify all scenarios or one selected
  scenario against the current game version, plus a preview workflow.
- A valid script can be replayed without manually recording its actions again.
- Expected results must be checkable. A failed check identifies the scenario
  and step, and blocks publication until corrected; obsolete teaching content
  must not be silently published.
- Scenarios may intentionally demonstrate an incorrect layout followed by its
  diagnosis and correction, especially at Intermediate and Advanced levels.
  Teaching errors and breakdowns are scripted and reproducible.
- Demonstrations are available regardless of the player's unlocks. The isolated
  scenario supplies the required building Tier, Staff and resources, and
  explains the prerequisites for reproducing the layout in the player's City.
  It never changes that City's unlocks.

## Navigation, camera and exit

- Offer Previous, Next, Play/Pause, Restart, and a numbered step list with
  direct access. Always identify the current step, for example
  "3 / 8 — Transmit Drive".
- Manual step navigation pauses playback at the destination. Previous and
  direct access restore that step's initial state, independent of viewing
  history. Restart returns to the initial step in the default step-by-step mode.
- Scripted camera framing is applied at the beginning of each step. The player
  may then pan and zoom freely. Recenter restores the scripted framing;
  playback must not continually override the player's inspection.
- Close returns to the launching view: the original Management view or codex
  page, with the player's City unchanged.
- Closing discards demonstration progress. Reopening starts at the beginning;
  the step list permits jumping directly to any step. Persisted progress is
  outside the first version.

## First scenario: Factory interior — Simple

The user approved the following teaching outline. A numbered item below may
expand into multiple playback steps so each placement remains explicit:

1. Explain the goal and prerequisites of the layout.
2. Show the empty interior and its starting indicators.
3. Introduce and place a Machine that requires Drive.
4. Explain and place the Motor.
5. Build the transmission, explaining each individual placement.
6. Explain the required input ports and orientations.
7. Show the functioning Machine and the changed indicators.
8. Recap the layout, its benefit, and its electricity cost.

Flow, complex layouts and breakdowns belong to later learning levels.
The concrete Fixtures, cells, orientations and expected indicator values must
be verified against the current game when authoring the scenario.

## Acceptance criteria

- The Factory Simple scenario teaches a working first layout using the
  outline above, with detailed explanations and observable expected results.
- Replay from the same scenario start gives the same step states and teaching
  outcomes. Deliberate failures are reproducible and distinguished from failed
  expectations by the script.
- Previous, direct step selection and Restart restore the appropriate starting
  state, including simulation, layout, Staff, stocks, breakdowns and indicators,
  and reset the explanation and scripted camera framing.
- Pause freezes both scripted actions and demo simulation. Manual navigation
  leaves playback paused. Next never requires waiting for a reading timer.
- Free camera inspection and Recenter work without changing the demo's game
  state. Step descriptions and controls work in FR/EN and on touch devices.
- Opening, navigating, replaying and closing the demo do not alter the player's
  City, consume its resources, change unlocks or advance its clock. Time spent
  viewing does not trigger Catch-up after closing.
- Launch and return work from both Management view and codex. Existing examples
  and tutorials retain their distinct roles.
- The verification command can select one scenario or all scenarios. An
  unexpected outcome reports the scenario and step and fails the publication
  check.
- Browser verification uses the project's `?e2e` URL convention.

## Delivery sequence and boundaries

1. Implement the reusable isolated player, authoring and verification workflow,
   and Factory Simple scenario with both access points.
2. Validate the visible Factory Simple demonstration with the user.
3. Extend to all supported interior types and their useful learning levels.
   The complete feature is not finished at the Factory pilot.

The first version excludes exported video files, recorded voice, interactive
exercises and persisted viewing progress. The implementation should reuse the
existing interior engine and game rules; exact integration points remain an
implementation task rather than an assertion of existing playback support.

The user approved the overall scope and authorized implementation. The next
delivery gate is their visual validation of the Factory Simple pilot before
authoring the remaining interiors and levels.

## Pilot implementation notes

- The catalogue currently contains Factory Simple only (eight steps). Remaining
  interior types and levels are still to be authored after pilot validation.
- In-engine replay always uses the current rules. `npm run demonstrations:verify`
  checks all scripts; append `-- factory-simple` to select the pilot.
- Checkpoints capture the state at entry to a step, after its semantic entry
  commands have executed. Returning to that step repeats the same presentation.
- The City remains logically frozen. Its absolute timestamps are shifted while
  viewing so autosaves preserve the pause, with no economic Catch-up on exit.
  The adaptation grace period is preserved too.
- An active online Challenge prevents launching a demonstration, with an inline
  explanation: its server deadline cannot be suspended with the local City.
- No exported video file or persistent demonstration progress is created.

## Pilot validation record

- 29 targeted tests passed across the scenario runner, City pause, existing
  Catch-up and game store, Replan clock, Management rendering and codex rules.
- Full repository typecheck and focused ESLint passed.
- The verification command passed for all registered scenarios and for
  `factory-simple` selected explicitly.
- Browser inspection verified launch from codex and Management, direct step
  access, play/pause, previous-step indicators, restart, Escape returning to
  Management, and layouts at desktop and 390px mobile width.
- Four Playwright regression tests were added and their collection checked.
  The automated browser suite was not executed: this environment rejects the
  local server's listening socket. Interactive inspection used the project's
  existing development server instead.
- Vite production bundling succeeded. The complete `npm run build` pipeline
  stops earlier in the existing codex image generator because that generator
  needs to open a local port, which this environment rejects.
- Preview capture: `factory-simple.jpg` beside this specification.

## Existing domain constraints

- Venue, Production interior, Service interior and Home interior retain their
  own meanings (CONTEXT.md; ADR 0070 and ADR 0066).
- The Tutorial and Venue tutorials are distinct existing teaching mechanisms.
- ADR 0020 describes the Management view's separate interior scene and an
  aggregate simulation driven by an injected clock.
