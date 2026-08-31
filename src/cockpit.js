import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class Cockpit {
  constructor(camera) {
    this.camera = camera;
    this.cockpitGroup = new THREE.Group();
    this.steeringWheel = null;
    this.steeringWheelBaseQuaternion = null;
    this.isReady = false;

    // Driver seat perspective:
    // With x = 0.525, the steering wheel and instrument cluster are centered in the driver's view
    this.driverOffset = new THREE.Vector3(0.525, -0.44, -0.32);

    this.loadModel();
  }

  async loadModel() {
    const loader = new GLTFLoader();

    try {
      const gltf = await loader.loadAsync('/models/cockpit.glb');
      const root = gltf.scene;

      // Enhance materials, enable smooth texture filtering and anisotropic filtering
      root.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = false;
          child.receiveShadow = true;

          if (child.material) {
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach((mat) => {
              // Smooth high-quality texture filtering
              if (mat.map) {
                mat.map.generateMipmaps = true;
                mat.map.minFilter = THREE.LinearMipmapLinearFilter;
                mat.map.magFilter = THREE.LinearFilter;
                mat.map.anisotropy = 16;
                mat.map.needsUpdate = true;
              }

              // Realistic 80s car dashboard finish (matte soft-touch vinyl)
              mat.roughness = 0.55;
              mat.metalness = 0.05;

              // Transparent windshield
              if (mat.name && mat.name.toLowerCase().includes('window')) {
                mat.transparent = true;
                mat.opacity = 0.15;
                mat.roughness = 0.1;
                mat.metalness = 0.1;
              }
            });
          }
        }
      });

      // Find the steering wheel object
      this.steeringWheel = root.getObjectByName('Steering_wheel');
      if (this.steeringWheel) {
        // Cache rest quaternion for proper axis rotation
        this.steeringWheelBaseQuaternion = this.steeringWheel.quaternion.clone();
      }

      root.position.copy(this.driverOffset);
      
      // Face forward down the road
      root.rotation.set(0, Math.PI, 0);

      this.cockpitGroup.add(root);
      this.camera.add(this.cockpitGroup);

      this.isReady = true;
      console.log('3D Cockpit initialized with smooth filtering and centered perspective');
    } catch (error) {
      console.error('Failed to load cockpit model:', error);
    }
  }

  show() {
    this.cockpitGroup.visible = true;
  }

  hide() {
    this.cockpitGroup.visible = false;
  }

  update(steerInput, speed, isOnShoulder = false, shoulderIntensity = 0) {
    if (!this.isReady) return;

    // Rotate the 3D steering wheel along its local steering column axis (local Y axis)
    if (this.steeringWheel && this.steeringWheelBaseQuaternion) {
      const maxSteerAngle = 1.3; // ~75 degrees rotation
      const turnAxis = new THREE.Vector3(0, 1, 0);
      const turnQuat = new THREE.Quaternion().setFromAxisAngle(
        turnAxis,
        -steerInput * maxSteerAngle
      );
      this.steeringWheel.quaternion
        .copy(this.steeringWheelBaseQuaternion)
        .multiply(turnQuat);
    }

    // Subtle cockpit vibration and sway based on speed and steering
    const speedRatio = Math.min(speed / 80, 1);
    let vibration = Math.sin(Date.now() * 0.03) * 0.0025 * speedRatio;
    let sway = -steerInput * 0.015;
    let chassisRoll = steerInput * 0.018;

    // High-frequency gravel & rumble strip vibration when driving on the shoulder
    if (isOnShoulder) {
      const now = Date.now();
      const rumble = (Math.sin(now * 0.09) * 0.5 + Math.cos(now * 0.14) * 0.5) * (0.008 + shoulderIntensity * 0.007);
      const lateralJitter = Math.sin(now * 0.11) * 0.005;
      vibration += rumble;
      sway += lateralJitter;
      chassisRoll += (Math.sin(now * 0.08) * 0.008);
    }

    this.cockpitGroup.position.y = vibration;
    this.cockpitGroup.position.x = sway;
    this.cockpitGroup.rotation.z = chassisRoll; // subtle chassis lean into turns & shoulder shake
  }
}
