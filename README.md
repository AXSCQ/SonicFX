# 🎨 SonicFX
**Audio-Reactive Visual Effects Library for DOM Elements**

![npm bundle size](https://img.shields.io/bundlephobia/minzip/sonicfx)
![npm version](https://img.shields.io/npm/v/sonicfx)
![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)

**SonicFX** is a JavaScript frontend library that applies advanced **audio-reactive CSS visual effects** to DOM elements: dynamic gradients, CSS filters, glowing borders, and overlay animations — all driven by real-time audio energy analysis.

Designed to work seamlessly with [SonicMotion](https://www.npmjs.com/package/sonicmotion), or any audio data source that provides `{ stemName: { value, bands } }` per frame.

---

## ✨ Features

- 🎨 **Instrument Presets**: Ready-made presets for bass, drums, vocals, and "other" stems — no configuration needed.
- 🌈 **Dynamic Gradients**: Radial pulses, multi-layer gradients and color shifts driven by audio energy.
- 🔦 **CSS Filter Effects**: `brightness`, `hue-rotate`, `contrast` and filter chains that react to sound frequency.
- 💡 **Border Animations**: Glowing, pulsing and rainbow borders synced to the beat.
- 🖥️ **Overlay Controller**: Full-screen audio-reactive overlay layers on demand.
- 🧩 **Declarative HTML API**: Add `data-sonicfx` attributes and call `parseDOM()` — zero JS config required.

---

## 💻 Installation

```bash
npm install sonicfx
```

```javascript
import SonicFX from 'sonicfx';
```

---

## 🚀 Quick Start

### Option 1: Declarative HTML (Easiest)

```html
<!-- Reacts to bass energy with a dynamic gradient -->
<div data-sonicfx="bassPulse" data-sonicfx-track="bass">
  Bass Section
</div>

<!-- Glow border driven by vocals -->
<h1 data-sonicfx="borderGlow" data-sonicfx-track="vocals" data-sonicfx-color="#ff00ff">
  Vocals Title
</h1>
```

```javascript
import SonicFX from 'sonicfx';

const fx = SonicFX.create();

// Connect to SonicMotion (or any frame data source)
sonic.onFrame((data) => {
    fx.setDataSource(() => data);
});

fx.parseDOM();
fx.start();
```

### Option 2: JavaScript API

```javascript
import SonicFX from 'sonicfx';

const fx = SonicFX.create();

fx.setDataSource(() => currentFrameData);

// Bind elements to presets
fx.bind('#kick-element', 'drumsHit', { stem: 'kick', band: 'bass' });
fx.bind('#bass-element', 'bassPulse', { stem: 'bass', color: '#7928ca' });
fx.bind('#vocals-element', 'borderGlow', { stem: 'vocals', intensity: 1.5 });

fx.start();
```

---

## 🎭 Available Presets & Effects

### Instrument Presets (via `data-sonicfx` or JS)
| Preset | Description |
|---|---|
| `bassPulse` | Deep pulsing gradient for bass/low-end stems |
| `drumsHit` | Sharp flash effect for percussion hits |
| `vocalsWave` | Smooth color wave for vocal stems |
| `otherFlow` | Fluid color flow for melodic instruments |

### Gradient Effects
| Effect | Description |
|---|---|
| `dynamicGradient` | Color gradient that shifts with audio value |
| `radialPulse` | Radial glow expanding from center |
| `multiLayerGradient` | Complex multi-stop gradient animation |

### CSS Filter Effects
| Effect | Description |
|---|---|
| `brightnessReactive` | Brightness that increases with energy |
| `hueShift` | Rotates the hue of the element |
| `contrastPop` | Contrast burst on audio peaks |
| `filterChain` | Apply multiple filters simultaneously |

### Border Effects
| Effect | Description |
|---|---|
| `borderPulse` | Border width/opacity pulsed by audio |
| `borderGlow` | Glowing box-shadow synced to energy |
| `borderRainbow` | Rainbow hue-cycling border |

---

## 📐 HTML Attributes

| Attribute | Values | Description |
|---|---|---|
| `data-sonicfx` | any preset name | Effect to apply |
| `data-sonicfx-track` | stem name | Audio stem to read energy from |
| `data-sonicfx-band` | `bass`, `mid`, `treble` | Frequency band to isolate |
| `data-sonicfx-color` | CSS color string | Base color for the effect |
| `data-sonicfx-intensity` | `0.0` – `2.0` | Multiplies the effect magnitude |

---

## 🔌 JavaScript API

```javascript
const fx = SonicFX.create();

fx.setDataSource(fn)   // Set frame data source function
fx.bind(selector, preset, config)  // Bind element to effect
fx.parseDOM()          // Auto-parse [data-sonicfx] elements
fx.createOverlay(config)  // Create full-screen overlay
fx.start()             // Start animation loop
fx.stop()              // Stop and reset all elements
fx.unbindAll()         // Remove all bindings
fx.destroy()           // Clean up all resources
```

---

## 🎵 Works Best With

- **[sonicmotion](https://www.npmjs.com/package/sonicmotion)** — Audio stem analysis and DOM animation engine
- **[sonicscroll](https://www.npmjs.com/package/sonicscroll)** — Scroll-triggered animations with audio-aware mode
- **[sonicwave](https://www.npmjs.com/package/sonicwave)** — Canvas waveform and spectrum visualizations

---

## 📄 License

MIT © 2025 axscq

## Cambios v1.1.0

- **Overlay**: ya no bloquea los clics de la página mientras está visible (antes `setIntensity` ponía `pointer-events: auto` durante toda la canción). Para que capture clics: `new OverlayController({ blocking: true })`.
- **`borderRainbow`**: el color pasa suavemente de uno al siguiente y, en silencio, el borde vuelve a reposo (antes quedaba congelado en el último color y ancho).
- **`bind`** acepta elementos SVG; **`parseDOM`** reemplaza los vínculos anteriores en vez de duplicarlos.
- `stem: 'master'` (el valor por defecto) sigue al stem más fuerte del cuadro.
- Pruebas: `npm test` (node:test).
