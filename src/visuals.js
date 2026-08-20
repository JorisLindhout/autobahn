import * as THREE from 'three';

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

export function createSky() {
  const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
  
  const skyMaterial = new THREE.ShaderMaterial({
    uniforms: {
      topColor: { value: new THREE.Color(0x1a0a2e) },
      middleColor: { value: new THREE.Color(0xff6b35) },
      bottomColor: { value: new THREE.Color(0xff9500) },
      offset: { value: 0 },
      exponent: { value: 0.6 }
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 middleColor;
      uniform vec3 bottomColor;
      uniform float offset;
      uniform float exponent;
      varying vec3 vWorldPosition;
      
      void main() {
        float h = normalize(vWorldPosition + offset).y;
        
        vec3 color;
        if (h > 0.0) {
          color = mix(middleColor, topColor, pow(h, exponent));
        } else {
          color = mix(middleColor, bottomColor, pow(-h, 0.5));
        }
        
        gl_FragColor = vec4(color, 1.0);
      }
    `,
    side: THREE.BackSide
  });
  
  const sky = new THREE.Mesh(skyGeometry, skyMaterial);
  return sky;
}

export function createSun() {
  const sunGroup = new THREE.Group();
  
  const sunGeometry = new THREE.CircleGeometry(40, 32);
  const sunMaterial = new THREE.ShaderMaterial({
    uniforms: {
      color1: { value: new THREE.Color(0xffff00) },
      color2: { value: new THREE.Color(0xff6600) }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 color1;
      uniform vec3 color2;
      varying vec2 vUv;
      
      void main() {
        float dist = length(vUv - 0.5) * 2.0;
        vec3 color = mix(color1, color2, dist);
        
        // Add horizontal lines for retro effect
        float lines = mod(gl_FragCoord.y, 8.0);
        if (lines < 2.0 && dist < 0.8) {
          color *= 0.7;
        }
        
        gl_FragColor = vec4(color, 1.0);
      }
    `,
    transparent: true
  });
  
  const sun = new THREE.Mesh(sunGeometry, sunMaterial);
  sun.position.set(0, 30, -400);
  sunGroup.add(sun);
  
  const glowGeometry = new THREE.CircleGeometry(60, 32);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xff6600,
    transparent: true,
    opacity: 0.3
  });
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  glow.position.set(0, 30, -401);
  sunGroup.add(glow);
  
  return sunGroup;
}

export function createScenery() {
  sceneryGroup = new THREE.Group();
  scrollOffset = 0;
  
  windTurbines = [];
  addRollingHills(sceneryGroup);
  addPoplars(sceneryGroup);
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
    color: 0x1a2a1a,
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
  
  const farHillMaterial = new THREE.MeshBasicMaterial({ color: 0x2d1b4e });
  for (let i = 0; i < 8; i++) {
    const geometry = new THREE.SphereGeometry(150, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const hill = new THREE.Mesh(geometry, farHillMaterial);
    hill.scale.y = 0.15;
    hill.position.set(-400 + i * 120, 0, -750);
    group.add(hill);
  }
}

function addPoplars(group) {
  const trunkMaterial = new THREE.MeshBasicMaterial({ color: 0x2a1a0a });
  const foliageMaterial = new THREE.MeshBasicMaterial({ color: 0x0a1a0a });
  
  const treePositions = [];
  for (let z = -40; z > -400; z -= 25) {
    if (Math.random() > 0.3) {
      treePositions.push({ x: -18 - Math.random() * 5, z: z + Math.random() * 8, height: 12 + Math.random() * 6 });
    }
    if (Math.random() > 0.3) {
      treePositions.push({ x: 18 + Math.random() * 5, z: z + Math.random() * 8, height: 12 + Math.random() * 6 });
    }
  }
  
  for (const pos of treePositions) {
    const treeGroup = new THREE.Group();
    
    const trunkGeometry = new THREE.CylinderGeometry(0.15, 0.25, pos.height * 0.9, 6);
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = pos.height * 0.45;
    treeGroup.add(trunk);
    
    const foliageGeometry = new THREE.ConeGeometry(1.2, pos.height * 0.85, 8);
    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliage.position.y = pos.height * 0.55;
    treeGroup.add(foliage);
    
    const topGeometry = new THREE.ConeGeometry(0.6, pos.height * 0.3, 6);
    const top = new THREE.Mesh(topGeometry, foliageMaterial);
    top.position.y = pos.height * 0.9;
    treeGroup.add(top);
    
    treeGroup.position.set(pos.x, 0, pos.z);
    group.add(treeGroup);
  }
}

function addWindTurbines(group, turbineArray) {
  const poleMaterial = new THREE.MeshBasicMaterial({ color: 0x333344 });
  const bladeMaterial = new THREE.MeshBasicMaterial({ color: 0x444455 });
  
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
  const gridSize = 500;
  const gridDivisions = 50;
  
  const gridMaterial = new THREE.LineBasicMaterial({ 
    color: 0xff00ff,
    transparent: true,
    opacity: 0.3
  });
  
  const points = [];
  const step = gridSize / gridDivisions;
  const half = gridSize / 2;
  
  for (let i = 0; i <= gridDivisions; i++) {
    const pos = -half + i * step;
    points.push(new THREE.Vector3(-half, -0.1, pos));
    points.push(new THREE.Vector3(half, -0.1, pos));
  }
  
  for (let i = 0; i <= gridDivisions; i++) {
    const pos = -half + i * step;
    points.push(new THREE.Vector3(pos, -0.1, -half));
    points.push(new THREE.Vector3(pos, -0.1, half));
  }
  
  const gridGeometry = new THREE.BufferGeometry().setFromPoints(points);
  const grid = new THREE.LineSegments(gridGeometry, gridMaterial);
  grid.position.z = -250;
  group.add(grid);
}
