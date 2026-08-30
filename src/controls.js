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

    // Input mode: 'gyro' | 'touch' | 'keyboard'
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

    // Touch state
    this.activeTouches = new Map();

    this.handleOrientation = this.handleOrientation.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.handleTouchCancel = this.handleTouchCancel.bind(this);
  }

  setMode(mode) {
    if (this.mode === mode) return;
    const wasEnabled = this.enabled;
    if (wasEnabled) {
      this.disable();
    }
    this.mode = mode;
    if (wasEnabled) {
      this.enable();
    }
  }

  getInputMode() {
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);

    if (isMobile && 'DeviceOrientationEvent' in window) {
      return 'gyro';
    }

    if (isMobile) {
      return 'touch';
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
    this.activeTouches.clear();

    if (this.mode === 'gyro') {
      window.addEventListener('deviceorientation', this.handleOrientation);
      window.addEventListener('deviceorientationabsolute', this.handleOrientation);
      // Also listen to touch for touch steering fallback/supplement
      window.addEventListener('touchstart', this.handleTouchStart, { passive: false });
      window.addEventListener('touchmove', this.handleTouchMove, { passive: false });
      window.addEventListener('touchend', this.handleTouchEnd, { passive: false });
      window.addEventListener('touchcancel', this.handleTouchCancel, { passive: false });
    } else if (this.mode === 'touch') {
      window.addEventListener('touchstart', this.handleTouchStart, { passive: false });
      window.addEventListener('touchmove', this.handleTouchMove, { passive: false });
      window.addEventListener('touchend', this.handleTouchEnd, { passive: false });
      window.addEventListener('touchcancel', this.handleTouchCancel, { passive: false });
    } else if (this.mode === 'keyboard' && isDevMode()) {
      window.addEventListener('keydown', this.handleKeyDown);
      window.addEventListener('keyup', this.handleKeyUp);
    }
  }

  disable() {
    this.enabled = false;

    window.removeEventListener('deviceorientation', this.handleOrientation);
    window.removeEventListener('deviceorientationabsolute', this.handleOrientation);

    window.removeEventListener('touchstart', this.handleTouchStart);
    window.removeEventListener('touchmove', this.handleTouchMove);
    window.removeEventListener('touchend', this.handleTouchEnd);
    window.removeEventListener('touchcancel', this.handleTouchCancel);

    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);

    this.leftPressed = false;
    this.rightPressed = false;
    this.activeTouches.clear();

    this.targetSteer = 0;
  }

  handleOrientation(event) {
    if (!this.enabled || this.mode !== 'gyro') return;
    if (this.activeTouches.size > 0) return; // Touch override

    const gamma = event.gamma;
    if (gamma === null || gamma === undefined) return;

    // Capture the phone's starting orientation.
    if (!this.calibrated) {
      this.calibrationGamma = gamma;
      this.calibrated = true;
      return;
    }

    const adjustedGamma = gamma - this.calibrationGamma;

    const normalizedTilt = Math.max(
      -1,
      Math.min(
        1,
        adjustedGamma / this.maxTiltAngle
      )
    );

    const sign = Math.sign(normalizedTilt);
    const magnitude = Math.abs(normalizedTilt);
    const curved = Math.pow(magnitude, 1.5);

    this.targetSteer = sign * curved;
  }

  handleTouchStart(event) {
    if (!this.enabled) return;
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      this.activeTouches.set(touch.identifier, touch.clientX);
    }
    this.updateTouchSteering();
  }

  handleTouchMove(event) {
    if (!this.enabled) return;
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      if (this.activeTouches.has(touch.identifier)) {
        this.activeTouches.set(touch.identifier, touch.clientX);
      }
    }
    this.updateTouchSteering();
  }

  handleTouchEnd(event) {
    if (!this.enabled) return;
    for (let i = 0; i < event.changedTouches.length; i++) {
      this.activeTouches.delete(event.changedTouches[i].identifier);
    }
    this.updateTouchSteering();
  }

  handleTouchCancel(event) {
    if (!this.enabled) return;
    for (let i = 0; i < event.changedTouches.length; i++) {
      this.activeTouches.delete(event.changedTouches[i].identifier);
    }
    this.updateTouchSteering();
  }

  updateTouchSteering() {
    if (this.activeTouches.size === 0) {
      if (this.mode === 'touch') {
        this.targetSteer = 0;
      }
      return;
    }

    // Average the touch positions relative to screen center
    const width = window.innerWidth;
    const midX = width / 2;
    let totalSteer = 0;

    for (const clientX of this.activeTouches.values()) {
      if (clientX < midX) {
        totalSteer -= 1;
      } else {
        totalSteer += 1;
      }
    }

    this.targetSteer = Math.max(-1, Math.min(1, totalSteer));
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