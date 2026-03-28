const OVERLAP_THRESHOLD_PX = 8;
const OFFSET_PX = 4;

function decompose(wires) {
  const segs = [];
  wires.forEach((wire, wireIdx) => {
    for (let i = 0; i < wire.path.length - 1; i++) {
      const [x1, y1] = wire.path[i];
      const [x2, y2] = wire.path[i + 1];
      if (y1 === y2) {
        segs.push({ wireIdx, segIdx: i, axis: 'H', fixed: y1, min: Math.min(x1, x2), max: Math.max(x1, x2) });
      } else if (x1 === x2) {
        segs.push({ wireIdx, segIdx: i, axis: 'V', fixed: x1, min: Math.min(y1, y2), max: Math.max(y1, y2) });
      }
    }
  });
  return segs;
}

function assignOffsets(segs, viewW = 960, viewH = 640) {
  const offsetMap = new Map();
  const groups = new Map();
  for (const seg of segs) {
    const key = `${seg.axis}|${seg.fixed}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(seg);
  }
  for (const [, group] of groups) {
    if (group.length < 2) continue;
    group.sort((a, b) => a.min - b.min);
    const clusters = [];
    let cluster = [group[0]];
    for (let i = 1; i < group.length; i++) {
      const seg = group[i];
      const joined = cluster.some(c => {
        const overlap = Math.min(c.max, seg.max) - Math.max(c.min, seg.min);
        return overlap > OVERLAP_THRESHOLD_PX;
      });
      if (joined) { cluster.push(seg); }
      else { if (cluster.length >= 2) clusters.push(cluster); cluster = [seg]; }
    }
    if (cluster.length >= 2) clusters.push(cluster);
    for (const cl of clusters) {
      cl.sort((a, b) => a.wireIdx - b.wireIdx || a.segIdx - b.segIdx);
      const n = cl.length;
      const axis = cl[0].axis;
      const fixed = cl[0].fixed;
      const maxCoord = axis === 'H' ? viewH : viewW;
      const rawOffsets = cl.map((_, i) => (i - (n - 1) / 2) * OFFSET_PX);
      const minResult = fixed + Math.min(...rawOffsets);
      const maxResult = fixed + Math.max(...rawOffsets);
      let shift = 0;
      if (minResult < 0) shift = -minResult;
      else if (maxResult > maxCoord) shift = maxCoord - maxResult;
      for (let i = 0; i < n; i++) {
        const finalOffset = rawOffsets[i] + shift;
        if (finalOffset !== 0) {
          offsetMap.set(`${cl[i].wireIdx}:${cl[i].segIdx}`, finalOffset);
        }
      }
    }
  }
  return offsetMap;
}

function segAxis(path, segIdx) {
  if (segIdx < 0 || segIdx >= path.length - 1) return null;
  const [x1, y1] = path[segIdx];
  const [x2, y2] = path[segIdx + 1];
  if (y1 === y2) return 'H';
  if (x1 === x2) return 'V';
  return null;
}

function applyOffsets(wires, offsetMap) {
  return wires.map((wire, wireIdx) => {
    const p = wire.path;
    const n = p.length - 1;
    if (n < 1) return wire;
    const off = (segIdx) => offsetMap.get(`${wireIdx}:${segIdx}`) ?? 0;
    const ax = (segIdx) => segAxis(p, segIdx);
    const adjusted = [];
    for (let i = 0; i <= n; i++) {
      const [ox, oy] = p[i];
      const inAx = ax(i - 1), inOff = off(i - 1);
      const outAx = ax(i), outOff = off(i);
      let nx = ox, ny = oy;
      if (inAx === 'H' || outAx === 'H') ny = oy + (inAx === 'H' ? inOff : outOff);
      if (inAx === 'V' || outAx === 'V') nx = ox + (inAx === 'V' ? inOff : outOff);
      adjusted.push([nx, ny]);
    }
    const firstAx = ax(0), firstOff = off(0);
    if (firstAx !== null && firstOff !== 0) {
      adjusted[0] = [p[0][0], p[0][1]];
      const [ox, oy] = p[0];
      const jog = firstAx === 'H' ? [ox, oy + firstOff] : [ox + firstOff, oy];
      adjusted.splice(1, 0, jog);
    }
    const lastAx = ax(n - 1), lastOff = off(n - 1);
    if (lastAx !== null && lastOff !== 0) {
      adjusted[adjusted.length - 1] = [p[n][0], p[n][1]];
      const [ox, oy] = p[n];
      const jog = lastAx === 'H' ? [ox, oy + lastOff] : [ox + lastOff, oy];
      adjusted.splice(adjusted.length - 1, 0, jog);
    }
    const cleaned = [adjusted[0]];
    for (let i = 1; i < adjusted.length; i++) {
      const [px, py] = cleaned[cleaned.length - 1];
      const [cx, cy] = adjusted[i];
      if (cx !== px || cy !== py) cleaned.push([cx, cy]);
    }
    return { ...wire, path: cleaned };
  });
}

export function deOverlapWires(wires) {
  if (wires.length < 2) return wires;
  const segs = decompose(wires);
  const offsetMap = assignOffsets(segs);
  if (offsetMap.size === 0) return wires;
  return applyOffsets(wires, offsetMap);
}
