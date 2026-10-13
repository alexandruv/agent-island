# Issue #4 validation

2026-10-13, assigned `agent/issue-4` worktree only.

- PASS: fresh `npm ci` (28 packages, zero audit vulnerabilities), TypeScript check and Vite static build. Node 26.10.0, npm 11.19.1. Host default npm cache was unwritable; used `--cache /private/tmp/agent-island-issue-4-npm-cache` without altering permissions. Install script policy was left intact.
- PASS: seven Node tests covering station/claim mapping, explicit merge/preview metadata, preview provenance and URL restrictions, offline/stale/unknown state, fixture IDs/states, detail content and static entry/import references.
- Build emits `dist/index.html`, CSS and two local JS assets. Three.js is lazy-loaded; Vite reports a roughly 505 kB scene chunk warning. No runtime server or secrets are needed.
- BLOCKED: phone 360px/keyboard/dialog, desktop/WebGL/fallback and reduced-motion browser assertions. Initial Playwright invocation found no installed browser. Installed Chromium into a writable temporary cache, then attempted the suite with one worker and max-failures=1. macOS denied browser startup before any assertion: `bootstrap_check_in ... Permission denied (1100)`. One launch failed, two tests did not run. No screenshots or visual/phone success claims are supplied.
- Evidence: [browser-host-block.log](browser-host-block.log). No denied launch was retried; no OS/security control was altered. Operator browser/phone verification and independent review remain pending before deployment.

No preview was deployed, and production is untouched.

## PR #5 review rework

- PASS: fresh `npm ci --cache /private/tmp/agent-island-issue-4-npm-cache`, then `npm run build && npm test`. All ten tests passed, with no skipped Node tests. The build still reports its roughly 506 kB lazy scene chunk warning. npm reported two install scripts not covered by the host allowScripts policy; that policy was left unchanged and install/build completed successfully.
- PASS: new CPU-only three.js regressions verify that the relocated rear peak does not intersect the Build workshop, Builder or station sign and does not intercept their default-camera picking rays. Separate crates preserve every fixture issue ID; rays select #105 and #107 independently. Conflicting reworking/ready labels keep placement, state and detail text consistent in either label order.
- NOT RUN (known host block): updated opt-in desktop assertions now click Builder and both Rework crates on the canvas and check each dialog's stable ID. Browser startup was already denied by this host as recorded above; the denied launch was not retried. These assertions and visual/phone verification remain pending for the operator. CPU geometry tests do not establish browser rendering success.

## PR #5 second authenticated review rework

- PASS: fresh `npm ci --cache /private/tmp/agent-island-issue-4-npm-cache`, `npm run build`, and `npm test`: 12 tests passed, zero failures or skips. Static entry/import checks pass. Install script policy remains unchanged; Vite retains the roughly 506 kB lazy scene chunk warning.
- PASS: CPU picking regression now builds the complete application scene, including every decorative sign, with a texture-free material factory. It verifies Reviewer head clearance from the relocated Rework sign, Reviewer/Builder and both Rework crate IDs, and selection through a deliberately overlapping decorative sprite. Browser and tests share the scene factory and entity picker.
- PASS: view-control regression exercises startup fallback, repeated attempted toggles, normal renderer toggles, and context loss. Unavailable rendering always leaves lanes visible with a disabled “Lane view only” control.
- PASS: `npm run test:ui -- --list` discovers all three opt-in browser tests. Desktop assertions now include Reviewer selection, and WebGL/reduced-motion fallback assertions attempt the disabled toggle and retain lanes.
- NOT RUN (documented host BLOCKED): browser assertions and visual/phone checks remain pending because the earlier macOS browser startup denial occurred before assertions. No denied launch was retried or security controls changed. Discovery and CPU tests are not browser execution passes. Operator-only browser validation remains pending before deployment.

## PR #5 third authenticated review rework

