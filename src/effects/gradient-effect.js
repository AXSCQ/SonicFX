/**
 * Gradient Effect — Dynamic CSS gradients that respond to audio energy.
 * Extracted from AstroPrueba MultiTrackAudioVisualizer vocals/other effects.
 */
import { rgba, parseColor, lerpColor } from '../utils/color-utils.js';

/**
 * Apply a dynamic linear gradient to an element
 * @param {HTMLElement} element 
 * @param {number} value - Audio intensity 0-1
 * @param {object} config
 * @param {string} [config.color='#3B82F6'] - Primary color
 * @param {string} [config.secondaryColor] - Optional secondary color
 * @param {number} [config.angle=90] - Gradient angle in degrees
 * @param {string} [config.direction='horizontal'] - 'horizontal' | 'vertical' | 'diagonal'
 * @param {number} [config.speed=800] - Animation speed in ms
 */
export function dynamicGradient(element, value, config = {}) {
    const color = config.color || '#3B82F6';
    const speed = config.speed || 800;

    let angle;
    switch (config.direction) {
        case 'vertical': angle = 180; break;
        case 'diagonal': angle = 135; break;
        default: angle = config.angle ?? 90;
    }

    const wave = (performance.now() / speed) % 2;
    const opacity = value * 0.7;

    element.style.background = `linear-gradient(${angle}deg, ${rgba(color, 0)} 0%, ${rgba(color, opacity)} ${wave * 60}%, ${rgba(color, opacity * 0.5)} ${wave * 85}%, ${rgba(color, 0)} 100%)`;
}

/**
 * Apply a radial gradient that pulses with audio
 * @param {HTMLElement} element
 * @param {number} value - Audio intensity 0-1
 * @param {object} config
 * @param {string} [config.color='#8B5CF6'] - Gradient color
 * @param {number} [config.maxRadius=80] - Max radius percentage
 */
export function radialPulse(element, value, config = {}) {
    const color = config.color || '#8B5CF6';
    const maxRadius = config.maxRadius || 80;

    const radius = 20 + value * maxRadius;
    const alpha = value * 0.6;

    element.style.background = `radial-gradient(circle at 50% 50%, ${rgba(color, alpha)} 0%, ${rgba(color, alpha * 0.3)} ${radius}%, transparent ${radius + 20}%)`;
}

/**
 * Multi-layer gradient with animating positions
 * @param {HTMLElement} element
 * @param {number} value - Audio intensity 0-1
 * @param {object} config
 * @param {string[]} [config.colors] - Array of colors for layers
 */
export function multiLayerGradient(element, value, config = {}) {
    const colors = config.colors || ['#8B5CF6', '#3B82F6', '#22C55E'];
    const t = performance.now() / 1000;

    const layers = colors.map((color, i) => {
        const phase = (t * (0.5 + i * 0.3)) % 2;
        const alpha = value * (0.3 + i * 0.15);
        const angle = 45 + i * 60;
        return `linear-gradient(${angle}deg, ${rgba(color, 0)} 0%, ${rgba(color, alpha)} ${phase * 50 + 20}%, ${rgba(color, 0)} 100%)`;
    });

    element.style.background = layers.join(', ');
}

export const GRADIENT_EFFECTS = {
    dynamicGradient,
    radialPulse,
    multiLayerGradient
};
