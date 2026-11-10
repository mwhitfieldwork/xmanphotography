/* WHAT: The black footer with site links and social links, all in gray.
   WHY:  A quiet ending to the page that repeats the main links.
   HOW:  Edit the two lists below. Put the real profile addresses in `social`. */
import { Component } from '@angular/core';

interface FooterLink {
  label: string;
  href: string;
}

@Component({
  selector: 'app-footer',
  templateUrl: './footer.html',
  styleUrl: './footer.scss'
})
export class Footer {
  protected readonly site: FooterLink[] = [
    { label: 'Home', href: '#top' },
    { label: 'Work', href: '#work' },
    { label: 'Prints', href: '#prints' },
    { label: 'Book', href: '#book' },
  ];

  /* Placeholders: replace each '#top' with the real address, e.g. 'https://instagram.com/yourname'. */
  protected readonly social: FooterLink[] = [
    { label: 'Instagram', href: '#top' },
    { label: 'TikTok', href: '#top' },
    { label: 'YouTube', href: '#top' },
    { label: 'Pinterest', href: '#top' },
  ];
}
