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

/* Realistic procedural overcast cloud sky texture generator */
function createCloudTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Base sky gradient: darker slate/charcoal zenith to luminous silver horizon
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0.0, '#3e4956');
  gradient.addColorStop(0.35, '#5b6775');
  gradient.addColorStop(0.70, '#8693a1');
  gradient.addColorStop(1.0, '#b2bcc6');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Layered cloudy atmosphere noise
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  // Simple multi-frequency value noise for realistic overcast cloud banks
  function noise2D(x, y) {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453123;
    return n - Math.floor(n);
  }

  function smoothNoise(x, y, freq) {
    const fx = x * freq;
    const fy = y * freq;
    const ix = Math.floor(fx);
    const iy = Math.floor(fy);
    const fracX = fx - ix;
    const fracY = fy - iy;

    // Smoothstep interpolation
    const sx = fracX * fracX * (3 - 2 * fracX);
    const sy = fracY * fracY * (3 - 2 * fracY);

    const n00 = noise2D(ix, iy);
    const n10 = noise2D(ix + 1, iy);
    const n01 = noise2D(ix, iy + 1);
    const n11 = noise2D(ix + 1, iy + 1);

    const nx0 = n00 * (1 - sx) + n10 * sx;
    const nx1 = n01 * (1 - sx) + n11 * sx;
    return nx0 * (1 - sy) + nx1 * sy;
  }

  function fbm(x, y) {
    let total = 0;
    let amp = 0.5;
    let freq = 0.006;
    for (let o = 0; o < 4; o++) {
      total += smoothNoise(x, y, freq) * amp;
      freq *= 2.2;
      amp *= 0.48;
    }
    return total;
  }

  for (let y = 0; y < canvas.height; y++) {
    const normY = y / canvas.height;
    // Cloud density stronger in mid/upper sky, hazy mist at horizon
    const horizonFade = Math.sin(normY * Math.PI * 0.95);

    for (let x = 0; x < canvas.width; x++) {
      const idx = (y * canvas.width + x) * 4;
      const cloudVal = fbm(x, y * 1.6);
      const cloudPuff = (cloudVal - 0.45) * 110 * horizonFade;

      data[idx] = Math.min(255, Math.max(0, data[idx] + cloudPuff * 0.92));
      data[idx + 1] = Math.min(255, Math.max(0, data[idx + 1] + cloudPuff * 0.96));
      data[idx + 2] = Math.min(255, Math.max(0, data[idx + 2] + cloudPuff * 1.02));
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // Soft diffused sun halo behind the cloud ceiling (realistic atmospheric glow)
  const sunX = canvas.width * 0.62;
  const sunY = canvas.height * 0.42;
  const sunGlow = ctx.createRadialGradient(sunX, sunY, 15, sunX, sunY, 180);
  sunGlow.addColorStop(0.0, 'rgba(240, 244, 250, 0.45)');
  sunGlow.addColorStop(0.3, 'rgba(220, 228, 238, 0.22)');
  sunGlow.addColorStop(1.0, 'rgba(180, 192, 204, 0.0)');
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
    depthWrite: false
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
