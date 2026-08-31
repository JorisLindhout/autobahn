import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const CAR_VARIANTS = [
  {
    type: 'standard',
    modelUrl: '/models/golf_mk2.glb',
    textures: [
      '/textures/cars/CompactCar_Texture_Gray.png',
      '/textures/cars/CompactCar_Texture_Black.png',
      '/textures/cars/CompactCar_Texture_White.png',
      '/textures/cars/CompactCar_Texture_Brown.png',
      '/textures/cars/CompactCar_Texture_Blue.png',
      '/textures/cars/CompactCar_Texture_Green.png',
      '/textures/cars/CompactCar_Texture_Red.png',
      '/textures/cars/CompactCar_Texture_Gray.png',
      '/textures/cars/CompactCar_Texture_Black.png',
    ],
    weight: 0.74
  },
  {
    type: 'muscle',
    modelUrl: '/models/golf_gti.glb',
    textures: [
      '/textures/cars/CompactCar_Texture_Muscle_Blue.png',
      '/textures/cars/CompactCar_Texture_Muscle_Red.png',
    ],
    weight: 0.12
  },
  {
    type: 'taxi',
    modelUrl: '/models/golf_taxi.glb',
    textures: [
      '/textures/cars/CompactCar_Texture_Taxi.png',
    ],
    weight: 0.07
  },
  {
    type: 'police',
    modelUrl: '/models/golf_police.glb',
    textures: [
      '/textures/cars/CompactCar_Texture_Police.png',
    ],
    weight: 0.07
  }
];

export class Traffic {
  constructor(scene) {
    this.scene = scene;
    this.cars = [];
    this.carPool = [];
    this.maxCars = 20;

    this.laneWidth = 4;
    this.lanePositions = [-4, 0, 4];

    this.spawnDistance = -120;
    this.despawnDistance = 2;

    this.minSpawnInterval = 1.0;
    this.maxSpawnInterval = 3.0;

    this.spawnTimer = 0;
    this.nextSpawnTime = 1;

    // Loaded asset caches
    this.models = new Map();
    this.materialsByVariant = new Map();
    this.assetsReady = false;

    this.carScale = 1.0;
    this.carRotationY = Math.PI;

    // Traffic AI parameters
    this.safeFollowingDistance = 8.0;    // Minimum gap behind lead car (meters)
    this.overtakeTriggerDistance = 22.0;  // Gap at which car looks to overtake
    this.adjacentSafetyGapAhead = 12.0;  // Required free space ahead in target lane
    this.adjacentSafetyGapBehind = 10.0; // Required free space behind in target lane
    this.laneChangeDuration = 0.9;       // Duration of lane change in seconds
    this.brakeRate = 4.0;                // How fast cars brake when stuck behind
    this.accelRate = 2.0;                // How fast cars regain desired speed

    this.loadAllAssets();
  }

  async loadAllAssets() {
    const gltfLoader = new GLTFLoader();
    const textureLoader = new THREE.TextureLoader();

    try {
      // 1. Load all GLB models
      const modelPromises = CAR_VARIANTS.map(async (variant) => {
        const gltf = await gltfLoader.loadAsync(variant.modelUrl);
        const root = gltf.scene;

        // Normalize model: center on X/Z and place bottom at Y = 0
        const box = new THREE.Box3().setFromObject(root);
        const center = box.getCenter(new THREE.Vector3());
        
        root.position.x -= center.x;
        root.position.y -= box.min.y;
        root.position.z -= center.z;

        // Wrap in a container so transformations are clean
        const wrapper = new THREE.Group();
        wrapper.add(root);

        this.models.set(variant.type, wrapper);
      });

      // 2. Preload all textures and create materials
      const materialPromises = CAR_VARIANTS.map(async (variant) => {
        const materials = await Promise.all(
          variant.textures.map(async (texPath) => {
            const texture = await textureLoader.loadAsync(texPath);
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.flipY = false;
            texture.minFilter = THREE.LinearMipmapLinearFilter;
            texture.magFilter = THREE.LinearFilter;

            return new THREE.MeshStandardMaterial({
              map: texture,
              roughness: 0.35,
              metalness: 0.15,
            });
          })
        );
        this.materialsByVariant.set(variant.type, materials);
      });

      await Promise.all([...modelPromises, ...materialPromises]);

      this.assetsReady = true;
      console.log('Traffic assets loaded successfully (4 models + 16 textures)');

      this.createCarPool();
      this.spawnInitialCars();
    } catch (error) {
      console.error('Failed to load traffic assets:', error);
    }
  }

