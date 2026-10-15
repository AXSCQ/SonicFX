/**
 * SonicFX — Advanced audio-reactive visual effects for DOM elements.
 *
 * Provides instrument-specific presets, dynamic gradients, overlays,
 * CSS filter effects, and border animations driven by audio energy.
 *
 * @version 1.2.0
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

/** The loudest stem of a SonicMotion frame (keys starting with _ are metadata). */
function loudest(data) {
    let best;
    for (const [k, d] of Object.entries(data)) if (k[0] !== '_' && d && (!best || (d.value ?? 0) > (best.value ?? 0))) best = d;
    return best;
}

/**
 * Valor de una banda, como en SonicMotion: 'bass' → bands.bass.value (o un
 * número suelto, formato viejo); 'bass.punch' → bands.bass.punch.
 */
function bandValue(bands, band) {
    const dot = band.indexOf('.');
    if (dot !== -1) {
        const v = bands[band.slice(0, dot)]?.[band.slice(dot + 1)];
        return typeof v === 'number' ? v : 0;
    }
    const b = bands[band];
    return b !== null && typeof b === 'object' ? (b.value ?? 0) : (b ?? 0);
}

// Estilos en línea que tocan los efectos: se guardan al enlazar y se
// devuelven al desenlazar (antes unbindAll los borraba, aunque el elemento
// ya los tuviera).
const TOUCHED_STYLES = ['willChange', 'transition', 'transform', 'filter', 'boxShadow', 'borderColor', 'borderWidth', 'background'];

/**
 * SonicFX main class — Manages audio-reactive effects on DOM elements
 */
class SonicFXInstance {
    constructor() {
        /** @type {Array<{element: HTMLElement, preset: Function, config: object, last?: number}>} */
        this._bindings = [];
        this._rafId = null;
        this._running = false;
        /** @type {Function|null} - () => { stemName: { value, bands } } */
        this._dataSource = null;
        this._overlay = null;
        /** @type {Map<HTMLElement, object>} - estilos en línea previos a enlazar */
        this._savedStyles = new Map();
        this._warned = false;
    }

    /**
     * Set the audio data source function
     * This should return an object with stem data: { stemName: { value, bands: { bass, mid, treble } } }
     * Compatible with SonicMotion's onFrame callback data
     * Si devuelve null/undefined cuenta como silencio; si lanza, se saltea ese
     * cuadro (el bucle sigue).
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
     *   band: 'bass' | 'mid' | 'treble' o un campo de la banda, como 'bass.punch'.
     *   intensity: solo la usan los presets de instrumento (bassPulse, drumsHit,
     *   vocalsWave, otherFlow); 0 apaga el efecto.
     *   everyFrame: true para un efecto propio que se anima con el tiempo aunque
     *   el valor no cambie (por defecto el efecto solo se aplica si cambió).
     */
    bind(selector, preset, config = {}) {
        let elements = [];
        if (typeof selector === 'string') {
            elements = Array.from(document.querySelectorAll(selector));
        } else if (selector instanceof NodeList || Array.isArray(selector)) {
            elements = Array.from(selector);
        } else if (selector instanceof Element) {   // also SVG elements
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
            if (!this._savedStyles.has(el)) {
                const saved = {};
                for (const prop of TOUCHED_STYLES) saved[prop] = el.style[prop] ?? '';
                this._savedStyles.set(el, saved);
            }
            el.style.willChange = 'transform, opacity, filter, box-shadow, border-color, background';
            el.style.transition = 'transform 0.08s ease-out, filter 0.08s ease-out';

            this._bindings.push({
                element: el,
                preset: effectFn,
                fromDOM: !!config.fromDOM,
                last: undefined,
                config: {
                    ...config,
                    stem: config.stem || 'master',
                    band: config.band || null,
                }
            });
        });

        return this;
    }

    /**
     * Parse DOM for [data-sonicfx] elements
     */
    parseDOM() {
        // re-parsing replaces the previous DOM bindings instead of duplicating them
        const old = this._bindings.filter(b => b.fromDOM);
        this._bindings = this._bindings.filter(b => !b.fromDOM);
        this._restore(old.map(b => b.element));
        const elements = document.querySelectorAll('[data-sonicfx]');
        elements.forEach(el => {
            const preset = el.getAttribute('data-sonicfx');
            const stem = el.getAttribute('data-sonicfx-track') || 'master';
            const band = el.getAttribute('data-sonicfx-band') || null;
            const color = el.getAttribute('data-sonicfx-color') || undefined;
            // 0 es una intensidad válida (apaga el efecto); `|| 1.0` la volvía 1
            const raw = parseFloat(el.getAttribute('data-sonicfx-intensity'));
            const intensity = Number.isFinite(raw) ? raw : 1.0;

            this.bind(el, preset, { stem, band, color, intensity, fromDOM: true });
        });
        return this;
    }

    /**
     * Create and return an overlay controller
     * Una sola capa por instancia: llamarla otra vez reemplaza la anterior
     * (antes quedaba en el DOM).
     */
    createOverlay(config = {}) {
        if (this._overlay) this._overlay.destroy();
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
        // Reset all elements (los que ya están en reposo no se tocan)
        this._bindings.forEach(b => {
            if (b.last !== 0) this._apply(b, 0);
        });
        return this;
    }

    /**
     * Remove all bindings and reset elements
     * Los estilos en línea que el elemento tenía antes de enlazarlo vuelven.
     */
    unbindAll() {
        this._bindings = [];
        this._restore([...this._savedStyles.keys()]);
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

        // El próximo cuadro se pide antes de trabajar: si la fuente de datos o
        // un efecto lanza, el bucle sigue vivo (antes moría sin aviso).
        this._rafId = requestAnimationFrame(() => this._loop());

        let data;
        try {
            data = this._dataSource ? this._dataSource() : null;
        } catch (e) {
            this._warn('la fuente de datos lanzó un error; se saltea el cuadro', e);
            return;
        }
        if (!data || typeof data !== 'object') data = {};   // sin datos = silencio

        for (const binding of this._bindings) {
            let value = 0;

            // 'master' follows the loudest stem when there is no stem called master
            const stemData = data[binding.config.stem] ?? (binding.config.stem === 'master' ? loudest(data) : undefined);
            if (stemData) {
                if (binding.config.band && stemData.bands) {
                    value = bandValue(stemData.bands, binding.config.band);
                } else {
                    value = stemData.value ?? 0;
                }
            }
            if (!Number.isFinite(value)) value = 0;

            // Mismo valor que el último aplicado: no reescribir los estilos (en
            // pausa o en silencio no se toca el DOM ni se repinta).
            if (value === binding.last && !binding.config.everyFrame) continue;
            this._apply(binding, value);
        }
    }

    _apply(binding, value) {
        try {
            binding.preset(binding.element, value, binding.config);
            binding.last = value;
        } catch (e) {
            this._warn('un efecto lanzó un error', e);
        }
    }

    /** Devuelve los estilos guardados de los elementos que ya no tienen vínculos. */
    _restore(elements) {
        const stillBound = new Set(this._bindings.map(b => b.element));
        for (const el of new Set(elements)) {
            const saved = this._savedStyles.get(el);
            if (!saved || stillBound.has(el)) continue;
            for (const prop of TOUCHED_STYLES) el.style[prop] = saved[prop];
            this._savedStyles.delete(el);
        }
    }

    // un solo aviso por instancia: a 60 cuadros por segundo llenaría la consola
    _warn(msg, e) {
        if (this._warned) return;
        this._warned = true;
        console.warn(`SonicFX: ${msg}`, e);
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
    version: '1.2.0'
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
