# Agent Island

Read-only, synthetic visual MVP. Original three.js geometry evokes the operator's low-poly evening island reference; accessible station lanes provide the same details without WebGL, at 360px, or with reduced motion. Every snapshot is visibly **DEMO**. No host collection, secrets, action APIs, tracking, approvals or production controls exist. The Production bridge is permanently locked.

Use Node **22.12+** (Node 22 LTS recommended; validated here on 26.10.0), with npm and the committed lockfile:

```sh
npm ci
npm run build
npm test
npm run dev
```

Open the URL printed by Vite. Select the offline fixture to see cached/stale status and dimming. Click a robot/crate or focus its lane button and press Enter for details; Escape or Close dismisses and returns focus. “Use lane view” switches desktop presentation. Preview links are absent in this synthetic MVP; ready-for-human never means merged or serving.

Cloudflare Pages settings: **build command `npm ci && npm run build`**, **output directory `dist`**, root directory repository root, Node 22.12 or newer. `dist/index.html` and local `/assets/` files serve from the domain root. No server runtime, Functions, Worker, environment secrets or live service is needed. `npm run preview` is a local-only static verification server. Hosting configuration/deployment belongs to the operator; no deployment or verified preview URL is provided here.

The versioned normalized snapshot interface is in [src/contract.ts](src/contract.ts), documented in [docs/snapshot.md](docs/snapshot.md). [src/fixture.ts](src/fixture.ts) supplies only synthetic stable IDs. Later issues #2/#3 own collection and integration.

`npm test` runs contract, state, offline/unknown, detail content and built static asset checks; run the build first. Browser checks are opt-in:

```sh
npx playwright install chromium
npm run test:ui
```

Actual validation and the host-only browser block are recorded in [docs/validation.md](docs/validation.md). Operator browser verification remains pending before deployment. This candidate supersedes #1; its old worktree was read only as an untrusted source reference.
