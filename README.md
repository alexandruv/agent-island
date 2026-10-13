# Agent Island

Read-only, synthetic visual MVP. Original three.js geometry evokes the operator's low-poly evening island reference; accessible station lanes provide the same details in a slide-over and without WebGL. Every snapshot is visibly **DEMO**. No host collection, secrets, action APIs, tracking, approvals or production controls exist. The Production bridge is permanently locked.

Use Node **22.12+** (Node 22 LTS recommended; validated here on 26.10.0), with npm and the committed lockfile:

```sh
npm ci
npm run build
npm test
npm run dev
```

Open the URL printed by Vite. The isometric island fills the window beneath the slim header at every viewport, including phones. Station signs stay at 16 CSS pixels and are positioned without overlap; the camera fits the island and support landmarks on resize. On short windows, signs switch to compact rows when placement near their stations runs out of space. If even those rows cannot fit at 16px, the island area scrolls vertically to keep every sign readable. Robots and issue crates sit along the seven-station road. Hover an entity to see its robot/log or issue information in the header; tap or click it for details and the lane slide-over. “Lane view” opens the same panel; “Close lane view” dismisses it. Lane buttons support keyboard selection, Enter opens details, and Escape or Close dismisses the dialog and returns focus. Select the offline fixture for cached/stale status and dimming.

Reduced motion keeps the island and disables its animation loop, including when the preference changes while the page is open. WebGL initialization failure or context loss switches to lanes with a disabled “Lane view only” button. Preview links are absent in this synthetic MVP; ready-for-human never means merged or serving.

Each issue has a separate island crate bound to its stable ID, including both #105 and #107 at Rework. Select either crate to open that issue's details. Conflicting reworking/ready-for-human labels show Rework in both placement and detail text; needs-human takes priority over both.

Cloudflare Pages settings: **build command `npm ci && npm run build`**, **output directory `dist`**, root directory repository root, Node 22.12 or newer. `dist/index.html` and local `/assets/` files serve from the domain root. No server runtime, Functions, Worker, environment secrets or live service is needed. `npm run preview` is a local-only static verification server. Hosting configuration/deployment belongs to the operator; no deployment or verified preview URL is provided here.

The versioned normalized snapshot interface is in [src/contract.ts](src/contract.ts), documented in [docs/snapshot.md](docs/snapshot.md). [src/fixture.ts](src/fixture.ts) supplies only synthetic stable IDs. Later issues #2/#3 own collection and integration.

`npm test` runs contract/state, detail content, scene geometry/picking, framing, fixed-size sign clearance across 390–1440px, island occupancy, view control and built static asset checks; run the build first. Browser acceptance uses headless Chromium with `--use-gl=swiftshader`, builds automatically and serves `dist`:

```sh
npx playwright install chromium
npm run test:ui
```

The browser suite checks 1280×800, 1440×900 and 390×844, canvas size, hidden default lanes, sign rectangles through constrained-height resizes, selection, WebGL failure/context loss, reduced motion, and offline details. Height-only growth and shrinkage at a fixed 1280px width must refit the canvas to the window height minus the 72px header and keep every sign in bounds without overlap. Screenshots are saved to `test-results/island-1280.png`, `island-1440.png` and `island-390.png` and attached to the Playwright results. Attach these files to the PR after an authorized operator run if the managed host cannot launch Chromium.

Actual validation and the documented host-only browser restriction are recorded in [docs/validation.md](docs/validation.md). On the specifically documented restricted host, `ISLAND_BROWSER_HOST_BLOCKED=1 npm run test:ui` records explicit browser skips without launching Chromium. This is not an acceptance pass; normal browser runs omit that variable. Mini Ops’ reported eight-pass rendered run for PR #9 head `a14e92726290ca69fe1ec8c4d9581d1b76e74852` and unchanged in-repo screenshots are recorded there under issue #14. Independent screenshot/reference review and operator-only validation remain required before deployment.

For issue #14 review, open the committed [1280px](docs/acceptance/a14e927/island-1280.png), [1440px](docs/acceptance/a14e927/island-1440.png), and [390px](docs/acceptance/a14e927/island-390.png) PNGs directly from the checkout; GitHub comment access is unnecessary. Verify their recorded hashes with `shasum -a 256 docs/acceptance/a14e927/*.png` or `npm test`. Compare them with the operator reference image and issue #8 acceptance list; see [validation](docs/validation.md#issue-14-reviewer-readable-screenshots) for provenance and review status. A rendering change requires a fresh authorized browser run and screenshots for the new head; run `npm run test:ui -- --workers=1` with `ISLAND_BROWSER_HOST_BLOCKED` unset and require eight passes with zero failures or skips.
