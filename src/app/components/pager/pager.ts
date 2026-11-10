/* ==========================================================================
   WHAT: A row of page buttons:  <-  1  2  3  ->
   WHY:  Both the gallery and the print shop show their tiles a page at a time.
   HOW:  The parent tells it the current page and how many pages there are.
         When a button is clicked it sends the new page number back:
           <app-pager [page]="page()" [pages]="pages" (pageChange)="page.set($event)" />
         Pages count from 0 in code, but the buttons show 1, 2, 3...
   ========================================================================== */
import { Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-pager',
  templateUrl: './pager.html',
  styleUrl: './pager.scss'
})
export class Pager {
  /** The current page, counting from 0. */
  readonly page = input(0);
  /** How many pages there are in total. */
  readonly pages = input(1);
  /** What a screen reader calls this group of buttons. */
  readonly label = input('Pages');
  /** Sends the page number the visitor picked. */
  readonly pageChange = output<number>();

  /** [0, 1, 2, ...] - one entry per page button. */
  protected readonly numbers = computed(() => Array.from({ length: this.pages() }, (_, i) => i));
}
