/**
 * Color utilities for SonicFX
 * Provides color manipulation helpers for dynamic effects
 *
 * Formatos: #RGB, #RGBA, #RRGGBB, #RRGGBBAA, rgb()/rgba() con comas o con
 * espacios ("rgb(10 20 30 / 50%)"), canales en porcentaje, hsl()/hsla(),
 * "r, g, b" (formato viejo de SonicMotion) y, si hay un canvas 2D (en el
 * navegador), cualquier otro color de CSS: nombres ("white"), "transparent"…
 * El alfa del color se ignora: cada efecto pone el suyo.
 */

const DEFAULT = Object.freeze({ r: 99, g: 102, b: 241 }); // default indigo

const HEX = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const FUNC = /^(rgba?|hsla?)\(\s*([^()]*)\)$/i;

// Los efectos piden el mismo color en cada cuadro: cada texto se resuelve una
// sola vez (con el canvas, la parte cara, solo los nombres y lo raro).
const cache = new Map();
const CACHE_MAX = 256;
let ctx2d; // undefined: sin probar todavía; null: no hay canvas (Node, SSR)

function canvasContext() {
    if (ctx2d !== undefined) return ctx2d;
    ctx2d = null;
    try {
        if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
            const c = document.createElement('canvas');
            ctx2d = (c && typeof c.getContext === 'function' && c.getContext('2d')) || null;
        }
        if (!ctx2d && typeof OffscreenCanvas !== 'undefined') {
            ctx2d = new OffscreenCanvas(1, 1).getContext('2d') || null;
        }
    } catch (e) {
        ctx2d = null;
    }
    return ctx2d;
}

function clamp255(n) {
    return Math.max(0, Math.min(255, Math.round(n)));
}

function parseHex(hex) {
    if (hex.length <= 4) hex = [...hex].map(c => c + c).join('');   // #RGB / #RGBA
    return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16)
    };
}

/** Un canal de rgb(): número 0–255 o porcentaje. */
function channel(s) {
    const n = parseFloat(s);
    return s.endsWith('%') ? n * 255 / 100 : n;
}

/** El tono de hsl() en grados: número solo o con deg, grad, rad o turn. */
function hue(s) {
    const n = parseFloat(s);
    if (/turn$/i.test(s)) return n * 360;
    if (/grad$/i.test(s)) return n * 0.9;
    if (/rad$/i.test(s)) return n * 180 / Math.PI;
    return n;
}

/** hsl → rgb (la fórmula de CSS Color 4). s y l entre 0 y 1. */
function hslToRgb(h, s, l) {
    h = ((h % 360) + 360) % 360;
    s = Math.max(0, Math.min(1, s));
    l = Math.max(0, Math.min(1, l));
    const a = s * Math.min(l, 1 - l);
    const f = (n) => {
        const k = (n + h / 30) % 12;
        return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    };
    return { r: clamp255(f(0) * 255), g: clamp255(f(8) * 255), b: clamp255(f(4) * 255) };
}

/** rgb()/rgba()/hsl()/hsla(), con comas o con espacios y "/ alfa". */
function parseFunc(name, body) {
    const parts = body.split(/[\s,\/]+/).filter(Boolean);
    if (parts.length < 3) return null;
    if (name.toLowerCase().startsWith('rgb')) {
        const [r, g, b] = parts.slice(0, 3).map(channel);
        if ([r, g, b].some(Number.isNaN)) return null;
        return { r: clamp255(r), g: clamp255(g), b: clamp255(b) };
    }
    const h = hue(parts[0]), s = parseFloat(parts[1]), l = parseFloat(parts[2]);
    if ([h, s, l].some(Number.isNaN)) return null;
    return hslToRgb(h, s / 100, l / 100);
}

/** Lo que no se entiende aquí lo normaliza el navegador (nombres, etc.). */
function parseWithCanvas(color) {
    const ctx = canvasContext();
    if (!ctx) return null;
    // un color inválido no cambia fillStyle: con dos valores de partida
    // distintos se nota (se lee lo que quedó en cada caso)
    ctx.fillStyle = '#000000';
    ctx.fillStyle = color;
    const a = ctx.fillStyle;
    ctx.fillStyle = '#ffffff';
    ctx.fillStyle = color;
    const b = ctx.fillStyle;
    if (a !== b || typeof a !== 'string') return null;
    if (HEX.test(a)) return parseHex(a.slice(1));
    const m = a.match(FUNC);
    return m ? parseFunc(m[1], m[2]) : null;
}

function parse(s) {
    if (s[0] === '#') return HEX.test(s) ? parseHex(s.slice(1)) : null;

    const m = s.match(FUNC);
    if (m) {
        const c = parseFunc(m[1], m[2]);
        if (c) return c;
    }

    // Comma-separated "r, g, b" (legacy format from SonicMotion)
    const parts = s.split(',').map(x => parseInt(x.trim()));
    if (parts.length >= 3 && parts.every(n => !isNaN(n))) {
        return { r: parts[0], g: parts[1], b: parts[2] };
    }

    return parseWithCanvas(s);
}

/** {r, g, b} congelado y en caché (uso interno: no copiar en cada cuadro). */
function resolve(color) {
    if (color && typeof color === 'object') return color;   // ya es {r, g, b}
    if (!color) return DEFAULT;
    const key = String(color).trim();
    let c = cache.get(key);
    if (c) return c;
    c = parse(key);
    if (!c) {
        // antes caía sin aviso al índigo por defecto
        console.warn(`SonicFX: no se pudo leer el color "${key}"; se usa el índigo por defecto`);
        c = DEFAULT;
    }
    if (cache.size >= CACHE_MAX) cache.clear();
    c = Object.freeze(c);
    cache.set(key, c);
    return c;
}

/**
 * Parse a CSS color string into {r, g, b} values
 * (formatos: ver la cabecera del archivo)
 */
export function parseColor(color) {
    const { r, g, b } = resolve(color);
    return { r, g, b };
}

/**
 * Convert {r,g,b} to rgba string
 */
export function rgba(color, alpha = 1) {
    const { r, g, b } = resolve(color);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Interpolate between two colors
 */
export function lerpColor(c1, c2, t) {
    const a = resolve(c1);
    const b = resolve(c2);
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
    const c = resolve(color);
    return {
        r: Math.min(255, Math.round(c.r + (255 - c.r) * factor)),
        g: Math.min(255, Math.round(c.g + (255 - c.g) * factor)),
        b: Math.min(255, Math.round(c.b + (255 - c.b) * factor))
    };
}
