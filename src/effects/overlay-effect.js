/**
 * Overlay Effect — Full-screen overlay for fade-to-black transitions.
 * Extracted from AstroPrueba AudioVisualizer fadeToBlack/fadeFromBlack.
 */

export class OverlayController {
    /**
     * @param {object} config
     * @param {string} [config.color='#000000'] - Overlay background color
     * @param {number} [config.maxOpacity=0.7] - Maximum opacity
     * @param {number} [config.duration=500] - Transition duration in ms
     * @param {number} [config.zIndex=40] - CSS z-index
     * @param {boolean} [config.blocking=false] - Catch clicks while visible
     */
    constructor(config = {}) {
        this._color = config.color || '#000000';
        this._maxOpacity = config.maxOpacity ?? 0.7;
        this._duration = config.duration ?? 500;
        this._zIndex = config.zIndex ?? 40;
        this._blocking = config.blocking ?? false;
        this._element = null;
        this._visible = false;
    }

    /**
     * Create and inject the overlay element into the DOM
     * @param {HTMLElement} [container=document.body]
     */
    mount(container) {
        if (this._element) return this;

        this._element = document.createElement('div');
        this._element.style.cssText = `
            position: fixed;
            inset: 0;
            background: ${this._color};
            opacity: 0;
            z-index: ${this._zIndex};
            pointer-events: none;
            transition: opacity ${this._duration}ms ease-in-out;
        `;
        this._element.setAttribute('data-sonicfx-overlay', 'true');

        (container || document.body).appendChild(this._element);
        return this;
    }

    /**
     * Fade to overlay (darken). The overlay does not take pointer events: it
     * is decoration, and with pointer-events:auto it blocked every click on
     * the page while visible (e.g. the whole song with setIntensity).
     * Pass { blocking: true } to the constructor to make it catch clicks.
     */
    fadeIn() {
        if (!this._element) this.mount();
        this._element.style.opacity = String(this._maxOpacity);
        this._element.style.pointerEvents = this._blocking ? 'auto' : 'none';
        this._visible = true;
        return this;
    }

    /**
     * Fade out overlay (clear)
     */
    fadeOut() {
        if (!this._element) return this;
        this._element.style.opacity = '0';
        this._element.style.pointerEvents = 'none';
        this._visible = false;
        return this;
    }

    /**
     * Set overlay opacity reactively based on audio value
     * @param {number} value - 0-1 audio intensity
     * @param {number} [maxOpacity] - Override max opacity
     */
    setIntensity(value, maxOpacity) {
        if (!this._element) this.mount();
        const max = maxOpacity ?? this._maxOpacity;
        this._element.style.opacity = String(value * max);
        this._element.style.pointerEvents = this._blocking && value > 0.01 ? 'auto' : 'none';
        this._visible = value > 0.01;
        return this;
    }

    get isVisible() { return this._visible; }

    /**
     * Remove overlay from DOM
     */
    destroy() {
        if (this._element && this._element.parentNode) {
            this._element.parentNode.removeChild(this._element);
        }
        this._element = null;
    }
}
