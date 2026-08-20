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
      0x00ffff,
      0xff00ff,
      0xffff00,
      0xff6600,
      0x00ff66,
      0xff0066,
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
    
    const bodyGeometry = new THREE.BoxGeometry(2, 1, 4);
    const bodyMaterial = new THREE.MeshBasicMaterial({ 
      color: this.carColors[Math.floor(Math.random() * this.carColors.length)]
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.5;
    group.add(body);
    
    const cabinGeometry = new THREE.BoxGeometry(1.6, 0.7, 2);
    const cabinMaterial = new THREE.MeshBasicMaterial({ color: 0x111122 });
    const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin.position.set(0, 1.1, -0.3);
    group.add(cabin);
    
    const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 8);
    const wheelMaterial = new THREE.MeshBasicMaterial({ color: 0x111111 });
    
    const wheelPositions = [
      [-0.9, 0.3, 1.2],
      [0.9, 0.3, 1.2],
      [-0.9, 0.3, -1.2],
      [0.9, 0.3, -1.2],
    ];
    
    for (const pos of wheelPositions) {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(...pos);
      group.add(wheel);
    }
    
    const tailLightGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.1);
    const tailLightMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    
    const leftTail = new THREE.Mesh(tailLightGeometry, tailLightMaterial);
    leftTail.position.set(-0.7, 0.6, 2.01);
    group.add(leftTail);
    
    const rightTail = new THREE.Mesh(tailLightGeometry, tailLightMaterial);
    rightTail.position.set(0.7, 0.6, 2.01);
    group.add(rightTail);
    
    group.userData = {
      lane: 0,
      speed: 0,
      active: false
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
    
    const bodyMesh = car.children[0];
    if (bodyMesh && bodyMesh.material) {
      bodyMesh.material.color.setHex(
        this.carColors[Math.floor(Math.random() * this.carColors.length)]
      );
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
