/* ==========================================================================
   WHAT: The prints for sale in the "Take one home" section.
   WHY:  Kept apart from photos.ts so a photo can be shown without being sold.
   HOW:  `photo` is a position in PHOTOS (the first photo is 0). Add or remove
         lines to change what is for sale. Prices here are samples.
   ========================================================================== */
export interface Print {
  photo: number;
  price: string;
}

export const PRINTS: Print[] = [
  { photo: 7, price: '$48' },
  { photo: 12, price: '$64' },
  { photo: 17, price: '$56' },
  { photo: 22, price: '$72' },
  { photo: 3, price: '$48' },
  { photo: 8, price: '$64' },
  { photo: 13, price: '$56' },
  { photo: 18, price: '$72' },
  { photo: 23, price: '$48' },
  { photo: 4, price: '$64' },
  { photo: 9, price: '$56' },
  { photo: 14, price: '$72' },
];
