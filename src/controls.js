export class Controls {
  constructor() {
    this.steerInput = 0;
    this.targetSteer = 0;
    this.enabled = false;
    
    this.calibrated = false;
    this.calibrationGamma = 0;
    
    this.maxTiltAngle = 25;
    this.smoothing = 0.15;
    
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
    
    const normalizedTilt = Math.max(-1, Math.min(1, adjustedGamma / this.maxTiltAngle));
    
    const sign = Math.sign(normalizedTilt);
    const magnitude = Math.abs(normalizedTilt);
    const curved = Math.pow(magnitude, 1.5);
    
    this.targetSteer = sign * curved;
  }
  
  getSteerInput() {
    this.steerInput += (this.targetSteer - this.steerInput) * this.smoothing;
    return this.steerInput;
  }
}
