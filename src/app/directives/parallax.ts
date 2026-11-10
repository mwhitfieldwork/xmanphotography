/* ==========================================================================
   WHAT: Makes an element drift a little slower or faster than the page as you
         scroll (a "parallax" effect).
   WHY:  It adds depth to the flat sections under the 3D hero.
   HOW:  Put it on any element:  <h2 appParallax="0.05">Title</h2>
         The number is the speed. 0 = no effect, bigger = more drift, and a
         negative number drifts the other way. It measures how far the
         element's parent is from the middle of the screen and shifts the
         element by that distance times the speed.
   ========================================================================== */
import { Directive, ElementRef, OnDestroy, OnInit, inject, input, numberAttribute } from '@angular/core';

@Directive({ selector: '[appParallax]' })
export class Parallax implements OnInit, OnDestroy {
  /** The drift speed, e.g. 0.05. */
  readonly appParallax = input(0.05, { transform: numberAttribute });

  private readonly el: HTMLElement = inject(ElementRef).nativeElement;
  private waiting = false;
  private readonly onScroll = () => {
    if (this.waiting) return;           // only do the work once per screen refresh
    this.waiting = true;
    requestAnimationFrame(() => { this.waiting = false; this.update(); });
  };

  ngOnInit(): void {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;   // respect "reduce motion" settings
    addEventListener('scroll', this.onScroll, { passive: true });
    addEventListener('resize', this.onScroll);
    this.update();
  }

  ngOnDestroy(): void {
    removeEventListener('scroll', this.onScroll);
    removeEventListener('resize', this.onScroll);
  }

  private update(): void {
    const box = this.el.parentElement!.getBoundingClientRect();
    if (box.bottom < -200 || box.top > innerHeight + 200) return;         // off screen: nothing to do
    const fromCenter = box.top + box.height / 2 - innerHeight / 2;
    const phone = innerWidth < 760 ? 0.5 : 1;                             // gentler on small screens
    this.el.style.transform = `translate3d(0, ${(fromCenter * this.appParallax() * phone).toFixed(1)}px, 0)`;
  }
}
