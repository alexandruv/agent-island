# Agent Island

Read-only, synthetic visual MVP. Original three.js geometry evokes the operator's low-poly evening island reference; accessible station lanes provide the same details without WebGL, at 360px, or with reduced motion. Every snapshot is visibly **DEMO**. No host collection, secrets, action APIs, tracking, approvals or production controls exist. The Production bridge is permanently locked.

Use Node **22.12+** (Node 22 LTS recommended; validated here on 26.10.0), with npm and the committed lockfile:

```sh
npm ci
npm run build
npm test
npm run dev
```

Open the URL printed by Vite. Select the offline fixture to see cached/stale status and dimming. Click a robot/crate or focus its lane button and press Enter for details; Escape or Close dismisses and returns focus. At viewport widths through 1300px, the dashboard uses readable lanes so every station, Archive and the locked Production city remain available. Above 1300px, “Use lane view” switches desktop presentation when a renderer is available. Island labels retain a 16px CSS font without shortening long labels; the camera fits geometry and label bounds on resize. Robot, permit and log labels shift vertically in screen space to keep station signs clear; resizing recomputes those offsets from their original anchors. Reduced motion, unavailable WebGL, and context loss keep the lanes visible with a disabled “Lane view only” button. Decorative signs do not consume robot/crate selection. Preview links are absent in this synthetic MVP; ready-for-human never means merged or serving.

Each issue has a separate island crate bound to its stable ID, including both #105 and #107 at Rework. Select either crate to open that issue's details. Conflicting reworking/ready-for-human labels show Rework in both placement and detail text; needs-human takes priority over both.

Cloudflare Pages settings: **build command `npm ci && npm run build`**, **output directory `dist`**, root directory repository root, Node 22.12 or newer. `dist/index.html` and local `/assets/` files serve from the domain root. No server runtime, Functions, Worker, environment secrets or live service is needed. `npm run preview` is a local-only static verification server. Hosting configuration/deployment belongs to the operator; no deployment or verified preview URL is provided here.

The versioned normalized snapshot interface is in [src/contract.ts](src/contract.ts), documented in [docs/snapshot.md](docs/snapshot.md). [src/fixture.ts](src/fixture.ts) supplies only synthetic stable IDs. Later issues #2/#3 own collection and integration.

`npm test` runs contract, state, offline/unknown, detail content, scene framing, fixed-size label legibility, station/robot/log screen-space clearance at 608–1024px and geometry/ray-picking and built static asset checks; run the build first. Browser checks include 761/1024/1280px lanes, desktop Builder and both Rework crate selection, and are opt-in:

```sh
npx playwright install chromium
npm run test:ui
```

Actual validation and the host-only browser block are recorded in [docs/validation.md](docs/validation.md). Operator browser verification remains pending before deployment. This candidate supersedes #1; its old worktree was read only as an untrusted source reference.
