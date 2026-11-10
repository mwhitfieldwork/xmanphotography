/* ==========================================================================
   WHAT: The peach "Take one home" section: a grid of prints for sale, with
         page buttons along the bottom.
   WHY:  Visitors can order a print of a photo they like.
   HOW:  - What is for sale comes from data/prints.ts.
         - It pages the same way the gallery does (see gallery.ts).
         - "Add to cart" only shows a message for now. Later it will ask the
           .NET API to start a Stripe Checkout session.
         - The grid layout is in print-shop.scss.
   ========================================================================== */
import { Component, computed, inject, signal } from '@angular/core';
import { PHOTOS } from '../../data/photos';
import { PRINTS, Print } from '../../data/prints';
import { Parallax } from '../../directives/parallax';
import { StudioService } from '../../services/studio.service';
import { photoUrl } from '../../three/photo-source';
import { Pager } from '../pager/pager';

@Component({
  selector: 'app-print-shop',
  imports: [Pager, Parallax],
  templateUrl: './print-shop.html',
  styleUrl: './print-shop.scss'
})
export class PrintShop {
  private readonly studio = inject(StudioService);
  protected readonly prints = PRINTS;

  /** Tiles per page: 3 columns x 2 rows on desktop, 2 columns x 2 rows on phones. */
  protected readonly perPage = window.innerWidth < 760 ? 4 : 6;
  protected readonly pages = Math.ceil(this.prints.length / this.perPage);
  protected readonly page = signal(0);

  /** The prints on the current page. */
  protected readonly visible = computed(() => {
    const start = this.page() * this.perPage;
    return this.prints.slice(start, start + this.perPage);
  });

  /** Empty placeholders that pad a short last page, so the section keeps its height. */
  protected readonly blanks = computed(() => Array.from({ length: this.perPage - this.visible().length }));

  protected title(print: Print): string {
    return PHOTOS[print.photo].title;
  }

  protected url(print: Print): string {
    return photoUrl(PHOTOS, print.photo);
  }

  protected buy(print: Print): void {
    this.studio.buy(this.title(print));
  }
}
