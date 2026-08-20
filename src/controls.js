export class Controls {
  constructor() {
    this.steerInput = 0;
    this.targetSteer = 0;
    this.enabled = false;
    
    this.gyroSensitivity = 1 / 30;
    this.smoothing = 0.15;
    
    this.handleOrientation = this.handleOrientation.bind(this);
  }
  
  enable() {
    this.enabled = true;
    this.steerInput = 0;
    this.targetSteer = 0;
    
    window.addEventListener('deviceorientation', this.handleOrientation);
  }
  
  disable() {
    this.enabled = false;
    window.removeEventListener('deviceorientation', this.handleOrientation);
  }
  
  handleOrientation(event) {
    if (!this.enabled) return;
    
    const gamma = event.gamma || 0;
    
    const clampedGamma = Math.max(-45, Math.min(45, gamma));
    this.targetSteer = clampedGamma * this.gyroSensitivity;
  }
  
  getSteerInput() {
    this.steerInput += (this.targetSteer - this.steerInput) * this.smoothing;
    return this.steerInput;
  }
}
