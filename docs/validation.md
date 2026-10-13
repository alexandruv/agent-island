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
