import * as T from 'three';
import { actualPreviewUrl, issueStation, type Snapshot, type Station } from './contract';

export const stationPoints = [[-6,3],[-5,-1],[-2,-3],[2,-3],[5,-.5],[4,4],[0,6]]
  .map(([x,z]) => new T.Vector3(x,.05,z));

export function createBackdrop(): T.Mesh {
  // Small rear peak leaves the workshop, Builder and their camera rays clear.
  const peak = new T.Mesh(new T.IcosahedronGeometry(1.6,0),
    new T.MeshStandardMaterial({color:0x344341,flatShading:true,roughness:.88}));
  peak.position.set(-.5,.6,-6);
  peak.scale.set(1,1.3,.7);
  return peak;
}

export function createIssueCrates(snapshot: Snapshot): T.Mesh[] {
  const counts = new Map<Station, number>();
  const url = actualPreviewUrl(snapshot);
  return snapshot.issues.map(issue => {
    const station = issueStation(issue,url);
    const slot = counts.get(station) ?? 0;
    counts.set(station,slot+1);
    const p = station === 'archive' ? new T.Vector3(-9,0,4) : stationPoints[station-1];
    const crate = new T.Mesh(new T.BoxGeometry(.5,.5,.5),
      new T.MeshStandardMaterial({color:0xb78c55,flatShading:true,roughness:.88}));
    // Separate rows keep collocated issues individually selectable.
    crate.position.set(p.x-.8-(slot%3)*.65,.4,p.z+.5+Math.floor(slot/3)*.65);
    crate.name = `Issue #${issue.number} · ${issue.id}`;
    crate.userData.entityId = issue.id;
    return crate;
  });
}
