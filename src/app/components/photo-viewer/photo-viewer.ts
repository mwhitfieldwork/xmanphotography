/* ==========================================================================
   WHAT: The buttons and caption shown on top of a photo in the tear viewer:
         close, previous, next, "Order print", and the photo's details.
   WHY:  The 3D code draws the print and the rip. This component is only the
         normal HTML that sits over it.
   HOW:  - It appears when studio.viewerOpen() is true.
         - `photo` is whichever photo the viewer is on right now.
         - The buttons call StudioService, which passes the request to the 3D.
         - Arrow keys, Escape, the scroll wheel and dragging are handled by
           the 3D code itself (studio-engine.ts).
   ========================================================================== */
import { Component, ElementRef, computed, effect, inject, viewChild } from '@angular/core';
import { PHOTOS } from '../../data/photos';
import { StudioService } from '../../services/studio.service';

@Component({
  selector: 'app-photo-viewer',
  templateUrl: './photo-viewer.html',
  styleUrl: './photo-viewer.scss'
})
export class PhotoViewer {
  protected readonly studio = inject(StudioService);

  /** The photo being shown. */
  protected readonly photo = computed(() => PHOTOS[this.studio.viewerIndex()]);

  /** e.g. "03/24 · White Sands, New Mexico · 85mm f/4 1/800" */
  protected readonly details = computed(() => {
    const number = String(this.studio.viewerIndex() + 1).padStart(2, '0');
    return `${number}/${PHOTOS.length} · ${this.photo().place} · ${this.photo().settings}`;
  });

  private readonly closeButton = viewChild<ElementRef<HTMLButtonElement>>('closeButton');

  constructor() {
    /* When the viewer opens, move keyboard focus to the close button. */
    effect(() => this.closeButton()?.nativeElement.focus({ preventScroll: true }));
  }
}
