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

## PR #12 authenticated review rework

2026-10-13, assigned `agent/issue-10` worktree, reviewed head `4f4716e`.

- PASS: `npm run build`, `npm test` (29 tests, zero failures/skips), and `git diff --check`. The existing approximately 508 kB scene chunk warning remains.
- PASS: unmatched WebSocket paths close promptly after 35 repeated attempts without blocking legitimate feed connections; an explicitly owned development HMR request is handed off. Real built preview rejects unmatched paths and Vite-protocol requests at `/`, with no ambient credentials. Exact health artifact and existing isolation/transport checks remain passing.
- PASS: a real fixture child ignores SIGTERM, is killed at the five-second SIGKILL deadline, and no longer exists; collection reports timeout and the next single-flight poll succeeds. Hostile inherited-property names and non-string statuses serialize as unknown agents and pass feed sanitization.
- PASS: `npm run test:ui -- --list` discovers four opt-in tests. NOT RUN: browser assertions retain the documented host launch denial; discovery is not execution. Live CLI/auth/Mini Ops schema, private access/TLS/proxy policy, optional Docker, browser/phone and deployment qualification remain operator-only and pending. No security controls were altered or host services activated.
- Usage remains `npm run build && npm test`, then configured synthetic `npm run preview`; hard timeout, unknown status and development-only HMR handoff behavior are documented in [collector-feed.md](collector-feed.md).

## PR #12 second authenticated review rework

2026-10-13, assigned `agent/issue-10` worktree, reviewed head `ea0fb468ffd185fe3d1a70b8014bddfdc072682a`.

- PASS: `npm run build`, `npm test` (31 passed, zero failures/skips), and `git diff --check`. The existing approximately 508 kB scene chunk warning remains.
- PASS: malformed non-string agent IDs, including two distinct arrays containing the same valid ID, are rejected before regex coercion; duplicate primitive string IDs remain rejected. Closed agents configured at station 3 move to Archive without a matching Mini Ops row, with invalid or failing Mini Ops data, and after a Mini Ops station override. Mini Ops-resolved closed state is also covered.
- PASS: fixture-backed built preview HTTP/WebSocket and exact health proof, bounded subprocesses, transport isolation and existing visual/geometry/static checks remain passing.
- PASS: `npm run test:ui -- --list` discovers four opt-in browser tests. NOT RUN: browser assertions retain the documented macOS startup denial; discovery is not execution. Real CLI/auth/Mini Ops schema, private access/TLS/proxy policy, optional Docker, browser/phone and deployment qualification remain operator-only and pending. No security controls were changed.
- Usage: `npm run build && npm test`, then `AGENT_ISLAND_FEED_CONFIG="$PWD/tests/fixtures/demo-feed.json" npm run preview` for a synthetic feed. String ID validation and post-resolution Archive placement are documented in [collector-feed.md](collector-feed.md).

## PR #12 third authenticated review rework

2026-10-13, assigned `agent/issue-10` worktree, reviewed head `b5948e6bf9e128e70478d67277983a009c8df04c`.

- PASS: `npm run build`, `npm test` (33 passed, zero failures/skips), and `git diff --check`. The existing approximately 508 kB scene chunk warning remains.
- PASS: real built preview rejects snapshot inputs inside `dist`, symlink aliases to those inputs, missing future inputs beneath a symlinked served directory, and configuration files inside served output. Tests use fabricated hostile extra fields and a minimal environment without ambient credentials. With inputs outside served directories, HTTP snapshots omit those fields, direct-file HTTP requests do not disclose them, and disallowed API origins remain forbidden. Startup checks also cover the Vite root, public directory, customized build output and development filesystem allow directories.
- PASS: collector Mini Ops unavailable/error/invalid fixtures with null heartbeats retain their precise failure state through FeedStore at fresh, stale and offline capture ages, and through served HTTP and WebSocket snapshots. Aggregate health stays offline/stale. Existing successful-heartbeat expiry, exact health bytes and visual tests remain passing.
- PASS: `npm run test:ui -- --list` discovers four opt-in browser tests. NOT RUN: browser assertions retain the documented macOS launch denial; discovery is not execution. Real CLI/auth/Mini Ops schema, private access/TLS/proxy policy, optional Docker, browser/phone and deployment qualification remain operator-only and pending. No security controls were altered.
- Usage: `npm run build && npm test`. Place feed configuration and snapshot inputs outside all served directories. For a synthetic preview, copy `tests/fixtures/demo-feed.json` to `/tmp/agent-island-demo-feed.json`, then run `AGENT_ISLAND_FEED_CONFIG=/tmp/agent-island-demo-feed.json npm run preview`. The Docker example now places its synthetic configuration outside `/app`; Docker execution remains untested.


