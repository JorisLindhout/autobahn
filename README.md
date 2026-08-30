# Autobahn

A retro-style mobile web game where you drive down an infinite German Autobahn, avoiding traffic using your phone's gyroscope.

## Gameplay

- **Tilt to steer**: Use your phone's gyroscope to control the car
- **Avoid traffic**: Dodge other cars on the 3-lane highway
- **Stay on the road**: Don't hit the guardrails
- **Survive as long as possible**: Speed and traffic density increase over time

## Features

- **1980s German Aesthetic**: Sober, overcast mood inspired by vintage German highway cinema, featuring ACES filmic tone mapping and a subtle analog CRT/film grain overlay
- **First-Person 3D Cockpit**: Authentic 3D car interior with animated steering column rotation, subtle suspension lean into turns, and speed-based chassis vibration
- **Realistic Procedural Overcast Sky**: Multi-octave Perlin cloud formations and diffused horizon illumination with zero texture download overhead
- **Dynamic 3D Scenery**: Layered Black Forest evergreen fir trees with randomized scale and color tints, rolling hills, wind turbines, and weathered guardrails
- **Detailed Road Textures**: Procedural asphalt with aggregate micro-stones, textured shoulders, and aged highway lane markings
- **Intelligent 80s Traffic AI**: 3D vehicle models (Golf Mk2, GTI, Taxi, Police) with era-accurate color variants, following distances, lane discipline, and overtaking logic
- **Mobile Gyroscope Controls**: Smooth motion sensor steering with automatic tilt calibration
- **Developer Keyboard Mode**: Keyboard steering support in dev mode for desktop testing
- **Forced Landscape Experience**: Auto-prompts for landscape orientation on mobile devices

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Environment Configuration (Optional)

Copy `.env.example` to `.env` to customize settings:

```bash
cp .env.example .env
```

Available variables:
- `VITE_DEV_CONTROLS=true` - Enables keyboard controls for desktop browser development (`A`/`D` or `ArrowLeft`/`ArrowRight`)

### Development

```bash
npm run dev
```

Open the displayed network URL on your mobile device (or open locally on desktop with dev controls enabled).

### Production Build

```bash
npm run build
npm run preview
```

## Controls

| Device | Input | Action |
|--------|-------|--------|
| **Mobile** | Tilt phone left / right | Steer left / right |
| **Desktop (Dev Mode)** | `ArrowLeft` / `ArrowRight` or `A` / `D` | Steer left / right |

*Note: On mobile, the game calibrates your phone's resting position upon starting — hold it steady at your preferred comfortable angle.*

## Tech Stack

- [Vite](https://vitejs.dev/) - Build tool & dev server
- [Three.js](https://threejs.org/) - 3D rendering engine (WebGL, GLTFLoader, ACES Filmic Tone Mapping)

## Browser Support

- Mobile browsers with WebGL and DeviceOrientation (gyroscope) support
- iOS Safari (iOS 13+ with motion permissions prompt)
- Chrome / Firefox for Android
- Desktop browsers supported for testing when `VITE_DEV_CONTROLS=true`

## License

MIT
