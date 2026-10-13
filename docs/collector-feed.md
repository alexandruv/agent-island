# Read-only collector and feed

Issue #10 adds collection and transport. The existing island and phone lanes remain explicitly synthetic; consuming live entities in that UI belongs to #3. No action endpoint exists. GET `/api/snapshot` shows an unavailable, empty, offline/stale live snapshot by default, rather than substituting demo data. `/api/feed` is the WebSocket endpoint. These routes exist on Vite dev and preview servers; static Cloudflare Pages does not run this server and cannot provide a WebSocket feed. Production remains locked.

## Local build and synthetic run

Node 22.12+:

```sh
npm ci
npm run build
npm test
cp tests/fixtures/demo-feed.json /tmp/agent-island-demo-feed.json
AGENT_ISLAND_FEED_CONFIG=/tmp/agent-island-demo-feed.json npm run preview
```

Visit `http://127.0.0.1:4173`. The feed reports `status.source: "demo"`; the unchanged visual UI is always DEMO. Without the startup configuration the feed reports unavailable. Development uses `npm run dev` on loopback. No collector is started by either command, tests or build. Tests use fabricated command/file/feed data and run an actual built preview with a minimal environment containing no ambient credentials. Browser checks are opt-in (`npm run test:ui`); the existing host browser denial remains documented in validation.md.

The optional Dockerfile runs **synthetic** preview only: no Paseo executable/socket, Mac home, GitHub/Cloudflare credentials or host commands are provided. Example operator-local container invocation (not executed by this task):

```sh
docker build -t agent-island-demo .
docker run --rm --read-only --cap-drop ALL --security-opt no-new-privileges --tmpfs /tmp -p 127.0.0.1:4173:4173 agent-island-demo
```

Do not mount host homes, sockets or credentials. A container is not a host collector. Docker build/run qualification is operator-only and not claimed as tested here. Public/static preview stays synthetic unless the operator explicitly supplies an approved sanitized feed.

## Separately operator-managed collector

Run only on a machine where these exact read-only sources have already been authorized. This implementation does not install a host service, authenticate GitHub, request permissions or change credentials. Save startup configuration outside version control, using absolute paths, for example:

```json
{
  "repo": "alexandruv/agent-island",
  "allowedRepos": ["alexandruv/agent-island"],
  "cwd": "/operator/authorized/project",
  "agents": [{"id": "operator-selected-paseo-id", "name": "Builder", "station": 3}],
  "outputFile": "/operator/private-export/snapshot.json",
  "intervalMs": 10000
}
```

```sh
npm run collect -- /absolute/operator-collector.local.json
```

The operator supplies the repository allowlist, working directory and exact agent IDs/benign display aliases at startup. No HTTP or WebSocket parameter affects these values. Repository names must match OWNER/REPO syntax and the allowlist. Names accept only short plain ASCII letters, numbers, spaces, underscores and hyphens. Agent IDs are hashed into stable opaque display IDs; other projects' agents and permits are omitted.

The CLI help and installed JSON renderer were inspected without contacting the live daemon. Fixed subprocess argv, no shell:

- `paseo ls --all --json` in the configured working directory (no global scan).
- `paseo permit ls --json`, with results matched only to allowlisted agents; no descriptions or permission IDs exported.
- `gh issue list --repo OWNER/REPO --state all --limit 100 --json number,labels,closedAt`. Uses already provisioned authentication. No `gh auth`, generic API, mutation or credential discovery.
- A bounded read of exactly `/Users/dev/.mini-ops/state.json`.

Each process has a five-second hard timeout using SIGKILL (including children that ignore SIGTERM) and a 256 KiB stdout/stderr limit. Timeout failures settle collection so subsequent polls can proceed. File reads reject symlinks and non-regular files, check size, read at most 256 KiB plus one sentinel byte, and reject oversized or malformed data even if a file grows. At most one collection is active; a polling delay of 10–300 seconds starts after the preceding collection completes. Failures never export command output, stderr, exception messages or paths.

Paseo JSON is an array of list items: only allowlisted `id` and enumerated `status` are used (`running`, `idle`, `error`; unrecognized values, inherited Object property names and non-string values are unknown). This installed CLI does not expose reliable context percentages or archive timestamps in its list projection. Pending permit presence overrides agent state to waiting-permit. Explicit Mini Ops display fields can supply closed/archive, stuck and context; absent values remain unknown.

The narrowly supported Mini Ops display projection is:

```json
{
  "projects": {
    "alexandruv/agent-island": {
      "heartbeatAt": "2026-10-13T15:00:00Z",
      "agents": [{"id": "operator-selected-paseo-id", "state": "working", "station": 3, "contextPercent": 42}]
    }
  }
}
```

Only the selected project, heartbeat, allowlisted agent IDs, enumerated state/station and finite 0–100 context percentages are parsed. All other state fields are discarded. **The real host state schema and freshness have not been qualified.** If that deployment does not supply this projection, Mini Ops is invalid/unavailable and live health stays offline/stale. The operator must qualify a compatible display projection or separately provide a sanitized feed; do not rewrite the orchestrator's workers/state, install services, or fabricate host health to work around that blocker.

## Sanitized feed interface and privacy

Collector output is the schemaVersion 1 Snapshot from `src/contract.ts`, plus `sources` and nullable `heartbeatAt` (types in `server/collector.ts`). A separate operator-managed feed can produce the same JSON. The app reads a fixed operator-selected file; it never fetches arbitrary remote URLs or executes host commands. An operator can transfer **only that sanitized file** into an isolated server. No HTTP upload or collector control route exists.

