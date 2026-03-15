/**
 * SonicFX — Advanced audio-reactive visual effects for DOM elements.
 * 
 * Provides instrument-specific presets, dynamic gradients, overlays,
 * CSS filter effects, and border animations driven by audio energy.
 * 
 * @version 1.0.0
 */

// Instrument presets
import { PRESETS, registerPreset, bassPulse, drumsHit, vocalsWave, otherFlow } from './presets/instrument-presets.js';

// Individual effect modules
import { GRADIENT_EFFECTS, dynamicGradient, radialPulse, multiLayerGradient } from './effects/gradient-effect.js';
import { OverlayController } from './effects/overlay-effect.js';
import { FILTER_EFFECTS, brightnessReactive, hueShift, contrastPop, filterChain } from './effects/filter-effect.js';
import { BORDER_EFFECTS, borderPulse, borderGlow, borderRainbow } from './effects/border-effect.js';

// Utilities
import { parseColor, rgba, lerpColor, lighten } from './utils/color-utils.js';

/**
 * SonicFX main class — Manages audio-reactive effects on DOM elements
 */
class SonicFXInstance {
    constructor() {
        /** @type {Array<{element: HTMLElement, preset: Function, config: object}>} */
        this._bindings = [];
        this._rafId = null;
        this._running = false;
        /** @type {Function|null} - () => { stemName: { value, bands } } */
        this._dataSource = null;
        this._overlay = null;
    }

    /**
     * Set the audio data source function
     * This should return an object with stem data: { stemName: { value, bands: { bass, mid, treble } } }
     * Compatible with SonicMotion's onFrame callback data
     */
    setDataSource(fn) {
        this._dataSource = fn;
        return this;
    }

    /**
     * Bind an element to a preset effect
     * @param {string|HTMLElement|NodeList} selector - CSS selector or element(s)
     * @param {string|Function} preset - Preset name or custom function
     * @param {object} config - { stem, band, color, intensity, ... }
     */
    bind(selector, preset, config = {}) {
        let elements = [];
        if (typeof selector === 'string') {
            elements = Array.from(document.querySelectorAll(selector));
        } else if (selector instanceof NodeList || Array.isArray(selector)) {
            elements = Array.from(selector);
        } else if (selector instanceof HTMLElement) {
            elements = [selector];
        }

        const effectFn = typeof preset === 'function'
            ? preset
            : PRESETS[preset] || GRADIENT_EFFECTS[preset] || FILTER_EFFECTS[preset] || BORDER_EFFECTS[preset];

        if (!effectFn) {
            console.warn(`SonicFX: Unknown preset "${preset}"`);
            return this;
        }

        elements.forEach(el => {
            el.style.willChange = 'transform, opacity, filter, box-shadow, border-color, background';
            el.style.transition = 'transform 0.08s ease-out, filter 0.08s ease-out';

            this._bindings.push({
                element: el,
                preset: effectFn,
                config: {
                    stem: config.stem || 'master',
                    band: config.band || null,
                    ...config
                }
            });
        });

        return this;
    }

    /**
     * Parse DOM for [data-sonicfx] elements
     */
    parseDOM() {
        const elements = document.querySelectorAll('[data-sonicfx]');
        elements.forEach(el => {
            const preset = el.getAttribute('data-sonicfx');
            const stem = el.getAttribute('data-sonicfx-track') || 'master';
            const band = el.getAttribute('data-sonicfx-band') || null;
            const color = el.getAttribute('data-sonicfx-color') || undefined;
            const intensity = parseFloat(el.getAttribute('data-sonicfx-intensity')) || 1.0;

            this.bind(el, preset, { stem, band, color, intensity });
        });
        return this;
    }

    /**
     * Create and return an overlay controller
     */
    createOverlay(config = {}) {
        this._overlay = new OverlayController(config);
        this._overlay.mount();
        return this._overlay;
    }

    /**
     * Start the animation loop
     */
    start() {
        if (this._running) return this;
        this._running = true;
        this._loop();
        return this;
    }

    /**
     * Stop the animation loop
     */
    stop() {
        this._running = false;
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }
        // Reset all elements
        this._bindings.forEach(b => {
            b.preset(b.element, 0, b.config);
        });
        return this;
    }

    /**
     * Remove all bindings and reset elements
     */
    unbindAll() {
        this._bindings.forEach(b => {
            b.element.style.willChange = '';
            b.element.style.transition = '';
            b.element.style.transform = '';
            b.element.style.filter = '';
            b.element.style.boxShadow = '';
            b.element.style.borderColor = '';
            b.element.style.borderWidth = '';
            b.element.style.background = '';
        });
        this._bindings = [];
        return this;
    }

    /**
     * Clean up all resources
     */
    destroy() {
        this.stop();
        this.unbindAll();
        if (this._overlay) {
            this._overlay.destroy();
            this._overlay = null;
        }
    }

    // --- Internal animation loop ---

    _loop() {
        if (!this._running) return;

        const data = this._dataSource ? this._dataSource() : {};

        for (const binding of this._bindings) {
            let value = 0;

            const stemData = data[binding.config.stem];
            if (stemData) {
                if (binding.config.band && stemData.bands) {
                    const bandObj = stemData.bands[binding.config.band];
                    value = typeof bandObj === 'object' ? (bandObj.value ?? 0) : (bandObj ?? 0);
                } else {
                    value = stemData.value ?? 0;
                }
            }

            binding.preset(binding.element, value, binding.config);
        }

        this._rafId = requestAnimationFrame(() => this._loop());
    }
}

// ---- Static Factory ----
const SonicFX = {
    create() {
        return new SonicFXInstance();
    },
    // Expose preset functions for standalone use
    presets: PRESETS,
    gradients: GRADIENT_EFFECTS,
    filters: FILTER_EFFECTS,
    borders: BORDER_EFFECTS,
    OverlayController,
    registerPreset,
    // Color utilities
    parseColor,
    rgba,
    lerpColor,
    lighten,
    version: '1.0.0'
};

export default SonicFX;
export {
    SonicFXInstance,
    SonicFX,
    OverlayController,
    // Presets
    bassPulse, drumsHit, vocalsWave, otherFlow,
    PRESETS, registerPreset,
    // Effects
    dynamicGradient, radialPulse, multiLayerGradient,
    brightnessReactive, hueShift, contrastPop, filterChain,
    borderPulse, borderGlow, borderRainbow,
    // Utils
    parseColor, rgba, lerpColor, lighten
};
