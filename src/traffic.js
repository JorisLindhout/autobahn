import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const CAR_VARIANTS = [
  {
    type: 'standard',
    modelUrl: '/models/golf_mk2.glb',
    textures: [
      '/textures/cars/CompactCar_Texture_Black.png',
      '/textures/cars/CompactCar_Texture_Blue.png',
      '/textures/cars/CompactCar_Texture_Brown.png',
      '/textures/cars/CompactCar_Texture_Gray.png',
      '/textures/cars/CompactCar_Texture_Green.png',
      '/textures/cars/CompactCar_Texture_Neon.png',
      '/textures/cars/CompactCar_Texture_Orange.png',
      '/textures/cars/CompactCar_Texture_Pink.png',
      '/textures/cars/CompactCar_Texture_Red.png',
      '/textures/cars/CompactCar_Texture_White.png',
      '/textures/cars/CompactCar_Texture_Yellow.png',
    ],
    weight: 0.70
  },
  {
    type: 'muscle',
    modelUrl: '/models/golf_gti.glb',
    textures: [
      '/textures/cars/CompactCar_Texture_Muscle_Blue.png',
      '/textures/cars/CompactCar_Texture_Muscle_Orange.png',
      '/textures/cars/CompactCar_Texture_Muscle_Red.png',
    ],
    weight: 0.16
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
    this.despawnDistance = 20;

    this.minSpawnInterval = 1.0;
    this.maxSpawnInterval = 3.0;

    this.spawnTimer = 0;
    this.nextSpawnTime = 1;

    // Loaded asset caches
    this.models = new Map();
    this.materialsByVariant = new Map();
    this.assetsReady = false;

    // Car scale and rotation (Math.PI so rear faces player/camera)
    this.carScale = 1.0;
    this.carRotationY = Math.PI;

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
              metalness: 0.1,
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
      speed: 0,
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
    const lane = this.lanePositions[laneIndex];

    car.position.set(lane, 0, this.spawnDistance);

    car.userData.lane = laneIndex;
    car.userData.speed = 15 + Math.random() * 10;
    car.userData.active = true;
    car.visible = true;

    this.cars.push(car);
  }

  getAvailableLanes() {
    const recentCars = this.cars.filter(
      car =>
        car.position.z < this.spawnDistance + 30 &&
        car.position.z > this.spawnDistance - 10
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

  spawnInitialCars() {
    if (!this.assetsReady) return;

    const initialPositions = [
      { laneIndex: 0, z: -25 },
      { laneIndex: 2, z: -45 },
      { laneIndex: 1, z: -70 },
      { laneIndex: 0, z: -95 }
    ];

    for (const pos of initialPositions) {
      const car = this.getCarFromPool();
      if (!car) continue;

      this.randomizeCarAppearance(car);

      const lane = this.lanePositions[pos.laneIndex];
      car.position.set(lane, 0, pos.z);
      car.userData.lane = pos.laneIndex;
      car.userData.speed = 15 + Math.random() * 8;
      car.userData.active = true;
      car.visible = true;

      this.cars.push(car);
    }
  }

  reset() {
    for (const car of this.cars) {
      car.userData.active = false;
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
