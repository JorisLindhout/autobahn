import * as THREE from 'three';

const DRY = {
  fogColor: 0x9faab4,
  fogNear: 120,
  fogFar: 650,
  hemiIntensity: 1.25,
  sunIntensity: 1.1,
  exposure: 1.05,
  hemiSky: 0xe8edf2,
  hemiGround: 0x555852,
  skyTint: 0xffffff
};

const WET = {
  fogColor: 0x5c6773,
  fogNear: 50,
  fogFar: 240,
  hemiIntensity: 0.7,
  sunIntensity: 0.36,
  exposure: 0.86,
  hemiSky: 0x8e9aa6,
  hemiGround: 0x3a3e3c,
  skyTint: 0x8a929c
};

const DROP_COUNT = 1100;
const DROP_WIDTH = 0.04;
const DROP_HEIGHT = 1.35;
const VOLUME_HALF_X = 12;
const VOLUME_Y_TOP = 16;
const VOLUME_Y_BOTTOM = -0.2;
const VOLUME_Z_NEAR = -0.9;
const VOLUME_Z_FAR = -14;

function createStreakTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 8;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(4, 0, 4, 32);
  gradient.addColorStop(0, 'rgba(200, 214, 226, 0)');
  gradient.addColorStop(0.18, 'rgba(200, 214, 226, 0.85)');
  gradient.addColorStop(0.82, 'rgba(200, 214, 226, 0.85)');
  gradient.addColorStop(1, 'rgba(200, 214, 226, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(3, 0, 2, 32);

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

export class Weather {
  constructor({ scene, camera, renderer, hemiLight, sunLight, sky }) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.hemiLight = hemiLight;
    this.sunLight = sunLight;
    this.sky = sky;

    this.intensity = 0;
    this.activeCount = 0;
    this.dummy = new THREE.Object3D();

    this.ox = new Float32Array(DROP_COUNT);
    this.oy = new Float32Array(DROP_COUNT);
    this.oz = new Float32Array(DROP_COUNT);
    this.fall = new Float32Array(DROP_COUNT);
    for (let i = 0; i < DROP_COUNT; i++) {
      this.seedDrop(i, true);
    }

    this.dryFogColor = new THREE.Color(DRY.fogColor);
    this.wetFogColor = new THREE.Color(WET.fogColor);
    this.fogColor = new THREE.Color();
    this.dryHemiSky = new THREE.Color(DRY.hemiSky);
    this.wetHemiSky = new THREE.Color(WET.hemiSky);
    this.dryHemiGround = new THREE.Color(DRY.hemiGround);
    this.wetHemiGround = new THREE.Color(WET.hemiGround);
    this.drySkyTint = new THREE.Color(DRY.skyTint);
    this.wetSkyTint = new THREE.Color(WET.skyTint);
    this.hemiSky = new THREE.Color();
    this.hemiGround = new THREE.Color();
    this.skyTint = new THREE.Color();

    const geometry = new THREE.PlaneGeometry(DROP_WIDTH, DROP_HEIGHT);
    this.material = new THREE.MeshBasicMaterial({
      map: createStreakTexture(),
      color: 0xc2ced8,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: true,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
      blending: THREE.NormalBlending,
      fog: true
    });

    this.mesh = new THREE.InstancedMesh(geometry, this.material, DROP_COUNT);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 2;
    this.mesh.visible = false;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.scene.add(this.mesh);

    this.hideDrops();
  }

  seedDrop(index, scatterY) {
    this.ox[index] = (Math.random() - 0.5) * VOLUME_HALF_X * 2;
    this.oy[index] = scatterY
      ? VOLUME_Y_BOTTOM + Math.random() * (VOLUME_Y_TOP - VOLUME_Y_BOTTOM)
      : VOLUME_Y_TOP - Math.random() * 3;
    // Near-field bias: most streaks sit around the car, not on the horizon.
    this.oz[index] = VOLUME_Z_NEAR + Math.pow(Math.random(), 1.7) * (VOLUME_Z_FAR - VOLUME_Z_NEAR);
    this.fall[index] = 11 + Math.random() * 9;
  }

  hideDrops() {
    this.dummy.scale.set(0, 0, 0);
    this.dummy.updateMatrix();
    for (let i = 0; i < DROP_COUNT; i++) {
      this.mesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    this.activeCount = 0;
  }

  applyAtmosphere(intensity) {
    const t = intensity;

    this.fogColor.lerpColors(this.dryFogColor, this.wetFogColor, t);
    if (this.scene.fog) {
      this.scene.fog.color.copy(this.fogColor);
      this.scene.fog.near = THREE.MathUtils.lerp(DRY.fogNear, WET.fogNear, t);
      this.scene.fog.far = THREE.MathUtils.lerp(DRY.fogFar, WET.fogFar, t);
    }
    this.renderer.setClearColor(this.fogColor);

    this.hemiLight.intensity = THREE.MathUtils.lerp(DRY.hemiIntensity, WET.hemiIntensity, t);
    this.sunLight.intensity = THREE.MathUtils.lerp(DRY.sunIntensity, WET.sunIntensity, t);
    this.renderer.toneMappingExposure = THREE.MathUtils.lerp(DRY.exposure, WET.exposure, t);

    this.hemiSky.lerpColors(this.dryHemiSky, this.wetHemiSky, t);
    this.hemiGround.lerpColors(this.dryHemiGround, this.wetHemiGround, t);
    this.hemiLight.color.copy(this.hemiSky);
    this.hemiLight.groundColor.copy(this.hemiGround);

    if (this.sky && this.sky.material) {
      this.skyTint.lerpColors(this.drySkyTint, this.wetSkyTint, t);
      this.sky.material.color.copy(this.skyTint);
    }
  }

  updateDrops(deltaTime, speed, intensity) {
    if (intensity <= 0.001) {
      if (this.mesh.visible) {
        this.mesh.visible = false;
        this.material.opacity = 0;
        this.hideDrops();
      }
      return;
    }

    const count = Math.floor(420 + intensity * (DROP_COUNT - 420));
    if (count > this.activeCount) {
      for (let i = this.activeCount; i < count; i++) {
        this.seedDrop(i, true);
      }
    }
    this.activeCount = count;

    this.mesh.visible = true;
    this.material.opacity = 0.4 + intensity * 0.35;

    const cam = this.camera.position;
    const fallMul = 1 + intensity * 0.35 + Math.min(speed / 80, 1) * 0.15;

    for (let i = 0; i < DROP_COUNT; i++) {
      if (i >= count) {
        this.dummy.scale.set(0, 0, 0);
        this.dummy.updateMatrix();
        this.mesh.setMatrixAt(i, this.dummy.matrix);
        continue;
      }

      this.oy[i] -= this.fall[i] * fallMul * deltaTime;
      if (this.oy[i] < VOLUME_Y_BOTTOM) {
        this.seedDrop(i, false);
      }

      this.dummy.position.set(cam.x + this.ox[i], this.oy[i], cam.z + this.oz[i]);
      this.dummy.lookAt(cam.x, this.oy[i], cam.z);
      this.dummy.scale.set(1, 1, 1);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
    }

    this.mesh.instanceMatrix.needsUpdate = true;
  }

  update(deltaTime, intensity, speed) {
    this.intensity = intensity;
    this.applyAtmosphere(intensity);
    this.updateDrops(deltaTime, speed, intensity);
  }

  reset() {
    this.intensity = 0;
    this.mesh.visible = false;
    this.material.opacity = 0;
    this.hideDrops();
    this.applyAtmosphere(0);
  }
}
