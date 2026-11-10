/* ==========================================================================
   WHAT: The one place components go to talk to the 3D code.
   WHY:  The gallery, the photo viewer, and the print shop are separate
         components, but they all need the same viewer and the same toast
         message. A service is shared by all of them.
   HOW:  - The Hero component starts the 3D and calls connect() with it.
         - Components call openViewer(), tear(), closeViewer(), buy().
         - viewerOpen, viewerIndex and toastMessage are "signals": values the
           templates read like functions, e.g. studio.viewerOpen(). When a
           signal changes, Angular updates the page for you.
   ========================================================================== */
import { Injectable, signal } from '@angular/core';
import { Studio } from '../three/studio-engine';

@Injectable({ providedIn: 'root' })
export class StudioService {
  /** True while the tear viewer is showing. */
  readonly viewerOpen = signal(false);
  /** Which photo the viewer is showing (a position in PHOTOS). */
  readonly viewerIndex = signal(0);
  /** The pop-up message at the top of the screen. Empty means hidden. */
  readonly toastMessage = signal('');

  private studio: Studio | null = null;
  private toastTimer = 0;

  /** Called by the Hero component once the 3D is running (or with null when it stops). */
  connect(studio: Studio | null): void {
    this.studio = studio;
  }

  /** Opens the tear viewer on a photo. Does nothing if 3D is not available. */
  openViewer(index: number): void {
    this.studio?.openViewer(index);
  }

  closeViewer(): void {
    this.studio?.closeViewer();
  }

  /** Rips to the next (1) or previous (-1) photo. */
  tear(direction: number): void {
    this.studio?.tear(direction);
  }

  /** Shows a short message, then hides it after a few seconds. */
  toast(message: string): void {
    this.toastMessage.set(message);
    clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.toastMessage.set(''), 3200);
  }

  /** Placeholder for buying a print. The real site will ask the .NET API to start Stripe Checkout. */
  buy(title: string): void {
    this.toast('Demo: Stripe Checkout would open for ' + title);
  }
}