## Issue #15 closed Paseo lifecycle correction

2026-10-13, assigned `agent/issue-15` worktree, based on PR #12 head `d4db722b8746a7939bb13ddf46fc7d26e954d12b`.

- PASS: `npm ci --cache /tmp/agent-island-issue-15-npm-cache`, `npm run build`, `npm test` (34 passed, zero failures/skips), and `git diff --check`. The default npm cache was outside writable roots; a temporary writable cache was used without changing permissions. The existing approximately 508 kB scene chunk warning remains.
- PASS: realistic Paseo `closed` fixtures reach Archive without a matching Mini Ops row, with missing/invalid data, unavailable data, source errors and station overrides. Unsupported `archived`, `initializing` and other unknown statuses remain unknown. Existing source failure, isolation and transport tests remain passing without secrets or live services.
- PASS: `npm run test:ui -- --list` discovers four opt-in browser tests. Browser assertions were NOT RUN; the documented host launch denial remains. Real CLI/auth/Mini Ops qualification, private access/TLS/proxy checks, browser/phone, optional Docker and deployment validation remain operator-only and pending.
- Usage: `npm ci && npm run build && npm test`; use a writable npm cache if the host default is restricted. Synthetic preview instructions and lifecycle mapping are in [collector-feed.md](collector-feed.md). No new configuration is required for closed agents.

## Issue #8 full viewport island

2026-10-13, assigned `agent/issue-8` worktree only.

- PASS: `npm ci --cache /private/tmp/agent-island-issue-8-npm-cache`, `npm run build`, and `npm test`: 15 Node tests passed, zero failures or skips. npm install-script controls were unchanged. Vite retains its approximately 510 kB lazy scene chunk warning.
- PASS: CPU regressions check all eleven station/support signs for visibility, bounds and mutual clearance across widths 390–1440px, fixed 16px text, geometry framing, selection and an island projected footprint of at least 60% of canvas width at the three acceptance sizes. Robot/log sprites are hidden; hover information is confined to the header, outside station signs. CPU tests do not establish rendered visual quality.
- HOST-ONLY SKIP: `ISLAND_BROWSER_HOST_BLOCKED=1 npm run test:ui` built and served `dist` and explicitly reported six skipped browser tests, zero browser passes. This uses the existing documented macOS Chromium bootstrap denial in [browser-host-block.log](browser-host-block.log); no denied launch was retried and no security controls were changed.
- PENDING OPERATOR VALIDATION: run `npm run test:ui` without the host-block variable on an authorized browser host. The six tests cover 1280×800, 1440×900 and 390×844 full viewport rendering, nonintersecting sign rectangles, hidden default lanes, slide-over/keyboard details, entity picking, WebGL failure/context loss and static reduced motion. They save `test-results/island-1280.png`, `island-1440.png`, `island-390.png` and attach them to Playwright results. No screenshots were produced on this restricted host; attaching those rendered screenshots to the PR and comparison against the reference remain pending before deployment.
- Usage: island rendering is the default on phones and desktops. “Lane view” opens the lane slide-over while keeping the island; clicking a robot or issue crate opens its details and lanes. Reduced motion stops animation instead of invoking fallback. Only unavailable WebGL or context loss invokes lane-only fallback. The site remains synthetic, read-only, and the Production bridge remains permanently locked.

## PR #9 authenticated review rework

2026-10-13, existing `agent/issue-8` worktree only.

