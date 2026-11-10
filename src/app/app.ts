/* ==========================================================================
   WHAT: The root component. It stacks the page sections in order.
   WHY:  Each section is its own small component, so you can find and edit
         one part of the page without reading the rest.
   HOW:  See app.html for the order. To move a section, move its tag there.
   ========================================================================== */
import { Component, inject } from '@angular/core';
import { Booking } from './components/booking/booking';
import { Footer } from './components/footer/footer';
import { Gallery } from './components/gallery/gallery';
import { Hero } from './components/hero/hero';
import { Intro } from './components/intro/intro';
import { Nav } from './components/nav/nav';
import { PhotoViewer } from './components/photo-viewer/photo-viewer';
import { PrintShop } from './components/print-shop/print-shop';
import { Wrap } from './components/wrap/wrap';
import { StudioService } from './services/studio.service';

@Component({
  selector: 'app-root',
  imports: [Nav, Hero, Intro, Gallery, PrintShop, Booking, Wrap, Footer, PhotoViewer],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly studio = inject(StudioService);
}
