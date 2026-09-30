// node --test — SonicFX con un DOM mínimo simulado.
import test from 'node:test';
import assert from 'node:assert/strict';

// DOM mínimo: lo justo para montar el overlay
globalThis.document = {
    body: { children: [], appendChild(el) { this.children.push(el); el.parentNode = this; }, removeChild(el) { this.children = this.children.filter(c => c !== el); } },
    createElement: () => ({ style: {}, setAttribute() {} }),
    querySelectorAll: () => [],
};

const { parseColor, rgba, lerpColor, borderRainbow, OverlayController } = await import('../src/sonicfx.js');

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
