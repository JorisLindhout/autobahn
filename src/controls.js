function isDevMode() {
  if (import.meta.env.VITE_DEV_CONTROLS !== undefined) {
    return import.meta.env.VITE_DEV_CONTROLS === 'true';
  }
  return !!import.meta.env.DEV;
}

function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
}

export class Controls {
  constructor() {
    this.steerInput = 0;
    this.targetSteer = 0;
    this.enabled = false;

    // Mobile uses gyro; Desktop in dev mode uses keyboard
    this.mode = isMobileDevice() ? 'gyro' : (isDevMode() ? 'keyboard' : 'gyro');

    // Steering settings: 25 degrees of steering wheel turn gives full lock
    this.maxTiltAngle = 25;
    this.deadzone = 1.5; // Small deadzone in degrees to prevent idle drift

    // Steering smoothing
    this.smoothing = 0.2;

    // Keyboard state
    this.leftPressed = false;
    this.rightPressed = false;

    this.handleOrientation = this.handleOrientation.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
  }

  enable() {
    this.enabled = true;
    this.steerInput = 0;
    this.targetSteer = 0;

    this.leftPressed = false;
    this.rightPressed = false;

    if (this.mode === 'gyro') {
      window.addEventListener('deviceorientation', this.handleOrientation);
      window.addEventListener('deviceorientationabsolute', this.handleOrientation);
    } else if (this.mode === 'keyboard' && isDevMode()) {
      window.addEventListener('keydown', this.handleKeyDown);
      window.addEventListener('keyup', this.handleKeyUp);
    }
  }

  disable() {
    this.enabled = false;

    window.removeEventListener('deviceorientation', this.handleOrientation);
    window.removeEventListener('deviceorientationabsolute', this.handleOrientation);

    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);

    this.leftPressed = false;
    this.rightPressed = false;
    this.targetSteer = 0;
  }

  /**
   * Extract purely the steering wheel rotation angle (turning left/right like a car wheel)
   * regardless of how much the phone is tilted forward or backward towards the player.
   */
  getSteeringAngle(event) {
    const beta = event.beta;
    const gamma = event.gamma;

    if (beta === null || beta === undefined) {
      if (gamma === null || gamma === undefined) return 0;
      return gamma;
    }

    // Determine screen orientation angle (0, 90, 180, 270)
    let orientationAngle = 90; // Default landscape
    if (window.screen && window.screen.orientation && typeof window.screen.orientation.angle === 'number') {
      orientationAngle = window.screen.orientation.angle;
    } else if (typeof window.orientation === 'number') {
      orientationAngle = window.orientation;
    } else if (window.innerWidth < window.innerHeight) {
      orientationAngle = 0;
    }

    let normAngle = ((Math.round(orientationAngle) % 360) + 360) % 360;

    // In landscape mode:
    // - Forward/backward tilt (pitch) rotates around the phone's long axis (gamma).
    // - Turning the phone like a steering wheel rotates around the phone's short axis (beta).
    if (normAngle === 90) {
      // Landscape primary (top of phone on the left):
      // Turning wheel left -> beta < 0, turning right -> beta > 0
      return beta;
    } else if (normAngle === 270) {
      // Landscape secondary (top of phone on the right)
      return -beta;
    } else if (normAngle === 180) {
      return -gamma;
    } else {
      if (window.innerWidth > window.innerHeight) {
        return beta;
      }
      return gamma || 0;
    }
  }

  handleOrientation(event) {
    if (!this.enabled || this.mode !== 'gyro') return;

    const rawAngle = this.getSteeringAngle(event);

    // Apply deadzone so holding level doesn't jitter or drift
    const absAngle = Math.abs(rawAngle);
    if (absAngle < this.deadzone) {
      this.targetSteer = 0;
      return;
    }

    // Normalize steering between -1.0 (full left) and +1.0 (full right)
    const effectiveAngle = Math.min(absAngle - this.deadzone, this.maxTiltAngle - this.deadzone);
    const normalized = effectiveAngle / (this.maxTiltAngle - this.deadzone);

    // Progressive response curve (fine control near center, full turn on tilt)
    const curved = Math.pow(normalized, 1.25);
    const sign = Math.sign(rawAngle);

    this.targetSteer = sign * curved;
  }

  handleKeyDown(event) {
    if (!this.enabled || this.mode !== 'keyboard' || !isDevMode()) return;

    if (
      event.key === 'ArrowLeft' ||
      event.key.toLowerCase() === 'a'
    ) {
      this.leftPressed = true;
      event.preventDefault();
    }

    if (
      event.key === 'ArrowRight' ||
      event.key.toLowerCase() === 'd'
    ) {
      this.rightPressed = true;
      event.preventDefault();
    }

    this.updateKeyboardSteering();
  }

  handleKeyUp(event) {
    if (!this.enabled || this.mode !== 'keyboard' || !isDevMode()) return;

    if (
      event.key === 'ArrowLeft' ||
      event.key.toLowerCase() === 'a'
    ) {
      this.leftPressed = false;
      event.preventDefault();
    }

    if (
      event.key === 'ArrowRight' ||
      event.key.toLowerCase() === 'd'
    ) {
      this.rightPressed = false;
      event.preventDefault();
    }

    this.updateKeyboardSteering();
  }

  updateKeyboardSteering() {
    if (this.leftPressed && !this.rightPressed) {
      this.targetSteer = -1;
    } else if (this.rightPressed && !this.leftPressed) {
      this.targetSteer = 1;
    } else {
      this.targetSteer = 0;
    }
  }

  getSteerInput() {
    this.steerInput +=
      (this.targetSteer - this.steerInput) *
      this.smoothing;

    return this.steerInput;
  }
}
