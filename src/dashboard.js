import * as THREE from 'three';

export class Dashboard {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.dashboardGroup = null;
    this.steeringWheel = null;
    this.speedNeedle = null;
    this.rpmNeedle = null;
  }
  
  create() {
    this.dashboardGroup = new THREE.Group();
    
    const dashColor = 0x2a2a2a;
    const panelColor = 0x8b5a3c;
    
    const dashMaterial = new THREE.MeshBasicMaterial({ color: dashColor });
    const panelMaterial = new THREE.MeshBasicMaterial({ color: panelColor });
    
    const mainDashGeometry = new THREE.BoxGeometry(2.6, 0.22, 0.5);
    const mainDash = new THREE.Mesh(mainDashGeometry, dashMaterial);
    mainDash.position.set(0, -0.75, -1.2);
    this.dashboardGroup.add(mainDash);
    
    const leftDoorGeometry = new THREE.BoxGeometry(0.12, 0.55, 0.9);
    const leftDoor = new THREE.Mesh(leftDoorGeometry, panelMaterial);
    leftDoor.position.set(-1.35, -0.72, -0.85);
    this.dashboardGroup.add(leftDoor);
    
    const rightDoor = new THREE.Mesh(leftDoorGeometry, panelMaterial);
    rightDoor.position.set(1.35, -0.72, -0.85);
    this.dashboardGroup.add(rightDoor);
    
    this.createGaugeCluster();
    this.createSteeringWheel();
    
    this.dashboardGroup.position.copy(this.camera.position);
    this.scene.add(this.dashboardGroup);
  }
  
  createGaugeCluster() {
    const clusterGroup = new THREE.Group();
    
    const clusterBgGeometry = new THREE.BoxGeometry(1.0, 0.4, 0.05);
    const clusterBgMaterial = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const clusterBg = new THREE.Mesh(clusterBgGeometry, clusterBgMaterial);
    clusterGroup.add(clusterBg);
    
    this.rpmNeedle = this.createGauge(-0.25, 0, 0.14, 'RPM', 0x00aa00);
    clusterGroup.add(this.rpmNeedle.group);
    
    this.speedNeedle = this.createGauge(0.25, 0, 0.14, 'MPH', 0x00aa00);
    clusterGroup.add(this.speedNeedle.group);
    
    clusterGroup.position.set(0.3, -0.62, -1.1);
    clusterGroup.rotation.x = -0.4;
    
    this.dashboardGroup.add(clusterGroup);
  }
  
  createGauge(x, y, radius, label, color) {
    const group = new THREE.Group();
    
    const bgGeometry = new THREE.CircleGeometry(radius, 32);
    const bgMaterial = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const bg = new THREE.Mesh(bgGeometry, bgMaterial);
    group.add(bg);
    
    const rimGeometry = new THREE.RingGeometry(radius - 0.008, radius, 32);
    const rimMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
    const rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.position.z = 0.001;
    group.add(rim);
    
    const tickMaterial = new THREE.MeshBasicMaterial({ color: 0xcccccc });
    for (let i = 0; i <= 10; i++) {
      const angle = -Math.PI * 0.75 + (i / 10) * Math.PI * 1.5;
      const tickLength = i % 2 === 0 ? 0.02 : 0.012;
      const tickGeometry = new THREE.BoxGeometry(0.004, tickLength, 0.001);
      const tick = new THREE.Mesh(tickGeometry, tickMaterial);
      const dist = radius - 0.02;
      tick.position.set(
        Math.cos(angle + Math.PI / 2) * dist + x,
        Math.sin(angle + Math.PI / 2) * dist + y,
        0.002
      );
      tick.rotation.z = angle;
      group.add(tick);
    }
    
    const needleGeometry = new THREE.BoxGeometry(0.008, radius * 0.7, 0.004);
    const needleMaterial = new THREE.MeshBasicMaterial({ color: 0xff3300 });
    const needle = new THREE.Mesh(needleGeometry, needleMaterial);
    needle.geometry.translate(0, radius * 0.35, 0);
    needle.position.set(x, y, 0.005);
    group.add(needle);
    
    const centerGeometry = new THREE.CircleGeometry(0.015, 16);
    const centerMaterial = new THREE.MeshBasicMaterial({ color: 0x222222 });
    const center = new THREE.Mesh(centerGeometry, centerMaterial);
    center.position.set(x, y, 0.006);
    group.add(center);
    
    group.position.set(x, y, 0);
    
    return { group, needle };
  }
  
  createSmallGauge(x, y, radius, label) {
    const group = new THREE.Group();
    
    const bgGeometry = new THREE.CircleGeometry(radius, 24);
    const bgMaterial = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const bg = new THREE.Mesh(bgGeometry, bgMaterial);
    group.add(bg);
    
    const rimGeometry = new THREE.RingGeometry(radius - 0.005, radius, 24);
    const rimMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
    const rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.position.z = 0.001;
    group.add(rim);
    
    const indicatorGeometry = new THREE.CircleGeometry(0.015, 8);
    const indicatorMaterial = new THREE.MeshBasicMaterial({ color: 0x00aa00 });
    const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
    indicator.position.set(0, radius * 0.4, 0.002);
    group.add(indicator);
    
    group.position.set(x, y, 0);
    
    return group;
  }
  
  createSteeringWheel() {
    this.steeringWheel = new THREE.Group();
    
    const wheelColor = 0x1a1a1a;
    const wheelMaterial = new THREE.MeshBasicMaterial({ color: wheelColor });
    const metalMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
    
    const rimRadius = 0.18;
    const tubeRadius = 0.016;
    const rimGeometry = new THREE.TorusGeometry(rimRadius, tubeRadius, 8, 32);
    const rim = new THREE.Mesh(rimGeometry, wheelMaterial);
    this.steeringWheel.add(rim);
    
    const hubGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.02, 16);
    const hub = new THREE.Mesh(hubGeometry, metalMaterial);
    hub.rotation.x = Math.PI / 2;
    this.steeringWheel.add(hub);
    
    const centerGeometry = new THREE.CircleGeometry(0.03, 16);
    const centerMaterial = new THREE.MeshBasicMaterial({ color: 0x222222 });
    const center = new THREE.Mesh(centerGeometry, centerMaterial);
    center.position.z = 0.011;
    this.steeringWheel.add(center);
    
    const spokeGeometry = new THREE.BoxGeometry(0.02, rimRadius - 0.04, 0.01);
    const angles = [-Math.PI / 2, Math.PI / 6, Math.PI - Math.PI / 6];
    
    for (const angle of angles) {
      const spoke = new THREE.Mesh(spokeGeometry, metalMaterial);
      const dist = (rimRadius - 0.04) / 2 + 0.02;
      spoke.position.set(
        Math.cos(angle) * dist,
        Math.sin(angle) * dist,
        0
      );
      spoke.rotation.z = angle;
      this.steeringWheel.add(spoke);
    }
    
    this.steeringWheel.position.set(-0.15, -0.6, -0.8);
    this.steeringWheel.rotation.x = -0.5;
    
    this.dashboardGroup.add(this.steeringWheel);
  }
  
  update(steerInput, speed) {
    if (this.steeringWheel) {
      const targetRotation = -steerInput * 1.5;
      this.steeringWheel.rotation.z = targetRotation;
    }
    
    if (this.speedNeedle && this.speedNeedle.needle) {
      const normalizedSpeed = Math.min(speed / 140, 1);
      const angle = -Math.PI * 0.75 + normalizedSpeed * Math.PI * 1.5;
      this.speedNeedle.needle.rotation.z = angle;
    }
    
    if (this.rpmNeedle && this.rpmNeedle.needle) {
      const rpm = (speed / 140) * 0.7 + Math.sin(Date.now() * 0.005) * 0.05;
      const angle = -Math.PI * 0.75 + Math.min(rpm, 1) * Math.PI * 1.5;
      this.rpmNeedle.needle.rotation.z = angle;
    }
    
    if (this.dashboardGroup) {
      this.dashboardGroup.position.x = this.camera.position.x;
    }
  }
}
