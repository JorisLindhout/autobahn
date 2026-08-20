export class Controls {
  constructor() {
    this.steerInput = 0;
    this.targetSteer = 0;
    this.enabled = false;
    
    this.calibrated = false;
    this.calibrationGamma = 0;
    
    this.gyroSensitivity = 1 / 25;
    this.smoothing = 0.12;
    
    this.handleOrientation = this.handleOrientation.bind(this);
  }
  
  enable() {
    this.enabled = true;
    this.steerInput = 0;
    this.targetSteer = 0;
    this.calibrated = false;
    this.calibrationGamma = 0;
    
    window.addEventListener('deviceorientation', this.handleOrientation);
  }
  
  disable() {
    this.enabled = false;
    window.removeEventListener('deviceorientation', this.handleOrientation);
  }
  
  handleOrientation(event) {
    if (!this.enabled) return;
    
    const gamma = event.gamma || 0;
    
    if (!this.calibrated) {
      this.calibrationGamma = gamma;
      this.calibrated = true;
      return;
    }
    
    const adjustedGamma = gamma - this.calibrationGamma;
    
    const clampedGamma = Math.max(-45, Math.min(45, adjustedGamma));
    this.targetSteer = clampedGamma * this.gyroSensitivity;
  }
  
  getSteerInput() {
    this.steerInput += (this.targetSteer - this.steerInput) * this.smoothing;
    return this.steerInput;
  }
}
