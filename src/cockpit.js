import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class Cockpit {
  constructor(camera) {
    this.camera = camera;
    this.cockpitGroup = new THREE.Group();
    this.steeringWheel = null;
    this.steeringWheelBaseQuaternion = null;
    this.isReady = false;
    this.windowMaterials = [];

    // Driver seat perspective:
    // With x = 0.525, the steering wheel and instrument cluster are centered in the driver's view
    this.driverOffset = new THREE.Vector3(0.525, -0.42, -0.28);

    this.setupCrackOverlay();
    this.loadModel();
  }

  setupCrackOverlay() {
    this.crackCanvas = document.createElement('canvas');
    this.crackCanvas.width = 1024;
    this.crackCanvas.height = 1024;
    this.crackCtx = this.crackCanvas.getContext('2d');

    this.crackTexture = new THREE.CanvasTexture(this.crackCanvas);
    this.crackTexture.generateMipmaps = true;
    this.crackTexture.minFilter = THREE.LinearMipmapLinearFilter;
    this.crackTexture.magFilter = THREE.LinearFilter;

    // Plane precisely sized and aligned to the windshield glass aperture
    const crackGeo = new THREE.PlaneGeometry(1.50, 0.72);
    const crackMat = new THREE.MeshBasicMaterial({
      map: this.crackTexture,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: true, // Enable depth testing so interior A-pillars & dash occlude the glass
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1
    });

    this.crackMesh = new THREE.Mesh(crackGeo, crackMat);
    this.crackMesh.visible = false;
    this.crackMesh.renderOrder = 5;

    // Pre-generate and upload texture to GPU during startup so the first crash is 100% instantaneous
    this.drawCracks();
  }

  drawCracks() {
    const ctx = this.crackCtx;
    const w = this.crackCanvas.width;
    const h = this.crackCanvas.height;

    ctx.clearRect(0, 0, w, h);

    // Primary impact point directly in driver's forward perspective
    const impacts = [
      {
        cx: w * 0.52 + (Math.random() - 0.5) * 80,
        cy: h * 0.48 + (Math.random() - 0.5) * 60,
        radius: 360,
        rays: 18
      },
      // Secondary secondary spidering stone fracture
      {
        cx: w * 0.72 + (Math.random() - 0.5) * 60,
        cy: h * 0.38 + (Math.random() - 0.5) * 50,
        radius: 210,
        rays: 12
      }
    ];

    impacts.forEach(({ cx, cy, radius, rays }) => {
      // 1. Frosted white impact epicenter
      const coreGlow = ctx.createRadialGradient(cx, cy, 2, cx, cy, 45);
      coreGlow.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      coreGlow.addColorStop(0.25, 'rgba(235, 245, 255, 0.7)');
      coreGlow.addColorStop(0.65, 'rgba(215, 230, 250, 0.25)');
      coreGlow.addColorStop(1, 'rgba(200, 220, 245, 0)');
      ctx.fillStyle = coreGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, 45, 0, Math.PI * 2);
      ctx.fill();

      // High-density crushed core fracture bursts
      for (let i = 0; i < 32; i++) {
        const ang = (i / 32) * Math.PI * 2 + (Math.random() - 0.5) * 0.15;
        const len = 6 + Math.random() * 32;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(ang) * len, cy + Math.sin(ang) * len);
        ctx.stroke();
      }

      // 2. Radial spiderweb fracture branches
      const rayPoints = []; // Array of arrays of path vertices for connecting stress arcs

      for (let i = 0; i < rays; i++) {
        const baseAngle = (i / rays) * Math.PI * 2 + (Math.random() - 0.5) * (Math.PI / rays * 0.7);
        let curX = cx;
        let curY = cy;
        let curAngle = baseAngle;
        const maxDist = radius * (0.6 + Math.random() * 0.45);
        let dist = 0;

        const pathVertices = [{ x: curX, y: curY, dist: 0 }];

        // Draw soft fracture halo first
        ctx.beginPath();
        ctx.moveTo(curX, curY);

        while (dist < maxDist) {
          const segLen = 10 + Math.random() * 14;
          curAngle += (Math.random() - 0.5) * 0.26;
          curX += Math.cos(curAngle) * segLen;
          curY += Math.sin(curAngle) * segLen;
          dist += segLen;
          pathVertices.push({ x: curX, y: curY, dist });
          ctx.lineTo(curX, curY);

          // Fine secondary branch
          if (Math.random() < 0.28 && dist > 35 && dist < maxDist * 0.8) {
            const bSide = Math.random() > 0.5 ? 1 : -1;
            let bAngle = curAngle + bSide * (0.4 + Math.random() * 0.4);
            let bX = curX;
            let bY = curY;
            const bLen = 3 + Math.floor(Math.random() * 4);

            ctx.save();
            ctx.strokeStyle = 'rgba(240, 245, 255, 0.65)';
            ctx.lineWidth = 0.9;
            ctx.beginPath();
            ctx.moveTo(bX, bY);
            for (let b = 0; b < bLen; b++) {
              const bStep = 8 + Math.random() * 10;
              bAngle += (Math.random() - 0.5) * 0.25;
              bX += Math.cos(bAngle) * bStep;
              bY += Math.sin(bAngle) * bStep;
              ctx.lineTo(bX, bY);
            }
            ctx.stroke();
            ctx.restore();
          }
        }

        // Crisp white primary fracture line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.88)';
        ctx.lineWidth = 1.6;
        ctx.stroke();

        rayPoints.push(pathVertices);
      }

      // 3. Concentric stress fracture arcs (spiderweb cross-links)
      const ringIntervals = [35, 65, 105, 155, 215, 285];

      ringIntervals.forEach((ringR) => {
        if (ringR > radius) return;

        for (let r = 0; r < rays; r++) {
          if (Math.random() < 0.22) continue; // Natural gaps

          const nextR = (r + 1) % rays;
          const rayA = rayPoints[r];
          const rayB = rayPoints[nextR];

          // Find closest vertex on ray A and ray B to ringR
          const pA = rayA.reduce((prev, curr) => 
            Math.abs(curr.dist - ringR) < Math.abs(prev.dist - ringR) ? curr : prev, rayA[0]
          );
          const pB = rayB.reduce((prev, curr) => 
            Math.abs(curr.dist - ringR) < Math.abs(prev.dist - ringR) ? curr : prev, rayB[0]
          );

          if (!pA || !pB) continue;

          // Jittered midpoint for organic curved spiderweb look
          const midX = (pA.x + pB.x) * 0.5 + (Math.random() - 0.5) * 8;
          const midY = (pA.y + pB.y) * 0.5 + (Math.random() - 0.5) * 8;

          ctx.strokeStyle = 'rgba(235, 245, 255, 0.72)';
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.moveTo(pA.x, pA.y);
          ctx.quadraticCurveTo(midX, midY, pB.x, pB.y);
          ctx.stroke();
        }
      });
    });

    // 4. Soft perimeter vignette so cracks fade smoothly before plane boundaries
    const vignette = ctx.createRadialGradient(w * 0.5, h * 0.5, w * 0.35, w * 0.5, h * 0.5, w * 0.52);
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 1)');
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';

    this.crackTexture.needsUpdate = true;
  }

  crackWindshield() {
    if (this.crackMesh) {
      this.crackMesh.material.opacity = 1.0;
      this.crackMesh.visible = true;
    }
  }

  repairWindshield() {
    if (this.crackMesh) {
      this.crackMesh.material.opacity = 0;
      this.crackMesh.visible = false;
    }
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
                this.windowMaterials.push(mat);
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

      // Attach crack overlay directly onto the windshield aperture inside the car body
      // This ensures depth testing naturally masks the cracks behind the A-pillars & dashboard
      const carBase = root.getObjectByName('Car_Base');
      if (carBase) {
        this.crackMesh.position.set(0, 0.517, 0.717);
        this.crackMesh.rotation.set(-0.783, 0, 0);
        carBase.add(this.crackMesh);
      } else {
        this.crackMesh.position.set(0.08, 0.47, 0.346);
        this.crackMesh.rotation.set(-0.783, 0, 0);
        root.add(this.crackMesh);
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
