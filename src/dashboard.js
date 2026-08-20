import * as THREE from 'three';

export class Dashboard {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.dashboardGroup = null;
    this.steeringWheel = null;
    this.speedNeedle = null;
  }
  
  create() {
    this.dashboardGroup = new THREE.Group();
    
    const dashGeometry = new THREE.BoxGeometry(3, 0.4, 1);
    const dashMaterial = new THREE.MeshBasicMaterial({ color: 0x1a1a2e });
    const dashboard = new THREE.Mesh(dashGeometry, dashMaterial);
    dashboard.position.set(0, -0.5, -1);
    this.dashboardGroup.add(dashboard);
    
    const topDashGeometry = new THREE.BoxGeometry(3, 0.15, 0.6);
    const topDash = new THREE.Mesh(topDashGeometry, dashMaterial);
    topDash.position.set(0, -0.2, -1.15);
    this.dashboardGroup.add(topDash);
    
    this.createSteeringWheel();
    
    this.createSpeedometer();
    
    this.createHood();
    
    this.dashboardGroup.position.copy(this.camera.position);
    this.scene.add(this.dashboardGroup);
  }
  
  createSteeringWheel() {
    this.steeringWheel = new THREE.Group();
    
    const rimRadius = 0.25;
    const tubeRadius = 0.02;
    const rimGeometry = new THREE.TorusGeometry(rimRadius, tubeRadius, 8, 24);
    const rimMaterial = new THREE.MeshBasicMaterial({ color: 0x333344 });
    const rim = new THREE.Mesh(rimGeometry, rimMaterial);
    this.steeringWheel.add(rim);
    
    const hubGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.03, 16);
    const hubMaterial = new THREE.MeshBasicMaterial({ color: 0x222233 });
    const hub = new THREE.Mesh(hubGeometry, hubMaterial);
    hub.rotation.x = Math.PI / 2;
    this.steeringWheel.add(hub);
    
    const spokeGeometry = new THREE.BoxGeometry(0.02, 0.02, rimRadius - 0.06);
    const spokeMaterial = new THREE.MeshBasicMaterial({ color: 0x333344 });
    
    for (let i = 0; i < 3; i++) {
      const spoke = new THREE.Mesh(spokeGeometry, spokeMaterial);
      const angle = (i * Math.PI * 2) / 3 - Math.PI / 2;
      spoke.position.set(
        Math.cos(angle) * (rimRadius / 2),
        Math.sin(angle) * (rimRadius / 2),
        0
      );
      spoke.rotation.z = angle;
      this.steeringWheel.add(spoke);
    }
    
    const glowGeometry = new THREE.TorusGeometry(rimRadius + 0.01, 0.005, 8, 24);
    const glowMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x00ffff,
      transparent: true,
      opacity: 0.3
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    this.steeringWheel.add(glow);
    
    this.steeringWheel.position.set(0, -0.35, -0.7);
    this.steeringWheel.rotation.x = -0.4;
    
    this.dashboardGroup.add(this.steeringWheel);
  }
  
  createSpeedometer() {
    const speedoGroup = new THREE.Group();
    
    const bgGeometry = new THREE.CircleGeometry(0.12, 24);
    const bgMaterial = new THREE.MeshBasicMaterial({ color: 0x111122 });
    const bg = new THREE.Mesh(bgGeometry, bgMaterial);
    speedoGroup.add(bg);
    
    const rimGeometry = new THREE.RingGeometry(0.11, 0.12, 24);
    const rimMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.position.z = 0.001;
    speedoGroup.add(rim);
    
    const needleGeometry = new THREE.BoxGeometry(0.01, 0.08, 0.01);
    const needleMaterial = new THREE.MeshBasicMaterial({ color: 0xff0066 });
    this.speedNeedle = new THREE.Mesh(needleGeometry, needleMaterial);
    this.speedNeedle.position.set(0, 0.03, 0.01);
    this.speedNeedle.geometry.translate(0, 0.04, 0);
    speedoGroup.add(this.speedNeedle);
    
    speedoGroup.position.set(0.5, -0.15, -1.1);
    speedoGroup.rotation.x = -0.3;
    
    this.dashboardGroup.add(speedoGroup);
  }
  
  createHood() {
    const hoodGeometry = new THREE.BoxGeometry(2.2, 0.1, 2);
    const hoodMaterial = new THREE.MeshBasicMaterial({ color: 0x1a1a2e });
    const hood = new THREE.Mesh(hoodGeometry, hoodMaterial);
    hood.position.set(0, -0.65, -1.8);
    hood.rotation.x = 0.1;
    this.dashboardGroup.add(hood);
    
    const accentGeometry = new THREE.BoxGeometry(0.05, 0.02, 1.5);
    const accentMaterial = new THREE.MeshBasicMaterial({ color: 0xff00ff });
    
    const leftAccent = new THREE.Mesh(accentGeometry, accentMaterial);
    leftAccent.position.set(-0.8, -0.58, -1.8);
    this.dashboardGroup.add(leftAccent);
    
    const rightAccent = new THREE.Mesh(accentGeometry, accentMaterial);
    rightAccent.position.set(0.8, -0.58, -1.8);
    this.dashboardGroup.add(rightAccent);
  }
  
  update(steerInput, speed) {
    if (this.steeringWheel) {
      const targetRotation = -steerInput * 1.2;
      this.steeringWheel.rotation.z = targetRotation;
    }
    
    if (this.speedNeedle) {
      const normalizedSpeed = Math.min(speed / 120, 1);
      const angle = -Math.PI * 0.75 + normalizedSpeed * Math.PI * 1.5;
      this.speedNeedle.rotation.z = angle;
    }
    
    if (this.dashboardGroup) {
      this.dashboardGroup.position.x = this.camera.position.x;
    }
  }
}
