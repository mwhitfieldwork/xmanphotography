/* ==========================================================================
   WHAT: The list of photos the whole site uses (tunnel, gallery, viewer, film).
   WHY:  One list in one file means adding a photo is a one-line change.
   HOW:  Add an object to PHOTOS. Fields:
           title    - shown under the photo and in the viewer
           place    - shown in the viewer caption
           settings - camera settings shown in the viewer caption
           portrait - true for tall photos (4:5), false for wide photos (3:2)
           src      - the image address. Either a Cloudflare URL such as
                      'https://imagedelivery.net/<account>/<image-id>/public'
                      or a file you put in the /public/photos folder, written
                      as 'photos/my-photo.jpg'.
                      Leave it '' to show the computer-drawn stand-in.
           standIn  - only used while src is ''. [scene, palette] for the drawing.
         NOTE: for a Cloudflare photo to appear in the 3D tunnel and on the
         film strip, Cloudflare must allow this site to read it (CORS).
         Without that it still shows in the gallery grid, but not in 3D.
   ========================================================================== */
export interface Photo {
  title: string;
  place: string;
  settings: string;
  portrait: boolean;
  src: string;
  standIn?: [scene: string, palette: string];
}

export const PHOTOS: Photo[] = [
  { title: 'Salt flat vows', place: 'Bonneville, Utah', settings: '50mm f/1.8 1/500', portrait: false, src: 'https://pub-35fa09fdb0714d33adfba94c1a229d9e.r2.dev/slider_worthy_3.png', standIn: ['figure', 'rose'] },
  { title: 'Blue hour skyline', place: 'Chicago, Illinois', settings: '35mm f/2 1/60', portrait: false, src: 'https://pub-35fa09fdb0714d33adfba94c1a229d9e.r2.dev/active_hoodie.png', standIn: ['city', 'night'] },
  { title: 'Last light dunes', place: 'White Sands, New Mexico', settings: '85mm f/4 1/800', portrait: false, src: 'https://pub-35fa09fdb0714d33adfba94c1a229d9e.r2.dev/slider_Painted4.png', standIn: ['dunes', 'dusk'] },
  { title: 'Morning in the pines', place: 'Black Hills, South Dakota', settings: '50mm f/2.8 1/125', portrait: true, src: 'https://pub-35fa09fdb0714d33adfba94c1a229d9e.r2.dev/skiils_slider.png', standIn: ['forest', 'mist'] },
  { title: 'Ridge after ridge', place: 'Great Smokies, Tennessee', settings: '135mm f/5.6 1/400', portrait: false, src: '', standIn: ['peaks', 'dusk'] },
  { title: 'Neon rain', place: 'Wicker Park, Chicago', settings: '35mm f/1.4 1/80', portrait: true, src: '', standIn: ['neon', 'neon'] },
  { title: 'Slack tide', place: 'Cannon Beach, Oregon', settings: '28mm f/8 1/250', portrait: false, src: '', standIn: ['sea', 'gold'] },
  { title: 'Campfire sky', place: 'Big Bend, Texas', settings: '24mm f/1.4 20s', portrait: false, src: '', standIn: ['stars', 'night'] },
  { title: 'First dance outside', place: 'Asheville, North Carolina', settings: '85mm f/1.4 1/250', portrait: true, src: '', standIn: ['figure', 'ember'] },
  { title: 'Sand and shadow', place: 'Mesquite Flat, California', settings: '70mm f/8 1/500', portrait: false, src: '', standIn: ['dunes', 'gold'] },
  { title: 'Fog at the trailhead', place: 'Olympic, Washington', settings: '35mm f/2.8 1/60', portrait: true, src: '', standIn: ['forest', 'teal'] },
  { title: 'Late train home', place: 'The Loop, Chicago', settings: '50mm f/1.8 1/40', portrait: false, src: '', standIn: ['city', 'ember'] },
  { title: 'Pink hour swell', place: 'Malibu, California', settings: '50mm f/5.6 1/320', portrait: false, src: '', standIn: ['sea', 'rose'] },
  { title: 'Past the last town', place: 'Moab, Utah', settings: '35mm f/8 1/200', portrait: false, src: '', standIn: ['peaks', 'ember'] },
  { title: 'After the reception', place: 'Nashville, Tennessee', settings: '50mm f/1.2 1/60', portrait: false, src: '', standIn: ['neon', 'neon'] },
  { title: 'Milky Way, no filter', place: 'Joshua Tree, California', settings: '20mm f/1.8 25s', portrait: true, src: '', standIn: ['stars', 'night'] },
  { title: 'Walking the ridge', place: 'Sedona, Arizona', settings: '135mm f/2.8 1/640', portrait: false, src: '', standIn: ['figure', 'gold'] },
  { title: 'Cold blue range', place: 'Glacier, Montana', settings: '100mm f/8 1/320', portrait: false, src: '', standIn: ['peaks', 'teal'] },
  { title: 'Tide pool morning', place: 'Big Sur, California', settings: '35mm f/11 1/125', portrait: true, src: '', standIn: ['sea', 'teal'] },
  { title: 'Rooftop, 9 p.m.', place: 'Brooklyn, New York', settings: '35mm f/1.8 1/50', portrait: false, src: '', standIn: ['city', 'dusk'] },
  { title: 'Golden understory', place: 'Shawnee, Illinois', settings: '85mm f/2 1/320', portrait: false, src: '', standIn: ['forest', 'gold'] },
  { title: 'Dune crest', place: 'Great Sand Dunes, Colorado', settings: '50mm f/5.6 1/400', portrait: true, src: '', standIn: ['dunes', 'rose'] },
  { title: 'Two against the sun', place: 'Marfa, Texas', settings: '70mm f/2.8 1/1000', portrait: false, src: '', standIn: ['figure', 'dusk'] },
  { title: 'Sign glow', place: 'Las Vegas, Nevada', settings: '28mm f/2 1/60', portrait: false, src: '', standIn: ['neon', 'neon'] },
];

/* The five photos that end the tunnel and land on the film strip.
   These are positions in PHOTOS (the first photo is 0). Pick five WIDE photos
   (portrait: false), because a 35mm film frame is wide. */
export const FILM_PHOTOS: number[] = [0, 4, 9, 13, 19];
