import * as THREE from 'three';

export class Dashboard {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.dashboardGroup = null;
    this.steeringWheel = null;
    this.speedNeedle = null;
    this.tachNeedle = null;
  }
  
  create() {
    this.dashboardGroup = new THREE.Group();
    
    const darkPlastic = new THREE.MeshBasicMaterial({ color: 0x1a1a1a });
    const brownInterior = new THREE.MeshBasicMaterial({ color: 0x8b4513 });
    
    this.createMainDashboard(darkPlastic);
    this.createSidePanels(brownInterior);
    this.createInstrumentCluster(darkPlastic);
    this.createSteeringWheel();
    this.createWindshieldFrame(darkPlastic);
    
    this.dashboardGroup.position.copy(this.camera.position);
    this.scene.add(this.dashboardGroup);
  }
  
  createMainDashboard(material) {
    const dashGeometry = new THREE.BoxGeometry(4, 0.6, 1.2);
    const dashboard = new THREE.Mesh(dashGeometry, material);
    dashboard.position.set(0, -0.4, -0.9);
    this.dashboardGroup.add(dashboard);
    
    const topDashGeometry = new THREE.BoxGeometry(4, 0.25, 0.8);
    const topDash = new THREE.Mesh(topDashGeometry, material);
    topDash.position.set(0, -0.05, -1.1);
    this.dashboardGroup.add(topDash);
    
    const ventGeometry = new THREE.BoxGeometry(0.3, 0.08, 0.05);
    const ventMaterial = new THREE.MeshBasicMaterial({ color: 0x0a0a0a });
    
    for (let i = -1; i <= 1; i++) {
      const vent = new THREE.Mesh(ventGeometry, ventMaterial);
      vent.position.set(i * 0.8, -0.1, -0.55);
      this.dashboardGroup.add(vent);
    }
  }
  
  createSidePanels(material) {
    const sidePanelGeometry = new THREE.BoxGeometry(0.8, 1.5, 2);
    
    const leftPanel = new THREE.Mesh(sidePanelGeometry, material);
    leftPanel.position.set(-1.8, -0.3, -0.8);
    this.dashboardGroup.add(leftPanel);
    
    const rightPanel = new THREE.Mesh(sidePanelGeometry, material);
    rightPanel.position.set(1.8, -0.3, -0.8);
    this.dashboardGroup.add(rightPanel);
    
    const leftDoorTop = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.15, 1.5),
      material
    );
    leftDoorTop.position.set(-1.6, 0.35, -0.6);
    this.dashboardGroup.add(leftDoorTop);
    
    const rightDoorTop = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.15, 1.5),
      material
    );
    rightDoorTop.position.set(1.6, 0.35, -0.6);
    this.dashboardGroup.add(rightDoorTop);
    
    const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x2a2a2a });
    const floorGeometry = new THREE.BoxGeometry(4, 0.1, 2);
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.set(0, -1.0, -0.5);
    this.dashboardGroup.add(floor);
  }
  
  createInstrumentCluster(material) {
    const clusterGeometry = new THREE.BoxGeometry(1.0, 0.5, 0.15);
    const cluster = new THREE.Mesh(clusterGeometry, material);
    cluster.position.set(0, -0.15, -0.6);
    cluster.rotation.x = -0.3;
    this.dashboardGroup.add(cluster);
    
    this.createGauge(-0.25, 0.12, true);
    this.createGauge(0.25, 0.1, false);
  }
  
  createGauge(xOffset, radius, isSpeedometer) {
    const gaugeGroup = new THREE.Group();
    
    const bgGeometry = new THREE.CircleGeometry(radius, 32);
    const bgMaterial = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const bg = new THREE.Mesh(bgGeometry, bgMaterial);
    gaugeGroup.add(bg);
    
    const rimGeometry = new THREE.RingGeometry(radius - 0.005, radius, 32);
    const rimMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
    const rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.position.z = 0.001;
    gaugeGroup.add(rim);
    
    const markMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let i = 0; i <= 10; i++) {
      const angle = -Math.PI * 0.75 + (i / 10) * Math.PI * 1.5;
      const markLength = i % 2 === 0 ? 0.02 : 0.01;
      const markGeometry = new THREE.BoxGeometry(0.003, markLength, 0.001);
      const mark = new THREE.Mesh(markGeometry, markMaterial);
      const r = radius - 0.015;
      mark.position.set(
        Math.cos(angle) * r,
        Math.sin(angle) * r,
        0.002
      );
      mark.rotation.z = angle - Math.PI / 2;
      gaugeGroup.add(mark);
    }
    
    const needleGeometry = new THREE.BoxGeometry(0.006, radius * 0.7, 0.005);
    const needleMaterial = new THREE.MeshBasicMaterial({ color: 0xff3300 });
    const needle = new THREE.Mesh(needleGeometry, needleMaterial);
    needle.geometry.translate(0, radius * 0.35, 0);
    needle.position.z = 0.005;
    gaugeGroup.add(needle);
    
    if (isSpeedometer) {
      this.speedNeedle = needle;
    } else {
      this.tachNeedle = needle;
    }
    
    const centerGeometry = new THREE.CircleGeometry(0.015, 16);
    const centerMaterial = new THREE.MeshBasicMaterial({ color: 0x222222 });
    const center = new THREE.Mesh(centerGeometry, centerMaterial);
    center.position.z = 0.006;
    gaugeGroup.add(center);
    
    gaugeGroup.position.set(xOffset, -0.12, -0.52);
    gaugeGroup.rotation.x = -0.3;
    
    this.dashboardGroup.add(gaugeGroup);
  }
  
  createSteeringWheel() {
    this.steeringWheel = new THREE.Group();
    
    const wheelMaterial = new THREE.MeshBasicMaterial({ color: 0x1a1a1a });
    
    const rimRadius = 0.22;
    const tubeRadius = 0.018;
    const rimGeometry = new THREE.TorusGeometry(rimRadius, tubeRadius, 12, 32);
    const rim = new THREE.Mesh(rimGeometry, wheelMaterial);
    this.steeringWheel.add(rim);
    
    const hubGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.025, 16);
    const hub = new THREE.Mesh(hubGeometry, wheelMaterial);
    hub.rotation.x = Math.PI / 2;
    this.steeringWheel.add(hub);
    
    const centerCapGeometry = new THREE.CircleGeometry(0.04, 16);
    const centerCapMaterial = new THREE.MeshBasicMaterial({ color: 0x222222 });
    const centerCap = new THREE.Mesh(centerCapGeometry, centerCapMaterial);
    centerCap.position.z = 0.013;
    this.steeringWheel.add(centerCap);
    
    const spokeGeometry = new THREE.BoxGeometry(0.03, rimRadius - 0.06, 0.015);
    
    const angles = [-Math.PI / 2, Math.PI / 6, Math.PI - Math.PI / 6];
    for (const angle of angles) {
      const spoke = new THREE.Mesh(spokeGeometry, wheelMaterial);
      const dist = (rimRadius - 0.06) / 2 + 0.03;
      spoke.position.set(
        Math.cos(angle) * dist,
        Math.sin(angle) * dist,
        0
      );
      spoke.rotation.z = angle;
      this.steeringWheel.add(spoke);
    }
    
    this.steeringWheel.position.set(0, -0.35, -0.5);
    this.steeringWheel.rotation.x = -0.5;
    
    const columnGeometry = new THREE.CylinderGeometry(0.03, 0.04, 0.4, 8);
    const columnMaterial = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const column = new THREE.Mesh(columnGeometry, columnMaterial);
    column.rotation.x = Math.PI / 2 - 0.5;
    column.position.set(0, -0.5, -0.7);
    this.dashboardGroup.add(column);
    
    this.dashboardGroup.add(this.steeringWheel);
  }
  
  createWindshieldFrame(material) {
    const topFrameGeometry = new THREE.BoxGeometry(4, 0.12, 0.1);
    const topFrame = new THREE.Mesh(topFrameGeometry, material);
    topFrame.position.set(0, 0.65, -1.2);
    this.dashboardGroup.add(topFrame);
    
    const leftPillarGeometry = new THREE.BoxGeometry(0.15, 1.2, 0.8);
    const leftPillar = new THREE.Mesh(leftPillarGeometry, material);
    leftPillar.position.set(-1.4, 0.2, -1.0);
    leftPillar.rotation.y = 0.2;
    this.dashboardGroup.add(leftPillar);
    
    const rightPillar = new THREE.Mesh(leftPillarGeometry, material);
    rightPillar.position.set(1.4, 0.2, -1.0);
    rightPillar.rotation.y = -0.2;
    this.dashboardGroup.add(rightPillar);
    
    const mirrorGeometry = new THREE.BoxGeometry(0.25, 0.08, 0.04);
    const mirrorMaterial = new THREE.MeshBasicMaterial({ color: 0x222222 });
    const mirror = new THREE.Mesh(mirrorGeometry, mirrorMaterial);
    mirror.position.set(0, 0.55, -1.15);
    this.dashboardGroup.add(mirror);
    
    const mirrorGlassGeometry = new THREE.BoxGeometry(0.22, 0.05, 0.01);
    const mirrorGlassMaterial = new THREE.MeshBasicMaterial({ color: 0x4a6080 });
    const mirrorGlass = new THREE.Mesh(mirrorGlassGeometry, mirrorGlassMaterial);
    mirrorGlass.position.set(0, 0.55, -1.13);
    this.dashboardGroup.add(mirrorGlass);
  }
  
  update(steerInput, speed) {
    if (this.steeringWheel) {
      const targetRotation = -steerInput * 1.5;
      this.steeringWheel.rotation.z = targetRotation;
    }
    
    if (this.speedNeedle) {
      const normalizedSpeed = Math.min(speed / 120, 1);
      const angle = -Math.PI * 0.75 + normalizedSpeed * Math.PI * 1.5;
      this.speedNeedle.rotation.z = angle;
    }
    
    if (this.tachNeedle) {
      const rpm = (speed / 120) * 0.7 + 0.15;
      const angle = -Math.PI * 0.75 + rpm * Math.PI * 1.5;
      this.tachNeedle.rotation.z = angle;
    }
    
    if (this.dashboardGroup) {
      this.dashboardGroup.position.x = this.camera.position.x;
    }
  }
}
