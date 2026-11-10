# Half Stop: photography site (Angular 21)

The Angular version of the Half Stop studio demo: a 3D photo tunnel in a white
studio, a film strip that spirals down the page, a paged gallery, a print shop,
a booking form and a footer.

## Run it

```
npm install
npm start
```

Then open http://localhost:4200

## Where to change things

| I want to...                         | Open this file                                   |
| ------------------------------------ | ------------------------------------------------ |
| Add, remove or reorder photos        | `src/app/data/photos.ts`                         |
| Pick the 5 photos on the film strip  | `FILM_PHOTOS` in `src/app/data/photos.ts`        |
| Change what prints are for sale      | `src/app/data/prints.ts`                         |
| Change any color                     | `src/colors.scss`                                |
| Change the gallery grid layout       | `src/app/components/gallery/gallery.scss`        |
| Change photos per gallery page       | `perPage` in `src/app/components/gallery/gallery.ts` |
| Change the print shop grid layout    | `src/app/components/print-shop/print-shop.scss`  |
| Change the hero headlines            | `headlines` in `src/app/components/hero/hero.ts` |
| Change the slogan                    | `src/app/components/intro/intro.html`            |
| Change session names and prices      | `sessions` in `src/app/components/booking/booking.ts` |
| Change footer and social links       | `src/app/components/footer/footer.ts`            |
| Change the order of the sections     | `src/app/app.html`                               |
| Change fonts                         | `src/index.html` (loads them) and `src/styles.scss` (names them) |

## Adding a real photo

Each photo is one line in `src/app/data/photos.ts`. Fill in `src`:

```ts
{ title: 'Salt flat vows', place: 'Bonneville, Utah', settings: '50mm f/1.8 1/500',
  portrait: false, src: 'https://imagedelivery.net/<account>/<image-id>/public' },
```

- A Cloudflare address works, and so does a file. Put the file in
  `public/photos/` and write `src: 'photos/my-photo.jpg'`.
- While `src` is `''`, the site shows a computer-drawn stand-in.
- `portrait: true` means a tall photo (4:5). `false` means a wide photo (3:2).
- The gallery grid crops every photo to the same shape, so the grid stays even.

**One Cloudflare setting matters.** A browser only lets 3D code use an image
from another site if that site allows it. This is called CORS. If it is not
allowed, the photo still shows in the gallery grid, but the tunnel, the viewer
and the film strip fall back to the stand-in for that photo. Check this in
your Cloudflare setup. For an R2 bucket it is a CORS rule that allows your
site's address.

## How the project is laid out

```
src/
  colors.scss              every color on the site
  styles.scss              shared styles (fonts, headings, buttons)
  app/
    app.html               the order of the page sections
    data/                  photos.ts and prints.ts: the content lists
    components/            one folder per section of the page
      nav/  hero/  intro/  gallery/  print-shop/  booking/  wrap/  footer/
      pager/               the page buttons used by gallery and print shop
      photo-viewer/        the buttons and caption over the tear viewer
    directives/parallax.ts makes headings drift as you scroll
    services/studio.service.ts   how components talk to the 3D code
    three/                 all of the Three.js code (no Angular in here)
      studio-engine.ts     tunnel, film strip, tear viewer
      film-texture.ts      draws the film strip (edge text, frames, holes)
      photo-source.ts      loads a photo's image, or draws its stand-in
      stand-in-photos.ts   the computer-drawn stand-ins
      tear-shader.ts       the paper-rip effect
```

## Not built yet

- **Stripe and the .NET API.** "Add to cart", "Order print" and the booking
  form only show a message. The plan: Angular asks the .NET API to start a
  payment, the Stripe secret key stays in .NET, and the customer pays on
  Stripe's hosted checkout page.
- **Print fulfilment.** Still to decide with the client: drop shipping through
  a print company, or the client ships prints themselves.

## Good to know

- Three.js is pinned to version 0.128 in `package.json`. Newer versions handle
  color and light differently and would change how the studio looks.
- `ng build` downloads the Google Fonts once to bundle them, so the first
  production build needs an internet connection.
