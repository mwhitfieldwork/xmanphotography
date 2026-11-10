/* WHAT: The two dark pills fixed at the top: the brand name and the page links.
   WHY:  They stay on screen so visitors can jump to a section from anywhere.
   HOW:  Each link points at a section id, e.g. href="#work" scrolls to id="work". */
import { Component } from '@angular/core';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.html',
  styleUrl: './nav.scss'
})
export class Nav {}
