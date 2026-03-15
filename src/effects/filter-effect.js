/**
 * Filter Effects — CSS filters that react to audio energy.
 * brightness, saturate, contrast, hue-rotate driven by audio.
 */

/**
 * Apply brightness + saturate filter based on audio
 * @param {HTMLElement} element
 * @param {number} value - 0-1 audio intensity
 * @param {object} config
 * @param {number} [config.brightness=0.4] - Max brightness boost
 * @param {number} [config.saturate=0.8] - Max saturation boost
 */
export function brightnessReactive(element, value, config = {}) {
    const b = config.brightness ?? 0.4;
    const s = config.saturate ?? 0.8;
    element.style.filter = `brightness(${1 + value * b}) saturate(${1 + value * s})`;
}

/**
 * Apply hue-rotate filter based on audio band
 * @param {HTMLElement} element
 * @param {number} value - 0-1 audio intensity
 * @param {object} config
 * @param {number} [config.maxHue=180] - Max hue rotation in degrees
 */
export function hueShift(element, value, config = {}) {
    const maxHue = config.maxHue ?? 180;
    element.style.filter = `hue-rotate(${value * maxHue}deg)`;
}

/**
 * Apply contrast + brightness for high-energy moments
 * @param {HTMLElement} element
 * @param {number} value - 0-1 audio intensity
 * @param {object} config
 */
export function contrastPop(element, value, config = {}) {
    const contrast = 1 + value * (config.contrast ?? 0.3);
    const brightness = 1 + value * (config.brightness ?? 0.2);
    element.style.filter = `contrast(${contrast}) brightness(${brightness})`;
}

/**
 * Combined filter chain
 */
export function filterChain(element, value, config = {}) {
    const filters = [];
    if (config.brightness !== false) {
        filters.push(`brightness(${1 + value * (config.brightness ?? 0.3)})`);
    }
    if (config.saturate !== false) {
        filters.push(`saturate(${1 + value * (config.saturate ?? 0.5)})`);
    }
    if (config.hueRotate) {
        filters.push(`hue-rotate(${value * config.hueRotate}deg)`);
    }
    if (config.contrast) {
        filters.push(`contrast(${1 + value * config.contrast})`);
    }
    element.style.filter = filters.join(' ');
}

export const FILTER_EFFECTS = {
    brightnessReactive,
    hueShift,
    contrastPop,
    filterChain
};
