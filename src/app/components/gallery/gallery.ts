/* ==========================================================================
   WHAT: The red "Selected work" section: an even grid of photos with page
         buttons underneath.
   WHY:  The client may have many photos, so they are shown a page at a time.
   HOW:  - The photos come from data/photos.ts. Add one there and it appears here.
         - `perPage` is how many tiles fit on one page (fewer on phones).
         - `visible` works out which photos belong on the current page.
         - Clicking a tile opens the tear viewer on that photo.
         - The grid layout (columns, spacing, tile shape) is in gallery.scss.
   ========================================================================== */
import { Component, computed, inject, signal } from '@angular/core';
import { PHOTOS } from '../../data/photos';
import { Parallax } from '../../directives/parallax';
import { StudioService } from '../../services/studio.service';
import { photoUrl } from '../../three/photo-source';
import { Pager } from '../pager/pager';

@Component({
  selector: 'app-gallery',
  imports: [Pager, Parallax],
  templateUrl: './gallery.html',
  styleUrl: './gallery.scss'
})
export class Gallery {
  private readonly studio = inject(StudioService);
  protected readonly photos = PHOTOS;

  /** Tiles per page: 3 columns x 3 rows on desktop, 2 columns x 3 rows on phones. */
  protected readonly perPage = window.innerWidth < 760 ? 6 : 9;
  protected readonly pages = Math.ceil(this.photos.length / this.perPage);

  /** The current page, counting from 0. A signal, so the grid redraws when it changes. */
  protected readonly page = signal(0);

  /** The positions (in PHOTOS) of the photos on the current page. */
  protected readonly visible = computed(() => {
    const start = this.page() * this.perPage;
    const end = Math.min(start + this.perPage, this.photos.length);
    return Array.from({ length: end - start }, (_, i) => start + i);
  });

  /** Empty placeholders that pad a short last page, so the section keeps its height. */
  protected readonly blanks = computed(() => Array.from({ length: this.perPage - this.visible().length }));

  /** The image address for a photo: its real src, or a drawn stand-in. */
  protected url(index: number): string {
    return photoUrl(this.photos, index);
  }

  /** "01", "02", ... for the caption. */
  protected label(index: number): string {
    return String(index + 1).padStart(2, '0');
  }

  protected open(index: number): void {
    this.studio.openViewer(index);
  }
}
