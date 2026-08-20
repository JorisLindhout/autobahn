import * as THREE from 'three';

export class Traffic {
  constructor(scene) {
    this.scene = scene;
    this.cars = [];
    this.carPool = [];
    this.maxCars = 20;
    this.laneWidth = 4;
    this.lanePositions = [-4, 0, 4];
    this.spawnDistance = -150;
    this.despawnDistance = 20;
    this.minSpawnInterval = 1.0;
    this.maxSpawnInterval = 3.5;
    this.spawnTimer = 0;
    this.nextSpawnTime = 1;
    
    this.carColors = [
      0x3a5a8c,
      0x4a6e3a,
      0x6b4423,
      0x8b1a1a,
      0x6a6a6a,
      0xe8e8e8,
      0xc4a35a,
      0xd4d4b0,
      0x2a4a6a,
      0x5a3a2a,
      0x8a8a7a,
      0x9a2a1a,
    ];
    
    this.createCarPool();
  }
  
  createCarPool() {
    for (let i = 0; i < this.maxCars; i++) {
      const car = this.createCar();
      car.visible = false;
      this.carPool.push(car);
      this.scene.add(car);
    }
  }
  
  createCar() {
    const group = new THREE.Group();
    const carColor = this.carColors[Math.floor(Math.random() * this.carColors.length)];
    const bodyMaterial = new THREE.MeshBasicMaterial({ color: carColor });
    
    const lowerBodyGeometry = new THREE.BoxGeometry(1.7, 0.5, 4.2);
    const lowerBody = new THREE.Mesh(lowerBodyGeometry, bodyMaterial);
    lowerBody.position.y = 0.35;
    group.add(lowerBody);
    
    const upperBodyGeometry = new THREE.BoxGeometry(1.65, 0.45, 3.8);
    const upperBody = new THREE.Mesh(upperBodyGeometry, bodyMaterial);
    upperBody.position.set(0, 0.7, -0.1);
    group.add(upperBody);
    
    const cabinGeometry = new THREE.BoxGeometry(1.5, 0.55, 2.2);
    const glassMaterial = new THREE.MeshBasicMaterial({ color: 0x1a2a3a });
    const cabin = new THREE.Mesh(cabinGeometry, glassMaterial);
    cabin.position.set(0, 1.1, -0.2);
    group.add(cabin);
    
    const rearWindowGeometry = new THREE.BoxGeometry(1.4, 0.4, 0.1);
    const rearWindow = new THREE.Mesh(rearWindowGeometry, glassMaterial);
    rearWindow.position.set(0, 1.0, 0.95);
    rearWindow.rotation.x = 0.3;
    group.add(rearWindow);
    
    const frontWindowGeometry = new THREE.BoxGeometry(1.4, 0.4, 0.1);
    const frontWindow = new THREE.Mesh(frontWindowGeometry, glassMaterial);
    frontWindow.position.set(0, 1.0, -1.35);
    frontWindow.rotation.x = -0.4;
    group.add(frontWindow);
    
    const hoodGeometry = new THREE.BoxGeometry(1.6, 0.15, 1.0);
    const hood = new THREE.Mesh(hoodGeometry, bodyMaterial);
    hood.position.set(0, 0.85, -1.5);
    group.add(hood);
    
    const trunkGeometry = new THREE.BoxGeometry(1.6, 0.2, 0.8);
    const trunk = new THREE.Mesh(trunkGeometry, bodyMaterial);
    trunk.position.set(0, 0.8, 1.6);
    group.add(trunk);
    
    const bumperMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
    const frontBumperGeometry = new THREE.BoxGeometry(1.7, 0.15, 0.15);
    const frontBumper = new THREE.Mesh(frontBumperGeometry, bumperMaterial);
    frontBumper.position.set(0, 0.25, -2.15);
    group.add(frontBumper);
    
    const rearBumper = new THREE.Mesh(frontBumperGeometry, bumperMaterial);
    rearBumper.position.set(0, 0.25, 2.15);
    group.add(rearBumper);
    
    const wheelMaterial = new THREE.MeshBasicMaterial({ color: 0x1a1a1a });
    const hubcapMaterial = new THREE.MeshBasicMaterial({ color: 0x666666 });
    const wheelGeometry = new THREE.CylinderGeometry(0.28, 0.28, 0.18, 12);
    const hubcapGeometry = new THREE.CircleGeometry(0.18, 8);
    
    const wheelPositions = [
      [-0.8, 0.28, 1.3],
      [0.8, 0.28, 1.3],
      [-0.8, 0.28, -1.3],
      [0.8, 0.28, -1.3],
    ];
    
    for (const pos of wheelPositions) {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(...pos);
      group.add(wheel);
      
      const hubcap = new THREE.Mesh(hubcapGeometry, hubcapMaterial);
      hubcap.rotation.y = Math.PI / 2;
      hubcap.position.set(pos[0] > 0 ? pos[0] + 0.1 : pos[0] - 0.1, pos[1], pos[2]);
      group.add(hubcap);
    }
    
    const tailLightGeometry = new THREE.BoxGeometry(0.25, 0.12, 0.05);
    const tailLightMaterial = new THREE.MeshBasicMaterial({ color: 0xaa0000 });
    
    const leftTail = new THREE.Mesh(tailLightGeometry, tailLightMaterial);
    leftTail.position.set(-0.65, 0.55, 2.13);
    group.add(leftTail);
    
    const rightTail = new THREE.Mesh(tailLightGeometry, tailLightMaterial);
    rightTail.position.set(0.65, 0.55, 2.13);
    group.add(rightTail);
    
    const headlightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffcc });
    const headlightGeometry = new THREE.CircleGeometry(0.1, 8);
    
    const leftHead = new THREE.Mesh(headlightGeometry, headlightMaterial);
    leftHead.position.set(-0.55, 0.55, -2.11);
    group.add(leftHead);
    
    const rightHead = new THREE.Mesh(headlightGeometry, headlightMaterial);
    rightHead.position.set(0.55, 0.55, -2.11);
    group.add(rightHead);
    
    const grilleMaterial = new THREE.MeshBasicMaterial({ color: 0x222222 });
    const grilleGeometry = new THREE.BoxGeometry(0.8, 0.2, 0.05);
    const grille = new THREE.Mesh(grilleGeometry, grilleMaterial);
    grille.position.set(0, 0.45, -2.11);
    group.add(grille);
    
    group.userData = {
      lane: 0,
      speed: 0,
      active: false,
      bodyMaterial: bodyMaterial
    };
    
    return group;
  }
  
  getCarFromPool() {
    for (const car of this.carPool) {
      if (!car.userData.active) {
        return car;
      }
    }
    return null;
  }
  
  spawnCar(gameTime) {
    const car = this.getCarFromPool();
    if (!car) return;
    
    const availableLanes = this.getAvailableLanes();
    if (availableLanes.length === 0) return;
    
    const laneIndex = availableLanes[Math.floor(Math.random() * availableLanes.length)];
    const lane = this.lanePositions[laneIndex];
    
    car.position.set(lane, 0, this.spawnDistance);
    car.userData.lane = laneIndex;
    car.userData.speed = 15 + Math.random() * 10;
    car.userData.active = true;
    car.visible = true;
    
    const newColor = this.carColors[Math.floor(Math.random() * this.carColors.length)];
    if (car.userData.bodyMaterial) {
      car.userData.bodyMaterial.color.setHex(newColor);
    }
    
    this.cars.push(car);
  }
  
  getAvailableLanes() {
    const recentCars = this.cars.filter(
      car => car.position.z < this.spawnDistance + 30 && car.position.z > this.spawnDistance - 10
    );
    
    const occupiedLanes = new Set(recentCars.map(car => car.userData.lane));
    
    const available = [];
    for (let i = 0; i < 3; i++) {
      if (!occupiedLanes.has(i)) {
        available.push(i);
      }
    }
    
    if (available.length === 0) {
      return [Math.floor(Math.random() * 3)];
    }
    
    return available;
  }
  
  reset() {
    for (const car of this.cars) {
      car.userData.active = false;
      car.visible = false;
    }
    this.cars = [];
    this.spawnTimer = 0;
    this.nextSpawnTime = 1;
  }
  
  update(deltaTime, playerSpeed, gameTime) {
    const difficultyFactor = Math.min(gameTime / 120, 1);
    const spawnInterval = this.maxSpawnInterval - 
      (this.maxSpawnInterval - this.minSpawnInterval) * difficultyFactor;
    
    this.spawnTimer += deltaTime;
    if (this.spawnTimer >= this.nextSpawnTime) {
      this.spawnCar(gameTime);
      this.spawnTimer = 0;
      this.nextSpawnTime = spawnInterval * (0.5 + Math.random());
    }
    
    for (let i = this.cars.length - 1; i >= 0; i--) {
      const car = this.cars[i];
      
      const relativeSpeed = playerSpeed - car.userData.speed;
      car.position.z += relativeSpeed * deltaTime;
      
      if (car.position.z > this.despawnDistance) {
        car.userData.active = false;
        car.visible = false;
        this.cars.splice(i, 1);
      }
    }
  }
  
  getCars() {
    return this.cars;
  }
}
