/**
 * Instrument Presets — Pre-configured effect chains per instrument type.
 * Extracted from AstroPrueba MultiTrackAudioVisualizer.astro
 */
import { rgba } from '../utils/color-utils.js';

/**
 * Bass preset — intense pulse with triple glow (purple)
 * Originally from AstroPrueba: contact panel + bass stem
 */
export function bassPulse(element, value, config = {}) {
    const color = config.color || '#9333EA';
    const intensity = config.intensity ?? 1.0;
    const v = value * intensity;

    const scale = 1 + v * 0.25;
    const opacity = 0.4 + v * 0.8;

    element.style.transform = `scale(${scale})`;
    element.style.borderColor = rgba(color, opacity);
    element.style.boxShadow = [
        `0 0 ${v * 60}px ${rgba(color, v * 0.8)}`,
        `0 0 ${v * 120}px ${rgba(color, v * 0.4)}`,
        `inset 0 0 ${v * 40}px ${rgba(color, v * 0.3)}`
    ].join(', ');
}

/**
 * Drums preset — rhythmic pulse with inset glow (red) + dynamic border
 * Originally from AstroPrueba: projects panel + drums stem
 */
export function drumsHit(element, value, config = {}) {
    const color = config.color || '#EF4444';
    const intensity = config.intensity ?? 1.0;
    const v = value * intensity;

    const scale = 1 + v * 0.3;
    const opacity = 0.5 + v * 0.7;
    const pulse = Math.sin(performance.now() / 100) * v * 0.1;

    element.style.transform = `scale(${scale + pulse})`;
    element.style.borderColor = rgba(color, opacity);
    element.style.boxShadow = [
        `inset 0 0 ${v * 50}px ${rgba(color, v * 0.6)}`,
        `0 0 ${v * 80}px ${rgba(color, v * 0.5)}`
    ].join(', ');
    element.style.borderWidth = `${Math.max(2, v * 8)}px`;
}

/**
 * Vocals preset — flowing horizontal gradient wave (blue)
 * Originally from AstroPrueba: profile panel + vocals stem
 */
export function vocalsWave(element, value, config = {}) {
    const color = config.color || '#3B82F6';
    const intensity = config.intensity ?? 1.0;
    const v = value * intensity;

    const wavePosition = (performance.now() / 800) % 2;
    const waveOpacity = v * 0.7;
    const scale = 1 + v * 0.15;

    element.style.transform = `scale(${scale})`;
    element.style.background = [
        `linear-gradient(90deg, ${rgba(color, 0)} 0%, ${rgba(color, waveOpacity)} ${wavePosition * 60}%, ${rgba(color, waveOpacity * 0.6)} ${wavePosition * 80}%, ${rgba(color, 0)} 100%)`,
        `linear-gradient(45deg, ${rgba(color, v * 0.1)} 0%, transparent 50%)`
    ].join(', ');
    element.style.borderColor = rgba(color, 0.5 + v * 0.6);
    element.style.boxShadow = `0 0 ${v * 70}px ${rgba(color, v * 0.7)}`;
}

/**
 * Other/Instrument preset — vertical gradient flow + rotation (green)
 * Originally from AstroPrueba: code editor panel + other stem
 */
export function otherFlow(element, value, config = {}) {
    const color = config.color || '#22C55E';
    const intensity = config.intensity ?? 1.0;
    const v = value * intensity;

    const verticalWave = (performance.now() / 1000) % 2;
    const verticalOpacity = v * 0.6;
    const scale = 1 + v * 0.2;
    const rotation = Math.sin(performance.now() / 500) * v * 3;

    element.style.transform = `scale(${scale}) rotate(${rotation}deg)`;
    element.style.background = [
        `linear-gradient(180deg, ${rgba(color, 0)} 0%, ${rgba(color, verticalOpacity)} ${verticalWave * 60}%, ${rgba(color, verticalOpacity * 0.5)} ${verticalWave * 85}%, ${rgba(color, 0)} 100%)`,
        `linear-gradient(135deg, ${rgba(color, v * 0.1)} 0%, transparent 60%)`
    ].join(', ');
    element.style.borderColor = rgba(color, 0.5 + v * 0.5);
    element.style.boxShadow = [
        `0 0 ${v * 50}px ${rgba(color, v * 0.6)}`,
        `inset 0 0 ${v * 30}px ${rgba(color, v * 0.2)}`
    ].join(', ');
    element.style.filter = `brightness(${1 + v * 0.4}) saturate(${1 + v * 0.8})`;
}

/**
 * Preset registry
 */
export const PRESETS = {
    bassPulse,
    drumsHit,
    vocalsWave,
    otherFlow
};

/**
 * Register a custom preset
 */
export function registerPreset(name, fn) {
    PRESETS[name] = fn;
}
