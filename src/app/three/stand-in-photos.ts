/* ==========================================================================
   WHAT: Draws a fake "photo" with code, for any photo that has no src yet.
   WHY:  The demo has no real images. Once every photo in photos.ts has a src,
         this file is no longer used and can be deleted.
   HOW:  drawStandIn() paints one of 8 scenes (dunes, peaks, sea, city, forest,
         figure, stars, neon) in one of 8 color palettes. The same seed always
         draws the same picture. You should not need to edit this file.
   ========================================================================== */
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const PAL: Record<string, string[]> = {
  dusk:['#2a2150','#d9587c','#ffb36b','#3a1b3d'], gold:['#7fb6d8','#f6d9a8','#ffd27a','#8a4b2a'],
  rose:['#54386e','#f28fa5','#ffe0b8','#3b1f3f'], teal:['#0f3a4a','#2f8f96','#f5d6a0','#0a2230'],
  ember:['#1c1020','#b23a48','#ff9f43','#120812'], mist:['#c9d6d2','#e8e4d8','#fff4d6','#2d4238'],
  night:['#050816','#16244d','#d9e6ff','#04060e'], neon:['#0c0618','#ff4f9a','#35e0e8','#050208']
};

function rng(seed: number) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function mixHex(a: string, b: string, t: number) { const p = (h: string) => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16)); const A = p(a), B = p(b); return 'rgb(' + A.map((v, i) => Math.round(lerp(v, B[i], t))).join(',') + ')'; }
const grain = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d')!, d = x.createImageData(256, 256); for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } x.putImageData(d, 0, 0); return c; })();