- Fixed the unplaced-sign path: placement is computed for every station before applying offsets. If nearby rows cannot hold every sign, all eleven signs are repacked into deterministic shelves. A canvas shorter than those fixed-font shelves is fitted to their minimum height and scrolls vertically. No station sign is hidden or rendered at an unplaced anchor. Resizing starts from original anchors each time.
- PASS: `npm run build` and `npm test`: 16 Node tests, zero failures or skips. The new regression checks all sign bounds and pairwise clearance at short desktop/phone sizes, repeated resizing, and a 40px scene height. The existing approximately 511 kB scene chunk warning remains.
- Added Playwright coverage of actual HTML rectangles through 1280×300, 390×360, 600×320, 1440×260 and restored acceptance sizes. It verifies all eleven signs stay within the viewport without overlap and lanes remain hidden.
- HOST-ONLY SKIP: `ISLAND_BROWSER_HOST_BLOCKED=1 npm run test:ui` rebuilt and served `dist`, discovered seven tests and explicitly skipped all seven. Zero browser assertions passed and no screenshots were generated. The documented macOS bootstrap denial in [browser-host-block.log](browser-host-block.log) remains applicable; no denied launch was retried and no security controls changed.
- REVIEW FINDING STILL PENDING: this invocation has no permitted Chromium host. An authorized operator must run `npm run test:ui` without the skip variable and attach `test-results/island-1280.png`, `test-results/island-1440.png`, and `test-results/island-390.png` to existing PR #9. Playwright result attachments alone are not PR attachments. Browser acceptance, screenshot/reference review and independent operator validation remain pending before deployment.
- Usage: normal windows retain signs near their landmarks. Short windows use compact rows; extremely short windows allow vertical island scrolling. “Lane view”, entity details, read-only behavior and the locked Production bridge are unchanged.

## PR #9 height-only resize review rework

2026-10-13, existing `agent/issue-8` worktree only.

- Observe the parent viewport container instead of the explicitly sized scene host. Height-only window growth and shrinkage now trigger camera fitting, canvas sizing and sign placement independently of the previous canvas height.
- Added a browser regression at fixed width 1280px through heights 300 → 800 → 300 → 900 → 260 → 800. It waits for exact canvas dimensions (window height minus the 72px header), then checks all eleven rendered signs for bounds and pairwise nonintersection and verifies lanes stay hidden.
- PASS: `npm run build` and `npm test`: all 16 Node tests passed, zero failures or skips. The approximately 511 kB scene chunk warning remains.
- HOST-ONLY SKIP: `ISLAND_BROWSER_HOST_BLOCKED=1 npm run test:ui` rebuilt and served this candidate and reported eight skipped browser tests, zero executed browser assertions, zero browser passes, and no screenshots. The previously documented macOS Chromium bootstrap denial in [browser-host-block.log](browser-host-block.log) remains applicable; no denied launch was retried or security controls changed.
- PENDING: the rendered acceptance finding is still unresolved. On a permitted Chromium host, run `npm run test:ui` without the host-block variable against this candidate and attach `test-results/island-1280.png`, `test-results/island-1440.png`, and `test-results/island-390.png` to existing PR #9. Browser acceptance, reference comparison and independent operator validation remain required before deployment. Skipped tests and CPU projection checks are not rendered acceptance evidence.
- Usage: resizing only the window height now refits the island as well as resizing its width. Short-window compact rows and minimum-height scrolling retain readable signs; Lane view and read-only behavior are unchanged.

## PR #9 rendered acceptance review follow-up

2026-10-13, existing `agent/issue-8` worktree, reviewed implementation head `61ebe5b8ff8cb1d4b761b50b6eaf38c7ba4381b1`.

- PASS: reran `npm run build` and `npm test`: 16 Node tests passed, zero failures and zero skips. The approximately 511 kB scene chunk warning remains.
- HOST-ONLY SKIP: `ISLAND_BROWSER_HOST_BLOCKED=1 npm run test:ui` rebuilt and served `dist`, then reported eight skipped tests, zero browser passes and no screenshots. The documented Chromium bootstrap permission denial still applies on this restricted host; no denied launch was retried or security control changed.
- The structured finding requests rendered evidence, not another CPU regression. Existing browser tests already cover all three acceptance viewports, screenshot artifacts and rendered sign rectangles. No additional implementation or redundant test was added for this finding.
- Added explicit README instructions to associate an authorized rendered run with the current PR head, require eight passes with zero skips, compare screenshots against the reference and upload all three PNGs to existing PR #9. Local Playwright attachments do not satisfy PR attachment requirements.
- UNRESOLVED: no permitted Chromium execution host is available in this invocation. No rendered screenshots, reference comparison or screenshot attachments can be claimed. The finding and operator-only validation remain pending before deployment.

