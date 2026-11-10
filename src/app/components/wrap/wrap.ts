/* WHAT: The white "That's a wrap." section near the bottom.
   WHY:  It is an empty patch of studio floor where the film strip collects
         into a roll. The 3D code finds this section by its id, "roll", and
         lands the film in the middle of it.
   HOW:  Keep id="roll" on the section and keep it about one screen tall,
         so there is room for the roll next to (or under) the text. */
import { Component } from '@angular/core';

@Component({
  selector: 'app-wrap',
  templateUrl: './wrap.html',
  styleUrl: './wrap.scss'
})
export class Wrap {}
