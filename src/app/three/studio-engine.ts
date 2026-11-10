/* ==========================================================================
   WHAT: All of the 3D for the home page, in one place:
         1. A photo tunnel you fly through by scrolling. Photos cast real
            shadows on the studio floor.
         2. A "funnel": the last five photos fly out of the tunnel and land
            in the frames of a 35mm film strip.
         3. The film strip spirals down the side of the page as you scroll and
            winds into a roll on the floor of the "wrap" section.
         4. A viewer where moving between photos rips the print.
   WHY:  This is plain Three.js with no Angular in it. Angular components stay
         small and readable, and they talk to this file through a few
         functions (openViewer, closeViewer, tear) and two callbacks.
   HOW:  createStudio() is called once by the Hero component. It draws two 3D
         scenes into the same canvas each frame:
         - scene  (tunnel): the camera flies forward as you scroll.
         - scene2 (film):   built in "page space". Its camera moves DOWN as you
                            scroll, so the film stays lined up with the page.
         The canvas floats above the page and only draws objects and shadows.
         The page background is the white studio, so the white has no edges.
   NOTE: This file is pinned to Three.js version 0.128. Newer versions handle
         color and light differently and would change the look.
   ========================================================================== */
import * as THREE from 'three';
import { Photo } from '../data/photos';
import { aspectOf, photoCanvas } from './photo-source';
import { makeFilm } from './film-texture';
import { TEAR_FRAGMENT, TEAR_VERTEX } from './tear-shader';

/** What the Hero component hands to the 3D code. */
export interface StudioOptions {
  canvas: HTMLCanvasElement;          // the fixed canvas everything is drawn on
  track: HTMLElement;                 // the tall section whose scrolling drives the tunnel
  says: HTMLElement[];                // the big hero headlines that fade in and out
  hud: HTMLElement;                   // the small pill at the bottom of the hero
  photos: Photo[];                    // every photo (from photos.ts)
  filmPhotos: number[];               // which five photos land on the film
  onViewer: (open: boolean) => void;  // called when the tear viewer opens or closes
  onCaption: (index: number) => void; // called when the viewer shows a different photo
}

