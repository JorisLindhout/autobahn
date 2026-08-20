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
    
    const dashColor = 0x2a2a2a;
    const interiorColor = 0x8b5a3c;
    
    const dashMaterial = new THREE.MeshBasicMaterial({ color: dashColor });
    const interiorMaterial = new THREE.MeshBasicMaterial({ color: interiorColor });
    
    const dashGeometry = new THREE.BoxGeometry(2.8, 0.25, 0.5);
    const dashboard = new THREE.Mesh(dashGeometry, dashMaterial);
    dashboard.position.set(0, -0.55, -1.1);
    this.dashboardGroup.add(dashboard);
    
    const topDashGeometry = new THREE.BoxGeometry(2.8, 0.08, 0.3);
    const topDash = new THREE.Mesh(topDashGeometry, dashMaterial);
    topDash.position.set(0, -0.38, -1.2);
    this.dashboardGroup.add(topDash);
    
    const leftPanelGeometry = new THREE.BoxGeometry(0.15, 0.5, 0.6);
    const leftPanel = new THREE.Mesh(leftPanelGeometry, interiorMaterial);
    leftPanel.position.set(-1.35, -0.55, -0.9);
    this.dashboardGroup.add(leftPanel);
    
    const rightPanel = new THREE.Mesh(leftPanelGeometry, interiorMaterial);
    rightPanel.position.set(1.35, -0.55, -0.9);
    this.dashboardGroup.add(rightPanel);
    
    this.createSteeringWheel();
    this.createSpeedometer();
    this.createHood();
    
    this.dashboardGroup.position.copy(this.camera.position);
    this.scene.add(this.dashboardGroup);
  }
  
  createSteeringWheel() {
    this.steeringWheel = new THREE.Group();
    
    const wheelColor = 0x1a1a1a;
    const wheelMaterial = new THREE.MeshBasicMaterial({ color: wheelColor });
    
    const rimRadius = 0.18;
    const tubeRadius = 0.015;
    const rimGeometry = new THREE.TorusGeometry(rimRadius, tubeRadius, 8, 24);
    const rim = new THREE.Mesh(rimGeometry, wheelMaterial);
    this.steeringWheel.add(rim);
    
    const hubGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.02, 12);
    const hub = new THREE.Mesh(hubGeometry, wheelMaterial);
    hub.rotation.x = Math.PI / 2;
    this.steeringWheel.add(hub);
    
    const centerGeometry = new THREE.CircleGeometry(0.03, 12);
    const centerMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
    const center = new THREE.Mesh(centerGeometry, centerMaterial);
    center.position.z = 0.011;
    this.steeringWheel.add(center);
    
    const spokeGeometry = new THREE.BoxGeometry(0.02, rimRadius - 0.04, 0.01);
    const angles = [-Math.PI / 2, Math.PI / 6, Math.PI - Math.PI / 6];
    
    for (const angle of angles) {
      const spoke = new THREE.Mesh(spokeGeometry, wheelMaterial);
      const dist = (rimRadius - 0.04) / 2 + 0.02;
      spoke.position.set(
        Math.cos(angle) * dist,
        Math.sin(angle) * dist,
        0
      );
      spoke.rotation.z = angle;
      this.steeringWheel.add(spoke);
    }
    
    this.steeringWheel.position.set(0, -0.45, -0.75);
    this.steeringWheel.rotation.x = -0.4;
    
    this.dashboardGroup.add(this.steeringWheel);
  }
  
  createSpeedometer() {
    const speedoGroup = new THREE.Group();
    
    const bgGeometry = new THREE.CircleGeometry(0.08, 24);
    const bgMaterial = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const bg = new THREE.Mesh(bgGeometry, bgMaterial);
    speedoGroup.add(bg);
    
    const rimGeometry = new THREE.RingGeometry(0.075, 0.08, 24);
    const rimMaterial = new THREE.MeshBasicMaterial({ color: 0x444444 });
    const rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.position.z = 0.001;
    speedoGroup.add(rim);
    
    const needleGeometry = new THREE.BoxGeometry(0.006, 0.055, 0.003);
    const needleMaterial = new THREE.MeshBasicMaterial({ color: 0xff3300 });
    this.speedNeedle = new THREE.Mesh(needleGeometry, needleMaterial);
    this.speedNeedle.geometry.translate(0, 0.0275, 0);
    this.speedNeedle.position.z = 0.005;
    speedoGroup.add(this.speedNeedle);
    
    speedoGroup.position.set(0.35, -0.35, -1.05);
    speedoGroup.rotation.x = -0.3;
    
    this.dashboardGroup.add(speedoGroup);
  }
  
  createHood() {
    const hoodGeometry = new THREE.BoxGeometry(1.8, 0.08, 1.5);
    const hoodMaterial = new THREE.MeshBasicMaterial({ color: 0x3a3a3a });
    const hood = new THREE.Mesh(hoodGeometry, hoodMaterial);
    hood.position.set(0, -0.72, -1.6);
    hood.rotation.x = 0.08;
    this.dashboardGroup.add(hood);
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
