/**
 * Border Effects — Dynamic border properties that react to audio.
 * Extracted from AstroPrueba MultiTrackAudioVisualizer border effects.
 */
import { rgba } from '../utils/color-utils.js';

/**
 * Dynamic border width that pulses with audio
 * @param {HTMLElement} element
 * @param {number} value - 0-1 audio intensity
 * @param {object} config
 * @param {number} [config.minWidth=1] - Minimum border width in px
 * @param {number} [config.maxWidth=8] - Maximum border width in px
 * @param {string} [config.color] - Border color (optional)
 */
export function borderPulse(element, value, config = {}) {
    const minW = config.minWidth ?? 1;
    const maxW = config.maxWidth ?? 8;
    const width = minW + value * (maxW - minW);
    element.style.borderWidth = `${width}px`;

    if (config.color) {
        const opacity = 0.5 + value * 0.5;
        element.style.borderColor = rgba(config.color, opacity);
    }
}

/**
 * Border glow — border color + box-shadow glow 
 * @param {HTMLElement} element
 * @param {number} value - 0-1 audio intensity
 * @param {object} config
 * @param {string} [config.color='#8B5CF6'] - Glow color
 * @param {number} [config.radius=60] - Max glow radius
 */
export function borderGlow(element, value, config = {}) {
    const color = config.color || '#8B5CF6';
    const radius = config.radius ?? 60;
    const opacity = 0.4 + value * 0.6;

    element.style.borderColor = rgba(color, opacity);
    element.style.boxShadow = `0 0 ${value * radius}px ${rgba(color, value * 0.6)}`;
}

/**
 * Animated border with color cycling
 * @param {HTMLElement} element
 * @param {number} value - 0-1 audio intensity
 * @param {object} config
 * @param {string[]} [config.colors] - Colors to cycle through
 * @param {number} [config.speed=2000] - Cycle speed in ms
 */
export function borderRainbow(element, value, config = {}) {
    const colors = config.colors || ['#EF4444', '#F59E0B', '#22C55E', '#3B82F6', '#8B5CF6'];
    const speed = config.speed ?? 2000;
    const t = performance.now() / speed;
    const idx = Math.floor(t % colors.length);
    const nextIdx = (idx + 1) % colors.length;
    const frac = t % 1;

    // Only animate when there's audio energy
    if (value > 0.05) {
        const color = colors[idx]; // Simple color pick
        const opacity = 0.5 + value * 0.5;
        element.style.borderColor = rgba(color, opacity);
        element.style.borderWidth = `${Math.max(1, value * 4)}px`;
    }
}

export const BORDER_EFFECTS = {
    borderPulse,
    borderGlow,
    borderRainbow
};
