/* ==========================================================================
   WHAT: Turns an entry from photos.ts into something that can be shown:
         - photoUrl()    -> an address for a normal <img> tag
         - photoCanvas() -> a canvas the 3D code can use as a texture
   WHY:  The rest of the app should not care whether a photo is a real image
         (it has a src) or still a computer-drawn stand-in (src is '').
   HOW:  If the photo has a src, the real image is loaded and drawn to fill
         the canvas, cropped from the center like CSS "object-fit: cover".
         If it has no src, or the image fails to load, the stand-in is drawn.
   ========================================================================== */
import { Photo } from '../data/photos';
import { drawStandIn } from './stand-in-photos';

/** Width divided by height: tall photos are 4:5, wide photos are 3:2. */
export const aspectOf = (photo: Photo): number => (photo.portrait ? 4 / 5 : 3 / 2);

/* Each real image is downloaded once and shared by everything that needs it. */
const imageCache = new Map<string, Promise<HTMLImageElement>>();
function loadImage(src: string): Promise<HTMLImageElement> {
  let pending = imageCache.get(src);
  if (!pending) {
    pending = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';   // needed before a browser lets 3D code use an image from another site
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Could not load ' + src));
      img.src = src;
    });
    imageCache.set(src, pending);
  }
  return pending;
}

/** Draws an image so it fills the box (x, y, w, h), cropping the overflow evenly. */
export function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number): void {
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const sw = w / scale, sh = h / scale;
  ctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, x, y, w, h);
}

/**
 * Returns a canvas showing photo number `index`, `width` pixels wide.
 * The canvas is returned right away. If the photo has a real image, it is
 * drawn in once it has downloaded, and then onReady() is called.
 */
export function photoCanvas(photos: Photo[], index: number, width: number, onReady?: () => void): HTMLCanvasElement {
  const photo = photos[index];
  const height = Math.round(width / aspectOf(photo));
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const [scene, palette] = photo.standIn ?? ['dunes', 'mist'];
  if (photo.src) {
    ctx.fillStyle = '#d8d3ca'; ctx.fillRect(0, 0, width, height);          // plain gray until the image arrives
    loadImage(photo.src)
      .then(img => { drawCover(ctx, img, 0, 0, width, height); onReady?.(); })
      .catch(() => { drawStandIn(ctx, scene, palette, index, width, height); onReady?.(); });
  } else {
    drawStandIn(ctx, scene, palette, index, width, height);
  }
  return canvas;
}

/** Returns an address for an <img> tag: the real src, or a stand-in drawing. */
const standInUrls = new Map<number, string>();
export function photoUrl(photos: Photo[], index: number): string {
  const photo = photos[index];
  if (photo.src) return photo.src;
  if (!standInUrls.has(index)) standInUrls.set(index, photoCanvas(photos, index, 480).toDataURL('image/jpeg', 0.82));
  return standInUrls.get(index)!;
}
