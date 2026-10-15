import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let windTurbines = [];
let sceneryGroup = null;
let horizonGroup = null;
let forestGroup = null;
let sceneryPromise = null;
let treePool = [];
let backdropCards = [];
const HORIZON_PARALLAX = 0.35;

export function updateScenery(deltaTime, speed = 0, track = null, sky = null) {
  for (const turbine of windTurbines) {
    if (turbine.userData.bladeGroup) {
      turbine.userData.bladeGroup.rotation.z += turbine.userData.bladeGroup.userData.rotationSpeed * deltaTime;
    }
  }

  if (!track) return;

  if (sky) {
    sky.rotation.y = 0;
    sky.position.y = track.playerY;
  }

  if (horizonGroup) {
    horizonGroup.rotation.y = 0;
    horizonGroup.position.y = track.playerY * HORIZON_PARALLAX;
  }

  poseRibbonScenery(track);
}

/* Realistic high-contrast 80s overcast cloud sky texture generator */
function createCloudTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Base sky: cold northern 80s slate blue-gray zenith to hazy silver horizon
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0.0, '#43505e');
  gradient.addColorStop(0.4, '#5e6d7d');
  gradient.addColorStop(0.75, '#8b98a6');
  gradient.addColorStop(1.0, '#b6c0cb');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // High quality Perlin-style gradient noise for distinct, billowing cloud banks
  const p = new Uint8Array(512);
  const permutation = [
    151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,
    8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,
    35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,
    134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,
    55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,
    18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,
    250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,
    189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,
    172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,
    228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,
    107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,
    138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180
  ];
  for (let i = 0; i < 256; i++) {
    p[256 + i] = p[i] = permutation[i];
  }

  function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  function lerp(t, a, b) { return a + t * (b - a); }
  function grad(hash, x, y) {
    const h = hash & 7;
    const u = h < 4 ? x : y;
    const v = h < 4 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  function perlin2D(x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = fade(xf);
    const v = fade(yf);
    const A = p[X] + Y;
    const B = p[X + 1] + Y;
    return lerp(v,
      lerp(u, grad(p[A], xf, yf), grad(p[B], xf - 1, yf)),
      lerp(u, grad(p[A + 1], xf, yf - 1), grad(p[B + 1], xf - 1, yf - 1))
    );
  }

  function cloudFBM(x, y) {
    let total = 0;
    let amp = 0.55;
    let freq = 1.0;
    for (let o = 0; o < 5; o++) {
      total += perlin2D(x * freq, y * freq) * amp;
      freq *= 2.1;
      amp *= 0.52;
    }
    return total;
  }

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  // Render thick, stratified 80s cloud formations
  for (let y = 0; y < canvas.height; y++) {
    const normY = y / canvas.height; // 0 (top/zenith) to 1 (horizon)
    const altitudeScale = 1.0 - normY * 0.5;

    for (let x = 0; x < canvas.width; x++) {
      const normX = x / canvas.width;
      const idx = (y * canvas.width + x) * 4;

      // Coordinate scaling for natural atmospheric perspective
      const nx = normX * 6.0;
      const ny = normY * 4.0;

      // Primary cloud density
      const rawNoise = cloudFBM(nx, ny * 1.5);
      // Secondary billow modulation (turbulence)
      const detailNoise = perlin2D(nx * 5.0 + rawNoise * 1.5, ny * 5.0);
      const cloudVal = rawNoise + detailNoise * 0.25;

      // Cloud density shaping: billowy tops, darker undersides
      const cloudCover = Math.sin(normY * Math.PI * 0.9);
      const shaped = (cloudVal + 0.15) * 1.8 * cloudCover;

      if (shaped > 0) {
        // Upper rim highlight (silver sunlight catching cloud crests)
        const highlight = Math.max(0, shaped - 0.25) * 65 * altitudeScale;
        // Darker belly shadow (dense stratified cloud bottom)
        const shadow = Math.max(0, -shaped - 0.1) * 40;

        data[idx]     = Math.min(255, Math.max(0, data[idx]     + highlight * 0.95 - shadow));
        data[idx + 1] = Math.min(255, Math.max(0, data[idx + 1] + highlight * 0.98 - shadow));
        data[idx + 2] = Math.min(255, Math.max(0, data[idx + 2] + highlight * 1.05 - shadow * 0.8));
      } else {
        // Subtle darker gaps between cloud banks
        const shadow = Math.min(45, -shaped * 35);
        data[idx]     = Math.max(0, data[idx]     - shadow * 0.9);
        data[idx + 1] = Math.max(0, data[idx + 1] - shadow * 0.9);
        data[idx + 2] = Math.max(0, data[idx + 2] - shadow * 0.8);
      }
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // Soft diffused overcast sunlight breaking through cloud deck
  const sunX = canvas.width * 0.58;
  const sunY = canvas.height * 0.35;
  const sunGlow = ctx.createRadialGradient(sunX, sunY, 20, sunX, sunY, 220);
  sunGlow.addColorStop(0.0, 'rgba(255, 255, 255, 0.40)');
  sunGlow.addColorStop(0.25, 'rgba(235, 242, 250, 0.22)');
  sunGlow.addColorStop(0.65, 'rgba(200, 215, 230, 0.08)');
  sunGlow.addColorStop(1.0, 'rgba(180, 195, 210, 0.0)');
  ctx.fillStyle = sunGlow;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createSky() {
  const skyGeometry = new THREE.SphereGeometry(600, 32, 24);
  const skyTexture = createCloudTexture();
  
  const skyMaterial = new THREE.MeshBasicMaterial({
    map: skyTexture,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false // Prevent scene depth fog from overriding sky cloud texture
  });
  
  const sky = new THREE.Mesh(skyGeometry, skyMaterial);
  return sky;
}

export function createSun() {
  // Diffused overcast atmosphere is naturally baked into the realistic panoramic sky dome
  return new THREE.Group();
}

export function createScenery() {
  sceneryGroup = new THREE.Group();
  horizonGroup = new THREE.Group();
  forestGroup = new THREE.Group();
  sceneryGroup.add(horizonGroup);
  sceneryGroup.add(forestGroup);

  windTurbines = [];
  treePool = [];
  backdropCards = [];
  addRollingHills(horizonGroup);
  addDistantMountains(horizonGroup);
  addWindTurbines(horizonGroup, windTurbines);
  addForestBackdrops(forestGroup);
  sceneryPromise = addTrees(forestGroup);

  return sceneryGroup;
}

export function getSceneryPromise() {
  return sceneryPromise;
}

export function resetScenery() {
  if (horizonGroup) {
    horizonGroup.rotation.set(0, 0, 0);
    horizonGroup.position.set(0, 0, 0);
  }
}

/* Procedural layered forest treeline silhouette backdrop texture */
function createForestBackdropTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Helper to draw realistic dense spruce/pine treeline silhouette
  // Note: Canvas (0,0) is TOP (sky). Lower Y in canvas = higher in 3D world.
  function drawTreeLine(skyY, bottomY, color, minWidth, maxWidth) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    ctx.lineTo(0, bottomY);

    let currentX = 0;
    while (currentX < canvas.width + 20) {
      const treeWidth = minWidth + Math.random() * (maxWidth - minWidth);
      const treeHeight = (bottomY - skyY) * (0.65 + Math.random() * 0.35);
      const tipX = currentX + treeWidth * 0.5;
      const tipY = bottomY - treeHeight;

      // Jagged spruce steps going up
      const steps = 4;
      for (let s = 1; s <= steps; s++) {
        const prog = s / steps;
        const stepX = currentX + (tipX - currentX) * prog + (Math.random() - 0.5) * 2;
        const stepY = bottomY - treeHeight * prog;
        ctx.lineTo(stepX, stepY);
      }

      ctx.lineTo(tipX, tipY);

      // Jagged spruce steps going down
      for (let s = steps; s >= 1; s--) {
        const prog = s / steps;
        const stepX = tipX + (currentX + treeWidth - tipX) * (1 - prog) + (Math.random() - 0.5) * 2;
        const stepY = bottomY - treeHeight * prog;
        ctx.lineTo(stepX, stepY);
      }

      currentX += treeWidth * 0.7;
    }

    ctx.lineTo(canvas.width, canvas.height);
    ctx.closePath();
    ctx.fill();
  }

  // Layer 1 (Far backdrop, highest reaching, hazy slate green)
  drawTreeLine(30, 210, '#36443b', 12, 26);

  // Layer 2 (Mid backdrop, dense pine crowns)
  drawTreeLine(65, 230, '#223026', 10, 22);

  // Layer 3 (Near backdrop, dark evergreen Black Forest pine)
  drawTreeLine(95, 255, '#131e16', 8, 18);

  // Dense solid understory base to completely block ground-level sky
  ctx.fillStyle = '#111913';
  ctx.fillRect(0, 210, canvas.width, canvas.height - 210);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function addForestBackdrops(group) {
  const backdropTex = createForestBackdropTexture();
  backdropTex.repeat.set(1.2, 1);

  const backdropMaterial = new THREE.MeshBasicMaterial({
    map: backdropTex,
    transparent: true,
    alphaTest: 0.1,
    side: THREE.DoubleSide,
    fog: true
  });

  const cardWidth = 28;
  const wallHeight = 28;
  const wallGeometry = new THREE.PlaneGeometry(cardWidth, wallHeight);
  backdropCards = [];

  for (let along = 20; along < 380; along += 24) {
    for (const side of [-1, 1]) {
      for (const layer of [
        { lateral: 48, heightScale: 1 },
        { lateral: 72, heightScale: 1.35 }
      ]) {
        const card = new THREE.Mesh(wallGeometry, backdropMaterial);
        card.userData.along = along + (layer.lateral > 50 ? 8 : 0);
        card.userData.lateral = side * layer.lateral;
        card.userData.heightScale = layer.heightScale;
        card.scale.y = layer.heightScale;
        card.visible = false;
        group.add(card);
        backdropCards.push(card);
      }
    }
  }
}

function addRollingHills(group) {
  const hillMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x222a21,
    side: THREE.DoubleSide
  });

  const midHillMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x2d392c,
    side: THREE.DoubleSide
  });

  const farHillMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x3d4b3e,
    side: THREE.DoubleSide
  });
  
  // Gentle rolling forested ridges placed safely behind the forest tree lines (x > 100 or x < -100)
  const ridgePositions = [
    // Left side background hills (z within one loop period)
    { x: -220, z: -100, radius: 140, height: 22, mat: hillMaterial },
    { x: -240, z: -280, radius: 160, height: 28, mat: midHillMaterial },
    { x: -210, z: -460, radius: 150, height: 24, mat: hillMaterial },
    { x: -320, z: -200, radius: 220, height: 42, mat: farHillMaterial },
    { x: -340, z: -450, radius: 240, height: 48, mat: farHillMaterial },

    // Right side background hills
    { x: 220, z: -120, radius: 140, height: 22, mat: hillMaterial },
    { x: 240, z: -300, radius: 160, height: 28, mat: midHillMaterial },
    { x: 210, z: -480, radius: 150, height: 24, mat: hillMaterial },
    { x: 320, z: -220, radius: 220, height: 42, mat: farHillMaterial },
    { x: 340, z: -470, radius: 240, height: 48, mat: farHillMaterial }
  ];
  
  for (const pos of ridgePositions) {
    const geometry = new THREE.SphereGeometry(pos.radius, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    const hill = new THREE.Mesh(geometry, pos.mat);
    hill.scale.y = pos.height / pos.radius;
    hill.position.set(pos.x, 0, pos.z);
    group.add(hill);
  }
}

