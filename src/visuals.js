import * as THREE from 'three';

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
  const sceneryGroup = new THREE.Group();
  
  addMountains(sceneryGroup);
  addPalmTrees(sceneryGroup);
  addGridFloor(sceneryGroup);
  
  return sceneryGroup;
}

function addMountains(group) {
  const mountainMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x2d1b4e,
    side: THREE.DoubleSide
  });
  
  const mountainPositions = [
    { x: -200, z: -350, width: 150, height: 60 },
    { x: -80, z: -380, width: 120, height: 45 },
    { x: 50, z: -360, width: 100, height: 55 },
    { x: 180, z: -370, width: 140, height: 50 },
    { x: -150, z: -400, width: 180, height: 70 },
    { x: 120, z: -420, width: 160, height: 65 },
  ];
  
  for (const pos of mountainPositions) {
    const geometry = new THREE.ConeGeometry(pos.width / 2, pos.height, 4);
    const mountain = new THREE.Mesh(geometry, mountainMaterial);
    mountain.position.set(pos.x, pos.height / 2 - 5, pos.z);
    mountain.rotation.y = Math.random() * Math.PI;
    group.add(mountain);
  }
}

function addPalmTrees(group) {
  const trunkMaterial = new THREE.MeshBasicMaterial({ color: 0x1a0a1a });
  const leafMaterial = new THREE.MeshBasicMaterial({ color: 0x0a0a1a });
  
  const treePositions = [];
  for (let z = -50; z > -350; z -= 30) {
    treePositions.push({ x: -25, z: z + Math.random() * 10 });
    treePositions.push({ x: 25, z: z + Math.random() * 10 });
  }
  
  for (const pos of treePositions) {
    const treeGroup = new THREE.Group();
    
    const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.5, 8, 6);
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 4;
    treeGroup.add(trunk);
    
    for (let i = 0; i < 5; i++) {
      const leafGeometry = new THREE.ConeGeometry(3, 4, 4);
      const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
      const angle = (i / 5) * Math.PI * 2;
      leaf.position.set(
        Math.cos(angle) * 1.5,
        7 + Math.random(),
        Math.sin(angle) * 1.5
      );
      leaf.rotation.x = 0.5;
      leaf.rotation.z = Math.cos(angle) * 0.5;
      treeGroup.add(leaf);
    }
    
    treeGroup.position.set(pos.x, 0, pos.z);
    group.add(treeGroup);
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
