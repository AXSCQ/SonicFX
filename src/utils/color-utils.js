/**
 * Color utilities for SonicFX
 * Provides color manipulation helpers for dynamic effects
 */

/**
 * Parse a CSS color string into {r, g, b} values
 * Supports hex (#RGB, #RRGGBB), rgb(r,g,b), and named colors via fallback
 */
export function parseColor(color) {
    if (!color) return { r: 99, g: 102, b: 241 }; // default indigo

    // Hex
    if (color.startsWith('#')) {
        let hex = color.slice(1);
        if (hex.length === 3) {
            hex = hex.split('').map(c => c + c).join('');
        }
        return {
            r: parseInt(hex.slice(0, 2), 16),
            g: parseInt(hex.slice(2, 4), 16),
            b: parseInt(hex.slice(4, 6), 16)
        };
    }

    // rgb(r, g, b) or rgba(r, g, b, a)
    const match = color.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (match) {
        return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) };
    }

    // Comma-separated "r, g, b" (legacy format from SonicMotion)
    const parts = color.split(',').map(s => parseInt(s.trim()));
    if (parts.length >= 3 && parts.every(n => !isNaN(n))) {
        return { r: parts[0], g: parts[1], b: parts[2] };
    }

    return { r: 99, g: 102, b: 241 }; // fallback
}

/**
 * Convert {r,g,b} to rgba string
 */
export function rgba(color, alpha = 1) {
    const { r, g, b } = typeof color === 'string' ? parseColor(color) : color;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Interpolate between two colors
 */
export function lerpColor(c1, c2, t) {
    const a = typeof c1 === 'string' ? parseColor(c1) : c1;
    const b = typeof c2 === 'string' ? parseColor(c2) : c2;
    return {
        r: Math.round(a.r + (b.r - a.r) * t),
        g: Math.round(a.g + (b.g - a.g) * t),
        b: Math.round(a.b + (b.b - a.b) * t)
    };
}

/**
 * Lighten a color by a factor (0-1)
 */
export function lighten(color, factor) {
    const c = typeof color === 'string' ? parseColor(color) : color;
    return {
        r: Math.min(255, Math.round(c.r + (255 - c.r) * factor)),
        g: Math.min(255, Math.round(c.g + (255 - c.g) * factor)),
        b: Math.min(255, Math.round(c.b + (255 - c.b) * factor))
    };
}
