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
let frame = {};
sonic.onFrame((data) => { frame = data; });
fx.setDataSource(() => frame);

fx.parseDOM();
fx.start();
```

### Option 2: JavaScript API

```javascript
import SonicFX from 'sonicfx';

const fx = SonicFX.create();

fx.setDataSource(() => currentFrameData);

// Bind elements to presets
fx.bind('#kick-element', 'drumsHit', { stem: 'drums', band: 'bass.punch' });
fx.bind('#bass-element', 'bassPulse', { stem: 'bass', color: '#7928ca' });
fx.bind('#vocals-element', 'vocalsWave', { stem: 'vocals', intensity: 1.5 });
fx.bind('#title', 'borderGlow', { stem: 'vocals', color: 'hsl(300 100% 50%)', radius: 24 });

fx.start();
```

`intensity` only scales the four **instrument presets** (`bassPulse`, `drumsHit`, `vocalsWave`, `otherFlow`); `0` turns them off. The gradient, filter and border effects ignore it: tune them with their own options (`radius`, `brightness`, `maxHue`, `maxWidth`…).

`band` picks a band of the stem: `'bass'`, `'mid'`, `'treble'` (its `value`) or a field of the band such as `'bass.punch'`, like SonicMotion. Colors: hex (`#RGB`, `#RGBA`, `#RRGGBB`, `#RRGGBBAA`), `rgb()`/`rgba()` with commas or spaces, `hsl()`/`hsla()` and, in the browser, any CSS color name. The color's own alpha is ignored (each effect sets its own).

The loop only rewrites an element's styles when its value changed (nothing is written while paused or silent). A custom effect that animates with time alone can ask for every frame: `fx.bind(el, myEffect, { everyFrame: true })`. If the data source throws, that frame is skipped and the loop keeps running.

---

## 🎭 Available Presets & Effects

### Instrument Presets (via `data-sonicfx` or JS)
| Preset | Description |
|---|---|
| `bassPulse` | Scale pulse with a triple purple glow (`box-shadow`, outer + inset); no gradient |
| `drumsHit` | Scale with a fast jitter, red inset glow and a border that thickens on hits |
| `vocalsWave` | Horizontal gradient wave sweeping across the element, blue glow and slight scale |
| `otherFlow` | Vertical gradient flow, slight rotation, green glow and a brightness/saturation filter |

These four read `color` and `intensity` (default `1`).

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
| `borderRainbow` | Border cycling through `colors` while there is energy; back to rest in silence |

---

## 📐 HTML Attributes

| Attribute | Values | Description |
|---|---|---|
| `data-sonicfx` | any preset name | Effect to apply |
| `data-sonicfx-track` | stem name | Audio stem to read energy from |
| `data-sonicfx-band` | `bass`, `mid`, `treble`, `bass.punch`… | Frequency band (or band field) to isolate |
| `data-sonicfx-color` | CSS color string | Base color for the effect |
| `data-sonicfx-intensity` | `0.0` – `2.0` | Instrument presets only: multiplies the energy (`0` turns the effect off). Other effects ignore it |

---

## 🔌 JavaScript API

```javascript
const fx = SonicFX.create();

fx.setDataSource(fn)   // Set frame data source function
fx.bind(selector, preset, config)  // Bind element to effect
fx.parseDOM()          // Auto-parse [data-sonicfx] elements
fx.createOverlay(config)  // Create full-screen overlay (one per instance: a second call replaces it)
fx.start()             // Start animation loop
fx.stop()              // Stop and reset all elements
fx.unbindAll()         // Remove all bindings, restoring the inline styles the elements had before
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

## Cambios v1.2.0

- **Bucle**: solo reescribe los estilos de un elemento si su valor cambió (en pausa o en silencio ya no toca el DOM en cada cuadro); `everyFrame: true` para un efecto propio que se anima con el tiempo. Si la fuente de datos (o un efecto) lanza, se saltea ese cuadro con un solo aviso y el bucle sigue (antes moría sin aviso). Una fuente que devuelve `null`/`undefined` cuenta como silencio.
- **Colores**: `#RGBA` y `#RRGGBBAA` (antes `#RGBA` daba `rgba(…, NaN, …)`), `rgb(10 20 30)` y `rgb(10 20 30 / 50%)`, canales en porcentaje, `hsl()`/`hsla()` y, en el navegador, nombres de color (con un canvas 2D, una vez por color: caché). Un color ilegible avisa en la consola y usa el índigo por defecto (antes caía sin aviso).
- **`data-sonicfx-intensity="0"`** es intensidad 0 (antes `|| 1.0` la volvía 1).
- **Bandas** con campo, como SonicMotion: `band: 'bass.punch'`.
- **`createOverlay()`** dos veces reemplaza la capa anterior (antes quedaba en el DOM); una capa destruida no vuelve a montarse sola con `fadeIn`/`setIntensity`.
- **`unbindAll()`/`destroy()`** devuelven los estilos en línea que el elemento tenía antes de enlazarlo (antes los borraba); `parseDOM()` hace lo mismo con los elementos que ya no lo tienen.
- README: `intensity` solo la usan los cuatro presets de instrumento; descripciones de los presets corregidas (`bassPulse` no tiene degradado).

## Cambios v1.1.0

- **Overlay**: ya no bloquea los clics de la página mientras está visible (antes `setIntensity` ponía `pointer-events: auto` durante toda la canción). Para que capture clics: `new OverlayController({ blocking: true })`.
- **`borderRainbow`**: el color pasa suavemente de uno al siguiente y, en silencio, el borde vuelve a reposo (antes quedaba congelado en el último color y ancho).
- **`bind`** acepta elementos SVG; **`parseDOM`** reemplaza los vínculos anteriores en vez de duplicarlos.
- `stem: 'master'` (el valor por defecto) sigue al stem más fuerte del cuadro.
- Pruebas: `npm test` (node:test).