- PASS: fresh `npm ci --cache /private/tmp/agent-island-issue-4-npm-cache`, `npm run build`, and `npm test`: 13 tests passed, zero failures or skips. Build produces the static root entry and local assets. Install script controls remain unchanged; the lazy scene chunk warning is approximately 507 kB.
- PASS: camera regression projects every content mesh bound and every sign rectangle at scene widths 608, 900 and 1024px (700px height), including Archive and Production. Ocean is decorative background and excluded from fitting. Every label uses a fixed 32px texture font at 2x resolution, rendered as 16 CSS pixels; no long-label font reduction remains. This numerical legibility check does not establish visual layout quality.
- PASS: `npm run test:ui -- --list` discovers four tests. Desktop picking now uses the fitted application camera at a 1440px viewport. Added browser assertions require all nine lane sections, no horizontal overflow, Intake and Archive details, and locked Production text at 761/1024/1280px.
- NOT RUN (documented host BLOCKED): browser assertions and screenshots remain pending because of the previously recorded macOS startup denial. No denied launch was retried or security controls changed. Operator desktop sign readability/overlap and phone checks remain required before deployment.
- Usage: viewports through 1300px use lanes; larger viewports can render the fitted island or switch to lanes. Resize keeps content within the camera and labels at a fixed CSS font size.


## Issue #6 Intake clearance

2026-10-13, assigned `agent/issue-6` worktree only, fast-forwarded to the required PR #5 head `243db7eef3a4478e742288415c6d03965dc37b51` before changes.

- PASS: fresh `npm ci --cache /private/tmp/agent-island-issue-6-npm-cache`, `npm run build`, and `npm test`: 14 tests passed, zero failures or skips. The temporary cache stays within writable paths; npm install-script controls were left intact. Static root entry and emitted asset/import checks pass. The existing lazy scene chunk warning is approximately 508 kB.
- PASS: the new regression initially failed on Intake/Dockhand projected rectangle overlap at 608px. It now checks all eleven station/support signs against all nine robot/log/permit labels at every integer scene width from 608 through 1024px (700px height), then repeats 1024/900/608px to exercise resizing. Every pair has at least 2 CSS pixels of screen-space clearance. Labels retain their fixed font and original world anchors; only colliding labels receive vertical offsets after camera fitting. Existing geometry, framing, font-size and picking tests still pass.
- PASS: `npm run test:ui -- --list` discovers all four opt-in browser tests.
- BLOCKED / NOT RUN: browser assertions and screenshots remain pending under the documented macOS launch denial (`bootstrap_check_in ... Permission denied (1100)`), with evidence in [browser-host-block.log](browser-host-block.log). No denied launch was retried or security control changed. CPU projection tests and browser discovery do not establish rendered visual success. Operator browser/phone validation remains pending before deployment.
- Usage: `npm ci && npm run build && npm test`, then `npm run dev` or local `npm run preview`. In the desktop island view, robot/log labels automatically clear station signs as the scene resizes; lane fallback and the permanently locked Production bridge are preserved.

## Issue #10 collector and feed

2026-10-13, assigned `agent/issue-10` worktree only; baseline is merged PR #7 (`3220218`). No additional worktree or agents were created.

- PASS: TypeScript and Vite build; Node suite passes 26 tests with zero failures/skips. New tests cover fixed read-only argv/cwd and repository/agent allowlists, permit priority, working/idle/failure/archive/context unknowns, independent errors versus successful empty sources, stale/offline heartbeats, single flight, hostile strings and fabricated secrets, large-file rejection, real subprocess output/timeout bounds, sanitized export reconstruction and cached retention, WebSocket origin/reconnect rate limits/heartbeats/dead peers/oversized frames, and exact health bytes. Existing visual contract/geometry/static checks remain passing. The pre-existing approximately 508 kB scene chunk warning remains.
- PASS: built Vite preview is started by the suite with a minimal environment and no ambient GitHub/Paseo/Cloudflare credentials; its root page, initial demo snapshot, WebSocket snapshot and health bytes are verified. No live host data or real secrets are used by tests. Startup config explicitly marks this run demo.
- PASS: `npm run test:ui -- --list` discovers the existing four browser tests. This is discovery, not a browser execution pass.
- NOT RUN / OPERATOR PENDING: opt-in browser/phone assertions retain the documented macOS browser startup denial. No denied launch was retried or security control changed. Optional Docker build/run, real CLI/auth/source and Mini Ops schema qualification, private authentication/TLS/proxy checks and deployment remain operator-only. No host service, credentials, permissions, orchestrator worker changes, merge or deployment were performed.
- LIMITATION: baseline contains no health JSON/revision endpoint; the new exact `/health.json` proof is tested against its built artifact. Live UI rendering remains #3. Real Mini Ops schema compatibility has not been claimed; unsupported state yields invalid/offline/stale as documented in [collector-feed.md](collector-feed.md).
