import * as THREE from 'three';
import { Controls } from './controls.js';
import { Road } from './road.js';
import { Traffic } from './traffic.js';
import { Cockpit } from './cockpit.js';
import { Collision } from './collision.js';
import { createSky, createSun, createScenery, updateScenery, resetScenery, getSceneryPromise } from './visuals.js';

export class Game {
  constructor(renderer) {
    this.renderer = renderer;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      58,
      window.innerWidth / window.innerHeight,
      0.02,
      1000
    );
    
    this.controls = new Controls();
    this.road = new Road(this.scene, this.renderer);
    this.traffic = new Traffic(this.scene);
    this.cockpit = new Cockpit(this.camera);
    this.collision = new Collision();
    
    this.gameState = 'title';
    this.speed = 0;
    this.baseSpeed = 25;
    this.maxSpeed = 80;
    this.speedIncreaseRate = 0.15;
    this.playerX = 0;
    this.playerLane = 1;
    this.laneWidth = 4;
    this.roadWidth = 12;
    this.gameTime = 0;

    // Shoulder driving mechanics
    this.shoulderTimer = 0;
    this.maxShoulderTime = 2.5; // Seconds allowed on shoulder before spinning out / crashing
    this.isOnShoulder = false;
    this.shoulderHazardEl = document.getElementById('shoulder-hazard');
    
    this.crashTimer = 0;
    this.crashDuration = 1.0; // Short pause on crash before showing game over screen

    this.onGameOver = null;
    
    this.setupScene();

    this.isReady = false;
    this.readyPromise = this.initResources();

    this.animate = this.animate.bind(this);
    this.lastTime = 0;
    
