# Autobahn

A retro-style mobile web game where you drive down an infinite German Autobahn, avoiding traffic using your phone's gyroscope.

## Gameplay

- **Tilt to steer**: Use your phone's gyroscope to control the car
- **Avoid traffic**: Dodge other cars on the 3-lane highway
- **Stay on the road**: Don't hit the guardrails
- **Survive as long as possible**: Speed and traffic increase over time

## Features

- First-person view with animated dashboard and steering wheel
- Gyroscope controls with automatic calibration
- 80s car interior aesthetic with RPM and speedometer gauges
- German Autobahn scenery: poplar trees, rolling green hills, wind turbines
- Blue sky with white clouds
- Traffic cars with 80s/90s styling and colors
- Increasing difficulty over time
- Mobile-only (requires gyroscope)
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

Open the displayed URL on your mobile device.

### Production Build

```bash
npm run build
npm run preview
```

## Controls

| Input | Action |
|-------|--------|
| Tilt phone forward/back | Steer left/right |

The game calibrates your phone's position when you start - hold it steady at your preferred angle.

## Tech Stack

- [Vite](https://vitejs.dev/) - Build tool
- [Three.js](https://threejs.org/) - 3D rendering

## Browser Support

- Mobile browsers with WebGL and gyroscope support
- iOS Safari, Chrome for Android recommended
- Desktop browsers will show "Mobile Only" message

## License

MIT
