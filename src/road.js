import * as THREE from 'three';
import { SEGMENT_LENGTH } from './track.js';

const MAX_JOINTS = 140;

function createAsphaltTexture(anisotropy = 8) {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Base dark asphalt color
  ctx.fillStyle = '#212325';
  ctx.fillRect(0, 0, size, size);

  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;

  // Grain, aggregate stones, micro-imperfections
  for (let i = 0; i < data.length; i += 4) {
    const grain = (Math.random() - 0.5) * 35;
    const speckle = Math.random() < 0.07 ? (Math.random() - 0.5) * 60 : 0;
    const pebble = Math.random() < 0.015 ? 45 : 0;

    const noise = grain + speckle + pebble;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise + 1));
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = anisotropy;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createAsphaltBumpTexture(anisotropy = 8) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    const val = 128 + (Math.random() - 0.5) * 90;
    const clamped = Math.min(255, Math.max(0, val));
    data[i] = clamped;
    data[i + 1] = clamped;
    data[i + 2] = clamped;
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = anisotropy;
  return texture;
}

function createShoulderTexture(anisotropy = 8) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#3a3c3e';
  ctx.fillRect(0, 0, size, size);

  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 40;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = anisotropy;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createGrassTexture(anisotropy = 8) {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Base natural German roadside verge tone
  ctx.fillStyle = '#2b3924';
  ctx.fillRect(0, 0, size, size);

  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;

  // Multi-frequency procedural noise for grass blades, clumps, thatch, and moisture
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      // 1. Broad terrain patch noise (moss vs dry verge vs damp soil)
      const nx1 = Math.sin(x * 0.04) * Math.cos(y * 0.04);
      const nx2 = Math.sin(x * 0.015 + y * 0.02) * 1.5;
      const patch = (nx1 + nx2) * 16;

      // 2. Mid clump noise
      const clump = ((Math.random() - 0.5) * 28);

      // 3. Fine grass blade fiber streaks (vertical bias)
      const bladeNoise = (Math.random() - 0.5) * 35;
      const bladeHighlight = Math.random() < 0.12 ? (Math.random() * 25) : 0;

      const totalNoise = patch + clump + bladeNoise;

      // Rich earthy vegetation palette
      data[idx]     = Math.min(255, Math.max(0, 43  + totalNoise * 0.75 + bladeHighlight * 0.8)); // R (earth/thatch)
      data[idx + 1] = Math.min(255, Math.max(0, 58  + totalNoise * 1.05 + bladeHighlight * 1.1)); // G (chlorophyll)
      data[idx + 2] = Math.min(255, Math.max(0, 34  + totalNoise * 0.6  + bladeHighlight * 0.4)); // B (cool shadow)
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = anisotropy;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createGrassBumpTexture(anisotropy = 8) {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      const clump = Math.sin(x * 0.05) * Math.cos(y * 0.05) * 30;
      const blade = (Math.random() - 0.5) * 80;
      const height = Math.min(255, Math.max(0, 128 + clump + blade));

      data[idx]     = height;
      data[idx + 1] = height;
      data[idx + 2] = height;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = anisotropy;
  return texture;
}

function createForestFloorTexture(anisotropy = 8) {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Deep forest loam, fallen needles, and dark damp moss
  ctx.fillStyle = '#1c231a';
  ctx.fillRect(0, 0, size, size);

  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      const patch = Math.sin(x * 0.02) * Math.cos(y * 0.02) * 20;
      const grain = (Math.random() - 0.5) * 30;
      const needle = Math.random() < 0.04 ? 35 : 0; // fallen brown needle highlights

      data[idx]     = Math.min(255, Math.max(0, 28 + patch * 0.8 + grain * 0.8 + needle * 1.2)); // R (brown needles)
      data[idx + 1] = Math.min(255, Math.max(0, 36 + patch * 1.0 + grain * 0.9 + needle * 0.5)); // G (damp moss)
      data[idx + 2] = Math.min(255, Math.max(0, 24 + patch * 0.6 + grain * 0.7 + needle * 0.2)); // B
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = anisotropy;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createGrassTuftTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw natural wild grass tuft blades with varying curves and tips
  const numBlades = 45;
  for (let i = 0; i < numBlades; i++) {
    const rootX = canvas.width * 0.5 + (Math.random() - 0.5) * 60;
    const rootY = canvas.height - 5;
    const height = 110 + Math.random() * 125;
    const lean = (Math.random() - 0.5) * 110;
    const tipX = rootX + lean;
    const tipY = rootY - height;
    const cpX = rootX + lean * 0.4 + (Math.random() - 0.5) * 25;
    const cpY = rootY - height * 0.55;

    ctx.beginPath();
    ctx.moveTo(rootX - 2.5, rootY);
    ctx.quadraticCurveTo(cpX, cpY, tipX, tipY);
    ctx.quadraticCurveTo(cpX + 2, cpY, rootX + 2.5, rootY);
    ctx.closePath();

    // Natural blade gradient: dark forest root to lighter olive/golden tip
    const bladeGrad = ctx.createLinearGradient(rootX, rootY, tipX, tipY);
    bladeGrad.addColorStop(0.0, '#1a2618');
    bladeGrad.addColorStop(0.6, '#384d2b');
    bladeGrad.addColorStop(1.0, Math.random() > 0.4 ? '#4e5a32' : '#615f3a');

    ctx.fillStyle = bladeGrad;
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createDashTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 8;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // 4 m dash / 6 m gap in a 10 m cycle
  ctx.fillStyle = '#cfccc4';
  ctx.fillRect(0, 0, canvas.width, Math.round(canvas.height * 0.4));
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  return texture;
}

function createStripGeometry(jointCount) {
  const pos = new Float32Array(jointCount * 2 * 3);
  const nrm = new Float32Array(jointCount * 2 * 3);
  const uv = new Float32Array(jointCount * 2 * 2);
  const indices = [];
  for (let i = 0; i < jointCount - 1; i++) {
    const a = i * 2;
    indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('normal', new THREE.BufferAttribute(nrm, 3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2).setUsage(THREE.DynamicDrawUsage));
  geometry.setIndex(indices);
  return geometry;
}

function writeStrip(geometry, joints, leftLat, rightLat, yOffset, vScale) {
  const pos = geometry.attributes.position.array;
  const nrm = geometry.attributes.normal.array;
  const uv = geometry.attributes.uv.array;
  const last = joints[joints.length - 1];

  for (let i = 0; i < MAX_JOINTS; i++) {
    const j = i < joints.length ? joints[i] : last;
    const c = Math.cos(j.heading);
    const s = Math.sin(j.heading);
    const lx = j.x + leftLat * c;
    const lz = j.z + leftLat * s;
    const rx = j.x + rightLat * c;
    const rz = j.z + rightLat * s;
    const y = j.y + yOffset;

    const sp = Math.sin(j.pitch);
    const cp = Math.cos(j.pitch);
    const nx = -Math.sin(j.heading) * sp;
    const ny = cp;
    const nz = Math.cos(j.heading) * sp;

    const base = i * 6;
    pos[base] = lx;
    pos[base + 1] = y;
    pos[base + 2] = lz;
    pos[base + 3] = rx;
    pos[base + 4] = y;
    pos[base + 5] = rz;

    nrm[base] = nx;
    nrm[base + 1] = ny;
    nrm[base + 2] = nz;
    nrm[base + 3] = nx;
    nrm[base + 4] = ny;
    nrm[base + 5] = nz;

    const v = j.s * vScale;
    const uvBase = i * 4;
    uv[uvBase] = 0;
    uv[uvBase + 1] = v;
    uv[uvBase + 2] = 1;
    uv[uvBase + 3] = v;
  }

  geometry.attributes.position.needsUpdate = true;
  geometry.attributes.normal.needsUpdate = true;
  geometry.attributes.uv.needsUpdate = true;
  geometry.computeBoundingSphere();
}

export class Road {
  constructor(scene, renderer = null) {
    this.scene = scene;
    this.renderer = renderer;
    this.roadWidth = 12;
    this.laneWidth = 4;
    this.shoulderWidth = 2;
    this.grassWidth = 8;
    this.groundWidth = 70;
    this.group = new THREE.Group();
    this.strips = [];
    this.dummy = new THREE.Object3D();
    this._basis = new THREE.Matrix4();
    this._axisX = new THREE.Vector3();
    this._axisY = new THREE.Vector3();
    this._axisZ = new THREE.Vector3();
    this.railCount = 0;
    this.tuftCount = 0;

    this.initMaterials();
  }

  initMaterials() {
    const maxAnisotropy = this.renderer ? this.renderer.capabilities.getMaxAnisotropy() : 8;

    const asphaltTex = createAsphaltTexture(maxAnisotropy);
    asphaltTex.repeat.set(3, 0.25);
    const asphaltBumpTex = createAsphaltBumpTexture(maxAnisotropy);
    asphaltBumpTex.repeat.set(3, 0.25);

    this.roadMaterial = new THREE.MeshStandardMaterial({
      map: asphaltTex,
      bumpMap: asphaltBumpTex,
      bumpScale: 0.04,
      roughness: 0.88,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    const shoulderTex = createShoulderTexture(maxAnisotropy);
    shoulderTex.repeat.set(1, 0.25);
    this.shoulderMaterial = new THREE.MeshStandardMaterial({
      map: shoulderTex,
      roughness: 0.95,
      metalness: 0.02,
      side: THREE.DoubleSide
    });

    this.dashMaterial = new THREE.MeshStandardMaterial({
      map: createDashTexture(),
      color: 0xffffff,
      roughness: 0.82,
      metalness: 0.05,
      transparent: true,
      alphaTest: 0.4,
      side: THREE.DoubleSide
    });

    this.edgeLineMaterial = new THREE.MeshStandardMaterial({
      color: 0xcfccc4,
      roughness: 0.82,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    this.guardrailMaterial = new THREE.MeshStandardMaterial({
      color: 0x6e757c,
      metalness: 0.55,
      roughness: 0.5
    });

    const grassTex = createGrassTexture(maxAnisotropy);
    grassTex.repeat.set(2, 0.25);
    const grassBumpTex = createGrassBumpTexture(maxAnisotropy);
    grassBumpTex.repeat.set(2, 0.25);
    this.grassMaterial = new THREE.MeshStandardMaterial({
      map: grassTex,
      bumpMap: grassBumpTex,
      bumpScale: 0.05,
      roughness: 0.92,
      metalness: 0.0,
      side: THREE.DoubleSide
    });

    const groundTex = createForestFloorTexture(maxAnisotropy);
    groundTex.repeat.set(8, 0.08);
    const groundBumpTex = createGrassBumpTexture(maxAnisotropy);
    groundBumpTex.repeat.set(8, 0.08);
    this.groundMaterial = new THREE.MeshStandardMaterial({
      map: groundTex,
      bumpMap: groundBumpTex,
      bumpScale: 0.06,
      roughness: 0.98,
      metalness: 0.0,
      side: THREE.DoubleSide
    });

    const tuftTex = createGrassTuftTexture();
    this.tuftMaterial = new THREE.MeshStandardMaterial({
      map: tuftTex,
      transparent: true,
      alphaTest: 0.35,
      roughness: 0.85,
      metalness: 0.0,
      side: THREE.DoubleSide
    });
  }

  addStrip(leftLat, rightLat, yOffset, vScale, material) {
    const geometry = createStripGeometry(MAX_JOINTS);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    this.group.add(mesh);
    this.strips.push({ geometry, leftLat, rightLat, yOffset, vScale });
    return mesh;
  }

  create() {
    const half = this.roadWidth / 2;
    const sh = this.shoulderWidth;
    const grass = this.grassWidth;
    const ground = this.groundWidth;

    this.addStrip(-half, half, 0, 1, this.roadMaterial);
    this.addStrip(-half - sh, -half, 0.005, 1, this.shoulderMaterial);
    this.addStrip(half, half + sh, 0.005, 1, this.shoulderMaterial);
    this.addStrip(-half + 0.0, -half + 0.2, 0.02, 1, this.edgeLineMaterial);
    this.addStrip(half - 0.2, half, 0.02, 1, this.edgeLineMaterial);
    const dashHalf = 0.08;
    this.addStrip(-this.laneWidth / 2 - dashHalf, -this.laneWidth / 2 + dashHalf, 0.03, 0.1, this.dashMaterial);
    this.addStrip(this.laneWidth / 2 - dashHalf, this.laneWidth / 2 + dashHalf, 0.03, 0.1, this.dashMaterial);
    this.addStrip(-half - sh - grass, -half - sh, 0.01, 1, this.grassMaterial);
    this.addStrip(half + sh, half + sh + grass, 0.01, 1, this.grassMaterial);
    this.addStrip(-half - sh - grass - ground, -half - sh - grass, -0.01, 1, this.groundMaterial);
    this.addStrip(half + sh + grass, half + sh + grass + ground, -0.01, 1, this.groundMaterial);

    this.railCount = (MAX_JOINTS - 1) * 2;
    const railGeo = new THREE.BoxGeometry(0.15, 0.4, SEGMENT_LENGTH + 0.2);
    this.rails = new THREE.InstancedMesh(railGeo, this.guardrailMaterial, this.railCount);
    this.rails.frustumCulled = false;
    this.rails.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.group.add(this.rails);

    this.tuftCount = 80;
    const tuftGeo = new THREE.PlaneGeometry(0.75, 0.6);
    tuftGeo.translate(0, 0.3, 0);
    this.tufts = new THREE.InstancedMesh(tuftGeo, this.tuftMaterial, this.tuftCount);
    this.tufts.frustumCulled = false;
    this.tufts.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.group.add(this.tufts);

    this.scene.add(this.group);
  }

  poseOnTrack(track, relZ, lateralX, yOffset, extraYaw = 0) {
    const p = track.sample(relZ, lateralX);
    const heading = p.heading + extraYaw;
    const ch = Math.cos(heading);
    const sh = Math.sin(heading);
    const cp = Math.cos(p.pitch);
    const sp = Math.sin(p.pitch);

    const fx = sh * cp;
    const fy = sp;
    const fz = -ch * cp;
    this._axisX.set(ch, 0, sh);
    this._axisZ.set(fx, fy, fz);
    this._axisY.crossVectors(this._axisZ, this._axisX).normalize();
    this._basis.makeBasis(this._axisX, this._axisY, this._axisZ);

    this.dummy.position.set(p.x, p.y + yOffset, p.z);
    this.dummy.quaternion.setFromRotationMatrix(this._basis);
    this.dummy.scale.set(1, 1, 1);
    this.dummy.updateMatrix();
  }

  hideInstance(mesh, index) {
    this.dummy.scale.set(0, 0, 0);
    this.dummy.position.set(0, -10, 0);
    this.dummy.updateMatrix();
    mesh.setMatrixAt(index, this.dummy.matrix);
  }

  sync(track) {
    if (!track || track.joints.length < 2) return;

    const joints = track.joints;
    for (const strip of this.strips) {
      writeStrip(strip.geometry, joints, strip.leftLat, strip.rightLat, strip.yOffset, strip.vScale);
    }

    const lastS = joints[joints.length - 1].s;

    const railLat = this.roadWidth / 2 + 1.5;
    let railIndex = 0;
    const segCount = Math.min(joints.length - 1, MAX_JOINTS - 1);
    for (let i = 0; i < segCount; i++) {
      const a = joints[i];
      const midS = a.s + SEGMENT_LENGTH / 2;
      const relZ = track.s - midS;
      for (const lat of [-railLat, railLat]) {
        this.poseOnTrack(track, relZ, lat, 0.5);
        this.rails.setMatrixAt(railIndex, this.dummy.matrix);
        railIndex++;
      }
    }
    while (railIndex < this.railCount) {
      this.hideInstance(this.rails, railIndex++);
    }
    this.rails.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < this.tuftCount; i++) {
      const along = (i >> 1) * 8 + 3;
      const relZ = track.s - track.repeatS(along, 320, 16);
      if (relZ > 20 || -relZ > lastS - track.s + 8) {
        this.hideInstance(this.tufts, i);
        continue;
      }
      const side = i % 2 === 0 ? -1 : 1;
      const lat = side * (this.roadWidth / 2 + 2.1 + (i % 5) * 0.7);
      this.poseOnTrack(track, relZ, lat, 0.01, (i * 1.7) % Math.PI);
      const scale = 0.55 + (i % 7) * 0.06;
      this.dummy.scale.set(scale, scale, scale);
      this.dummy.updateMatrix();
      this.tufts.setMatrixAt(i, this.dummy.matrix);
    }
    this.tufts.instanceMatrix.needsUpdate = true;
  }

  reset() {}

  update(deltaTime, speed, track) {
    if (track) this.sync(track);
  }
}
