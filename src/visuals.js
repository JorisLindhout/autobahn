import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let windTurbines = [];
let sceneryGroup = null;
let scrollOffset = 0;
const SCENERY_LOOP_LENGTH = 600;
const PARALLAX_FACTOR = 0.15;

export function updateScenery(deltaTime, speed = 0) {
  for (const turbine of windTurbines) {
    if (turbine.userData.bladeGroup) {
      turbine.userData.bladeGroup.rotation.z += turbine.userData.bladeGroup.userData.rotationSpeed * deltaTime;
    }
  }
  
  if (sceneryGroup && speed > 0) {
    scrollOffset += speed * deltaTime * PARALLAX_FACTOR;
    
    if (scrollOffset > SCENERY_LOOP_LENGTH) {
      scrollOffset -= SCENERY_LOOP_LENGTH;
    }
    
    sceneryGroup.position.z = scrollOffset;
  }
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
  scrollOffset = 0;
  
  windTurbines = [];
  addRollingHills(sceneryGroup);
  addTrees(sceneryGroup);
  addWindTurbines(sceneryGroup, windTurbines);
  addGridFloor(sceneryGroup);
  
  return sceneryGroup;
}

export function resetScenery() {
  scrollOffset = 0;
  if (sceneryGroup) {
    sceneryGroup.position.z = 0;
  }
}

function addRollingHills(group) {
  const hillMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x424b3e,
    side: THREE.DoubleSide
  });
  
  const hillPositions = [
    { x: -180, z: -500, width: 200, height: 25 },
    { x: -60, z: -550, width: 180, height: 20 },
    { x: 100, z: -520, width: 220, height: 30 },
    { x: 200, z: -580, width: 160, height: 22 },
    { x: -120, z: -600, width: 250, height: 35 },
    { x: 80, z: -620, width: 200, height: 28 },
    { x: -200, z: -650, width: 300, height: 40 },
    { x: 150, z: -680, width: 280, height: 38 },
  ];
  
  for (const pos of hillPositions) {
    const geometry = new THREE.SphereGeometry(pos.width / 2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const hill = new THREE.Mesh(geometry, hillMaterial);
    hill.scale.y = pos.height / (pos.width / 2);
    hill.position.set(pos.x, 0, pos.z);
    group.add(hill);
  }
  
  const farHillMaterial = new THREE.MeshBasicMaterial({ color: 0x5a6557 });
  for (let i = 0; i < 8; i++) {
    const geometry = new THREE.SphereGeometry(150, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const hill = new THREE.Mesh(geometry, farHillMaterial);
    hill.scale.y = 0.15;
    hill.position.set(-400 + i * 120, 0, -750);
    group.add(hill);
  }
}

async function addTrees(group) {
  const treeContainer = new THREE.Group();
  group.add(treeContainer);

  const loader = new GLTFLoader();
  try {
    const gltf = await loader.loadAsync('/models/fir_tree.glb');
    const baseTree = gltf.scene;

    // Center base at ground level Y = 0
    const box = new THREE.Box3().setFromObject(baseTree);
    baseTree.position.y = -box.min.y;

    // Desaturated, deep German Black Forest pine & spruce shades
    const foliageColors = [
      0x16241b, // deep charcoal evergreen
      0x1c2b20, // cold forest pine
      0x142018, // dark spruce
      0x223026, // slate pine
      0x1a241d  // overcast evergreen
    ];

    const foliageMaterials = foliageColors.map(color => new THREE.MeshStandardMaterial({
      color,
      roughness: 0.9,
      metalness: 0.02
    }));

    const trunkMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a231c,
      roughness: 0.95,
      metalness: 0.0
    });

    const createVariedTree = (baseScaleMin, baseScaleMax, posX, posZ) => {
      const tree = baseTree.clone(true);

      // 1. Non-uniform scale variation: some trees are tall and slender, others short and bushy
      const overallScale = baseScaleMin + Math.random() * (baseScaleMax - baseScaleMin);
      const widthFactor = 0.8 + Math.random() * 0.45;   // 0.8x to 1.25x width
      const heightFactor = 0.85 + Math.random() * 0.55; // 0.85x to 1.4x height
      tree.scale.set(
        overallScale * widthFactor,
        overallScale * heightFactor,
        overallScale * widthFactor
      );

      // 2. Full 360° random heading + subtle natural tilt (1° to 3°)
      tree.rotation.y = Math.random() * Math.PI * 2;
      tree.rotation.x = (Math.random() - 0.5) * 0.08;
      tree.rotation.z = (Math.random() - 0.5) * 0.08;

      // 3. Randomize foliage material tint on this instance
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

      tree.position.set(posX, 0, posZ);
      return tree;
    };

    // Generate natural layered tree line along the scrolling loop (SCENERY_LOOP_LENGTH = 600)
    for (let z = 0; z > -SCENERY_LOOP_LENGTH; z -= 14) {
      // Left side: Row 1 (close roadside), Row 2 (mid distance), Row 3 (background hillside)
      if (Math.random() > 0.15) {
        const x = -15 - Math.random() * 6;
        const jitterZ = z + (Math.random() - 0.5) * 10;
        treeContainer.add(createVariedTree(1.8, 3.2, x, jitterZ));
      }
      if (Math.random() > 0.3) {
        const x = -24 - Math.random() * 10;
        const jitterZ = z + (Math.random() - 0.5) * 12;
        treeContainer.add(createVariedTree(2.4, 4.2, x, jitterZ));
      }
      if (Math.random() > 0.45) {
        const x = -38 - Math.random() * 16;
        const jitterZ = z + (Math.random() - 0.5) * 14;
        treeContainer.add(createVariedTree(3.0, 5.2, x, jitterZ));
      }

      // Right side: Row 1 (close roadside), Row 2 (mid distance), Row 3 (background hillside)
      if (Math.random() > 0.15) {
        const x = 15 + Math.random() * 6;
        const jitterZ = z + (Math.random() - 0.5) * 10;
        treeContainer.add(createVariedTree(1.8, 3.2, x, jitterZ));
      }
      if (Math.random() > 0.3) {
        const x = 24 + Math.random() * 10;
        const jitterZ = z + (Math.random() - 0.5) * 12;
        treeContainer.add(createVariedTree(2.4, 4.2, x, jitterZ));
      }
      if (Math.random() > 0.45) {
        const x = 38 + Math.random() * 16;
        const jitterZ = z + (Math.random() - 0.5) * 14;
        treeContainer.add(createVariedTree(3.0, 5.2, x, jitterZ));
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

function addGridFloor(group) {
  const floorSize = 1000;
  const floorGeometry = new THREE.PlaneGeometry(floorSize, floorSize);
  const floorMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x384133,
    side: THREE.DoubleSide
  });
  
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -0.1, -400);
  group.add(floor);
}