/** What the rest of the app can ask the 3D code to do. */
export interface Studio {
  openViewer(index: number): void;
  closeViewer(): void;
  tear(direction: number): void;      // 1 = next photo, -1 = previous photo
  destroy(): void;
}

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Returns null when the browser cannot do WebGL (3D). The page still works without it. */
export function createStudio(o: StudioOptions): Studio | null {
  const { canvas, track, says, hud, photos } = o;
  const FINAL = o.filmPhotos;
  const UNIQUE = photos.length;
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SMALL = innerWidth < 760;

  let renderer: THREE.WebGLRenderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); }
  catch { return null; }

  /* Everything we attach to the page is tied to this "abort" switch, so destroy() can undo it all at once. */
  const abort = new AbortController();
  const listen = (target: EventTarget, type: string, fn: (e: any) => void, opts: AddEventListenerOptions = {}) =>
    target.addEventListener(type, fn, { ...opts, signal: abort.signal });

  /* The studio white comes from the --bg color in colors.scss, so the 3D haze always matches the page. */
  const css = getComputedStyle(document.documentElement);
  const BG = new THREE.Color(css.getPropertyValue('--bg').trim() || '#f4f2ee');
  const VEIL = new THREE.Color(css.getPropertyValue('--viewer-bg').trim() || '#dcd8d0');

  renderer.setPixelRatio(Math.min(devicePixelRatio, SMALL ? 1.5 : 2));
  renderer.setClearColor(BG, 0);
  renderer.autoClear = false;                       // we draw two scenes per frame, so we clear by hand
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;     // this type lets "radius" blur the shadow edges

  /* ===================== SCENE 1: the studio tunnel ===================== */
  const scene = new THREE.Scene(); scene.fog = new THREE.Fog(BG.getHex(), 7, 40);   // far photos fade into the white
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 120); scene.add(camera);
  const BASE_FOV = 60, DIST = 5;

  /* The tunnel center bends gently, so the flight swoops instead of running straight. */
  const axis = (z: number) => new THREE.Vector3(Math.sin(z * 0.045) * 3.2, (Math.cos(z * 0.06) - 1) * 0.6, z);
  const N = SMALL ? 34 : 54;            // how many photos hang in the tunnel
  const GAP = 2.9;                      // distance between one photo and the next
  const portraitView = innerHeight > innerWidth;
  const RX = portraitView ? 2.1 : 3.9, RY = portraitView ? 3.4 : 2.5;   // tunnel width and height
  const FLOOR_Y = -(RY + 2.5);
  const unit = new THREE.PlaneGeometry(1, 1);
  const thumbs = photos.map((_, i) => {
    const t: THREE.CanvasTexture = new THREE.CanvasTexture(photoCanvas(photos, i, SMALL ? 512 : 768, () => (t.needsUpdate = true)));
    t.anisotropy = 4; return t;
  });
  const tunnel = new THREE.Group(); scene.add(tunnel);
  const meshes: THREE.Mesh[] = [], finals: THREE.Mesh[] = [];
  const Z_FINAL = -(N - 5) * GAP - 3;      // where the last five photos hang
  const START = 7, END = Z_FINAL + 6.5;    // camera start and stop positions
  for (let i = 0; i < N; i++) {
    const k = i - (N - 5), isFinal = k >= 0, idx = isFinal ? FINAL[k] : i % UNIQUE;
    const m = new THREE.Mesh(unit, new THREE.MeshBasicMaterial({ map: thumbs[idx], side: THREE.DoubleSide, fog: !isFinal }));
    let w: number;
    if (isFinal) {
      /* The last five hang in a tight ring facing the camera, ready to fly to the film. */
      const z = Z_FINAL - k * 0.9, c = axis(z), a = -Math.PI / 2 + k * Math.PI * 0.4 + 0.3;
      w = portraitView ? 1.65 : 2.4;
      m.position.set(c.x + Math.cos(a) * (portraitView ? 1.15 : 3), c.y + Math.sin(a) * (portraitView ? 1.9 : 1.25) + 0.2, z);
      m.lookAt(axis(END));
      finals.push(m);
    } else {
      /* The ring narrows near the end, like a funnel. */
      const a = i * 2.39996, z = -i * GAP, c = axis(z), rs = i >= N - 13 ? lerp(1, 0.72, (i - (N - 13)) / 7) : 1;
      w = aspectOf(photos[idx]) > 1 ? 3 : 2.1;
      m.position.set(c.x + Math.cos(a) * RX * rs, c.y + Math.sin(a) * RY * rs, z);
      m.lookAt(axis(z + 7));
    }
    m.scale.set(w, w / aspectOf(photos[idx]), 1);
    m.castShadow = true;
    m.userData = { idx, i, base: m.scale.clone(), h: 0, y: m.position.y, ph: i * 2.39996 };
    meshes.push(m); tunnel.add(m);
  }

  /* Studio floor: an invisible plane that only shows the shadows falling on it. */
  const floor1 = new THREE.Mesh(unit, new THREE.ShadowMaterial({ opacity: 0.3, depthWrite: false }));
  floor1.rotation.x = -Math.PI / 2; floor1.scale.set(120, 120, 1); floor1.receiveShadow = true; scene.add(floor1);
  /* Key light: sits behind and above the camera and travels with it. */
  const key1 = new THREE.DirectionalLight(0xffffff, 1); key1.castShadow = true;
  key1.shadow.mapSize.set(1024, 1024); key1.shadow.radius = 5; key1.shadow.bias = -0.0005;
  Object.assign(key1.shadow.camera, { left: -24, right: 24, top: 26, bottom: -26, near: 1, far: 110 }); key1.shadow.camera.updateProjectionMatrix();
  scene.add(key1, key1.target);

  /* Viewer pieces hang off the camera, so they stay centered on screen. */
  const veilMat = new THREE.MeshBasicMaterial({ color: VEIL, transparent: true, opacity: 0, depthTest: false, depthWrite: false, fog: false });
  const veil = new THREE.Mesh(unit, veilMat);
  veil.position.z = -DIST - 0.5; veil.scale.set(60, 60, 1); veil.renderOrder = 10; camera.add(veil);
  /* A soft blurred shadow that sits under the print in the viewer. */
  const dropCanvas = document.createElement('canvas'); dropCanvas.width = dropCanvas.height = 128;
  const dx = dropCanvas.getContext('2d')!; dx.shadowColor = '#000'; dx.shadowBlur = 22; dx.fillStyle = '#000'; dx.fillRect(34, 34, 60, 60);
  const dropMat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(dropCanvas), transparent: true, opacity: 0, depthTest: false, depthWrite: false, fog: false });
  const drop = new THREE.Mesh(unit, dropMat); drop.renderOrder = 10.5; camera.add(drop);

  /* A "sheet" is one print in the viewer: two halves that can be ripped apart. */
  interface Sheet extends THREE.Group { u: any; parts: THREE.Mesh[]; setOrder(order: number): void; }
  const sheetGeo = new THREE.PlaneGeometry(1, 1, SMALL ? 70 : 140, SMALL ? 70 : 140);
  function makeSheet(): Sheet {
    const u = { uMap: { value: thumbs[0] as THREE.Texture }, uP: { value: 0 }, uSeed: { value: 3 }, uDim: { value: 1 }, uA: { value: 1 }, uM: { value: new THREE.Vector2(0.02, 0.02) } };
    const g = new THREE.Group() as Sheet; g.visible = false; g.u = u; g.parts = [];
    [-1, 1].forEach(side => {
      const mat = new THREE.ShaderMaterial({ vertexShader: TEAR_VERTEX, fragmentShader: TEAR_FRAGMENT, uniforms: { ...u, uSide: { value: side } }, transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide });
      const m = new THREE.Mesh(sheetGeo, mat); m.frustumCulled = false; g.add(m); g.parts.push(m);
    });
    g.setOrder = order => g.parts.forEach(p => (p.renderOrder = order));
    camera.add(g); return g;
  }
  let top = makeSheet(), under = makeSheet();

  /* Sharp copies are made only when the viewer needs them, then discarded. */
  const hiCache = new Map<number, THREE.CanvasTexture>();
  function hi(i: number): THREE.CanvasTexture {
    if (!hiCache.has(i)) {
      const t: THREE.CanvasTexture = new THREE.CanvasTexture(photoCanvas(photos, i, SMALL ? 1000 : 1600, () => (t.needsUpdate = true)));
      t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; hiCache.set(i, t);
    }
    return hiCache.get(i)!;
  }
  function trimCache(cur: number) { const keep = [cur, (cur + 1) % UNIQUE, (cur - 1 + UNIQUE) % UNIQUE]; hiCache.forEach((t, k) => { if (!keep.includes(k)) { t.dispose(); hiCache.delete(k); } }); }

  /* Size a print to fit the screen and leave room for the caption. */
  function fit(i: number) {
    const vis = 2 * DIST * Math.tan(BASE_FOV * Math.PI / 360), pxW = vis / innerHeight, as = aspectOf(photos[i]);
    const h = Math.min(innerHeight - (SMALL ? 190 : 170), (innerWidth - (SMALL ? 32 : 120)) / as), w = h * as;
    return { w: w * pxW, h: h * pxW, y: (SMALL ? 26 : 14) * pxW };
  }
  function place(sheet: Sheet, i: number, k = 1) {
    const f = fit(i), mw = 0.022 * Math.min(f.w, f.h);
    sheet.position.set(0, f.y, -DIST); sheet.quaternion.identity();
    sheet.scale.set(f.w * k, f.h * k, f.h);
    sheet.u.uM.value.set(mw / f.w, mw / f.h);
  }
  function placeDrop(i: number) { const f = fit(i); drop.position.set(f.w * 0.015, f.y - f.h * 0.05, -DIST - 0.2); drop.scale.set(f.w * 2.1, f.h * 2.1, 1); }

  /* Small animation helper: runs fn(t) with t from 0 to 1, then done(). */
  const tweens: { s: number; d: number; fn: (t: number) => void; done?: () => void }[] = [];
  const tween = (ms: number, fn: (t: number) => void, done?: () => void) => { tweens.push({ s: performance.now(), d: REDUCED ? 1 : ms, fn, done }); };
  const runTweens = (now: number) => { for (let k = tweens.length - 1; k >= 0; k--) { const w = tweens[k], t = clamp((now - w.s) / w.d); w.fn(t); if (t >= 1) { tweens.splice(k, 1); w.done?.(); } } };

  /* Viewer states: tunnel -> busy -> inspect -> (tear or drag) -> inspect -> tunnel */
  let mode: 'tunnel' | 'busy' | 'inspect' | 'tear' | 'drag' = 'tunnel';
  let cur = 0, nextI = 0, hiddenMesh: THREE.Mesh | null = null, lastFocus: HTMLElement | null = null;
  const lock = (on: boolean) => { document.documentElement.style.overflow = on ? 'hidden' : ''; };

  function openViewer(i: number, mesh: THREE.Mesh | null = null) {
    if (mode !== 'tunnel') return;
    mode = 'busy'; cur = i; lastFocus = document.activeElement as HTMLElement | null; lock(true);
    canvas.classList.add('top'); hud.hidden = true; camera.fov = BASE_FOV; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
    const s = top; s.u.uMap.value = thumbs[i]; s.u.uP.value = 0; s.u.uDim.value = 1; s.setOrder(12); s.visible = true;
    place(s, i); placeDrop(i); const P1 = s.position.clone(), S1 = s.scale.clone(), Q1 = new THREE.Quaternion();
    let P0: THREE.Vector3, Q0: THREE.Quaternion, S0: THREE.Vector3;
    if (mesh && !REDUCED) {
      /* Start the print exactly where the tunnel photo is, so it seems to fly to the center. */
      P0 = camera.worldToLocal(mesh.getWorldPosition(new THREE.Vector3()));
      Q0 = camera.quaternion.clone().invert().multiply(mesh.getWorldQuaternion(new THREE.Quaternion()));
      S0 = new THREE.Vector3(mesh.scale.x, mesh.scale.y, S1.z); s.u.uA.value = 1; mesh.visible = false; hiddenMesh = mesh;
    } else { P0 = P1.clone().setY(P1.y - 1); Q0 = Q1.clone(); S0 = S1.clone().multiplyScalar(0.9); S0.z = S1.z; }
    const fade = !mesh;
    tween(950, t => {
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      s.position.lerpVectors(P0, P1, e); s.quaternion.copy(Q0).slerp(Q1, e); s.scale.lerpVectors(S0, S1, e);
      veilMat.opacity = smooth(clamp(t * 1.4)); dropMat.opacity = 0.55 * smooth(clamp(t * 1.6 - 0.6)); if (fade) s.u.uA.value = clamp(t * 2);
    }, () => {
      s.u.uMap.value = hi(i); s.u.uA.value = 1; mode = 'inspect'; o.onCaption(i); o.onViewer(true);
      setTimeout(() => { hi((i + 1) % UNIQUE); }, 150);
    });
  }

  function closeViewer() {
    if (mode !== 'inspect') return;
    mode = 'busy'; o.onViewer(false); const s = top, S1 = s.scale.clone();
    tween(480, t => { s.u.uA.value = 1 - t; s.scale.set(S1.x * (1 - t * 0.08), S1.y * (1 - t * 0.08), S1.z); veilMat.opacity = 1 - t; dropMat.opacity = 0.55 * (1 - t); }, () => {
      s.visible = false; s.u.uA.value = 1; if (hiddenMesh) { hiddenMesh.visible = true; hiddenMesh = null; }
      canvas.classList.remove('top'); lock(false); mode = 'tunnel'; lastFocus?.focus?.({ preventScroll: true });
    });
  }

  /* Set up the next print beneath the current one before ripping. */
  function prepareTear(dir: number) {
    nextI = (cur + dir + UNIQUE) % UNIQUE;
    const b = under; b.u.uMap.value = hi(nextI); b.u.uP.value = 0; b.u.uA.value = 1; b.setOrder(11); b.visible = true;
    top.u.uSeed.value = Math.random() * 90; top.setOrder(12); placeDrop(nextI); setTear(0);
  }
  function setTear(p: number) { top.u.uP.value = p; const e = smooth(clamp(p * 1.15)); under.u.uDim.value = 0.42 + 0.58 * e; place(under, nextI, 0.95 + 0.05 * e); }
  function finishTear() {
    top.visible = false; top.u.uP.value = 0; [top, under] = [under, top]; top.setOrder(12); top.u.uDim.value = 1;
    cur = nextI; o.onCaption(cur); mode = 'inspect'; trimCache(cur); setTimeout(() => { if (mode === 'inspect') hi((cur + 1) % UNIQUE); }, 120);
  }
  function tearTo(dir: number) {
    if (mode !== 'inspect') return;
    mode = 'tear'; prepareTear(dir);
    tween(1250, t => setTear(t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2), finishTear);
  }

  /* Dragging down scrubs the rip by hand. Release early and it heals. */
  let dragY: number | null = null, dragP = 0;
  listen(canvas, 'pointerdown', (e: PointerEvent) => { if (mode === 'inspect') { dragY = e.clientY; dragP = 0; canvas.setPointerCapture(e.pointerId); } });
  listen(canvas, 'pointermove', (e: PointerEvent) => {
    if (dragY === null) return; const dy = e.clientY - dragY;
    if (mode === 'inspect' && dy > 8) { mode = 'drag'; prepareTear(1); }
    if (mode === 'drag') { dragP = clamp((dy - 8) / (innerHeight * 0.75)); setTear(dragP); }
  });
  const endDrag = () => {
    if (dragY === null) return; dragY = null; if (mode !== 'drag') return; mode = 'tear'; const p0 = dragP;
    if (p0 > 0.22) tween(650 * (1 - p0) + 120, t => setTear(lerp(p0, 1, t)), finishTear);
    else tween(260, t => setTear(lerp(p0, 0, t)), () => { under.visible = false; placeDrop(cur); mode = 'inspect'; });
  };
  listen(canvas, 'pointerup', endDrag); listen(canvas, 'pointercancel', endDrag);
  listen(window, 'wheel', (e: WheelEvent) => { if (mode === 'inspect' && Math.abs(e.deltaY) > 25) tearTo(e.deltaY > 0 ? 1 : -1); }, { passive: true });
  listen(window, 'keydown', (e: KeyboardEvent) => {
    if (mode !== 'inspect') return;
    if (e.key === 'Escape') closeViewer();
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); tearTo(1); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); tearTo(-1); }
  });

  /* Picking: find which tunnel photo sits under the pointer. */
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(0, 0);
  let mouseIn = false, hovered: THREE.Object3D | null = null, lastPtr: PointerEvent | null = null;
  const pick = (cx: number, cy: number) => {
    ray.setFromCamera(new THREE.Vector2(cx / innerWidth * 2 - 1, -(cy / innerHeight) * 2 + 1), camera);
    const h = ray.intersectObjects(meshes.filter(m => m.visible))[0];
    return h && h.distance < 26 ? h.object : null;
  };
  listen(window, 'pointermove', (e: PointerEvent) => { ptr.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); mouseIn = e.pointerType === 'mouse'; lastPtr = e; });
  listen(document, 'click', (e: MouseEvent) => {
    const target = e.target as Element;
    if (mode !== 'tunnel' || scrollY > track.offsetHeight - innerHeight * 0.9 || target.closest('a,button,input,select,textarea,label')) return;
    const m = pick(e.clientX, e.clientY); if (m) openViewer(m.userData['idx'], m as THREE.Mesh);
  });

  /* ===================== SCENE 2: the film strip ========================
     WHAT: A ribbon of 35mm film that starts at the end of the tunnel, spirals
           down the right side of the page, and winds into a roll at the bottom.
     WHY:  It ties the 3D hero to the normal page sections below it.
     HOW:  The ribbon follows a path made of 5 joined parts:
             0. head   - a wide curve near the camera. The 5 photos land here.
             1. funnel - the curve tightens and swings over to the right side.
             2. helix  - a steady spiral running down the page.
             3. land   - the spiral widens and slows as it reaches the floor.
             4. coil   - a flat spiral, winding inward like a roll of film.
           Every point on the path is "a center + a radius + an angle". Adding
           the same amount (phi) to every angle turns the whole strip, which
           makes it look like it is screwing down the page as you scroll.     */
  const scene2 = new THREE.Scene();
  const cam2 = new THREE.PerspectiveCamera(30, 1, 0.5, 300);
  const D2 = 5 / Math.tan(Math.PI / 12);   // camera distance where the screen is exactly 10 units tall
  const P0 = 0.384, P1 = 0.8;              // camera tilt: 22 degrees down the page, 46 degrees over the coil
  scene2.add(new THREE.HemisphereLight(0xffffff, 0xcfc8bc, 0.95));
  const key2 = new THREE.DirectionalLight(0xffffff, 0.55); key2.castShadow = true;
  key2.shadow.mapSize.set(1024, 1024); key2.shadow.radius = 4; key2.shadow.bias = -0.0005;
  scene2.add(key2, key2.target);
  const filmTex = (withPhotos: boolean) => {
    const t: THREE.CanvasTexture = new THREE.CanvasTexture(makeFilm(photos, FINAL, withPhotos, () => (t.needsUpdate = true)));
    t.wrapS = THREE.RepeatWrapping; t.anisotropy = 8; return t;
  };
  const filmMat = (map: THREE.Texture) => new THREE.MeshStandardMaterial({ map, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.3, metalness: 0.1 });
  const blankFilm = new THREE.Mesh(new THREE.BufferGeometry(), filmMat(filmTex(false)));   // start of the roll, no pictures yet
  const photoFilm = new THREE.Mesh(new THREE.BufferGeometry(), filmMat(filmTex(true)));    // the rest, 5 photos repeating
  [blankFilm, photoFilm].forEach(m => { m.castShadow = true; m.frustumCulled = false; scene2.add(m); });
  /* Two invisible shadow catchers: the page behind the strip, and the floor under the coil. */
  const wallMat = new THREE.ShadowMaterial({ opacity: 0, depthWrite: false });
  const wall = new THREE.Mesh(unit, wallMat); wall.receiveShadow = true; scene2.add(wall);
  const floor2 = new THREE.Mesh(unit, new THREE.ShadowMaterial({ opacity: 0.32, depthWrite: false })); floor2.rotation.x = -Math.PI / 2; floor2.receiveShadow = true; scene2.add(floor2);
  /* Flyers: the five photos while they travel from the tunnel to the film.
     Each is two planes back to back, so the photo also shows through the film. */
  const flyers = FINAL.map(idx => {
    const g = new THREE.Group(); g.visible = false;
    ([[THREE.FrontSide, 0.012], [THREE.BackSide, -0.012]] as [THREE.Side, number][]).forEach(([side, z]) => {
      const m = new THREE.Mesh(unit, new THREE.MeshBasicMaterial({ map: thumbs[idx], side })); m.position.z = z; m.castShadow = true; g.add(m);
    });
    scene2.add(g); return g;
  });

  const S: any = { n: 0 };   // everything about the current strip path lives here
  let lw = 0, lh = 0;        // the screen size the 3D was last sized for

  function buildStrip() {
    const VH = lh, U = VH / 10, halfW = 5 * lw / lh, narrow = halfW < 4.2;
    /* Sizes in "units" (1 unit = one tenth of the screen height).
       fw = film width, R = spiral radius, ax = how far right the spiral sits,
       Rc / rIn = outer and inner radius of the final roll, nC = turns in the roll. */
    const d = narrow
      ? { fw: 0.32, R: 0.27, ax: halfW - 0.2, R0: 3.2, zf: 8, d1: 4.2, Rc: Math.min(1.15, halfW * 0.5), rIn: 0.22, nC: 6, cxEnd: 0 }
      : { fw: 0.5, R: 0.8, ax: halfW - 1.3, R0: 6, zf: 7, d1: 7, Rc: 1.9, rIn: 0.32, nC: 7, cxEnd: halfW * 0.4 };
    const pitch = d.fw * 38 / 35;            // distance from one frame to the next
    S.d = d; S.pitch = pitch; S.L = 5 * pitch; S.frameLen = pitch * 36 / 38; S.frameH = d.fw * 24 / 35; S.halfW = halfW;
    /* --strip tells the CSS how much room to leave on the right so text stays clear of the film. */
    document.documentElement.style.setProperty('--strip', Math.round((halfW - d.ax + d.R + d.fw * 0.4) * U) + 'px');
    S.trackEnd = track.offsetHeight - VH;
    /* maxS: the scroll position where the "wrap" section is centered on screen. The film lands here. */
    const landing = document.getElementById('roll');
    const box = landing ? landing.getBoundingClientRect() : { top: document.documentElement.scrollHeight - scrollY - VH, height: VH };
    S.maxS = Math.max(S.trackEnd + VH, Math.min(document.documentElement.scrollHeight - VH, box.top + scrollY + box.height / 2 - VH / 2));
    /* ty: turns a scroll position into the height the film camera looks at.
       Past the landing spot (the footer) the roll simply scrolls away with the page. */
    S.ty = (s: number) => -(Math.min(s, S.maxS) - S.trackEnd) / (U * Math.cos(P0)) - Math.max(0, s - S.maxS) / (U * Math.cos(P1));
    const yHead = d.zf * Math.tan(P0) - 0.4;                 // puts the 5 frames mid-screen when the tunnel ends
    const yF = S.ty(S.maxS) - 1 / Math.cos(P1);              // height of the coil: just below mid-screen
    S.yFloor = yF - d.fw / 2; S.yHead = yHead;
    /* n1, n3: how many turns the funnel and the landing make. More turns = more coiled. */
    let d1 = d.d1; const n1 = 2.25, n3 = 2.5, c = 1.6 / n1, need = (k: number) => k * (1 + c * n3 / 1.6 + 0.5 * c);
    if (yHead - yF < need(d1)) d1 = Math.max(0.3, (yHead - yF) / need(1));   // very short pages: squash the path to fit
    const turnH = c * d1, d3 = turnH * n3 / 1.6;             // chosen so the parts join smoothly
    const z0 = d.zf - d.R0, a0 = -6.5 * pitch, a1 = 4 * pitch;
    const thB = Math.PI / 2 - a1 / d.R0, th1 = thB - 2 * Math.PI * n1;
    const y1 = yHead - d1, y2 = yF + d3, th2 = th1 - 2 * Math.PI * Math.max(0, y1 - y2) / turnH, th3 = th2 - 2 * Math.PI * n3;
    S.z0 = z0;
    /* Each part returns [centerX, centerZ, radius, height, angle] for t from 0 to 1. */
    const parts: ((t: number) => number[])[] = [
      t => [0, z0, d.R0, yHead, Math.PI / 2 - lerp(a0, a1, t) / d.R0],
      t => { const e = smooth(t); return [lerp(0, d.ax, e), lerp(z0, 0, e), lerp(d.R0, d.R, e), yHead - d1 * Math.pow(t, 1.6), thB - 2 * Math.PI * n1 * t]; },
      t => [d.ax, 0, d.R, lerp(y1, y2, t), lerp(th1, th2, t)],
      t => { const e = smooth(t); return [lerp(d.ax, d.cxEnd, e), 0, lerp(d.R, d.Rc, e), yF + d3 * Math.pow(1 - t, 1.6), th2 - 2 * Math.PI * n3 * t]; },
      t => { const th = th3 - 2 * Math.PI * d.nC * t; return [d.cxEnd, 0, lerp(d.Rc, d.rIn, t) + Math.sin(th * 2.3) * 0.025 * 4 * t * (1 - t), yF, th]; }
    ];
    /* Walk along the path in tiny steps and keep one sample every "ds" units. */
    const ds = narrow ? 0.06 : 0.075, rows: number[][] = []; let total = 0, next = 0, px = 0, py = 0, pz = 0, first = true;
    S.coilStart = 0;
    parts.forEach((f, pi) => {
      for (let j = pi ? 1 : 0; j <= 3000; j++) {
        const v = f(j / 3000), x = v[0] + v[2] * Math.cos(v[4]), z = v[1] + v[2] * Math.sin(v[4]);
        if (!first) total += Math.hypot(x - px, v[3] - py, z - pz);
        first = false; px = x; py = v[3]; pz = z;
        if (total >= next) { if (pi === 4 && !S.coilStart) S.coilStart = rows.length; v.push(total); rows.push(v); next += ds; }
      }
    });
    const n = rows.length; S.n = n;
    S.cx = new Float32Array(n); S.cz = new Float32Array(n); S.R = new Float32Array(n); S.y = new Float32Array(n); S.th = new Float32Array(n); S.taper = new Float32Array(n);
    S.split = n - 1;
    rows.forEach((v, i) => {
      S.cx[i] = v[0]; S.cz[i] = v[1]; S.R[i] = v[2]; S.y[i] = v[3]; S.th[i] = v[4];
      S.taper[i] = 0.1 + 0.9 * smooth(clamp(v[5] / (2.2 * pitch)));        // the narrow "tongue" at the start of a roll
      if (S.split === n - 1 && v[5] >= 9 * pitch) S.split = i;             // blank film ends just after the 5 landing frames
    });
    /* One set of points is shared by both meshes; each mesh draws its own range. */
    S.P = new Float32Array(n * 3);
    S.pos = new THREE.BufferAttribute(new Float32Array(n * 6), 3); S.nor = new THREE.BufferAttribute(new Float32Array(n * 6), 3); S.uv = new THREE.BufferAttribute(new Float32Array(n * 4), 2);
    const idx = new Uint32Array((n - 1) * 6);
    for (let i = 0; i < n - 1; i++) { const a = 2 * i; idx.set([a, a + 1, a + 2, a + 1, a + 3, a + 2], i * 6); }
    const index = new THREE.BufferAttribute(idx, 1);
    [blankFilm, photoFilm].forEach(m => { m.geometry.dispose(); const g = m.geometry = new THREE.BufferGeometry(); g.setAttribute('position', S.pos); g.setAttribute('normal', S.nor); g.setAttribute('uv', S.uv); g.setIndex(index); });
    blankFilm.geometry.setDrawRange(0, S.split * 6);
    /* Shadow catchers and the light's coverage. */
    const wallTop = yHead + 14, wallH = wallTop - S.yFloor;
    wall.position.set(0, wallTop - wallH / 2, -(d.R + 0.4)); wall.scale.set(halfW * 2 + 40, wallH, 1);
    floor2.position.set(d.cxEnd, S.yFloor, 0); floor2.scale.set(120, 120, 1);
    Object.assign(key2.shadow.camera, { left: -(halfW + 8), right: halfW + 8, top: 14, bottom: -14, near: 1, far: 110 }); key2.shadow.camera.updateProjectionMatrix();
    cam2.aspect = lw / lh; cam2.updateProjectionMatrix();
  }

  /* Reusable scratch objects, so the animation loop creates no garbage. */
  const V = () => new THREE.Vector3(), Q = () => new THREE.Quaternion();
  const vA = V(), vB = V(), vC = V(), vR = V(), vU = V(), vF = V(), vT = V(), qA = Q(), qB = Q(), mB = new THREE.Matrix4();
  const V_UP = new THREE.Vector3(0, 1, 0);
  const L_WALL = new THREE.Vector3(5, 8, 14).normalize(), L_FLOOR = new THREE.Vector3(5, 9, -6).normalize();

  /* Runs every frame: aims the film camera, turns the strip, rebuilds the ribbon. */
  function updateStrip(s: number) {
    const VH = lh, n: number = S.n, d = S.d;
    const e = smooth(clamp((s - (S.maxS - 1.4 * VH)) / (1.4 * VH)));      // 0 for most of the page, 1 at the landing
    const tilt = lerp(P0, P1, e), ty: number = S.ty(s);
    cam2.position.set(0, ty + D2 * Math.sin(tilt), D2 * Math.cos(tilt)); cam2.lookAt(0, ty, 0); cam2.updateMatrixWorld();
    /* Light: from the front while the strip hangs by the page, from behind over the coil (longer floor shadows). */
    vA.copy(L_WALL).lerp(L_FLOOR, e).normalize();
    key2.target.position.set(0, ty, 0); key2.position.set(vA.x * 50, ty + vA.y * 50, vA.z * 50);
    wallMat.opacity = 0.2 * (1 - e) * smooth(clamp((s - (S.trackEnd - 0.2 * VH)) / (0.8 * VH)));
    const phi = REDUCED ? 0 : -(s - S.trackEnd) / VH * 1.1;                // how far the whole strip has turned
    S.phi = phi;

    /* 1. Where is each sample point right now? */
    const P: Float32Array = S.P;
    for (let i = 0; i < n; i++) { const a = S.th[i] + phi, r = S.R[i]; P[3 * i] = S.cx[i] + r * Math.cos(a); P[3 * i + 1] = S.y[i]; P[3 * i + 2] = S.cz[i] + r * Math.sin(a); }
    /* 2. Turn the line of points into a flat ribbon with two edges. */
    const pos: Float32Array = S.pos.array, nor: Float32Array = S.nor.array, uv: Float32Array = S.uv.array, hw = d.fw / 2;
    let cum = 0, cumSplit = 0;
    for (let i = 0; i < n; i++) {
      const i0 = i ? i - 1 : 0, i1 = i < n - 1 ? i + 1 : i, a = S.th[i] + phi;
      let tx = P[3 * i1] - P[3 * i0], tyy = P[3 * i1 + 1] - P[3 * i0 + 1], tz = P[3 * i1 + 2] - P[3 * i0 + 2];
      const tl = Math.hypot(tx, tyy, tz) || 1; tx /= tl; tyy /= tl; tz /= tl;                   // T: direction the film runs
      const nx = Math.cos(a), nz = Math.sin(a);                                                 // outward direction
      let wx = -nz * tyy, wy = nz * tx - nx * tz, wz = nx * tyy;                                // W: across the film
      const wl = Math.hypot(wx, wy, wz) || 1, k = hw * S.taper[i] / wl; wx *= k; wy *= k; wz *= k;
      const fx = tyy * wz - tz * wy, fy = tz * wx - tx * wz, fz = tx * wy - tyy * wx, fl = Math.hypot(fx, fy, fz) || 1;   // face direction, for lighting
      if (i) cum += Math.hypot(P[3 * i] - P[3 * i - 3], P[3 * i + 1] - P[3 * i - 2], P[3 * i + 2] - P[3 * i - 1]);
      if (i === S.split) cumSplit = cum;
      const q = 6 * i, x = P[3 * i], y = P[3 * i + 1], z = P[3 * i + 2];
      pos[q] = x + wx; pos[q + 1] = y + wy; pos[q + 2] = z + wz; pos[q + 3] = x - wx; pos[q + 4] = y - wy; pos[q + 5] = z - wz;
      nor[q] = nor[q + 3] = fx / fl; nor[q + 1] = nor[q + 4] = fy / fl; nor[q + 2] = nor[q + 5] = fz / fl;
      const u = (i < S.split ? cum : cum - cumSplit) / S.L;                                     // how far along the film, in 5-frame lengths
      uv[4 * i] = u; uv[4 * i + 1] = 1; uv[4 * i + 2] = u; uv[4 * i + 3] = 0;
    }
    S.pos.needsUpdate = S.nor.needsUpdate = S.uv.needsUpdate = true;
    /* 3. Only draw the strip down to just below the screen, then wind the coil in over the last stretch of scrolling. */
    let lo = 0, hiI: number = S.coilStart; const limit = ty - 13;
    while (lo < hiI) { const m = (lo + hiI) >> 1; if (S.y[m] < limit) hiI = m; else lo = m + 1; }
    let rev = lo;
    if (rev >= S.coilStart) rev = S.coilStart + Math.round((n - 1 - S.coilStart) * clamp((s - (S.maxS - 0.72 * VH)) / (0.64 * VH)));
    /* 4. At the very end the loose film above is pulled in, so only the roll is left on the floor. */
    let start: number = S.split; const e3 = smooth(clamp((s - (S.maxS - 0.42 * VH)) / (0.4 * VH)));
    if (e3 > 0) { const cut = lerp(ty + 9, S.y[S.coilStart] + 0.02, e3); lo = S.split; hiI = S.coilStart; while (lo < hiI) { const m = (lo + hiI) >> 1; if (S.y[m] < cut) hiI = m; else lo = m + 1; } start = lo; }
    blankFilm.visible = e3 <= 0;
    photoFilm.geometry.setDrawRange(start * 6, Math.max(0, rev - start) * 6);
  }

  /* Moves the five flyers between their tunnel spot (g = 0) and their film frame (g = 1). */
  function updateFlyers(g: number) {
    camera.updateMatrixWorld(); camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
    const d = S.d, aspect = lw / lh, tan1 = Math.tan(camera.fov * Math.PI / 360);
    cam2.getWorldDirection(vF); vR.set(1, 0, 0).applyQuaternion(cam2.quaternion); vU.set(0, 1, 0).applyQuaternion(cam2.quaternion);
    flyers.forEach((fly, k) => {
      const mesh = finals[k];
      const t = REDUCED ? (g >= 1 ? 1 : 0) : smooth(clamp((g - k * 0.11) / 0.56));   // each photo leaves a little after the last
      mesh.visible = t <= 0 && mesh !== hiddenMesh; fly.visible = t > 0;
      if (t <= 0) return;
      /* Start: copy where the tunnel photo appears on screen into the film scene. */
      mesh.getWorldPosition(vA); vB.copy(vA).applyMatrix4(camera.matrixWorldInverse); const depth = -vB.z;
      vA.project(camera);
      const h0 = mesh.scale.y / (2 * depth * tan1) * 10, w0 = h0 * 1.5;
      vB.copy(cam2.position).addScaledVector(vF, D2).addScaledVector(vR, vA.x * 5 * aspect).addScaledVector(vU, vA.y * 5);
      qA.copy(cam2.quaternion).multiply(qB.copy(camera.quaternion).invert()).multiply(mesh.quaternion);
      /* End: frame number k on the head of the strip. */
      const th = Math.PI / 2 - (k - 2) * S.pitch / d.R0 + S.phi, c = Math.cos(th), sn = Math.sin(th);
      vC.set(d.R0 * c, S.yHead, S.z0 + d.R0 * sn);
      mB.makeBasis(vA.set(sn, 0, -c), V_UP, vT.set(c, 0, sn)); qB.setFromRotationMatrix(mB);
      /* Blend, with a swoop toward the camera in the middle of the flight. */
      fly.position.lerpVectors(vB, vC, t); vA.copy(cam2.position).sub(fly.position).normalize(); fly.position.addScaledVector(vA, Math.sin(Math.PI * t) * 1.8);
      fly.quaternion.copy(qA).slerp(qB, t);
      fly.scale.set(lerp(w0, S.frameLen, t), lerp(h0, S.frameH, t), 1);
    });
  }

  /* Resizing, ignoring small phone address-bar height changes. */
  let buildKey = '';
  const pageKey = () => lw + '|' + lh + '|' + document.documentElement.scrollHeight;
  function resize(force = false) {
    if (!force && innerWidth === lw && Math.abs(innerHeight - lh) < 120 && lw) return;
    lw = innerWidth; lh = innerHeight; renderer.setSize(lw, lh, false); camera.aspect = lw / lh; camera.updateProjectionMatrix();
    if (mode === 'inspect') { place(top, cur); placeDrop(cur); }
    buildStrip(); buildKey = pageKey();
  }
  listen(window, 'resize', () => resize()); resize(true);
  /* The page changes height after load (fonts, images, gallery pages). Rebuild the strip path when it does. */
  let rebuildTimer = 0;
  const watcher = new ResizeObserver(() => {
    clearTimeout(rebuildTimer);
    rebuildTimer = window.setTimeout(() => { if (pageKey() !== buildKey) { buildStrip(); buildKey = pageKey(); } }, 150);
  });
  watcher.observe(document.body);

  /* ===================== The animation loop ===================== */
  let smoothY = scrollY, lastY = scrollY, fov = BASE_FOV, funnel = 0, stripY = scrollY, raf = 0;

  function frame(now: number) {
    raf = requestAnimationFrame(frame); runTweens(now);
    const y = scrollY, vh = innerHeight, trackEnd = track.offsetHeight - vh;

    if (mode === 'tunnel') {
      smoothY += (y - smoothY) * (REDUCED ? 1 : 0.09);
      const prog = clamp(smoothY / trackEnd), past = Math.max(0, smoothY - trackEnd) / vh;
      /* Headlines: each fades in at data-a and out at data-b (0 = top of the tunnel, 1 = end). */
      says.forEach(el => { const a = +el.dataset['a']!, b = +el.dataset['b']!, m = 0.035; el.style.opacity = String(clamp((prog - a) / m) * clamp((b - prog) / m)); });
      /* The camera slows down as it reaches the last five photos, then waits while they fly off. */
      const travel = prog <= 0.6 ? prog : 0.6 + 0.24 * (1 - Math.pow(1 - (prog - 0.6) / 0.4, 2));
      const z = lerp(START, END, travel / 0.84) - past * 5, c = axis(z), look = axis(z - 9);
      const mx = (mouseIn && !REDUCED) ? ptr.x : 0, my = (mouseIn && !REDUCED) ? ptr.y : 0;
      camera.position.set(c.x + mx * 0.55, c.y + my * 0.35, z);
      camera.lookAt(look.x + mx * 1.3, look.y + my * 0.9, look.z);
      if (!REDUCED) camera.rotateZ(Math.sin(z * 0.035) * 0.05);
      const v = clamp(Math.abs(smoothY - lastY) / 42); lastY = smoothY;
      fov += (BASE_FOV + (REDUCED ? 0 : v * 15) - fov) * 0.12; camera.fov = fov; camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
      /* Floor and key light follow the camera, so shadows are always under the photos you can see. */
      floor1.position.set(c.x, FLOOR_Y, z - 20);
      key1.target.position.set(c.x, FLOOR_Y, z - 14); key1.position.set(c.x - 16, FLOOR_Y + 28, z + 14);

      const inTunnel = y < trackEnd + vh * 0.4;
      const over = lastPtr ? (lastPtr as PointerEvent).target as Element | null : null;
      hovered = (mouseIn && lastPtr && inTunnel && !over?.closest?.('a,button')) ? pick((lastPtr as PointerEvent).clientX, (lastPtr as PointerEvent).clientY) : null;
      document.body.style.cursor = hovered ? 'zoom-in' : '';
      meshes.forEach(m => {
        const u = m.userData; u['h'] += ((m === hovered ? 1 : 0) - u['h']) * 0.14;
        const k = 1 + u['h'] * 0.09; m.scale.set(u['base'].x * k, u['base'].y * k, 1);
        if (!REDUCED) m.position.y = u['y'] + Math.sin(now * 0.0005 + u['ph']) * 0.08;
      });
      funnel = clamp((prog - 0.88) / 0.12);
      if (y < trackEnd) {
        hud.hidden = false;
        if (funnel > 0) hud.innerHTML = '<b>ROLL 01</b> Loading 5 frames onto film';
        else {
          const i = hovered ? hovered.userData['i'] : clamp(Math.round((START - 4 - z) / GAP), 0, N - 6), p = photos[meshes[i].userData['idx']];
          hud.innerHTML = `<b>${String(i + 1).padStart(2, '0')}A</b> ${p.title} · ${p.settings}`;
        }
      } else hud.hidden = true;
    }

    /* Film strip: follows the scroll with a little glide. */
    stripY += (y - stripY) * (REDUCED ? 1 : 0.22);
    const show1 = y < trackEnd + vh * 0.5, show2 = y > trackEnd - vh * 1.1;
    tunnel.visible = floor1.visible = show1;
    if (show2) { updateStrip(stripY); if (mode === 'tunnel') updateFlyers(funnel); }

    /* Draw. Normally: tunnel first, film on top. In the viewer: film first, so the print covers it. */
    renderer.clear();
    if (mode === 'tunnel') {
      if (show1) renderer.render(scene, camera);
      if (show2) { renderer.clearDepth(); renderer.render(scene2, cam2); }
    } else {
      if (show2) { renderer.render(scene2, cam2); renderer.clearDepth(); }
      renderer.render(scene, camera);
    }
  }
  says[0].style.opacity = '1';
  raf = requestAnimationFrame(frame);

  return {
    openViewer: (index: number) => openViewer(index, null),
    closeViewer,
    tear: tearTo,
    destroy() {
      cancelAnimationFrame(raf); abort.abort(); watcher.disconnect(); clearTimeout(rebuildTimer);
      lock(false); document.body.style.cursor = '';
      renderer.dispose();
    }
  };
}
