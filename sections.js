/* Stellaris ship section definitions.
   Slot codes:
     S  = Small weapon        M  = Medium weapon     L  = Large weapon
     X  = Extra-Large weapon  G  = Guided (torpedo)  H  = Hangar
     PD = Point-Defense        T  = Titan weapon
   utility: counts of {S,M,L} utility module slots for the entire ship
   aux:     number of auxiliary slots for the entire ship
   Section groups use 'main' for 1-section hulls, or bow/core/stern for multi-section hulls.
*/
window.SHIP_SECTIONS = {
  'Corvette': {
    base: { hull: 200, evasion: 0.60, speed: 160, cost: 30 },
    slots: { utility: { Small: 3, Medium: 0, Large: 0 }, aux: 1 },
    groups: [
      {
        id: 'main', label: 'Section',
        options: [
          { name: 'Interceptor', weapons: ['S','S','S'] },
          { name: 'Picket Ship', weapons: ['S','S','PD'] },
          { name: 'Missile Boat', weapons: ['S','G'] },
        ],
      },
    ],
  },
  'Frigate': {
    base: { hull: 400, evasion: 0.20, speed: 120, cost: 30 },
    slots: { utility: { Small: 3, Medium: 0, Large: 0 }, aux: 1 },
    groups: [
      {
        id: 'main', label: 'Section',
        options: [
          { name: 'Torpedo', weapons: ['S','G'] },
        ],
      },
    ],
  },
  'Destroyer': {
    base: { hull: 600, evasion: 0.35, speed: 140, cost: 60 },
    slots: { utility: { Small: 6, Medium: 0, Large: 0 }, aux: 1 },
    groups: [
      {
        id: 'bow', label: 'Bow',
        options: [
          { name: 'Artillery', weapons: ['L'] },
          { name: 'Gunship',   weapons: ['M','M'] },
          { name: 'Picket',    weapons: ['S','S','PD','PD'] },
        ],
      },
      {
        id: 'stern', label: 'Stern',
        options: [
          { name: 'Gunship',     weapons: ['M'] },
          { name: 'Interceptor', weapons: ['S','S'] },
          { name: 'Picket',      weapons: ['PD','PD'] },
        ],
      },
    ],
  },
  'Cruiser': {
    base: { hull: 1800, evasion: 0.10, speed: 120, cost: 120 },
    slots: { utility: { Small: 4, Medium: 2, Large: 0 }, aux: 2 },
    groups: [
      {
        id: 'bow', label: 'Bow',
        options: [
          { name: 'Artillery', weapons: ['L'] },
          { name: 'Torpedo',   weapons: ['G','G'] },
          { name: 'Gunship',   weapons: ['M','M'] },
        ],
      },
      {
        id: 'core', label: 'Core',
        options: [
          { name: 'Broadside', weapons: ['M','M'] },
          { name: 'Hangar',    weapons: ['H'] },
          { name: 'Torpedo',   weapons: ['M','G','G'] },
        ],
      },
      {
        id: 'stern', label: 'Stern',
        options: [
          { name: 'Gunship',     weapons: ['L'] },
          { name: 'Interceptor', weapons: ['M','M'] },
          { name: 'Picket',      weapons: ['M','PD','PD'] },
        ],
      },
    ],
  },
  'Battleship': {
    base: { hull: 3000, evasion: 0.05, speed: 100, cost: 240 },
    slots: { utility: { Small: 4, Medium: 4, Large: 2 }, aux: 3 },
    groups: [
      {
        id: 'bow', label: 'Bow',
        options: [
          { name: 'Spinal Mount', weapons: ['X'] },
          { name: 'Artillery',    weapons: ['L','L'] },
          { name: 'Carrier',      weapons: ['M','H','H'] },
        ],
      },
      {
        id: 'core', label: 'Core',
        options: [
          { name: 'Artillery', weapons: ['L','L','L'] },
          { name: 'Broadside', weapons: ['M','M','M','M'] },
          { name: 'Hangar',    weapons: ['H','H'] },
          { name: 'Core',      weapons: ['M','M','PD','PD'] },
        ],
      },
      {
        id: 'stern', label: 'Stern',
        options: [
          { name: 'Gunship',   weapons: ['L','M'] },
          { name: 'Artillery', weapons: ['M','M'] },
        ],
      },
    ],
  },
  'Titan': {
    base: { hull: 15000, evasion: 0.05, speed: 100, cost: 480 },
    slots: { utility: { Small: 4, Medium: 4, Large: 2 }, aux: 4 },
    groups: [
      {
        id: 'main', label: 'Section',
        options: [
          { name: 'Titan', weapons: ['T','L','L','M','M','M','M'] },
        ],
      },
    ],
  },
};

/* Map slot code to the weapon size string used in data.js */
window.SLOT_TO_SIZE = {
  S: 'Small', M: 'Medium', L: 'Large', X: 'X-Large',
  G: 'Guided', H: 'Hangar', PD: 'PD', T: 'Titan',
};
window.SLOT_LABEL = {
  S:'Small', M:'Medium', L:'Large', X:'X-Large',
  G:'Guided', H:'Hangar', PD:'Point-Defense', T:'Titan',
};
