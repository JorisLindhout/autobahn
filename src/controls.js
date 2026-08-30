function isDevMode() {
  if (import.meta.env.VITE_DEV_CONTROLS !== undefined) {
    return import.meta.env.VITE_DEV_CONTROLS === 'true';
  }
  return !!import.meta.env.DEV;
}

export class Controls {
  constructor() {
    this.steerInput = 0;
    this.targetSteer = 0;
    this.enabled = false;

    // Input mode
    this.mode = this.getInputMode();

    // Gyroscope calibration
    this.calibrated = false;
    this.calibrationGamma = 0;

    // Gyroscope settings
    this.maxTiltAngle = 25;

    // Steering smoothing
    this.smoothing = 0.15;

    // Keyboard state
    this.leftPressed = false;
    this.rightPressed = false;

    this.handleOrientation = this.handleOrientation.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
  }

  getInputMode() {
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);

    if (isMobile && 'DeviceOrientationEvent' in window) {
      return 'gyro';
    }

    return 'keyboard';
  }

  enable() {
    this.enabled = true;
    this.steerInput = 0;
    this.targetSteer = 0;

    this.calibrated = false;
    this.calibrationGamma = 0;

    this.leftPressed = false;
    this.rightPressed = false;

    if (this.mode === 'gyro') {
      window.addEventListener(
        'deviceorientation',
        this.handleOrientation
      );
    } else if (this.mode === 'keyboard' && isDevMode()) {
      window.addEventListener('keydown', this.handleKeyDown);
      window.addEventListener('keyup', this.handleKeyUp);
    }
  }

  disable() {
    this.enabled = false;

    window.removeEventListener(
      'deviceorientation',
      this.handleOrientation
    );

    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);

    this.leftPressed = false;
    this.rightPressed = false;

    this.targetSteer = 0;
  }

  handleOrientation(event) {
    if (!this.enabled || this.mode !== 'gyro') return;

    const gamma = event.gamma || 0;

    // Capture the phone's starting orientation.
    if (!this.calibrated) {
      this.calibrationGamma = gamma;
      this.calibrated = true;
      return;
    }

    const adjustedGamma =
      gamma - this.calibrationGamma;

    const normalizedTilt = Math.max(
      -1,
      Math.min(
        1,
        adjustedGamma / this.maxTiltAngle
      )
    );

    // Apply the same steering curve used by
    // the original mobile implementation.
    const sign = Math.sign(normalizedTilt);
    const magnitude = Math.abs(normalizedTilt);
    const curved = Math.pow(magnitude, 1.5);

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