An explicitly approved sanitized-server startup configuration:

```json
{
  "mode": "sanitized",
  "snapshotFile": "/operator/sanitized-input/snapshot.json",
  "origins": ["https://operator-approved-preview.example"],
  "revision": "0123456789abcdef0123456789abcdef01234567"
}
```

Use `AGENT_ISLAND_FEED_CONFIG=/absolute/feed.local.json npm run preview`. Modes are `unavailable` (default), `demo` and `sanitized`. Configuration is validated once at startup. Both the configuration file and snapshot input must live outside the Vite root, public directory, build output and development filesystem allow directories. Startup rejects paths inside these directories, including symlink aliases and missing files beneath symlinked directories, so static serving cannot bypass sanitization. Keep these directories separate throughout runtime; do not move or link private inputs into served directories. The sanitized mode is **explicit operator authorization to disclose that projection to clients**. Keep live exports private by default, in an operator-protected directory; private deployments require operator-managed authentication/network isolation in front of this server. Origin checks are browser isolation, not authentication. No live mode is activated here. Public mode must use demo or a separately reviewed sanitized export. Never put raw Mini Ops state in the app container.

The app independently reconstructs every field from the export, enforces size/count/schema limits, requires primitive string agent IDs matching `agent-` plus 32 lowercase hexadecimal characters, rejects duplicate IDs and future timestamps, and discards names, titles, logs, metadata and arbitrary properties. Agent display names become generic; issue titles are `Issue #N`. This deliberately omits hostile text and secrets rather than relying on regex redaction. Only known stage labels survive. Logs always stay null because no explicitly sanitized bounded log source exists. Claims, merge timestamps, serving-preview metadata and preview URLs remain absent: none of the currently selected CLI fields attests to those facts. Labels never imply merged or serving. A future trustworthy metadata source requires a separately reviewed adapter.

Retention is one atomically replaced mode-0600 output file and one in-memory latest sanitized snapshot; no history, raw logs or raw source files are stored. Failed app reads retain the last sanitized snapshot as offline/stale `cache`. Remove the export when retiring the feed; the app never serves paths or raw files through its API.

## Failure and transport semantics

`sources` separately reports Paseo, permits, GitHub and Mini Ops as `ok`, `unavailable`, `unauthenticated` (gh exit 4), `timeout`, `error`, `invalid`, `stale` or `offline`. Successful empty arrays are `ok`; source failures are not empty-success. Source failure sets aggregate stale. Feed freshness preserves unavailable, unauthenticated, timeout, error and invalid source states, even when their heartbeat is null or the snapshot expires; only successful heartbeat health becomes stale/offline. After permit and Mini Ops state resolution, every closed agent is placed in Archive, even when its configured station is active or its Mini Ops row is missing, invalid or unavailable. Mac online requires available Paseo and a valid Mini Ops heartbeat. Heartbeat older than 30 seconds is stale; older than 120 seconds is offline. Future timestamps beyond five seconds are invalid. Feed snapshots also expire based on capture age, so a collector that stops writing cannot remain online. Collector capture time does not renew the Mini Ops heartbeat.

WebSocket connects receive `{ "type": "snapshot", "snapshot": ... }` immediately. Every ten seconds the server refreshes once, broadcasts a snapshot and sends `{ "type": "heartbeat", "at": "ISO timestamp" }` and a protocol ping. A missing pong closes the connection at the next tick. Application messages close with code 1008; frames over 1024 bytes close with 1009. No inbound operation invokes an action. Maximum 32 connections, 256 KiB buffered outbound data, ten connection attempts per remote address per minute, and 128 bounded rate-limit entries. Compression is disabled. Exact startup-configured browser origins are mandatory for WebSocket upgrades; missing/unapproved origins are rejected. Initial GET snapshots reject unapproved supplied origins; there is no CORS wildcard. Errors are fixed short responses. Every unmatched upgrade path is immediately closed, including requests advertising Vite protocols in preview. Only the development server explicitly hands its configured HMR path and `vite-hmr`/`vite-ping` protocol to Vite; Vite retains its own token/origin checks. Preview has no HMR handoff.

Clients should reconnect with jittered exponential backoff (1, 2, 4, 8, 16, then at least 30 seconds), reset after a stable connection, and mark stale/offline on missing heartbeats. Do not use reconnect loops as a poller. Server limits remain enforced across reconnects; the UI integration is deferred to #3.

The starting static MVP contains **no health JSON or revision endpoint**. This change adds exact `/health.json` proof `{ "status": "ok", "revision": "<40-char SHA or unknown>" }` serialized without spaces/newline. Build with `AGENT_ISLAND_REVISION=<SHA> npm run build` and use the same revision in runtime configuration; preview startup rejects a mismatch with the built proof. Health proves application revision, never Mac connectivity. Tests compare runtime bytes with the built health artifact. Existing static assets and visual behavior are preserved. Static Pages can serve the built health artifact but requires a separately qualified transport for live snapshots; no deployment is performed here.

## Operator qualification before live exposure

Verify authorized repository/agent selection, CLI versions and real Mini Ops display schema; observe empty, unauthenticated, daemon-unavailable and heartbeat-offline behavior without approving permits. Independently review redaction using fabricated hostile/secret strings. Verify file directory protections and any private front-end authentication, TLS, proxy origin policy and rate limits. Confirm feed shutdown becomes stale/offline, revision matches the build, and isolated preview contains no host mounts/credentials. Browser/phone and optional container checks remain pending. Mini Ops owns independent review, merge and publishing; production remains locked.