function addDistantMountains(group) {
  const farHillMaterial = new THREE.MeshBasicMaterial({
    color: 0x3d4b3e,
    side: THREE.DoubleSide
  });

  // Static horizon ranges — not in the scrolling loop, so they never slide up beside the road
  const mountainPositions = [
    { x: -300, z: -680, radius: 220, height: 38 },
    { x: 300,  z: -690, radius: 220, height: 38 },
    { x: -440, z: -780, radius: 340, height: 52 },
    { x: 440,  z: -780, radius: 340, height: 52 }
  ];

  for (const pos of mountainPositions) {
    const geometry = new THREE.SphereGeometry(pos.radius, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    const mountain = new THREE.Mesh(geometry, farHillMaterial);
    mountain.scale.y = pos.height / pos.radius;
    mountain.position.set(pos.x, 0, pos.z);
    group.add(mountain);
  }
}

function poseRibbonScenery(track) {
  for (const tree of treePool) {
    const slot = tree.userData.slot;
    if (!slot) {
      tree.visible = false;
      continue;
    }
    const worldS = track.repeatS(slot.along);
    const relZ = track.s - worldS;
    if (relZ > 20 || -relZ > track.aheadDistance) {
      tree.visible = false;
      continue;
    }
    const p = track.sample(relZ, slot.lateral);
    tree.visible = true;
    tree.position.set(p.x, p.y, p.z);
    tree.rotation.y = slot.yaw + p.heading;
  }

  for (const card of backdropCards) {
    const worldS = track.repeatS(card.userData.along);
    const relZ = track.s - worldS;
    if (relZ > 20 || -relZ > track.aheadDistance) {
      card.visible = false;
      continue;
    }
    const p = track.sample(relZ, card.userData.lateral);
    card.visible = true;
    const height = 28 * (card.userData.heightScale || 1);
    card.position.set(p.x, p.y + height / 2 - 0.5, p.z);
    const face = card.userData.lateral > 0 ? -Math.PI / 2 : Math.PI / 2;
    card.rotation.set(0, p.heading + face, 0);
  }
}

async function addTrees(group) {
  treePool = [];
  const loader = new GLTFLoader();
  try {
    const gltf = await loader.loadAsync('/models/fir_tree.glb');
    const baseTree = gltf.scene;

    const box = new THREE.Box3().setFromObject(baseTree);
    baseTree.position.y = -box.min.y;

    const foliageColors = [
      0x16241b,
      0x1c2b20,
      0x142018,
      0x223026,
      0x1a241d,
      0x111c15
    ];

    const foliageMaterials = foliageColors.map(color => new THREE.MeshStandardMaterial({
      color,
      roughness: 0.9,
      metalness: 0.02
    }));

    const trunkMaterial = new THREE.MeshStandardMaterial({
      color: 0x241d17,
      roughness: 0.95,
      metalness: 0.0
    });

    const createVariedTree = (baseScaleMin, baseScaleMax, isUndergrowth = false) => {
      const tree = baseTree.clone(true);

      const overallScale = baseScaleMin + Math.random() * (baseScaleMax - baseScaleMin);
      const widthFactor = isUndergrowth
        ? 1.1 + Math.random() * 0.5
        : 0.8 + Math.random() * 0.45;
      const heightFactor = isUndergrowth
        ? 0.65 + Math.random() * 0.35
        : 0.85 + Math.random() * 0.55;

      tree.scale.set(
        overallScale * widthFactor,
        overallScale * heightFactor,
        overallScale * widthFactor
      );

      tree.rotation.x = (Math.random() - 0.5) * 0.08;
      tree.rotation.z = (Math.random() - 0.5) * 0.08;

      const mat = foliageMaterials[Math.floor(Math.random() * foliageMaterials.length)];
      tree.traverse((child) => {
        if (child.isMesh) {
          if (child.name && (child.name.toLowerCase().includes('bark') || child.name.toLowerCase().includes('trunk'))) {
            child.material = trunkMaterial;
          } else {
            child.material = mat;
          }
          child.castShadow = false;
          child.receiveShadow = true;
        }
      });

      return tree;
    };

    const layers = [
      { chance: 0.9, min: 0.8, max: 1.7, lateral: 13, spread: 6, under: true },
      { chance: 0.85, min: 1.8, max: 3.2, lateral: 16, spread: 6, under: false },
      { chance: 0.7, min: 2.6, max: 4.2, lateral: 26, spread: 9, under: false },
      { chance: 0.5, min: 3.4, max: 5.2, lateral: 40, spread: 12, under: false }
    ];

    for (let along = 10; along < 380; along += 9) {
      for (const side of [-1, 1]) {
        for (const layer of layers) {
          if (Math.random() > layer.chance) continue;
          const tree = createVariedTree(layer.min, layer.max, layer.under);
          tree.userData.slot = {
            along: along + (Math.random() - 0.5) * 6,
            lateral: side * (layer.lateral + Math.random() * layer.spread),
            yaw: Math.random() * Math.PI * 2
          };
          tree.visible = false;
          group.add(tree);
          treePool.push(tree);
        }
      }
    }
  } catch (err) {
    console.error('Failed to load fir tree model:', err);
  }
}

function addWindTurbines(group, turbineArray) {
  const poleMaterial = new THREE.MeshBasicMaterial({ color: 0x3d4349 });
  const bladeMaterial = new THREE.MeshBasicMaterial({ color: 0x4f565e });
  
  const turbinePositions = [
    { x: -100, z: -350 },
    { x: 110, z: -420 },
    { x: -130, z: -500 },
    { x: 90, z: -580 },
  ];

  for (const pos of turbinePositions) {
    const turbineGroup = new THREE.Group();
    
    const poleGeometry = new THREE.CylinderGeometry(0.3, 0.5, 25, 8);
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.y = 12.5;
    turbineGroup.add(pole);
    
    const hubGeometry = new THREE.SphereGeometry(0.8, 8, 8);
    const hub = new THREE.Mesh(hubGeometry, poleMaterial);
    hub.position.set(0, 25, -0.5);
    turbineGroup.add(hub);
    
    const bladeGroup = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const bladeGeometry = new THREE.BoxGeometry(0.3, 10, 0.1);
      const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
      blade.position.y = 5;
      blade.geometry.translate(0, 5, 0);
      
      const bladeHolder = new THREE.Group();
      bladeHolder.add(blade);
      bladeHolder.rotation.z = (i / 3) * Math.PI * 2;
      bladeGroup.add(bladeHolder);
    }
    bladeGroup.position.set(0, 25, -1.3);
    bladeGroup.userData.rotationSpeed = 0.5 + Math.random() * 0.3;
    turbineGroup.add(bladeGroup);
    
    turbineGroup.position.set(pos.x, 0, pos.z);
    turbineGroup.userData.bladeGroup = bladeGroup;
    group.add(turbineGroup);
    turbineArray.push(turbineGroup);
  }
}

