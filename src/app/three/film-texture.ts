/* ==========================================================================
   WHAT: Draws one repeating length of 35mm film: 5 frames, sprocket holes,
         and the yellow edge printing.
   WHY:  The film strip is a long ribbon, and this picture repeats along it.
         This is where photos get "baked into" the strip.
   HOW:  All sizes come from real film (35mm wide, 36x24mm frames, 8 holes per
         frame). The holes are erased to transparent, so you can see through.
         withPhotos = false draws blank film for the start of the roll.
         To change the yellow edge text, edit EDGE_TEXT below.
   ========================================================================== */
import { Photo } from '../data/photos';
import { photoCanvas } from './photo-source';

const EDGE_TEXT = 'HALF STOP 400';
const EDGE_COLOR = '#f2b705';

export function makeFilm(photos: Photo[], filmPhotos: number[], withPhotos: boolean, onReady?: () => void): HTMLCanvasElement {
  const canvas = document.createElement('canvas'); canvas.width = 2048; canvas.height = 512;
  const x = canvas.getContext('2d')!;
  const mm = 512 / 35;            // pixels per millimeter of film
  const CYCLE = 190 * mm;         // 5 frames, 38mm apart
  x.scale(2048 / CYCLE, 1);
  /* Film base: dark brown, slightly lighter at the edges. */
  const base = x.createLinearGradient(0, 0, 0, 512);
  base.addColorStop(0, '#33231a'); base.addColorStop(0.5, '#1c130d'); base.addColorStop(1, '#33231a');
  x.fillStyle = base; x.fillRect(0, 0, CYCLE, 512);
  x.font = `600 ${1.25 * mm}px ui-monospace,Menlo,Consolas,monospace`; x.textBaseline = 'alphabetic';
  for (let k = 0; k < 5; k++) {
    const fx = (k * 38 + 1) * mm;
    if (withPhotos) {
      /* Draw the photo into its frame now, and again when a real image finishes downloading. */
      const drawFrame = () => x.drawImage(photo, fx, 5.5 * mm, 36 * mm, 24 * mm);
      const photo = photoCanvas(photos, filmPhotos[k], 640, () => { drawFrame(); onReady?.(); });
      drawFrame();
    }
    x.fillStyle = EDGE_COLOR;
    x.fillText(String(k + 1), fx + 3 * mm, 5.2 * mm);
    x.fillText('▸ ' + (k + 1) + 'A', fx + 21 * mm, 5.2 * mm);
    x.fillText(EDGE_TEXT, fx + 9 * mm, 30.9 * mm);
  }
  /* Punch the sprocket holes. "destination-out" erases instead of painting. */
  x.globalCompositeOperation = 'destination-out'; x.fillStyle = '#000';
  const hole = (hx: number, hy: number) => {
    const w = 2.8 * mm, h = 2 * mm, r = 0.45 * mm;
    x.beginPath(); x.moveTo(hx + r, hy);
    x.arcTo(hx + w, hy, hx + w, hy + h, r); x.arcTo(hx + w, hy + h, hx, hy + h, r);
    x.arcTo(hx, hy + h, hx, hy, r); x.arcTo(hx, hy, hx + w, hy, r); x.fill();
  };
  for (let j = 0; j < 40; j++) { hole((j * 4.75 + 1) * mm, 1.6 * mm); hole((j * 4.75 + 1) * mm, 31.4 * mm); }
  x.globalCompositeOperation = 'source-over';   // back to normal painting, for late-arriving photos
  return canvas;
}
