export class Controls {
  constructor() {
    this.steerInput = 0;
    this.targetSteer = 0;
    this.enabled = false;
    this.useGyro = false;
    this.forceTouchControls = false;
    this.touchInput = 0;
    
    this.gyroSensitivity = 1 / 30;
    this.smoothing = 0.15;
    
    this.handleOrientation = this.handleOrientation.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    
    this.checkGyroSupport();
  }
  
  checkGyroSupport() {
    if (typeof DeviceOrientationEvent !== 'undefined') {
      window.addEventListener('deviceorientation', (e) => {
        if (e.gamma !== null) {
          this.useGyro = true;
        }
      }, { once: true });
    }
  }
  
  enable(forceTouchControls = false) {
    this.enabled = true;
    this.steerInput = 0;
    this.targetSteer = 0;
    this.forceTouchControls = forceTouchControls;
    
    if (!forceTouchControls) {
      window.addEventListener('deviceorientation', this.handleOrientation);
    }
    
    document.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd);
    document.addEventListener('touchmove', this.handleTouchMove, { passive: false });
  }
  
  disable() {
    this.enabled = false;
    
    window.removeEventListener('deviceorientation', this.handleOrientation);
    document.removeEventListener('touchstart', this.handleTouchStart);
    document.removeEventListener('touchend', this.handleTouchEnd);
    document.removeEventListener('touchmove', this.handleTouchMove);
  }
  
  handleOrientation(event) {
    if (!this.enabled) return;
    
    const gamma = event.gamma || 0;
    
    const clampedGamma = Math.max(-45, Math.min(45, gamma));
    this.targetSteer = clampedGamma * this.gyroSensitivity;
    this.useGyro = true;
  }
  
  handleTouchStart(event) {
    if (!this.enabled) return;
    event.preventDefault();
    
    if (this.useGyro && !this.forceTouchControls) return;
    
    this.updateTouchInput(event.touches[0]);
  }
  
  handleTouchMove(event) {
    if (!this.enabled) return;
    if (this.useGyro && !this.forceTouchControls) return;
    event.preventDefault();
    
    this.updateTouchInput(event.touches[0]);
  }
  
  handleTouchEnd() {
    if (!this.enabled) return;
    if (this.useGyro && !this.forceTouchControls) return;
    this.touchInput = 0;
    this.targetSteer = 0;
  }
  
  updateTouchInput(touch) {
    const screenWidth = window.innerWidth;
    const x = touch.clientX;
    
    const normalizedX = (x / screenWidth) * 2 - 1;
    
    this.targetSteer = normalizedX * 1.5;
  }
  
  getSteerInput() {
    this.steerInput += (this.targetSteer - this.steerInput) * this.smoothing;
    return this.steerInput;
  }
}