    requestAnimationFrame(this.animate);
  }

  async initResources() {
    try {
      const promises = [
        this.cockpit.loadPromise,
        this.traffic.loadPromise,
        getSceneryPromise()
      ].filter(Boolean);

      await Promise.all(promises);

      // Pre-compile scene & shaders on GPU to prevent frame drops on game start
      if (this.renderer && typeof this.renderer.compileAsync === 'function') {
        try {
          await this.renderer.compileAsync(this.scene, this.camera);
        } catch (e) {
          // Fallback / ignore compile errors
        }
      } else if (this.renderer && typeof this.renderer.compile === 'function') {
        try {
          this.renderer.compile(this.scene, this.camera);
        } catch (e) {
          // Fallback / ignore compile errors
        }
      }
    } catch (err) {
      console.error('Resource initialization error:', err);
    } finally {
      this.isReady = true;
    }
    return true;
  }

  async whenReady() {
    if (this.isReady) return true;
    return this.readyPromise;
  }
  
  setupScene() {
    this.camera.position.set(0, 1.5, 0);
    this.camera.rotation.set(0, 0, 0);
    
    // Realistic 80s overcast Autobahn atmosphere with distant horizon haze
    this.scene.fog = new THREE.Fog(0x9faab4, 120, 650);
    
    const sky = createSky();
    this.scene.add(sky);
    
    const sun = createSun();
    this.scene.add(sun);
    
    const scenery = createScenery();
    this.scene.add(scenery);
    
    // Natural overcast daylight: bright diffuse sky downlight + crisp directional sunlight
    const hemiLight = new THREE.HemisphereLight(0xe8edf2, 0x555852, 1.25);
    this.scene.add(hemiLight);
    
    const sunLight = new THREE.DirectionalLight(0xf2f6fa, 1.1);
    sunLight.position.set(45, 100, -50);
    this.scene.add(sunLight);
    
    // Camera needs to be in the scene so child objects (cockpit) render
    this.scene.add(this.camera);

    this.road.create();
  }
  
  start() {
    this.gameState = 'playing';
    this.speed = this.baseSpeed;
    this.playerX = 0;
    this.playerLane = 1;
    this.gameTime = 0;
    this.shoulderTimer = 0;
    this.isOnShoulder = false;
    this.crashTimer = 0;

    if (this.shoulderHazardEl) {
      this.shoulderHazardEl.classList.remove('active');
      this.shoulderHazardEl.style.opacity = '0';
    }
    
    this.road.reset();
    this.traffic.reset();
    this.controls.enable();
    this.cockpit.show();
    this.cockpit.repairWindshield();
    resetScenery();
  }

  crash() {
    if (this.gameState !== 'playing') return;

    this.gameState = 'crashing';
    this.crashTimer = 0;
    this.controls.disable();

    if (this.shoulderHazardEl) {
      this.shoulderHazardEl.classList.remove('active');
      this.shoulderHazardEl.style.opacity = '0';
    }

    this.cockpit.crackWindshield();
  }
  
  stop() {
    this.gameState = 'gameover';
    this.controls.disable();

    if (this.shoulderHazardEl) {
      this.shoulderHazardEl.classList.remove('active');
      this.shoulderHazardEl.style.opacity = '0';
    }
    
    if (this.onGameOver) {
      this.onGameOver();
    }
  }
  
  handleResize(width, height) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
  
  update(deltaTime) {
    if (this.gameState === 'crashing') {
      this.crashTimer += deltaTime;

      // Crash impact: rapid deceleration and chassis shockwave
      this.speed = Math.max(0, this.speed - this.speed * 4.5 * deltaTime);

      const crashRatio = Math.min(this.crashTimer / this.crashDuration, 1.0);
      const impactDecay = Math.max(0, 1.0 - crashRatio);

      const joltY = Math.sin(this.crashTimer * 42) * 0.022 * impactDecay;
      const joltX = Math.cos(this.crashTimer * 32) * 0.018 * impactDecay;
      this.cockpit.cockpitGroup.position.y = joltY;
      this.cockpit.cockpitGroup.position.x = joltX;

      this.road.update(deltaTime, this.speed);
      this.traffic.update(deltaTime, this.speed, this.gameTime);
      updateScenery(deltaTime, this.speed);

      if (this.crashTimer >= this.crashDuration) {
        this.stop();
      }
      return;
    }

    if (this.gameState !== 'playing') return;
    
    this.gameTime += deltaTime;
    
    this.speed = Math.min(
      this.baseSpeed + this.gameTime * this.speedIncreaseRate,
      this.maxSpeed
    );
    
    const steerInput = this.controls.getSteerInput();
    const steerSpeed = 12;
    const maxX = (this.roadWidth / 2) + 1.5;
    
    this.playerX += steerInput * steerSpeed * deltaTime;
    this.playerX = Math.max(-maxX, Math.min(maxX, this.playerX));
    
    this.camera.position.x = this.playerX;

    // Shoulder driving state and friction
    this.isOnShoulder = Math.abs(this.playerX) > 5.1;

    if (this.isOnShoulder) {
      this.shoulderTimer += deltaTime;
      // Shoulder friction drag
      this.speed = Math.max(this.baseSpeed * 0.8, this.speed - 6.0 * deltaTime);

      if (this.shoulderHazardEl) {
        const ratio = Math.min(this.shoulderTimer / this.maxShoulderTime, 1.0);
        this.shoulderHazardEl.classList.add('active');
        this.shoulderHazardEl.style.setProperty('--shoulder-opacity', (0.25 + ratio * 0.65).toFixed(2));
      }

      if (this.shoulderTimer >= this.maxShoulderTime) {
        this.crash();
        return;
      }
    } else {
      if (this.shoulderTimer > 0) {
        this.shoulderTimer = Math.max(0, this.shoulderTimer - deltaTime * 2.0);
        if (this.shoulderHazardEl) {
          const ratio = this.shoulderTimer / this.maxShoulderTime;
          if (ratio <= 0.05) {
            this.shoulderHazardEl.classList.remove('active');
            this.shoulderHazardEl.style.opacity = '0';
          } else {
            this.shoulderHazardEl.style.setProperty('--shoulder-opacity', (ratio * 0.4).toFixed(2));
          }
        }
      }
    }
    
    const shoulderRatio = this.shoulderTimer / this.maxShoulderTime;
    this.cockpit.update(steerInput, this.speed, this.isOnShoulder, shoulderRatio);
    
    this.road.update(deltaTime, this.speed);
    
    this.traffic.update(deltaTime, this.speed, this.gameTime);
    
    updateScenery(deltaTime, this.speed);
    
    const collision = this.collision.check(
      this.playerX,
      this.traffic.getCars(),
      this.roadWidth
    );
    
    if (collision) {
      this.crash();
    }
  }
  
  animate(currentTime) {
    requestAnimationFrame(this.animate);
    
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;
    
    this.update(deltaTime);
    this.renderer.render(this.scene, this.camera);
  }
  
  renderTitle() {
    this.renderer.render(this.scene, this.camera);
  }
}
