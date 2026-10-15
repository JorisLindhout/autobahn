function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function easeIn(a, b, p) {
  return a + (b - a) * p * p;
}

function easeInOut(a, b, p) {
  return a + (b - a) * (-Math.cos(p * Math.PI) / 2 + 0.5);
}

export const SEGMENT_LENGTH = 4;

const LENGTH = {
  SHORT: 12,
  MEDIUM: 20,
  LONG: 28
};

const HILL = {
  LOW: 5,
  MEDIUM: 9
};

const CURVE = {
  EASY: 0.009,
  MEDIUM: 0.016
};

export class Track {
  constructor() {
    this.segmentLength = SEGMENT_LENGTH;
    this.aheadDistance = 400;
    this.behindDistance = 16;
    this.segments = [];
    this.joints = [];
    this.s = 0;
    this.headingConsumed = 0;
    this.worldHeading = 0;
    this.playerCurve = 0;
    this.playerY = 0;
    this.playerPitch = 0;
    this.rand = Math.random;
    this.curveCooldown = 0;
    this.hillCooldown = 0;
    this._out = { x: 0, y: 0, z: 0, heading: 0, pitch: 0, s: 0, curve: 0 };
    this.reset();
  }

  reset(seed = (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0) {
    this.rand = mulberry32(seed || 1);
    this.segments.length = 0;
    this.joints.length = 0;
    this.s = 0;
    this.headingConsumed = 0;
    this.worldHeading = 0;
    this.playerCurve = 0;
    this.playerY = 0;
    this.playerPitch = 0;
    this.curveCooldown = 0;
    this.hillCooldown = 0;

    this.addRoad(8, 14, 8, 0, 0);
    this.ensureAhead();
    this.rebuildLocal();
  }

  lastY() {
    return this.segments.length === 0 ? 0 : this.segments[this.segments.length - 1].y1;
  }

  addSegment(curve, yEnd) {
    const y0 = this.lastY();
    const s = this.segments.length === 0 ? 0 : this.segments[this.segments.length - 1].s + this.segmentLength;
    this.segments.push({
      s,
      curve,
      y0,
      y1: yEnd
    });
  }

  addRoad(enter, hold, leave, curve, hill) {
    const startY = this.lastY();
    const endY = startY + hill;
    const total = Math.max(1, enter + hold + leave);
    let n = 0;
    for (let i = 0; i < enter; i++, n++) {
      this.addSegment(easeIn(0, curve, i / Math.max(1, enter)), easeInOut(startY, endY, n / total));
    }
    for (let i = 0; i < hold; i++, n++) {
      this.addSegment(curve, easeInOut(startY, endY, n / total));
    }
    for (let i = 0; i < leave; i++, n++) {
      this.addSegment(easeInOut(curve, 0, i / Math.max(1, leave)), easeInOut(startY, endY, n / total));
    }
  }

  pickLength() {
    const r = this.rand();
    if (r < 0.35) return LENGTH.SHORT;
    if (r < 0.75) return LENGTH.MEDIUM;
    return LENGTH.LONG;
  }

  pickCurve() {
    const mag = this.rand() < 0.65 ? CURVE.EASY : CURVE.MEDIUM;
    return mag * (this.rand() < 0.5 ? -1 : 1);
  }

  pickHill() {
    const mag = this.rand() < 0.6 ? HILL.LOW : HILL.MEDIUM;
    const y = this.lastY();
    let sign = this.rand() < 0.5 ? 1 : -1;
    if (y + mag * sign > 14) sign = -1;
    if (y + mag * sign < -6) sign = 1;
    return mag * sign;
  }

  generatePiece() {
    const len = this.pickLength();
    const enter = Math.max(4, Math.round(len * 0.35));
    const leave = Math.max(4, Math.round(len * 0.35));
    const hold = Math.max(4, len - enter - leave);

    const canCurve = this.curveCooldown <= 0;
    const canHill = this.hillCooldown <= 0;
    const r = this.rand();

    let kind = 'straight';
    if (r < 0.28) {
      kind = 'straight';
    } else if (r < 0.58 && canCurve) {
      kind = 'curve';
    } else if (r < 0.8 && canHill) {
      kind = 'hill';
    } else if (canCurve && canHill && r >= 0.8) {
      kind = 'both';
    } else if (canCurve) {
      kind = 'curve';
    } else if (canHill) {
      kind = 'hill';
    }

    if (kind === 'straight') {
      this.addRoad(enter, hold, leave, 0, 0);
      this.curveCooldown = Math.max(0, this.curveCooldown - 1);
      this.hillCooldown = Math.max(0, this.hillCooldown - 1);
      return;
    }

    if (kind === 'curve') {
      this.addRoad(enter, hold, leave, this.pickCurve(), 0);
      this.curveCooldown = Math.abs(hold) > 16 ? 2 : 1;
      this.hillCooldown = Math.max(0, this.hillCooldown - 1);
      return;
    }

    if (kind === 'hill') {
      this.addRoad(enter, hold, leave, 0, this.pickHill());
      this.hillCooldown = 2;
      this.curveCooldown = Math.max(0, this.curveCooldown - 1);
      return;
    }

    this.addRoad(enter, hold, leave, this.pickCurve(), this.pickHill());
    this.curveCooldown = 2;
    this.hillCooldown = 2;
  }

  dropBehind() {
    const L = this.segmentLength;
    while (
      this.segments.length > 8 &&
      this.segments[0].s + L < this.s - this.behindDistance
    ) {
      this.headingConsumed += this.segments[0].curve;
      this.segments.shift();
    }
  }

  ensureAhead() {
    let guard = 0;
    while (
      guard++ < 40 &&
      (this.segments.length === 0 ||
        this.segments[this.segments.length - 1].s + this.segmentLength < this.s + this.aheadDistance)
    ) {
      this.generatePiece();
    }
  }

  indexOfS(s) {
    if (this.segments.length === 0) return 0;
    const i = Math.floor((s - this.segments[0].s) / this.segmentLength);
    return Math.max(0, Math.min(this.segments.length - 1, i));
  }

  percentOfS(s) {
    if (this.segments.length === 0) return 0;
    const seg = this.segments[this.indexOfS(s)];
    return Math.max(0, Math.min(1, (s - seg.s) / this.segmentLength));
  }

  rebuildLocal() {
    const n = this.segments.length;
    const L = this.segmentLength;
    if (n === 0) {
      this.joints = [];
      return;
    }

    const idx = this.indexOfS(this.s);
    const seg = this.segments[idx];
    const t = this.percentOfS(this.s);
    const playerY = seg.y0 + (seg.y1 - seg.y0) * t;
    const playerPitch = Math.atan2(seg.y1 - seg.y0, L);

    this.playerY = playerY;
    this.playerPitch = playerPitch;
    this.playerCurve = seg.curve / L;
    this.worldHeading = this.headingConsumed + t * seg.curve;

    this.joints = new Array(n + 1);

    const dsBack = t * L;
    const midBack = -0.5 * t * seg.curve;
    let x = -Math.sin(midBack) * dsBack;
    let z = Math.cos(midBack) * dsBack;
    let y = seg.y0;
    let heading = -t * seg.curve;
    this.joints[idx] = { x, y, z, heading, pitch: playerPitch, s: seg.s };

    for (let i = idx - 1; i >= 0; i--) {
      const sg = this.segments[i];
      const hEnd = heading;
      const hStart = hEnd - sg.curve;
      const mid = (hStart + hEnd) * 0.5;
      x -= Math.sin(mid) * L;
      z += Math.cos(mid) * L;
      y = sg.y0;
      heading = hStart;
      this.joints[i] = {
        x,
        y,
        z,
        heading,
        pitch: Math.atan2(sg.y1 - sg.y0, L),
        s: sg.s
      };
    }

    x = 0;
    y = playerY;
    z = 0;
    heading = 0;
    const remain = (1 - t) * L;
    const midFwd = 0.5 * (1 - t) * seg.curve;
    x += Math.sin(midFwd) * remain;
    z += -Math.cos(midFwd) * remain;
    y = seg.y1;
    heading = (1 - t) * seg.curve;
    this.joints[idx + 1] = {
      x,
      y,
      z,
      heading,
      pitch: playerPitch,
      s: seg.s + L
    };

    for (let i = idx + 1; i < n; i++) {
      const sg = this.segments[i];
      const hStart = heading;
      const hEnd = hStart + sg.curve;
      const mid = (hStart + hEnd) * 0.5;
      x += Math.sin(mid) * L;
      z += -Math.cos(mid) * L;
      y = sg.y1;
      heading = hEnd;
      this.joints[i + 1] = {
        x,
        y,
        z,
        heading,
        pitch: Math.atan2(sg.y1 - sg.y0, L),
        s: sg.s + L
      };
    }
  }

  applyLateral(pose, lateralX, out) {
    const c = Math.cos(pose.heading);
    const s = Math.sin(pose.heading);
    out.x = pose.x + lateralX * c;
    out.y = pose.y;
    out.z = pose.z + lateralX * s;
    out.heading = pose.heading;
    out.pitch = pose.pitch;
    out.s = pose.s;
    out.curve = this.playerCurve;
    return out;
  }

  // Map a planted offset s0 into the visible window so roadside props
  // stay locked to the road and recycle behind the camera.
  repeatS(s0, span = 360, behind = 16) {
    const period = span > 0 ? span : 360;
    const base = ((s0 % period) + period) % period;
    const n = Math.ceil((this.s - behind - base) / period);
    return base + n * period;
  }

  sample(relZ, lateralX = 0) {
    const out = this._out;
    if (this.joints.length < 2) {
      out.x = lateralX;
      out.y = 0;
      out.z = relZ;
      out.heading = 0;
      out.pitch = 0;
      out.s = this.s - relZ;
      out.curve = 0;
      return out;
    }

    const sTarget = this.s - relZ;
    const firstS = this.segments[0].s;
    const last = this.segments[this.segments.length - 1];
    const maxS = last.s + this.segmentLength;
    const clamped = Math.max(firstS, Math.min(maxS, sTarget));
    const raw = (clamped - firstS) / this.segmentLength;
    const i = Math.max(0, Math.min(this.joints.length - 2, Math.floor(raw)));
    const t = Math.max(0, Math.min(1, raw - i));
    const a = this.joints[i];
    const b = this.joints[i + 1];

    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dz = b.z - a.z;
    const horiz = Math.hypot(dx, dz) || 0.0001;
    const pose = {
      x: a.x + dx * t,
      y: a.y + dy * t,
      z: a.z + dz * t,
      heading: Math.atan2(dx, -dz),
      pitch: Math.atan2(dy, horiz),
      s: a.s + (b.s - a.s) * t
    };

    return this.applyLateral(pose, lateralX, out);
  }

  advance(distance) {
    if (distance > 0) {
      this.s += distance;
    }
    this.dropBehind();
    this.ensureAhead();
    this.rebuildLocal();
  }
}
