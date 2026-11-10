/* ==========================================================================
   WHAT: The hero: the 3D canvas, the tall "track" you scroll through, the big
         headlines, and the small info pill at the bottom.
   WHY:  This is the only component that touches Three.js. It starts the 3D
         when the page is ready and shuts it down when the component goes away.
   HOW:  1. The template gives us the canvas, the track, the headlines, the pill.
         2. ngAfterViewInit() hands those to createStudio() (studio-engine.ts).
         3. The 3D code calls back when the viewer opens/closes or changes
            photo, and we store that in StudioService for other components.
         To change the headline words or when they appear, edit `headlines`.
   ========================================================================== */
import { AfterViewInit, Component, ElementRef, OnDestroy, QueryList, ViewChild, ViewChildren, inject, signal } from '@angular/core';
import { FILM_PHOTOS, PHOTOS } from '../../data/photos';
import { StudioService } from '../../services/studio.service';
import { Studio, createStudio } from '../../three/studio-engine';

interface Headline {
  text: string;
  note?: string;   // small line under the headline
  from: number;    // when it fades in:  0 = top of the tunnel, 1 = end of the tunnel
  to: number;      // when it fades out
}

@Component({
  selector: 'app-hero',
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
  host: { '[class.no-webgl]': 'noWebgl()' }
})
export class Hero implements AfterViewInit, OnDestroy {
  private readonly studioService = inject(StudioService);
  private studio: Studio | null = null;

  /** True when the browser cannot show 3D. The page then shows just the first headline. */
  protected readonly noWebgl = signal(false);

  protected readonly headlines: Headline[] = [
    { text: 'Step into the frame', note: 'Scroll to fly through. Click any photo.', from: -1, to: 0.09 },
    { text: 'Weddings', from: 0.24, to: 0.4 },
    { text: 'Road trips', from: 0.46, to: 0.62 },
    { text: 'Your people', from: 0.68, to: 0.82 },
  ];

  @ViewChild('gl') private canvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('track') private track!: ElementRef<HTMLElement>;
  @ViewChild('hud') private hud!: ElementRef<HTMLElement>;
  @ViewChildren('say') private says!: QueryList<ElementRef<HTMLElement>>;

  ngAfterViewInit(): void {
    this.studio = createStudio({
      canvas: this.canvas.nativeElement,
      track: this.track.nativeElement,
      hud: this.hud.nativeElement,
      says: this.says.map(ref => ref.nativeElement),
      photos: PHOTOS,
      filmPhotos: FILM_PHOTOS,
      onViewer: open => this.studioService.viewerOpen.set(open),
      onCaption: index => this.studioService.viewerIndex.set(index),
    });
    this.studioService.connect(this.studio);
    if (!this.studio) this.noWebgl.set(true);
  }

  ngOnDestroy(): void {
    this.studio?.destroy();
    this.studioService.connect(null);
  }
}
