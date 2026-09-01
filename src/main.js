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
const noGyroRetryButton = document.getElementById('no-gyro-retry-button');
const noGyroDesc = document.getElementById('no-gyro-desc');

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
let gyroFailureReason = null;

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
  if (noGyroDesc) {
    if (gyroFailureReason === 'insecure_context') {
      noGyroDesc.textContent = 'HTTPS required: mobile browsers disable motion sensors on HTTP.';
    } else if (gyroFailureReason === 'permission_denied') {
      noGyroDesc.textContent = 'Motion sensor permission was denied.';
    } else {
      noGyroDesc.textContent = "Your device doesn't have active motion sensors.";
    }
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

    const timeout = setTimeout(() => {
      if (typeof DeviceOrientationEvent !== 'undefined') {
        done(true);
      } else {
        done(false, 'timeout');
      }
    }, 2000);

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

async function startGame() {
  // Desktop in dev mode uses keyboard controls for development/testing.
  if (!isMobileDevice()) {
    if (isDevMode()) {
      if (!game.isReady) {
        startButton.textContent = 'Laden';
        startButton.style.pointerEvents = 'none';
        await game.whenReady();
        startButton.textContent = 'START';
        startButton.style.pointerEvents = '';
      }
      hideAllScreens();
      game.start();
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

  if (!game.isReady) {
    startButton.textContent = 'Laden';
    startButton.style.pointerEvents = 'none';
    await game.whenReady();
    startButton.textContent = 'START';
    startButton.style.pointerEvents = '';
  }

  hideAllScreens();
  game.start();
}

game.onGameOver = () => {
  showGameOver();
};

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', async () => {
  if (!game.isReady) {
    await game.whenReady();
  }
  hideAllScreens();
  game.start();
});

permissionButton.addEventListener('click', async () => {
  const granted = await requestMotionPermission();
  if (granted) {
    hasGyroscope = await checkGyroscope();
    gyroChecked = true;
    
    if (!hasGyroscope) {
      showNoGyroScreen();
    } else {
      if (!game.isReady) {
        await game.whenReady();
      }
      hideAllScreens();
      game.start();
    }
  }
});

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
