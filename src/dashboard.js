export class Dashboard {
  constructor() {
    this.overlay = null;
    this.steeringWheel = null;
    this.wheelRim = null;
    this.speedNeedle = null;
    this.rpmNeedle = null;
  }
  
  create() {
    this.overlay = document.getElementById('dashboard-overlay');
    this.steeringWheel = document.getElementById('steering-wheel');
    this.wheelRim = document.querySelector('.wheel-rim');
    this.speedNeedle = document.getElementById('speed-needle');
    this.rpmNeedle = document.getElementById('rpm-needle');
  }
  
  show() {
    if (this.overlay) {
      this.overlay.classList.add('visible');
    }
  }
  
  hide() {
    if (this.overlay) {
      this.overlay.classList.remove('visible');
    }
  }
  
  update(steerInput, speed) {
    if (this.steeringWheel) {
      const rotation = -steerInput * 90;
      this.steeringWheel.style.transform = `rotate(${rotation}deg)`;
    }
    
    if (this.speedNeedle) {
      const normalizedSpeed = Math.min(speed / 140, 1);
      const angle = -135 + normalizedSpeed * 270;
      this.speedNeedle.style.transform = `translateX(-50%) rotate(${angle}deg)`;
    }
    
    if (this.rpmNeedle) {
      const rpm = (speed / 140) * 0.7 + Math.sin(Date.now() * 0.005) * 0.05;
      const angle = -135 + Math.min(rpm, 1) * 270;
      this.rpmNeedle.style.transform = `translateX(-50%) rotate(${angle}deg)`;
    }
  }
}
