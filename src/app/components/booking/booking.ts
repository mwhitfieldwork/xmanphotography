/* ==========================================================================
   WHAT: The black "Book a shoot" section: a price list and a request form.
   WHY:  It is the main call to action, so it is the boldest section.
   HOW:  - `sessions` is the price list. Edit it to change names and prices.
         - The form does not send anything yet. submit() only shows a message.
           Later it will post the request to the .NET API.
   ========================================================================== */
import { Component, signal } from '@angular/core';
import { Parallax } from '../../directives/parallax';

interface Session {
  name: string;
  detail: string;
  price: string;
}

@Component({
  selector: 'app-booking',
  imports: [Parallax],
  templateUrl: './booking.html',
  styleUrl: './booking.scss'
})
export class Booking {
  protected readonly sessions: Session[] = [
    { name: 'Portrait session', detail: '1 hour', price: '$350' },
    { name: 'Couples and engagement', detail: '2 hours', price: '$600' },
    { name: 'Wedding day', detail: '8 hours', price: '$3,200' },
  ];

  /** The line shown under the button after the form is submitted. */
  protected readonly message = signal('');

  protected submit(event: Event): void {
    event.preventDefault();   // stop the browser from reloading the page
    this.message.set('Demo only. Nothing was sent.');
  }
}
