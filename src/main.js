import * as THREE from 'three';
import { Game } from './game.js';

const canvas = document.getElementById('game-canvas');
const titleScreen = document.getElementById('title-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const permissionPrompt = document.getElementById('permission-prompt');
const noGyroScreen = document.getElementById('no-gyro-screen');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const permissionButton = document.getElementById('permission-button');
const noGyroStartButton = document.getElementById('no-gyro-start');

const renderer = new THREE.WebGLRenderer({ 
  canvas, 
  antialias: false,
  powerPreference: 'high-performance'
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x1a0a2e);

const game = new Game(renderer);

let hasGyroscope = false;
let gyroChecked = false;
let useTouchControls = false;

function hideAllScreens() {
  titleScreen.classList.add('hidden');
  gameOverScreen.classList.add('hidden');
  permissionPrompt.classList.add('hidden');
  noGyroScreen.classList.add('hidden');
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
  noGyroScreen.classList.remove('hidden');
}

async function checkGyroscope() {
  return new Promise((resolve) => {
    if (typeof DeviceOrientationEvent === 'undefined') {
      resolve(false);
      return;
    }
    
    let timeout = setTimeout(() => {
      resolve(false);
    }, 1000);
    
    const handler = (e) => {
      if (e.gamma !== null && e.beta !== null) {
        clearTimeout(timeout);
        window.removeEventListener('deviceorientation', handler);
        resolve(true);
      }
    };
    
    window.addEventListener('deviceorientation', handler);
  });
}

async function requestMotionPermission() {
  if (typeof DeviceOrientationEvent !== 'undefined' && 
      typeof DeviceOrientationEvent.requestPermission === 'function') {
    try {
      const permission = await DeviceOrientationEvent.requestPermission();
      return permission === 'granted';
    } catch (e) {
      console.warn('Motion permission denied:', e);
      return false;
    }
  }
  return true;
}

async function startGame() {
  const hasPermission = await requestMotionPermission();
  
  if (!hasPermission) {
    showPermissionPrompt();
    return;
  }
  
  if (!gyroChecked) {
    hasGyroscope = await checkGyroscope();
    gyroChecked = true;
  }
  
  if (!hasGyroscope && !useTouchControls) {
    showNoGyroScreen();
    return;
  }
  
  hideAllScreens();
  game.start(useTouchControls);
}

game.onGameOver = () => {
  showGameOver();
};

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', () => {
  game.start(useTouchControls);
  hideAllScreens();
});

permissionButton.addEventListener('click', async () => {
  const granted = await requestMotionPermission();
  if (granted) {
    hasGyroscope = await checkGyroscope();
    gyroChecked = true;
    
    if (!hasGyroscope) {
      showNoGyroScreen();
    } else {
      hideAllScreens();
      game.start(false);
    }
  }
});

noGyroStartButton.addEventListener('click', () => {
  useTouchControls = true;
  hideAllScreens();
  game.start(true);
});

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  game.handleResize(window.innerWidth, window.innerHeight);
});

if (screen.orientation && screen.orientation.lock) {
  screen.orientation.lock('landscape').catch(() => {
  });
}

showTitleScreen();
game.renderTitle();
