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
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Muted, cold-war era roadside verge grass
  ctx.fillStyle = '#32392c';
  ctx.fillRect(0, 0, size, size);

  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 26;
    data[i] = Math.min(255, Math.max(0, data[i] + noise * 0.8));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise * 0.7));
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = anisotropy;
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

    this.grassMaterial = new THREE.MeshStandardMaterial({
      map: grassTex,
      roughness: 0.95,
      metalness: 0.0,
      side: THREE.DoubleSide
    });

    const groundTex = createGrassTexture(maxAnisotropy);
    groundTex.repeat.set(20, this.chunkLength / 4);

    this.groundMaterial = new THREE.MeshStandardMaterial({
      map: groundTex,
      roughness: 0.98,
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
