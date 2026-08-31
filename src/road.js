import * as THREE from 'three';

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

export class Road {
  constructor(scene, renderer = null) {
    this.scene = scene;
    this.renderer = renderer;
    this.chunks = [];
    this.chunkLength = 100;
    this.numChunks = 7;
    this.roadWidth = 12;
    this.laneWidth = 4;
    this.scrollOffset = 0;

    this.initMaterials();
  }

  initMaterials() {
    const maxAnisotropy = this.renderer ? this.renderer.capabilities.getMaxAnisotropy() : 8;

    // Road asphalt textures
    const asphaltTex = createAsphaltTexture(maxAnisotropy);
    asphaltTex.repeat.set(3, this.chunkLength / 4);

    const asphaltBumpTex = createAsphaltBumpTexture(maxAnisotropy);
    asphaltBumpTex.repeat.set(3, this.chunkLength / 4);

    this.roadMaterial = new THREE.MeshStandardMaterial({
      map: asphaltTex,
      bumpMap: asphaltBumpTex,
      bumpScale: 0.04,
      roughness: 0.88,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    // Shoulder material
    const shoulderTex = createShoulderTexture(maxAnisotropy);
    shoulderTex.repeat.set(1, this.chunkLength / 4);

    this.shoulderMaterial = new THREE.MeshStandardMaterial({
      map: shoulderTex,
      roughness: 0.95,
      metalness: 0.02,
      side: THREE.DoubleSide
    });

    // Lane markings - vintage weathered motorway paint
    this.dashMaterial = new THREE.MeshStandardMaterial({
      color: 0xcfccc4,
      roughness: 0.82,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    this.edgeLineMaterial = new THREE.MeshStandardMaterial({
      color: 0xcfccc4,
      roughness: 0.82,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    // Guardrails - weathered galvanized steel
    this.guardrailMaterial = new THREE.MeshStandardMaterial({
      color: 0x6e757c,
      metalness: 0.55,
      roughness: 0.5
    });

    // Grass & Ground
    const grassTex = createGrassTexture(maxAnisotropy);
    grassTex.repeat.set(2, this.chunkLength / 4);

    const grassBumpTex = createGrassBumpTexture(maxAnisotropy);
    grassBumpTex.repeat.set(2, this.chunkLength / 4);

    this.grassMaterial = new THREE.MeshStandardMaterial({
      map: grassTex,
      bumpMap: grassBumpTex,
      bumpScale: 0.05,
      roughness: 0.92,
      metalness: 0.0,
      side: THREE.DoubleSide
    });

    const groundTex = createForestFloorTexture(maxAnisotropy);
    groundTex.repeat.set(16, this.chunkLength / 4);

    const groundBumpTex = createGrassBumpTexture(maxAnisotropy);
    groundBumpTex.repeat.set(16, this.chunkLength / 4);

    this.groundMaterial = new THREE.MeshStandardMaterial({
      map: groundTex,
      bumpMap: groundBumpTex,
      bumpScale: 0.06,
      roughness: 0.98,
      metalness: 0.0,
      side: THREE.DoubleSide
    });

    // 3D Roadside Grass Tufts
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

  create() {
    for (let i = 0; i < this.numChunks; i++) {
      const chunk = this.createChunk();
      chunk.position.z = -i * this.chunkLength;
      this.chunks.push(chunk);
      this.scene.add(chunk);
    }
  }

  createChunk() {
    const group = new THREE.Group();

    const roadGeometry = new THREE.PlaneGeometry(this.roadWidth, this.chunkLength);
    const road = new THREE.Mesh(roadGeometry, this.roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0;
    road.position.z = -this.chunkLength / 2;
    group.add(road);

    const shoulderWidth = 2;
    const shoulderGeometry = new THREE.PlaneGeometry(shoulderWidth, this.chunkLength);

    const leftShoulder = new THREE.Mesh(shoulderGeometry, this.shoulderMaterial);
    leftShoulder.rotation.x = -Math.PI / 2;
    leftShoulder.position.set(-this.roadWidth / 2 - shoulderWidth / 2, 0.005, -this.chunkLength / 2);
    group.add(leftShoulder);

    const rightShoulder = new THREE.Mesh(shoulderGeometry, this.shoulderMaterial);
    rightShoulder.rotation.x = -Math.PI / 2;
    rightShoulder.position.set(this.roadWidth / 2 + shoulderWidth / 2, 0.005, -this.chunkLength / 2);
    group.add(rightShoulder);

    this.addLaneMarkings(group);
    this.addRoadEdges(group);
    this.addGround(group);
    this.addGrassTufts(group);

    return group;
  }

  addLaneMarkings(group) {
    const dashLength = 4;
    const dashGap = 6;
    const cycle = dashLength + dashGap; // 10m cycle divides 100m chunk length evenly
    const dashWidth = 0.15;
    const numDashes = Math.round(this.chunkLength / cycle);

    const dashGeometry = new THREE.PlaneGeometry(dashWidth, dashLength);

    for (let lane = 0; lane < 2; lane++) {
      const xPos = (lane - 0.5) * this.laneWidth;

      for (let i = 0; i < numDashes; i++) {
        const dash = new THREE.Mesh(dashGeometry, this.dashMaterial);
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(
          xPos,
          0.02,
          -i * cycle - dashLength / 2
        );
        group.add(dash);
      }
    }

    const edgeLineGeometry = new THREE.PlaneGeometry(0.2, this.chunkLength);

    const leftEdge = new THREE.Mesh(edgeLineGeometry, this.edgeLineMaterial);
    leftEdge.rotation.x = -Math.PI / 2;
    leftEdge.position.set(-this.roadWidth / 2 + 0.1, 0.02, -this.chunkLength / 2);
    group.add(leftEdge);

    const rightEdge = new THREE.Mesh(edgeLineGeometry, this.edgeLineMaterial);
    rightEdge.rotation.x = -Math.PI / 2;
    rightEdge.position.set(this.roadWidth / 2 - 0.1, 0.02, -this.chunkLength / 2);
    group.add(rightEdge);
  }

  addRoadEdges(group) {
    const barrierHeight = 0.4;
    const barrierWidth = 0.15;
    const barrierGeometry = new THREE.BoxGeometry(barrierWidth, barrierHeight, this.chunkLength);

    const leftBarrier = new THREE.Mesh(barrierGeometry, this.guardrailMaterial);
    leftBarrier.position.set(-this.roadWidth / 2 - 1.5, barrierHeight / 2 + 0.3, -this.chunkLength / 2);
    group.add(leftBarrier);

    const rightBarrier = new THREE.Mesh(barrierGeometry, this.guardrailMaterial);
    rightBarrier.position.set(this.roadWidth / 2 + 1.5, barrierHeight / 2 + 0.3, -this.chunkLength / 2);
    group.add(rightBarrier);

    const grassWidth = 8;
    const grassGeometry = new THREE.PlaneGeometry(grassWidth, this.chunkLength);

    const leftGrass = new THREE.Mesh(grassGeometry, this.grassMaterial);
    leftGrass.rotation.x = -Math.PI / 2;
    leftGrass.position.set(-this.roadWidth / 2 - 2 - grassWidth / 2, 0.01, -this.chunkLength / 2);
    group.add(leftGrass);

    const rightGrass = new THREE.Mesh(grassGeometry, this.grassMaterial);
    rightGrass.rotation.x = -Math.PI / 2;
    rightGrass.position.set(this.roadWidth / 2 + 2 + grassWidth / 2, 0.01, -this.chunkLength / 2);
    group.add(rightGrass);
  }

  addGrassTufts(group) {
    const tuftGeo1 = new THREE.PlaneGeometry(0.75, 0.6);
    tuftGeo1.translate(0, 0.3, 0);
    const tuftGeo2 = new THREE.PlaneGeometry(0.75, 0.6);
    tuftGeo2.rotateY(Math.PI / 2);
    tuftGeo2.translate(0, 0.3, 0);

    const numTufts = 16;
    for (let i = 0; i < numTufts; i++) {
      const z = -Math.random() * this.chunkLength;

      // Left roadside tuft (right beside guardrail)
      const leftGroup = new THREE.Group();
      leftGroup.add(new THREE.Mesh(tuftGeo1, this.tuftMaterial));
      leftGroup.add(new THREE.Mesh(tuftGeo2, this.tuftMaterial));
      const leftScale = 0.55 + Math.random() * 0.45;
      leftGroup.scale.set(leftScale, leftScale, leftScale);
      leftGroup.rotation.y = Math.random() * Math.PI;
      leftGroup.position.set(-this.roadWidth / 2 - 2.1 - Math.random() * 3.5, 0.01, z);
      group.add(leftGroup);

      // Right roadside tuft (right beside guardrail)
      const rightGroup = new THREE.Group();
      rightGroup.add(new THREE.Mesh(tuftGeo1, this.tuftMaterial));
      rightGroup.add(new THREE.Mesh(tuftGeo2, this.tuftMaterial));
      const rightScale = 0.55 + Math.random() * 0.45;
      rightGroup.scale.set(rightScale, rightScale, rightScale);
      rightGroup.rotation.y = Math.random() * Math.PI;
      rightGroup.position.set(this.roadWidth / 2 + 2.1 + Math.random() * 3.5, 0.01, z);
      group.add(rightGroup);
    }
  }

  addGround(group) {
    const groundWidth = 200;
    const groundGeometry = new THREE.PlaneGeometry(groundWidth, this.chunkLength);

    const leftGround = new THREE.Mesh(groundGeometry, this.groundMaterial);
    leftGround.rotation.x = -Math.PI / 2;
    leftGround.position.set(-groundWidth / 2 - this.roadWidth / 2 - 12, -0.01, -this.chunkLength / 2);
    group.add(leftGround);

    const rightGround = new THREE.Mesh(groundGeometry, this.groundMaterial);
    rightGround.rotation.x = -Math.PI / 2;
    rightGround.position.set(groundWidth / 2 + this.roadWidth / 2 + 12, -0.01, -this.chunkLength / 2);
    group.add(rightGround);
  }

  reset() {
    this.scrollOffset = 0;
    for (let i = 0; i < this.chunks.length; i++) {
      this.chunks[i].position.z = -i * this.chunkLength;
    }
  }

  update(deltaTime, speed) {
    const movement = speed * deltaTime;
    this.scrollOffset += movement;
    const totalLength = this.numChunks * this.chunkLength;

    for (const chunk of this.chunks) {
      chunk.position.z += movement;

      if (chunk.position.z > this.chunkLength) {
        chunk.position.z -= totalLength;
      }
    }
  }
}
