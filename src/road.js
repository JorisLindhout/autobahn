import * as THREE from 'three';

export class Road {
  constructor(scene) {
    this.scene = scene;
    this.chunks = [];
    this.chunkLength = 100;
    this.numChunks = 5;
    this.roadWidth = 12;
    this.laneWidth = 4;
    this.scrollOffset = 0;
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
    const roadMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x505050,
      side: THREE.DoubleSide
    });
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0;
    road.position.z = -this.chunkLength / 2;
    group.add(road);
    
    const shoulderWidth = 2;
    const shoulderGeometry = new THREE.PlaneGeometry(shoulderWidth, this.chunkLength);
    
    const leftShoulderMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x606060,
      side: THREE.DoubleSide
    });
    const leftShoulder = new THREE.Mesh(shoulderGeometry, leftShoulderMaterial);
    leftShoulder.rotation.x = -Math.PI / 2;
    leftShoulder.position.set(-this.roadWidth / 2 - shoulderWidth / 2, 0.01, -this.chunkLength / 2);
    group.add(leftShoulder);
    
    const rightShoulderMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x606060,
      side: THREE.DoubleSide
    });
    const rightShoulder = new THREE.Mesh(shoulderGeometry, rightShoulderMaterial);
    rightShoulder.rotation.x = -Math.PI / 2;
    rightShoulder.position.set(this.roadWidth / 2 + shoulderWidth / 2, 0.01, -this.chunkLength / 2);
    group.add(rightShoulder);
    
    this.addLaneMarkings(group);
    
    this.addRoadEdges(group);
    
    this.addGround(group);
    
    return group;
  }
  
  addLaneMarkings(group) {
    const dashLength = 3;
    const dashGap = 6;
    const dashWidth = 0.15;
    const numDashes = Math.floor(this.chunkLength / (dashLength + dashGap));
    
    const dashGeometry = new THREE.PlaneGeometry(dashWidth, dashLength);
    const dashMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffffff,
      side: THREE.DoubleSide
    });
    
    for (let lane = 0; lane < 2; lane++) {
      const xPos = (lane - 0.5) * this.laneWidth;
      
      for (let i = 0; i < numDashes; i++) {
        const dash = new THREE.Mesh(dashGeometry, dashMaterial);
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(
          xPos,
          0.02,
          -i * (dashLength + dashGap) - dashLength / 2
        );
        group.add(dash);
      }
    }
    
    const edgeLineGeometry = new THREE.PlaneGeometry(0.2, this.chunkLength);
    const edgeLineMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffffff,
      side: THREE.DoubleSide
    });
    
    const leftEdge = new THREE.Mesh(edgeLineGeometry, edgeLineMaterial);
    leftEdge.rotation.x = -Math.PI / 2;
    leftEdge.position.set(-this.roadWidth / 2 + 0.1, 0.02, -this.chunkLength / 2);
    group.add(leftEdge);
    
    const rightEdge = new THREE.Mesh(edgeLineGeometry, edgeLineMaterial);
    rightEdge.rotation.x = -Math.PI / 2;
    rightEdge.position.set(this.roadWidth / 2 - 0.1, 0.02, -this.chunkLength / 2);
    group.add(rightEdge);
  }
  
  addRoadEdges(group) {
    const barrierHeight = 0.4;
    const barrierWidth = 0.15;
    const barrierGeometry = new THREE.BoxGeometry(barrierWidth, barrierHeight, this.chunkLength);
    const guardrailMaterial = new THREE.MeshBasicMaterial({ color: 0x888888 });
    
    const leftBarrier = new THREE.Mesh(barrierGeometry, guardrailMaterial);
    leftBarrier.position.set(-this.roadWidth / 2 - 1.5, barrierHeight / 2 + 0.3, -this.chunkLength / 2);
    group.add(leftBarrier);
    
    const rightBarrier = new THREE.Mesh(barrierGeometry, guardrailMaterial);
    rightBarrier.position.set(this.roadWidth / 2 + 1.5, barrierHeight / 2 + 0.3, -this.chunkLength / 2);
    group.add(rightBarrier);
    
    const grassWidth = 8;
    const grassGeometry = new THREE.PlaneGeometry(grassWidth, this.chunkLength);
    const grassMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x4a8c3a,
      side: THREE.DoubleSide
    });
    
    const leftGrass = new THREE.Mesh(grassGeometry, grassMaterial);
    leftGrass.rotation.x = -Math.PI / 2;
    leftGrass.position.set(-this.roadWidth / 2 - 2 - grassWidth / 2, 0.01, -this.chunkLength / 2);
    group.add(leftGrass);
    
    const rightGrass = new THREE.Mesh(grassGeometry, grassMaterial);
    rightGrass.rotation.x = -Math.PI / 2;
    rightGrass.position.set(this.roadWidth / 2 + 2 + grassWidth / 2, 0.01, -this.chunkLength / 2);
    group.add(rightGrass);
  }
  
  addGround(group) {
    const groundWidth = 200;
    const groundGeometry = new THREE.PlaneGeometry(groundWidth, this.chunkLength);
    const groundMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x3d7a35,
      side: THREE.DoubleSide
    });
    
    const leftGround = new THREE.Mesh(groundGeometry, groundMaterial);
    leftGround.rotation.x = -Math.PI / 2;
    leftGround.position.set(-groundWidth / 2 - this.roadWidth / 2 - 12, -0.01, -this.chunkLength / 2);
    group.add(leftGround);
    
    const rightGround = new THREE.Mesh(groundGeometry, groundMaterial);
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
    
    for (const chunk of this.chunks) {
      chunk.position.z += movement;
      
      if (chunk.position.z > this.chunkLength) {
        const minZ = Math.min(...this.chunks.map(c => c.position.z));
        chunk.position.z = minZ - this.chunkLength;
      }
    }
  }
}