  createCarPool() {
    if (!this.assetsReady || this.carPool.length > 0) {
      return;
    }

    for (let i = 0; i < this.maxCars; i++) {
      const car = this.createCarInstance();
      car.visible = false;
      this.carPool.push(car);
      this.scene.add(car);
    }
  }

  getRandomVariantType() {
    const r = Math.random();
    let accumulated = 0;
    for (const v of CAR_VARIANTS) {
      accumulated += v.weight;
      if (r <= accumulated) {
        return v.type;
      }
    }
    return CAR_VARIANTS[0].type;
  }

  createCarInstance() {
    const variantType = this.getRandomVariantType();
    const baseModel = this.models.get(variantType) || this.models.get('standard');
    const materials = this.materialsByVariant.get(variantType) || this.materialsByVariant.get('standard');

    const car = baseModel.clone(true);
    car.scale.setScalar(this.carScale);
    car.rotation.y = this.carRotationY;

    // Apply a random matching texture material
    const material = materials[Math.floor(Math.random() * materials.length)];
    this.applyMaterialToCar(car, material);

    car.userData = {
      variantType,
      material,
      lane: 0,
      targetLane: 0,
      fromX: 0,
      toX: 0,
      isChangingLane: false,
      laneProgress: 0,
      laneCooldown: 0,
      speed: 0,
      baseSpeed: 0,
      active: false
    };

    return car;
  }

