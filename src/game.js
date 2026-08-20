import * as THREE from 'three';
import { Controls } from './controls.js';
import { Road } from './road.js';
import { Traffic } from './traffic.js';
import { Dashboard } from './dashboard.js';
import { Collision } from './collision.js';
import { createSky, createSun, createScenery, updateScenery, resetScenery } from './visuals.js';

export class Game {
  constructor(renderer) {
    this.renderer = renderer;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    
    this.controls = new Controls();
    this.road = new Road(this.scene);
    this.traffic = new Traffic(this.scene);
    this.dashboard = new Dashboard(this.scene, this.camera);
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
    
    this.onGameOver = null;
    
    this.setupScene();
    this.animate = this.animate.bind(this);
    this.lastTime = 0;
    
    requestAnimationFrame(this.animate);
  }
  
  setupScene() {
    this.camera.position.set(0, 1.5, 0);
    this.camera.rotation.set(0, 0, 0);
    
    const sky = createSky();
    this.scene.add(sky);
    
    const sun = createSun();
    this.scene.add(sun);
    
    const scenery = createScenery();
    this.scene.add(scenery);
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);
    
    const sunLight = new THREE.DirectionalLight(0xfffde8, 0.6);
    sunLight.position.set(50, 100, -50);
    this.scene.add(sunLight);
    
    this.road.create();
    this.dashboard.create();
  }
  
  start() {
    this.gameState = 'playing';
    this.speed = this.baseSpeed;
    this.playerX = 0;
    this.playerLane = 1;
    this.gameTime = 0;
    
    this.road.reset();
    this.traffic.reset();
    this.controls.enable();
    resetScenery();
  }
  
  stop() {
    this.gameState = 'gameover';
    this.controls.disable();
    
    if (this.onGameOver) {
      this.onGameOver();
    }
  }
  
  handleResize(width, height) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
  
  update(deltaTime) {
    if (this.gameState !== 'playing') return;
    
    this.gameTime += deltaTime;
    
    this.speed = Math.min(
      this.baseSpeed + this.gameTime * this.speedIncreaseRate,
      this.maxSpeed
    );
    
    const steerInput = this.controls.getSteerInput();
    const steerSpeed = 12;
    const maxX = (this.roadWidth / 2) - 1;
    
    this.playerX += steerInput * steerSpeed * deltaTime;
    this.playerX = Math.max(-maxX, Math.min(maxX, this.playerX));
    
    this.camera.position.x = this.playerX;
    
    this.dashboard.update(steerInput, this.speed);
    
    this.road.update(deltaTime, this.speed);
    
    this.traffic.update(deltaTime, this.speed, this.gameTime);
    
    updateScenery(deltaTime, this.speed);
    
    const collision = this.collision.check(
      this.playerX,
      this.traffic.getCars(),
      this.roadWidth
    );
    
    if (collision) {
      this.stop();
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
