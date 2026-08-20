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
    
    const darkPlastic = new THREE.MeshBasicMaterial({ color: 0x1a1a1a });
    const brownInterior = new THREE.MeshBasicMaterial({ color: 0x6b3d2e });
    
    const dashGeometry = new THREE.BoxGeometry(3.5, 0.4, 1);
    const dashboard = new THREE.Mesh(dashGeometry, darkPlastic);
    dashboard.position.set(0, -0.5, -1);
    this.dashboardGroup.add(dashboard);
    
    const topDashGeometry = new THREE.BoxGeometry(3.5, 0.2, 0.6);
    const topDash = new THREE.Mesh(topDashGeometry, darkPlastic);
    topDash.position.set(0, -0.2, -1.15);
    this.dashboardGroup.add(topDash);
    
    const leftPanelGeometry = new THREE.BoxGeometry(0.3, 0.8, 1.2);
    const leftPanel = new THREE.Mesh(leftPanelGeometry, brownInterior);
    leftPanel.position.set(-1.6, -0.3, -0.7);
    this.dashboardGroup.add(leftPanel);
    
    const rightPanel = new THREE.Mesh(leftPanelGeometry, brownInterior);
    rightPanel.position.set(1.6, -0.3, -0.7);
    this.dashboardGroup.add(rightPanel);
    
    this.createSteeringWheel(darkPlastic);
    this.createInstrumentCluster();
    this.createHood(darkPlastic);
    
    this.dashboardGroup.position.copy(this.camera.position);
    this.scene.add(this.dashboardGroup);
  }
  
  createSteeringWheel(material) {
    this.steeringWheel = new THREE.Group();
    
    const rimRadius = 0.22;
    const tubeRadius = 0.018;
    const rimGeometry = new THREE.TorusGeometry(rimRadius, tubeRadius, 12, 32);
    const rim = new THREE.Mesh(rimGeometry, material);
    this.steeringWheel.add(rim);
    
    const hubGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.025, 16);
    const hub = new THREE.Mesh(hubGeometry, material);
    hub.rotation.x = Math.PI / 2;
    this.steeringWheel.add(hub);
    
    const centerCapGeometry = new THREE.CircleGeometry(0.04, 16);
    const centerCapMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
    const centerCap = new THREE.Mesh(centerCapGeometry, centerCapMaterial);
    centerCap.position.z = 0.013;
    this.steeringWheel.add(centerCap);
    
    const spokeGeometry = new THREE.BoxGeometry(0.025, rimRadius - 0.05, 0.012);
    
    const angles = [-Math.PI / 2, Math.PI / 6, Math.PI - Math.PI / 6];
    for (const angle of angles) {
      const spoke = new THREE.Mesh(spokeGeometry, material);
      const dist = (rimRadius - 0.05) / 2 + 0.025;
      spoke.position.set(
        Math.cos(angle) * dist,
        Math.sin(angle) * dist,
        0
      );
      spoke.rotation.z = angle;
      this.steeringWheel.add(spoke);
    }
    
    this.steeringWheel.position.set(0, -0.32, -0.65);
    this.steeringWheel.rotation.x = -0.45;
    
    this.dashboardGroup.add(this.steeringWheel);
  }
  
  createInstrumentCluster() {
    const clusterGroup = new THREE.Group();
    
    const bgGeometry = new THREE.BoxGeometry(0.6, 0.35, 0.08);
    const bgMaterial = new THREE.MeshBasicMaterial({ color: 0x0a0a0a });
    const bg = new THREE.Mesh(bgGeometry, bgMaterial);
    clusterGroup.add(bg);
    
    const gaugeRadius = 0.1;
    const gaugeBgGeometry = new THREE.CircleGeometry(gaugeRadius, 24);
    const gaugeBgMaterial = new THREE.MeshBasicMaterial({ color: 0x111111 });
    
    const leftGauge = new THREE.Mesh(gaugeBgGeometry, gaugeBgMaterial);
    leftGauge.position.set(-0.15, 0, 0.041);
    clusterGroup.add(leftGauge);
    
    const rightGauge = new THREE.Mesh(gaugeBgGeometry, gaugeBgMaterial);
    rightGauge.position.set(0.15, 0, 0.041);
    clusterGroup.add(rightGauge);
    
    const rimGeometry = new THREE.RingGeometry(gaugeRadius - 0.005, gaugeRadius, 24);
    const rimMaterial = new THREE.MeshBasicMaterial({ color: 0x444444 });
    
    const leftRim = new THREE.Mesh(rimGeometry, rimMaterial);
    leftRim.position.set(-0.15, 0, 0.042);
    clusterGroup.add(leftRim);
    
    const rightRim = new THREE.Mesh(rimGeometry, rimMaterial);
    rightRim.position.set(0.15, 0, 0.042);
    clusterGroup.add(rightRim);
    
    const needleGeometry = new THREE.BoxGeometry(0.008, 0.07, 0.005);
    const needleMaterial = new THREE.MeshBasicMaterial({ color: 0xff3300 });
    
    this.speedNeedle = new THREE.Mesh(needleGeometry, needleMaterial);
    this.speedNeedle.geometry.translate(0, 0.035, 0);
    this.speedNeedle.position.set(-0.15, 0, 0.045);
    clusterGroup.add(this.speedNeedle);
    
    const tachNeedle = new THREE.Mesh(needleGeometry, needleMaterial);
    tachNeedle.geometry.translate(0, 0.035, 0);
    tachNeedle.position.set(0.15, 0, 0.045);
    tachNeedle.rotation.z = -Math.PI * 0.3;
    clusterGroup.add(tachNeedle);
    
    clusterGroup.position.set(0, -0.1, -1.05);
    clusterGroup.rotation.x = -0.35;
    
    this.dashboardGroup.add(clusterGroup);
  }
  
  createHood(material) {
    const hoodGeometry = new THREE.BoxGeometry(2.4, 0.12, 2);
    const hoodMaterial = new THREE.MeshBasicMaterial({ color: 0x2a2a2a });
    const hood = new THREE.Mesh(hoodGeometry, hoodMaterial);
    hood.position.set(0, -0.62, -1.8);
    hood.rotation.x = 0.1;
    this.dashboardGroup.add(hood);
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
    
    if (this.dashboardGroup) {
      this.dashboardGroup.position.x = this.camera.position.x;
    }
  }
}