## Issue #11 rendered acceptance evidence

2026-10-13, assigned `agent/issue-11` worktree, fast-forwarded to PR #9 head `a14e92726290ca69fe1ec8c4d9581d1b76e74852`. All PR #9 island code and tests are retained unchanged. This documentation follow-up supersedes the historical pending rendered-run statements above.

- REPORTED PASS (operator evidence supplied in issue #11): Mini Ops ran `npm run test:ui` on an unsandboxed host against tested SHA `a14e92726290ca69fe1ec8c4d9581d1b76e74852`, without `ISLAND_BROWSER_HOST_BLOCKED`: **8 passed / 0 skipped / 0 failed**. This is the operator's rendered run, not a browser pass performed by this developer.
- Historical PR #9 screenshot attachments (superseded by the committed evidence below): [screenshot attachment comment 1](https://github.com/alexandruv/agent-island/pull/9#issuecomment-6147332433), [screenshot attachment comment 2](https://github.com/alexandruv/agent-island/pull/9#issuecomment-6147336897). Together these contain `island-1280.png`, `island-1440.png`, and `island-390.png`. These are the supplied attachment comment links; retain them with the tested SHA in the candidate PR.
- PASS (local clean install): `npm ci --cache /private/tmp/agent-island-issue-11-npm-cache`, `npm run build`, and `npm test`: 16 Node tests passed, zero failures and zero skips. No secrets or live services were used. npm reported zero audit vulnerabilities and two install scripts outside the host allowScripts policy; that policy was left unchanged. Vite retains the approximately 511 kB lazy scene chunk warning.
- HOST-ONLY SKIP (local): `ISLAND_BROWSER_HOST_BLOCKED=1 npm run test:ui` builds and serves `dist`, with **0 passed / 8 skipped / 0 failed**. No local browser assertions or screenshots are claimed. The documented `MachPortRendezvousServer` / permission denial 1100 in [browser-host-block.log](browser-host-block.log) remains applicable; no denied launch was retried or security controls changed.
- PENDING INDEPENDENT REVIEW: compare all three in-repo screenshots listed under issue #14 against `/Users/dev/agent-worktrees/agent-island-operator/agent-island-reference.jpg` and issue #8: full-viewport canvas, no fallback text, lane grid hidden by default, non-overlapping station labels, and fitted island at 390px. The supplied browser pass does not itself establish that independent visual comparison. The orchestrator's separate reviewer performs it; operator-only validation remains required before deployment.
- Usage: `npm ci && npm run build && npm test`, then `npm run dev` or `npm run preview`. On an authorized Chromium host, run `npm run test:ui` with the host-block variable unset. Existing tests capture all three acceptance screenshots. No rendering code changed for #11; the reported rendered evidence applies to the unchanged PR #9 implementation.

## Issue #14 reviewer-readable screenshots

2026-10-13, assigned `agent/issue-14` worktree, fast-forwarded to the required PR #13 head `78fdaf217f9488924a08b9a95fd87b9fb6fc0400`. Rendering code remains unchanged from tested SHA `a14e92726290ca69fe1ec8c4d9581d1b76e74852`.

- REPORTED PASS (Mini Ops evidence supplied in issue #14): unsandboxed `npm run test:ui` against that tested SHA: **8 passed / 0 skipped / 0 failed**. This is the operator's run, not this developer's local browser execution.
- PASS: copied the three operator PNGs unchanged into the repository and verified each SHA-256 against issue #14. These checkout-readable files supersede reliance on PR #9 comment attachments:

| Screenshot | SHA-256 |
| --- | --- |
| [island-1280.png](acceptance/a14e927/island-1280.png) | `13e1a96f5fd94f426f8d4b11c6f57627887d3fd6642997808a93426afe98313e` |
| [island-1440.png](acceptance/a14e927/island-1440.png) | `681f4442e908ea81eb95e9584fbb001c70e0f546ee19fd44ec1d29348716063e` |
| [island-390.png](acceptance/a14e927/island-390.png) | `a3b6c2827c05ea7ce2c4d2ca0ee290ba1693bf1e700716da1fff9cda1194ced0` |

- PASS: fresh `npm ci --cache /private/tmp/agent-island-issue-14-npm-cache`, `npm run build`, and `npm test`: **17 passed / 0 skipped / 0 failed**, including a new checksum regression for the committed evidence. No secrets or live services were used. npm reported zero vulnerabilities and two scripts outside the host allowScripts policy, which remains unchanged. The existing approximately 511 kB Vite scene chunk warning remains.
- HOST-ONLY SKIP (local): `ISLAND_BROWSER_HOST_BLOCKED=1 npm run test:ui`: **0 passed / 8 skipped / 0 failed**. No Chromium launch was attempted; the documented permission denial remains applicable. No local rendered pass is claimed and no security controls changed.
- PENDING INDEPENDENT REVIEW: the orchestrator's separate read-only reviewer must open these in-repo screenshots and compare them with `/Users/dev/agent-worktrees/agent-island-operator/agent-island-reference.jpg` and issue #8: full-viewport canvas, no fallback text, lane grid hidden by default, non-overlapping station labels, and phone fit at 390px. Committing verified evidence does not claim that review has passed. Operator-only validation remains pending before deployment.
- Usage: open the PNG links above from the checkout, then run `shasum -a 256 docs/acceptance/a14e927/*.png` to authenticate the files. `npm ci && npm run build && npm test` validates the app and evidence without a browser; `npm run dev` or `npm run preview` serves the app locally.

## Issue #3 live integration candidate

2026-10-13, assigned `agent/issue-3` checkout, single developer. Dependencies #1 and #2 were closed before implementation; merged UI and collector/feed code is present in this main-derived baseline. No other checkout or branch was changed.

- PASS: fresh `npm ci --cache /private/tmp/agent-island-issue-3-npm-cache` (zero audit vulnerabilities). Host install-script policy remains unchanged.
- PASS: `npm run build` (TypeScript and Vite), `npm test` (42 tests, zero failures/skips) and `git diff --check`. Existing lazy Three.js chunk warning is approximately 511 kB.
- New CPU/client checks exercise bounded jittered reconnect, resumed snapshots, silent peer expiry, cached identities, source versus transport freshness, source failure/Mac offline, stable detail identity through movement/archive/removal, duplicate rejection, and empty/multi-agent scenes. The built app test invokes `npm start` without ambient credentials and checks exact runtime `/health` MAO values, rejected POST, existing built `/health.json` bytes, HTTP snapshot and WebSocket feed. An initial test harness expectation assumed the loopback URL in stdout; it was corrected for the required 0.0.0.0 listener, then the suite passed.
- HOST-ONLY SKIP: `ISLAND_BROWSER_HOST_BLOCKED=1 npm run test:ui -- --workers=1` builds/serves the app and reports 12 explicit skips, zero browser passes. The previously documented macOS Chromium bootstrap denial applies; no denied launch was retried and no security control was changed. Added reproducible 360/390/1280px live-feed checks cover keyboard details, movement/archive/removal, disconnect/reconnect and readable signs, alongside desktop/demo screenshots, reduced motion and WebGL fallback. Operator must run with the skip variable unset and require 12 passes/zero skips. Prior committed screenshots describe an older revision, not this candidate; fresh screenshots and visual reference review remain pending.
- OPERATOR PENDING: trusted collector/Mini Ops projection qualification, private authentication/TLS/origins, isolated Docker qualification, actual protected preview routes and phone rendering. Backend strips logs and serving/merge metadata; a separately reviewed trusted adapter is needed to supply those facts. No live configuration, installation, public route, deployment, merge or approval was activated. Production remains locked. Candidate PR is for independent review; canonical ready_for_human completion belongs to that review.

Usage: see README production start instructions and collector-feed.md for explicit public demo versus private sanitized startup. `/health` is exact runtime identity; `/health.json` remains build proof; neither implies a healthy Mac. No phone-ready URL has been invented.
