/* WHAT: The yellow band under the hero with the main slogan.
   WHY:  It introduces the photographer right after the 3D opening.
   HOW:  Plain text in intro.html. The colors are --intro-bg, --intro-text and
         --intro-soft in colors.scss. */
import { Component } from '@angular/core';
import { Parallax } from '../../directives/parallax';

@Component({
  selector: 'app-intro',
  imports: [Parallax],
  templateUrl: './intro.html',
  styleUrl: './intro.scss'
})
export class Intro {}
