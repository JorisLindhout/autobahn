import * as THREE from 'three';
import { Game } from './game.js';

const canvas = document.getElementById('game-canvas');
const titleScreen = document.getElementById('title-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const permissionPrompt = document.getElementById('permission-prompt');
const noGyroScreen = document.getElementById('no-gyro-screen');
const desktopScreen = document.getElementById('desktop-screen');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const permissionButton = document.getElementById('permission-button');

const noGyroTitle = document.getElementById('no-gyro-title');
const noGyroDesc = document.getElementById('no-gyro-desc');
const noGyroHint = document.getElementById('no-gyro-hint');
const noGyroTouchButton = document.getElementById('no-gyro-touch-button');
const noGyroRetryButton = document.getElementById('no-gyro-retry-button');

const renderer = new THREE.WebGLRenderer({ 
  canvas, 
  antialias: true,
  powerPreference: 'high-performance'
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x9faab4);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const game = new Game(renderer);
window.game = game;

let hasGyroscope = false;
let gyroChecked = false;
let gyroFailureReason = null; // 'insecure_context' | 'no_sensor' | 'permission_denied' | 'timeout'
let activeControlMode = 'gyro';

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

function isSecureConnection() {
  return window.isSecureContext ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';
}

function hideAllScreens() {
  titleScreen.classList.add('hidden');
  gameOverScreen.classList.add('hidden');
  permissionPrompt.classList.add('hidden');
  noGyroScreen.classList.add('hidden');
  desktopScreen.classList.add('hidden');
}

function showDesktopScreen() {
  hideAllScreens();
  desktopScreen.classList.remove('hidden');
}

function showTitleScreen() {
  hideAllScreens();
  titleScreen.classList.remove('hidden');
}

function showGameOver() {
  hideAllScreens();
  gameOverScreen.classList.remove('hidden');
}

function showPermissionPrompt() {
  hideAllScreens();
  permissionPrompt.classList.remove('hidden');
}

function showNoGyroScreen() {
  hideAllScreens();
  if (gyroFailureReason === 'insecure_context') {
    if (noGyroTitle) noGyroTitle.textContent = 'HTTPS REQUIRED';
    if (noGyroDesc) noGyroDesc.textContent = 'Mobile browsers block gyroscope on insecure HTTP.';
    if (noGyroHint) noGyroHint.textContent = 'Open via HTTPS (e.g. Cloudflare tunnel) or play using touch controls:';
  } else if (gyroFailureReason === 'permission_denied') {
    if (noGyroTitle) noGyroTitle.textContent = 'PERMISSION NEEDED';
    if (noGyroDesc) noGyroDesc.textContent = 'Motion sensor permission was not granted.';
    if (noGyroHint) noGyroHint.textContent = 'Enable motion permissions in browser settings or play with touch:';
  } else {
    if (noGyroTitle) noGyroTitle.textContent = 'NO GYROSCOPE';
    if (noGyroDesc) noGyroDesc.textContent = "Could not detect active motion sensors on this device.";
    if (noGyroHint) noGyroHint.textContent = 'You can retry or play using touch controls (tap left/right to steer):';
  }
  noGyroScreen.classList.remove('hidden');
}

async function checkGyroscope() {
  if (!isSecureConnection()) {
    gyroFailureReason = 'insecure_context';
    return false;
  }

  if (typeof DeviceOrientationEvent === 'undefined' && typeof DeviceMotionEvent === 'undefined') {
    gyroFailureReason = 'no_sensor';
    return false;
  }

  return new Promise((resolve) => {
    let resolved = false;

    const cleanup = () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      window.removeEventListener('deviceorientationabsolute', handleOrientation);
      window.removeEventListener('devicemotion', handleMotion);
    };

    const done = (result, reason = null) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeout);
      cleanup();
      gyroFailureReason = reason;
      resolve(result);
    };

    const handleOrientation = (e) => {
      if ((e.gamma !== null && e.gamma !== undefined) || 
          (e.beta !== null && e.beta !== undefined)) {
        done(true);
      }
    };

    const handleMotion = (e) => {
      if (e.acceleration || e.accelerationIncludingGravity || e.rotationRate) {
        done(true);
      }
    };

    // 2500ms timeout to allow stationary sensors to emit or hardware to warm up
    const timeout = setTimeout(() => {
      // In a secure mobile browser where DeviceOrientationEvent is defined,
      // stationary devices might not emit an event until moved.
      if (typeof DeviceOrientationEvent !== 'undefined') {
        done(true);
      } else {
        done(false, 'timeout');
      }
    }, 2500);

    window.addEventListener('deviceorientation', handleOrientation);
    window.addEventListener('deviceorientationabsolute', handleOrientation);
    window.addEventListener('devicemotion', handleMotion);
  });
}

async function requestMotionPermission() {
  if (typeof DeviceOrientationEvent !== 'undefined' && 
      typeof DeviceOrientationEvent.requestPermission === 'function') {
    try {
      const permission = await DeviceOrientationEvent.requestPermission();
      if (permission === 'granted') {
        hasGyroscope = true;
        gyroChecked = true;
        return true;
      }
      gyroFailureReason = 'permission_denied';
      return false;
    } catch (e) {
      console.warn('Motion permission denied:', e);
      gyroFailureReason = 'permission_denied';
      return false;
    }
  }
  return true;
}

function startWithMode(mode) {
  activeControlMode = mode;
  hideAllScreens();
  game.start(mode);
}

async function startGame() {
  // Desktop in dev mode uses keyboard controls for development/testing.
  if (!isMobileDevice()) {
    if (isDevMode()) {
      startWithMode('keyboard');
      return;
    }
    showDesktopScreen();
    return;
  }

  // Check secure context for mobile devices
  if (!isSecureConnection()) {
    gyroFailureReason = 'insecure_context';
    showNoGyroScreen();
    return;
  }

  // Mobile uses gyroscope controls.
  const hasPermission = await requestMotionPermission();

  if (!hasPermission) {
    if (gyroFailureReason === 'permission_denied') {
      showPermissionPrompt();
    } else {
      showNoGyroScreen();
    }
    return;
  }

  if (!gyroChecked) {
    hasGyroscope = await checkGyroscope();
    gyroChecked = true;
  }

  if (!hasGyroscope) {
    showNoGyroScreen();
    return;
  }

  startWithMode('gyro');
}

game.onGameOver = () => {
  showGameOver();
};

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', () => {
  hideAllScreens();
  game.start(activeControlMode);
});

permissionButton.addEventListener('click', async () => {
  const granted = await requestMotionPermission();
  if (granted) {
    hasGyroscope = await checkGyroscope();
    gyroChecked = true;
    
    if (!hasGyroscope) {
      showNoGyroScreen();
    } else {
      startWithMode('gyro');
    }
  }
});

if (noGyroTouchButton) {
  noGyroTouchButton.addEventListener('click', () => {
    startWithMode('touch');
  });
}

if (noGyroRetryButton) {
  noGyroRetryButton.addEventListener('click', async () => {
    gyroChecked = false;
    await startGame();
  });
}

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  game.handleResize(window.innerWidth, window.innerHeight);
});

if (screen.orientation && screen.orientation.lock) {
  screen.orientation.lock('landscape').catch(() => {
  });
}

if (!isMobileDevice() && !isDevMode()) {
  showDesktopScreen();
} else {
  showTitleScreen();
}
game.renderTitle();