export function drawStandIn(x: CanvasRenderingContext2D, scene: string, palette: string, seed: number, W: number, H: number): void {
  const R = rng(seed * 991 + 7), P = PAL[palette] ?? PAL['dusk'], u = W / 1000;
  const sky = (a: string, b: string, c2: string, stop = .7) => { const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, a); g.addColorStop(stop, b); g.addColorStop(1, c2); x.fillStyle = g; x.fillRect(0, 0, W, H); };
  const glow = (cx: number, cy: number, r: number, col: string, a = 1) => { const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); x.globalAlpha = a; x.fillStyle = g; x.fillRect(cx - r, cy - r, r * 2, r * 2); x.globalAlpha = 1; };
  const ridge = (y0: number, amp: number, rough: number) => { const w = Array.from({ length: 7 }, (_, k) => [R() * 6.28, (k + 1) * (k + 1) * rough * (.7 + R() * .6), amp / Math.pow(k + 1, 1.25)]); return (X: number) => y0 + w.reduce((a, q) => a + Math.sin(X / W * q[1] * 6.28 + q[0]) * q[2], 0); };
  const fillRidge = (f: (X: number) => number, col: string | CanvasGradient) => { x.fillStyle = col; x.beginPath(); x.moveTo(0, H); for (let X = 0; X <= W; X += 3 * u + 1) x.lineTo(X, f(X)); x.lineTo(W, H); x.fill(); };
  const person = (px: number, py: number, ph: number, col: string) => { x.fillStyle = col; x.beginPath(); x.arc(px, py - ph * .9, ph * .085, 0, 7); x.fill(); x.beginPath(); x.moveTo(px - ph * .13, py - ph * .78); x.quadraticCurveTo(px, py - ph * .84, px + ph * .13, py - ph * .78); x.lineTo(px + ph * .1, py - ph * .36); x.lineTo(px + ph * .08, py); x.lineTo(px - ph * .08, py); x.lineTo(px - ph * .1, py - ph * .36); x.fill(); };
  const K = scene;
  if (K === 'dunes') {
    sky(P[0], P[1], P[2]); glow(W * (.25 + R() * .5), H * .36, H * .6, P[2], .9);
    for (let k = 0; k < 6; k++) { const t = k / 5, f = ridge(H * (.45 + t * .5), H * .07 * (1 - t * .3), .35 + R() * .3), g = x.createLinearGradient(0, H * .4, W, H); g.addColorStop(0, mixHex(P[2], P[3], t * .5)); g.addColorStop(.55, mixHex(P[1], P[3], .25 + t * .35)); g.addColorStop(1, mixHex(P[3], '#000000', t * .55)); fillRidge(f, g); }
  } else if (K === 'peaks') {
    sky(P[0], P[1], P[2], .6); glow(W * (.3 + R() * .4), H * .48, H * .55, P[2]);
    for (let k = 0; k < 7; k++) { const t = k / 6; fillRidge(ridge(H * (.42 + t * .5), H * (.1 + t * .03), 1.1), mixHex(P[1], P[3], .2 + t * .8)); }
  } else if (K === 'sea') {
    const hz = H * (.46 + R() * .1), sx = W * (.35 + R() * .3); sky(P[0], P[1], P[2], .4); glow(sx, hz, H * .7, P[2]);
    const g = x.createLinearGradient(0, hz, 0, H); g.addColorStop(0, mixHex(P[1], P[2], .4)); g.addColorStop(1, P[3]); x.fillStyle = g; x.fillRect(0, hz, W, H - hz);
    for (let k = 0; k < 900; k++) { const t = Math.pow(R(), 1.5), y = hz + t * (H - hz), near = Math.exp(-Math.pow((R() * W - sx) / (W * (.05 + t * .22)), 2)), w = (10 + 90 * t) * u; x.globalAlpha = .08 + .6 * near * (1 - t * .5); x.fillStyle = near > .3 ? P[2] : P[3]; x.fillRect(sx + (R() - .5) * W * (.1 + t * .9) - w / 2, y, w, (1 + t * 3) * u); }
    x.globalAlpha = 1;
  } else if (K === 'city') {
    sky(P[0], P[1], P[3] === '#04060e' ? '#3a4a80' : P[2], .75);
    for (let L = 0; L < 3; L++) { let X = -20 * u; const base = mixHex(P[3], P[0], .6 - L * .3); while (X < W) { const w = (45 + R() * 90) * u, h = H * (.28 + R() * .32 + (2 - L) * .1); x.fillStyle = base; x.fillRect(X, H - h, w, h); const cols = Math.floor(w / (11 * u)), rows = Math.floor(h / (15 * u)); for (let a = 0; a < cols; a++) for (let b = 0; b < rows; b++) if (R() < .3 + L * .1) { x.globalAlpha = .35 + R() * .6; x.fillStyle = R() < .8 ? '#ffd27a' : '#f7b5c4'; x.fillRect(X + a * 11 * u + 3 * u, H - h + b * 15 * u + 4 * u, 5 * u, 8 * u); } x.globalAlpha = 1; X += w + 3 * u; } }
    for (let k = 0; k < 16; k++) glow(R() * W, H * (.72 + R() * .28), (20 + R() * 55) * u, R() < .5 ? '#ffb36b' : '#f28fa5', .55);
  } else if (K === 'forest') {
    sky(P[1], P[2], P[0], .55); glow(W * (.3 + R() * .4), H * .3, H * .7, '#fff6da', .85);
    for (let L = 0; L < 5; L++) { const t = L / 4, col = mixHex(P[0], P[3], .25 + t * .75); x.fillStyle = col; const n = 12 - L; for (let k = 0; k < n; k++) { const tx = R() * W, w = (6 + t * 26 + R() * 8) * u; x.beginPath(); x.moveTo(tx - w * .35, 0); x.lineTo(tx + w * .35, 0); x.lineTo(tx + w * .7, H); x.lineTo(tx - w * .7, H); x.fill(); } fillRidge(ridge(H * (.8 + t * .12), H * .025, .8), col); glow(W * .5, H * .7, W * .8, P[1], .16); }
  } else if (K === 'figure') {
    sky(P[0], P[1], P[2], .65); const sx = W * (.38 + R() * .24), sy = H * .55, sr = H * .23; glow(sx, sy, H * .75, P[2]); x.fillStyle = P[2]; x.beginPath(); x.arc(sx, sy, sr, 0, 7); x.fill();
    const f = ridge(H * .78, H * .02, .4); fillRidge(f, mixHex(P[3], '#000000', .35)); const ph = H * .38, gy = f(sx) + 4 * u; person(sx - ph * .13, gy, ph, mixHex(P[3], '#000000', .55)); person(sx + ph * .13, gy, ph * .92, mixHex(P[3], '#000000', .55));
  } else if (K === 'stars') {
    sky(P[0], P[1], '#2c2a55', .8);
    for (let k = 0; k < 340; k++) { const t = R(), bx = t * W, by = H * (.05 + t * .55) + (R() - .5) * H * .24; glow(bx, by, (12 + R() * 42) * u, '#8ea6ee', .07); }
    for (let k = 0; k < 2200; k++) { x.globalAlpha = R() * R(); x.fillStyle = '#fff'; const z = R() * 1.8 * u + .4; x.fillRect(R() * W, R() * H * .85, z, z); } x.globalAlpha = 1;
    fillRidge(ridge(H * .82, H * .05, .8), '#03040a'); glow(W * .3, H * .84, 60 * u, '#ff9f43', .9);
  } else {
    sky(P[0], mixHex(P[0], P[1], .3), P[3], .6); x.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 42; k++) glow(R() * W, R() * H * .85, (25 + R() * 95) * u, R() < .55 ? P[1] : P[2], .34); x.globalCompositeOperation = 'source-over';
    x.strokeStyle = 'rgba(255,255,255,.14)'; x.lineWidth = u; for (let k = 0; k < 240; k++) { const a = R() * W, b = R() * H; x.beginPath(); x.moveTo(a, b); x.lineTo(a - 5 * u, b + 34 * u); x.stroke(); }
    const ph = H * .55, px = W * (.42 + R() * .16), py = H * .96; person(px, py, ph, '#05030b');
    x.fillStyle = '#05030b'; x.beginPath(); x.ellipse(px, py - ph * 1.0, ph * .3, ph * .17, 0, Math.PI, 0); x.fill(); x.fillRect(px - u, py - ph, 2 * u, ph * .25);
  }
  const v = x.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .35, W / 2, H / 2, Math.max(W, H) * .72); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(10,0,20,.55)'); x.fillStyle = v; x.fillRect(0, 0, W, H);
  x.globalCompositeOperation = 'overlay'; x.globalAlpha = .16; x.fillStyle = x.createPattern(grain, 'repeat')!; x.fillRect(0, 0, W, H); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
}

