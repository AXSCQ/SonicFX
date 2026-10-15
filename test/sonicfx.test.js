// node --test — SonicFX con un DOM mínimo simulado.
import test from 'node:test';
import assert from 'node:assert/strict';

// Un canvas 2D de mentira: normaliza unos pocos nombres como lo haría el
// navegador y deja fillStyle como estaba si el color no es válido.
const NAMED = { white: '#ffffff', rebeccapurple: '#663399', transparent: 'rgba(0, 0, 0, 0)' };
let canvasSets = 0;
const fakeCtx = {
    _v: '#000000',
    set fillStyle(v) {
        canvasSets++;
        const s = String(v).toLowerCase();
        if (NAMED[s]) this._v = NAMED[s];
        else if (/^#[0-9a-f]{6}$/.test(s)) this._v = s;
    },
    get fillStyle() { return this._v; },
};

// DOM mínimo: lo justo para montar el overlay, enlazar elementos y el canvas
globalThis.Element = class Element {};
globalThis.NodeList = class NodeList {};
globalThis.document = {
    body: { children: [], appendChild(el) { this.children.push(el); el.parentNode = this; }, removeChild(el) { this.children = this.children.filter(c => c !== el); } },
    createElement: (tag) => tag === 'canvas' ? { getContext: () => fakeCtx } : ({ style: {}, setAttribute() {} }),
    querySelectorAll: () => [],
};

const { default: SonicFX, parseColor, rgba, lerpColor, borderRainbow, OverlayController } = await import('../src/sonicfx.js');

/** requestAnimationFrame de mentira: frame() corre los cuadros pedidos hasta ahora. */
function fakeRaf() {
    let pending = new Map();
    let next = 0;
    globalThis.requestAnimationFrame = (f) => { pending.set(++next, f); return next; };
    globalThis.cancelAnimationFrame = (id) => { pending.delete(id); };
    return { frame() { const q = [...pending.values()]; pending = new Map(); q.forEach(f => f()); } };
}

/** Un elemento cuyo style cuenta las escrituras. */
function fakeEl(initial = {}) {
    const el = new Element();
    el.writes = 0;
    el.style = new Proxy({ ...initial }, { set(t, k, v) { el.writes++; t[k] = v; return true; } });
    return el;
}

/** console.warn silenciado; devuelve cuántas veces se llamó. */
function muteWarn(fn) {
    const orig = console.warn;
    let n = 0;
    console.warn = () => { n++; };
    try { fn(); } finally { console.warn = orig; }
    return n;
}

test('parseColor: hex corto, hex largo, rgb() y "r, g, b"', () => {
    assert.deepEqual(parseColor('#f00'), { r: 255, g: 0, b: 0 });
    assert.deepEqual(parseColor('#3B82F6'), { r: 59, g: 130, b: 246 });
    assert.deepEqual(parseColor('rgba(1, 2, 3, 0.5)'), { r: 1, g: 2, b: 3 });
    assert.deepEqual(parseColor('10, 20, 30'), { r: 10, g: 20, b: 30 });
    assert.equal(rgba('#000', 0.5), 'rgba(0, 0, 0, 0.5)');
    assert.deepEqual(lerpColor('#000000', '#ffffff', 0.5), { r: 128, g: 128, b: 128 });
});

test('borderRainbow: con energía pinta el borde; en silencio vuelve a reposo', () => {
    const el = { style: {} };
    borderRainbow(el, 0.8, {});
    assert.match(el.style.borderColor, /^rgba\(/);
    assert.equal(el.style.borderWidth, '3.2px');
    borderRainbow(el, 0, {});
    assert.equal(el.style.borderColor, '');
    assert.equal(el.style.borderWidth, '');
});

test('overlay: visible NO bloquea los clics de la página (salvo blocking: true)', () => {
    const o = new OverlayController();
    o.setIntensity(0.8);
    assert.equal(o._element.style.pointerEvents, 'none');
    o.fadeIn();
    assert.equal(o._element.style.pointerEvents, 'none');
    o.destroy();

    const b = new OverlayController({ blocking: true });
    b.fadeIn();
    assert.equal(b._element.style.pointerEvents, 'auto');
    b.destroy();
});

// ── v1.2.0 ──────────────────────────────────────────────────────────────────

test('parseColor: #RGBA, #RRGGBBAA, rgb() con espacios o porcentajes y hsl()', () => {
    assert.deepEqual(parseColor('#f008'), { r: 255, g: 0, b: 0 });
    assert.equal(rgba('#f008', 0.5), 'rgba(255, 0, 0, 0.5)');   // antes "rgba(240, 8, NaN, 0.5)", CSS inválido
    assert.deepEqual(parseColor('#ff000080'), { r: 255, g: 0, b: 0 });
    assert.deepEqual(parseColor('rgb(10 20 30)'), { r: 10, g: 20, b: 30 });
    assert.deepEqual(parseColor('rgb(10 20 30 / 50%)'), { r: 10, g: 20, b: 30 });
    assert.deepEqual(parseColor('RGB(100%, 0%, 50%)'), { r: 255, g: 0, b: 128 });
    assert.deepEqual(parseColor('hsl(0, 100%, 50%)'), { r: 255, g: 0, b: 0 });
    assert.deepEqual(parseColor('hsl(120 100% 25%)'), { r: 0, g: 128, b: 0 });
    assert.deepEqual(parseColor('hsla(240, 100%, 50%, 0.3)'), { r: 0, g: 0, b: 255 });
    assert.deepEqual(parseColor('hsl(0.5turn 100% 50%)'), { r: 0, g: 255, b: 255 });
    assert.deepEqual(parseColor({ r: 1, g: 2, b: 3 }), { r: 1, g: 2, b: 3 });
});

test('parseColor: nombres con el canvas 2D, una sola vez por color (caché); lo inválido avisa y usa el índigo', () => {
    assert.deepEqual(parseColor('white'), { r: 255, g: 255, b: 255 });
    assert.deepEqual(parseColor('RebeccaPurple'), { r: 102, g: 51, b: 153 });
    assert.equal(rgba('transparent', 1), 'rgba(0, 0, 0, 1)');
    const n = canvasSets;
    for (let i = 0; i < 50; i++) rgba('white', 0.5);
    assert.equal(canvasSets, n, 'el canvas se consultó otra vez para el mismo color');
    // el resultado devuelto es una copia: modificarlo no cambia la caché
    parseColor('white').r = 0;
    assert.deepEqual(parseColor('white'), { r: 255, g: 255, b: 255 });
    let got;
    const warned = muteWarn(() => { got = parseColor('no-es-un-color'); parseColor('no-es-un-color'); });
    assert.deepEqual(got, { r: 99, g: 102, b: 241 });
    assert.equal(warned, 1);
});

test('bucle: no reescribe estilos si el valor no cambió y no muere si la fuente de datos lanza', () => {
    const raf = fakeRaf();
    const el = fakeEl();
    const fx = SonicFX.create();
    let frame = { vocals: { value: 0.5 } };
    let fail = false;
    fx.setDataSource(() => { if (fail) throw new Error('sin datos'); return frame; });
    fx.bind(el, 'borderGlow', { stem: 'vocals', color: '#ff0000', radius: 10 });
    fx.start();                          // el primer cuadro aplica 0,5
    const first = el.writes;
    assert.ok(first > 0);
    assert.equal(el.style.boxShadow, '0 0 5px rgba(255, 0, 0, 0.3)');
    raf.frame(); raf.frame();            // el mismo valor: no se toca el DOM
    assert.equal(el.writes, first);
    frame = { vocals: { value: 0.7 } };
    raf.frame();
    assert.ok(el.writes > first);

    fail = true;
    const warned = muteWarn(() => { raf.frame(); raf.frame(); });
    assert.equal(warned, 1, 'un solo aviso, no uno por cuadro');
    fail = false;
    frame = { vocals: { value: 0.2 } };
    raf.frame();
    assert.equal(el.style.boxShadow, '0 0 2px rgba(255, 0, 0, 0.12)', 'el bucle murió con el error');

    frame = undefined;                   // la fuente todavía no tiene datos: silencio, sin TypeError
    raf.frame();
    assert.equal(el.style.boxShadow, '0 0 0px rgba(255, 0, 0, 0)');
    fx.destroy();
});

test('bucle: everyFrame vuelve a aplicar un efecto propio aunque el valor no cambie', () => {
    const raf = fakeRaf();
    const el = fakeEl();
    const fx = SonicFX.create();
    fx.setDataSource(() => ({ bass: { value: 0.4 } }));
    let calls = 0, callsAlways = 0;
    fx.bind(el, () => { calls++; }, { stem: 'bass' });
    fx.bind(el, () => { callsAlways++; }, { stem: 'bass', everyFrame: true });
    fx.start(); raf.frame(); raf.frame();
    assert.equal(calls, 1);
    assert.equal(callsAlways, 3);
    fx.destroy();
});

test('bandas como SonicMotion: "bass" es bands.bass.value y "bass.punch" es bands.bass.punch', () => {
    const raf = fakeRaf();
    const fx = SonicFX.create();
    fx.setDataSource(() => ({ drums: { value: 0.1, bands: { bass: { value: 0.3, punch: 0.9 }, mid: null, treble: 0.25 } } }));
    const got = {};
    for (const band of ['bass', 'bass.punch', 'bass.nada', 'mid', 'treble', 'mid.punch']) {
        fx.bind(fakeEl(), (e, v) => { got[band] = v; }, { stem: 'drums', band });
    }
    fx.start();
    assert.deepEqual(got, { 'bass': 0.3, 'bass.punch': 0.9, 'bass.nada': 0, 'mid': 0, 'treble': 0.25, 'mid.punch': 0 });
    raf.frame();
    fx.destroy();
});

test('parseDOM: data-sonicfx-intensity="0" es intensidad 0 (antes se volvía 1)', () => {
    const raf = fakeRaf();
    const attrs = { 'data-sonicfx': 'bassPulse', 'data-sonicfx-track': 'bass', 'data-sonicfx-intensity': '0' };
    const el = fakeEl();
    el.getAttribute = (name) => attrs[name] ?? null;
    const orig = document.querySelectorAll;
    document.querySelectorAll = (sel) => sel === '[data-sonicfx]' ? [el] : [];
    try {
        const fx = SonicFX.create();
        fx.setDataSource(() => ({ bass: { value: 0.9 } }));
        fx.parseDOM().start();
        assert.equal(fx._bindings[0].config.intensity, 0);
        assert.equal(el.style.transform, 'scale(1)');
        // sin el atributo sigue siendo 1
        delete attrs['data-sonicfx-intensity'];
        fx.parseDOM();
        assert.equal(fx._bindings.length, 1);
        assert.equal(fx._bindings[0].config.intensity, 1);
        raf.frame();
        fx.destroy();
    } finally {
        document.querySelectorAll = orig;
    }
});

test('createOverlay dos veces deja una sola capa en el DOM; la vieja no vuelve sola', () => {
    const fx = SonicFX.create();
    const before = document.body.children.length;
    const a = fx.createOverlay({ maxOpacity: 0.2 });
    const b = fx.createOverlay({ maxOpacity: 0.5 });
    assert.equal(document.body.children.length, before + 1);
    a.fadeIn();                          // reemplazada: no se vuelve a montar
    assert.equal(document.body.children.length, before + 1);
    b.fadeIn();
    assert.equal(b._element.style.opacity, '0.5');
    fx.destroy();
    assert.equal(document.body.children.length, before);
});

test('unbindAll/destroy devuelven los estilos en línea que el elemento tenía antes de enlazarlo', () => {
    const raf = fakeRaf();
    const el = fakeEl({ transition: 'opacity 1s', boxShadow: '0 0 2px red', borderColor: '', transform: 'translateY(4px)' });
    const fx = SonicFX.create();
    fx.setDataSource(() => ({ bass: { value: 0.6 } }));
    fx.bind(el, 'borderGlow', { stem: 'bass' });
    fx.bind(el, 'bassPulse', { stem: 'bass' });   // dos efectos en el mismo elemento
    fx.start(); raf.frame();
    assert.notEqual(el.style.boxShadow, '0 0 2px red');
    fx.destroy();
    assert.equal(el.style.transition, 'opacity 1s');
    assert.equal(el.style.boxShadow, '0 0 2px red');
    assert.equal(el.style.transform, 'translateY(4px)');
    assert.equal(el.style.willChange, '');
    assert.equal(el.style.borderColor, '');
});
