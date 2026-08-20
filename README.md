# Autobahn

An Outrun-style mobile web game where you drive down an infinite German Autobahn, avoiding traffic using your phone's gyroscope.

## Gameplay

- **Tilt to steer**: Use your phone's gyroscope to control the car
- **Avoid traffic**: Dodge other cars on the 3-lane highway
- **Stay on the road**: Don't hit the barriers
- **Survive as long as possible**: Speed and traffic increase over time

## Features

- First-person view with animated dashboard and steering wheel
- Gyroscope controls with touch fallback for devices without motion sensors
- 80s arcade aesthetic with sunset sky, neon colors, and retro sun
- German Autobahn scenery: poplar trees, rolling hills, wind turbines
- Increasing difficulty over time
- Forced landscape mode

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open the displayed URL on your mobile device (or use browser devtools mobile simulation).

### Production Build

```bash
npm run build
npm run preview
```

## Controls

| Input | Action |
|-------|--------|
| Tilt phone left/right | Steer |
| Touch left/right side of screen | Steer (fallback) |

## Tech Stack

- [Vite](https://vitejs.dev/) - Build tool
- [Three.js](https://threejs.org/) - 3D rendering

## Browser Support

- Mobile browsers with WebGL support
- Best experience on devices with gyroscope
- Touch fallback available for desktop/devices without motion sensors

## License

MIT