  applyMaterialToCar(car, material) {
    car.traverse((child) => {
      if (child.isMesh) {
        child.material = material;
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  randomizeCarAppearance(car) {
    const variantType = this.getRandomVariantType();
    const materials = this.materialsByVariant.get(variantType);
    if (!materials || materials.length === 0) return;

    // If variant type changed, swap the cloned model children
    if (car.userData.variantType !== variantType) {
      const baseModel = this.models.get(variantType);
      if (baseModel) {
        while (car.children.length > 0) {
          car.remove(car.children[0]);
        }
        const newClone = baseModel.clone(true);
        while (newClone.children.length > 0) {
          car.add(newClone.children[0]);
        }
        car.userData.variantType = variantType;
      }
    }

    car.rotation.y = this.carRotationY;
    car.scale.setScalar(this.carScale);

    const material = materials[Math.floor(Math.random() * materials.length)];
    car.userData.material = material;
    this.applyMaterialToCar(car, material);
  }

  getCarFromPool() {
    for (const car of this.carPool) {
      if (!car.userData.active) {
        return car;
      }
    }
    return null;
  }

  setupCarState(car, laneIndex, z, speed = null) {
    const lane = this.lanePositions[laneIndex];
    car.position.set(lane, 0, z);
    car.rotation.y = this.carRotationY;

    if (speed === null) {
      // Natural Autobahn speed distribution per lane
      if (laneIndex === 0) {
        speed = 22 + Math.random() * 6; // Fast/passing lane (left)
      } else if (laneIndex === 1) {
        speed = 18 + Math.random() * 5; // Middle cruising lane
      } else {
        speed = 14 + Math.random() * 5; // Slower lane (right)
      }
    }

    car.userData.lane = laneIndex;
    car.userData.targetLane = laneIndex;
    car.userData.fromX = lane;
    car.userData.toX = lane;
    car.userData.isChangingLane = false;
    car.userData.laneProgress = 0;
    car.userData.laneCooldown = 1.0 + Math.random() * 2.0;
    car.userData.baseSpeed = speed;
    car.userData.speed = speed;
    car.userData.active = true;
    car.visible = true;
  }

  spawnCar(gameTime) {
    if (!this.assetsReady) {
      return;
    }

    const car = this.getCarFromPool();
    if (!car) {
      return;
    }

    const availableLanes = this.getAvailableLanes();
    if (availableLanes.length === 0) {
      return;
    }

    // Randomize appearance (model + texture variation)
    this.randomizeCarAppearance(car);

    const laneIndex = availableLanes[Math.floor(Math.random() * availableLanes.length)];
    this.setupCarState(car, laneIndex, this.spawnDistance);

    this.cars.push(car);
  }

  getAvailableLanes() {
    // Find cars near the spawn area
    const recentCars = this.cars.filter(
      car =>
        car.userData.active &&
        car.position.z < this.spawnDistance + 30 &&
        car.position.z > this.spawnDistance - 20
    );

    const occupiedLanes = new Set(recentCars.map(car => car.userData.lane));
    const available = [];

    for (let i = 0; i < 3; i++) {
      if (!occupiedLanes.has(i)) {
        available.push(i);
      }
    }

    // Anti-Blockade Spawn Gatekeeper:
    // If all 3 lanes have cars in the spawn region, or if spawning in an available lane
    // would align 3 cars within a tight longitudinal gap (< 16m), delay spawn.
    if (available.length === 0) {
      return []; // Wait for traffic ahead to clear
    }

    // If 2 lanes are occupied, check if the occupied cars are already clustered side-by-side
    if (available.length === 1 && recentCars.length >= 2) {
      const zPositions = recentCars.map(c => c.position.z);
      const minZ = Math.min(...zPositions);
      const maxZ = Math.max(...zPositions);
      // If the existing cars are closely aligned in Z, avoid dropping the 3rd car right next to them
      if (maxZ - minZ < 16.0) {
        return []; // Hold spawn until gap widens
      }
    }

    return available;
  }

  spawnInitialCars() {
    if (!this.assetsReady) return;

    const initialPositions = [
      { laneIndex: 0, z: -50, speed: 24 },
      { laneIndex: 2, z: -80, speed: 17 },
      { laneIndex: 1, z: -115, speed: 20 },
      { laneIndex: 0, z: -150, speed: 26 }
    ];

    for (const pos of initialPositions) {
      const car = this.getCarFromPool();
      if (!car) continue;

      this.randomizeCarAppearance(car);
      this.setupCarState(car, pos.laneIndex, pos.z, pos.speed);
      this.cars.push(car);
    }
  }

  startLaneChange(car, targetLane) {
    if (car.userData.isChangingLane || targetLane === car.userData.lane) return;

    car.userData.isChangingLane = true;
    car.userData.fromX = car.position.x;
    car.userData.toX = this.lanePositions[targetLane];
    car.userData.targetLane = targetLane;
    car.userData.laneProgress = 0;
  }

  isLaneClear(targetLane, car) {
    for (const other of this.cars) {
      if (other === car || !other.userData.active) continue;

      // Check if other car is in target lane or transitioning across it
      const inTargetLane =
        other.userData.lane === targetLane ||
        other.userData.targetLane === targetLane ||
        Math.abs(other.position.x - this.lanePositions[targetLane]) < 2.0;

      if (!inTargetLane) continue;

      // deltaZ > 0: other car is ahead; deltaZ <= 0: other car is behind
      const deltaZ = car.position.z - other.position.z;

      if (deltaZ > 0) {
        // Other car is ahead in target lane
        if (deltaZ < this.adjacentSafetyGapAhead) {
          return false;
        }
      } else {
        // Other car is behind in target lane
        const behindDistance = -deltaZ;
        let requiredGap = this.adjacentSafetyGapBehind;
        if (other.userData.speed > car.userData.speed) {
          requiredGap += (other.userData.speed - car.userData.speed) * 0.5;
        }
        if (behindDistance < requiredGap) {
          return false;
        }
      }
    }
    return true;
  }

  findLeadCar(car) {
    let nearestLead = null;
    let minDistance = Infinity;

    for (const other of this.cars) {
      if (other === car || !other.userData.active) continue;

      // Check if other car shares path or overlaps horizontally
      const samePath =
        other.userData.lane === car.userData.lane ||
        other.userData.targetLane === car.userData.targetLane ||
        Math.abs(other.position.x - car.position.x) < 2.2;

      if (!samePath) continue;

      // In this coordinate system, vehicles ahead have more negative Z
      const distanceAhead = car.position.z - other.position.z;

      if (distanceAhead > 0 && distanceAhead < minDistance) {
        minDistance = distanceAhead;
        nearestLead = other;
      }
    }

    return { leadCar: nearestLead, distance: minDistance };
  }

  resolveBlockades(deltaTime) {
    // Detect if cars across lanes 0, 1, and 2 form an impassable side-by-side wall
    // within the visible / approaching horizon (Z between -110m and -10m)
    const activeRoadCars = this.cars.filter(
      c => c.userData.active && c.position.z < -10 && c.position.z > -110
    );

    const lane0Cars = activeRoadCars.filter(c => (c.userData.lane === 0 || c.userData.targetLane === 0));
    const lane1Cars = activeRoadCars.filter(c => (c.userData.lane === 1 || c.userData.targetLane === 1));
    const lane2Cars = activeRoadCars.filter(c => (c.userData.lane === 2 || c.userData.targetLane === 2));

    for (const c0 of lane0Cars) {
      for (const c1 of lane1Cars) {
        if (Math.abs(c0.position.z - c1.position.z) > 10.0) continue;

        for (const c2 of lane2Cars) {
          const gap02 = Math.abs(c0.position.z - c2.position.z);
          const gap12 = Math.abs(c1.position.z - c2.position.z);

          // All 3 cars are within a tight longitudinal cluster (< 11m), completely blocking all lanes
          if (gap02 < 11.0 && gap12 < 10.0) {
            // Dissolve the wall proactively:
            // 1. Left lane car accelerates to surge ahead and clear the passing lane
            c0.userData.speed = Math.min(c0.userData.speed + 7.0 * deltaTime, 36.0);
            c0.userData.baseSpeed = Math.max(c0.userData.baseSpeed, 28.0);

            // 2. Right lane car eases off speed to let the pack stretch out
            c2.userData.speed = Math.max(c2.userData.speed - 5.0 * deltaTime, 12.0);
          }
        }
      }
    }
  }

  reset() {
    for (const car of this.cars) {
      car.userData.active = false;
      car.userData.isChangingLane = false;
      car.visible = false;
    }

    this.cars = [];
    this.spawnTimer = 0;
    this.nextSpawnTime = 1;

    this.spawnInitialCars();
  }

  update(deltaTime, playerSpeed, gameTime) {
    const difficultyFactor = Math.min(gameTime / 120, 1);
    const spawnInterval =
      this.maxSpawnInterval -
      (this.maxSpawnInterval - this.minSpawnInterval) * difficultyFactor;

    this.spawnTimer += deltaTime;

    if (this.spawnTimer >= this.nextSpawnTime) {
      this.spawnCar(gameTime);
      this.spawnTimer = 0;
      this.nextSpawnTime = spawnInterval * (0.5 + Math.random());
    }

    // 1. Update lane change steering animations and cooldowns
    for (let i = 0; i < this.cars.length; i++) {
      const car = this.cars[i];
      if (car.userData.laneCooldown > 0) {
        car.userData.laneCooldown -= deltaTime;
      }

      if (car.userData.isChangingLane) {
        car.userData.laneProgress += deltaTime / this.laneChangeDuration;
        const t = Math.min(car.userData.laneProgress, 1.0);
        // Smooth cubic ease-in-out curve
        const ease = t * t * (3 - 2 * t);
        car.position.x = THREE.MathUtils.lerp(car.userData.fromX, car.userData.toX, ease);

        // Natural slight yaw turn during lane change
        const deltaX = car.userData.toX - car.userData.fromX;
        const steeringYaw = Math.sin(t * Math.PI) * (deltaX > 0 ? -0.07 : 0.07);
        car.rotation.y = this.carRotationY + steeringYaw;

        if (t >= 1.0) {
          car.userData.isChangingLane = false;
          car.userData.lane = car.userData.targetLane;
          car.position.x = this.lanePositions[car.userData.lane];
          car.rotation.y = this.carRotationY;
          car.userData.laneCooldown = 1.5 + Math.random() * 2.0;
        }
      }
    }

    // 2. Traffic AI: Lead car following, overtaking decisions, and braking
    for (let i = 0; i < this.cars.length; i++) {
      const car = this.cars[i];
      const { leadCar, distance } = this.findLeadCar(car);

      if (leadCar && distance < this.overtakeTriggerDistance) {
        // Vehicle ahead is in range: try overtaking if ready
        if (!car.userData.isChangingLane && car.userData.laneCooldown <= 0) {
          const currentLane = car.userData.lane;

          if (currentLane === 1) {
            // Middle lane: try left pass first (Autobahn rules), then right
            if (this.isLaneClear(0, car)) {
              this.startLaneChange(car, 0);
            } else if (this.isLaneClear(2, car)) {
              this.startLaneChange(car, 2);
            }
          } else if (currentLane === 2) {
            // Right lane: pass on middle lane
            if (this.isLaneClear(1, car)) {
              this.startLaneChange(car, 1);
            }
          } else if (currentLane === 0) {
            // Left lane: pass on middle lane
            if (this.isLaneClear(1, car)) {
              this.startLaneChange(car, 1);
            }
          }
        }

        // If not overtaking or waiting for opening, match speed / brake safely
        if (distance <= this.safeFollowingDistance) {
          const targetSpeed = Math.max(8, leadCar.userData.speed - (this.safeFollowingDistance - distance));
          car.userData.speed = THREE.MathUtils.lerp(
            car.userData.speed,
            targetSpeed,
            deltaTime * this.brakeRate * 2.5
          );
        } else {
          car.userData.speed = THREE.MathUtils.lerp(
            car.userData.speed,
            leadCar.userData.speed,
            deltaTime * this.brakeRate
          );
        }
      } else {
        // Clear road ahead: smoothly accelerate back to desired cruise speed
        car.userData.speed = THREE.MathUtils.lerp(
          car.userData.speed,
          car.userData.baseSpeed,
          deltaTime * this.accelRate
        );

        // Highway lane discipline: if cruising in the left lane with open road, return to middle
        if (
          !car.userData.isChangingLane &&
          car.userData.laneCooldown <= 0 &&
          car.userData.lane === 0 &&
          this.isLaneClear(1, car)
        ) {
          this.startLaneChange(car, 1);
        }
      }
    }

    // 3. Active Anti-Blockade Flow: Dissolve side-by-side 3-lane walls dynamically
    this.resolveBlockades(deltaTime);

    // 4. Move cars along Z and despawn cars that pass behind the camera
    for (let i = this.cars.length - 1; i >= 0; i--) {
      const car = this.cars[i];
      const relativeSpeed = playerSpeed - car.userData.speed;
      car.position.z += relativeSpeed * deltaTime;

      // Hard anti-clipping safeguard
      const { leadCar, distance } = this.findLeadCar(car);
      if (leadCar && distance < 4.2) {
        car.position.z = leadCar.position.z + 4.2;
        car.userData.speed = Math.min(car.userData.speed, leadCar.userData.speed);
      }

      if (car.position.z > this.despawnDistance) {
        car.userData.active = false;
        car.userData.isChangingLane = false;
        car.visible = false;
        this.cars.splice(i, 1);
      }
    }
  }

  getCars() {
    return this.cars;
  }
}
