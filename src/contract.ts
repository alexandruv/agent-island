/** Versioned, sanitized read-only boundary for the next backend. No host data is read here. */
export type Station = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 'archive';
export type AgentState = 'working' | 'idle' | 'waiting-permit' | 'failed' | 'stuck' | 'needs-human' | 'closed' | 'unknown';
export interface Agent { id: string; name: string; station: Station; state: AgentState; contextPercent: number | null; latestLog: string | null }
export interface Issue { id: string; number: number; title: string; labels: string[]; authorizedPendingClaim: boolean; mergedAt: string | null; previewReadyAt: string | null; closedAt: string | null }
export interface Snapshot {
  schemaVersion: 1;
  project: { id: string; name: string };
  capturedAt: string;
  status: { online: boolean; stale: boolean; source: 'demo' | 'live' | 'cache' };
  agents: Agent[];
  issues: Issue[];
  previewUrl: string | null;
}
export const stations = [
  [1, 'Intake dock', 'Arrival & triage'], [2, 'Queue yard', 'Worker radar'],
  [3, 'Build workshop', 'Developer · medium'], [4, 'Review tower', 'Reviewer · high'],
  [5, 'Rework shed', 'Senior · xhigh'], [6, 'Merge gate', 'Human handoff'],
  [7, 'Preview storefront', 'Link only with real metadata'],
] as const;
export function safePreviewUrl(url: string | null): string | null {
  if (!url) return null;
  try { const u = new URL(url); return u.protocol === 'https:' && !u.username && !u.password ? u.href : null; } catch { return null; }
}
export function actualPreviewUrl(s: Snapshot): string | null {
  // Synthetic and cached snapshots cannot attest to a serving preview.
  return s.status.source === 'live' && s.status.online && !s.status.stale &&
    s.issues.some(i => i.mergedAt && i.previewReadyAt) ? safePreviewUrl(s.previewUrl) : null;
}
export function issueStation(issue: Issue, previewUrl: string | null): Station {
  if (issue.mergedAt) return issue.previewReadyAt && safePreviewUrl(previewUrl) ? 7 : 6;
  if (issue.closedAt) return 'archive';
  if (issue.labels.includes('agent:needs-human') || issue.labels.includes('agent:reworking')) return 5;
  if (issue.labels.includes('agent:ready-for-human')) return 6;
  if (issue.labels.includes('agent:under-review')) return 4;
  if (issue.labels.includes('agent:working')) return 3;
  if (issue.labels.includes('agent:queued') || issue.authorizedPendingClaim) return 2;
  return 1;
}
export function issueState(i: Issue, url: string | null): string {
  if (i.mergedAt) return issueStation(i, url) === 7 ? '↗ Preview available' : '✓ Merged';
  if (i.closedAt) return '◇ Closed';
  if (i.labels.includes('agent:needs-human')) return '☁ Needs you';
  if (i.labels.includes('agent:ready-for-human')) return '! Ready for human · merge unconfirmed';
  return ({1:'↓ Intake',2:'▣ Queued',3:'⚒ Working',4:'◎ Under review',5:'↺ Reworking'} as Record<string,string>)[issueStation(i,url)] ?? '? Unknown';
}
export const symbols: Record<AgentState, string> = { working:'⚒',idle:'zzz', 'waiting-permit':'!',failed:'×',stuck:'×', 'needs-human':'☁ Needs you',closed:'◇',unknown:'?' };
export function contextText(value: number | null): string { return value === null || !Number.isFinite(value) || value < 0 || value > 100 ? 'Context unknown' : `Context ${value}%`; }
export function statusText(s: Snapshot): string { return `${s.status.source.toUpperCase()} · ${!s.status.online ? 'Mac offline · cached data stale' : s.status.stale ? 'Stale snapshot' : 'Online'} · captured ${s.capturedAt}`; }

/** Detail content is plain text. latestLog must already be sanitized upstream. */
export function agentDetails(a: Agent): string[] {
 return [`Stable ID: ${a.id}`, `State: ${a.state} · ${symbols[a.state]}`, contextText(a.contextPercent), a.latestLog === null ? 'Latest log: not supplied' : `Latest sanitized log: ${a.latestLog}`];
}
export function issueDetails(i: Issue, url: string | null): string[] {
 return [`Stable ID: ${i.id}`, issueState(i,url), `Labels: ${i.labels.join(', ') || 'none supplied'}`, `Authorized pending claim: ${i.authorizedPendingClaim}`, `Merged: ${i.mergedAt || 'not confirmed'}`, `Preview ready: ${i.previewReadyAt || 'not confirmed'}`, `Closed: ${i.closedAt || 'not confirmed'}`];
}
