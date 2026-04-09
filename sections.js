/* Stellaris ship section definitions, sourced from the Stellaris Wiki Ship_designer page.
   Slot codes:
     S  = Small weapon        M  = Medium weapon     L  = Large weapon
     X  = Extra-Large weapon  G  = Guided (torpedo)  H  = Hangar
     PD = Point-Defense       T  = Titan weapon       W = World weapon (Colossus)
   Each section option has:
     weapons: array of slot codes
     utility: { S?, M?, L? } — utility slot counts for that section
     aux:     number of auxiliary slots for that section
*/
window.SHIP_SECTIONS = {
  'Corvette': {
    base: { hull: 200, evasion: 0.60, speed: 160, cost: 30, buildTime: 60 },
    groups: [
      { id: 'main', label: 'Section', options: [
        { name: 'Interceptor', weapons: ['S','S','S'],  utility: { S: 3 }, aux: 1 },
        { name: 'Picket Ship', weapons: ['S','S','PD'], utility: { S: 3 }, aux: 1 },
      ]},
    ],
  },

  'Frigate': {
    base: { hull: 600, evasion: 0.20, speed: 140, cost: 30, buildTime: 90 },
    groups: [
      { id: 'main', label: 'Section', options: [
        { name: 'Missile Boat', weapons: ['S','G'], utility: { S: 5 }, aux: 2 },
      ]},
    ],
  },

  'Destroyer': {
    base: { hull: 1200, evasion: 0.35, speed: 140, cost: 60, buildTime: 120 },
    groups: [
      { id: 'bow', label: 'Bow', options: [
        { name: 'Artillery',  weapons: ['L'],            utility: { S: 6 }, aux: 0 },
        { name: 'Gunship',    weapons: ['S','S','M'],    utility: { S: 6 }, aux: 0 },
        { name: 'Picket',     weapons: ['S','S','PD'],   utility: { S: 6 }, aux: 0 },
      ]},
      { id: 'stern', label: 'Stern', options: [
        { name: 'Gunship',     weapons: ['M'],       utility: {}, aux: 1 },
        { name: 'Interceptor', weapons: ['S','S'],   utility: {}, aux: 2 },
        { name: 'Picket Ship', weapons: ['PD','PD'], utility: {}, aux: 1 },
      ]},
    ],
  },

  'Cruiser': {
    base: { hull: 2400, evasion: 0.10, speed: 120, cost: 120, buildTime: 240 },
    groups: [
      { id: 'bow', label: 'Bow', options: [
        { name: 'Artillery', weapons: ['L'],         utility: { M: 4 }, aux: 0 },
        { name: 'Broadside', weapons: ['M','M'],     utility: { M: 4 }, aux: 0 },
        { name: 'Torpedo',   weapons: ['S','S','G'], utility: { M: 4 }, aux: 0 },
      ]},
      { id: 'core', label: 'Core', options: [
        { name: 'Artillery', weapons: ['M','L'],           utility: { M: 4 }, aux: 0 },
        { name: 'Broadside', weapons: ['M','M','M'],       utility: { M: 4 }, aux: 0 },
        { name: 'Hangar',    weapons: ['PD','PD','H'],     utility: { M: 4 }, aux: 0 },
        { name: 'Torpedo',   weapons: ['S','S','G','G'],   utility: { M: 4 }, aux: 0 },
      ]},
      { id: 'stern', label: 'Stern', options: [
        { name: 'Broadside', weapons: ['M'],       utility: {}, aux: 2 },
        { name: 'Gunship',   weapons: ['S','S'],   utility: {}, aux: 3 },
      ]},
    ],
  },

  'Battleship': {
    base: { hull: 4800, evasion: 0.05, speed: 100, cost: 240, buildTime: 480 },
    groups: [
      { id: 'bow', label: 'Bow', options: [
        { name: 'Artillery',    weapons: ['L','L'],             utility: { L: 3 }, aux: 0 },
        { name: 'Broadside',    weapons: ['S','S','M','L'],     utility: { L: 3 }, aux: 0 },
        { name: 'Hangar',       weapons: ['M','PD','PD','H'],   utility: { L: 3 }, aux: 0 },
        { name: 'Spinal Mount', weapons: ['X'],                 utility: { L: 3 }, aux: 0 },
      ]},
      { id: 'core', label: 'Core', options: [
        { name: 'Artillery', weapons: ['L','L','L'],                       utility: { L: 3 }, aux: 0 },
        { name: 'Broadside', weapons: ['M','M','L','L'],                   utility: { L: 3 }, aux: 0 },
        { name: 'Carrier',   weapons: ['S','S','PD','PD','H','H'],         utility: { L: 3 }, aux: 0 },
        { name: 'Hangar',    weapons: ['M','M','M','M','H'],               utility: { L: 3 }, aux: 0 },
      ]},
      { id: 'stern', label: 'Stern', options: [
        { name: 'Artillery', weapons: ['L'],     utility: {}, aux: 2 },
        { name: 'Broadside', weapons: ['M','M'], utility: {}, aux: 3 },
      ]},
    ],
  },

  'Titan': {
    base: { hull: 20000, evasion: 0.05, speed: 100, cost: 480, buildTime: 1800 },
    groups: [
      { id: 'bow',   label: 'Bow',   options: [{ name: 'Titan Bow',   weapons: ['T'],             utility: { L: 6 }, aux: 0 }]},
      { id: 'core',  label: 'Core',  options: [{ name: 'Titan Core',  weapons: ['L','L','L','L'], utility: { L: 6 }, aux: 0 }]},
      { id: 'stern', label: 'Stern', options: [{ name: 'Titan Stern', weapons: ['L','L'],         utility: {},       aux: 3 }]},
    ],
  },

  'Juggernaut': {
    base: { hull: 100000, evasion: 0.02, speed: 100, cost: 960, buildTime: 3600 },
    groups: [
      { id: 'main', label: 'Section', options: [
        { name: 'Juggernaut',
          weapons: ['X','X','H','H','H','H','H','H','M','M','M','M','M'],
          utility: { L: 21 }, aux: 4 },
      ]},
    ],
  },

  'Colossus': {
    base: { hull: 30000, evasion: 0.02, speed: 80, cost: 10000, buildTime: 20000 },
    groups: [
      { id: 'main', label: 'Section', options: [
        { name: 'Colossus', weapons: ['W'], utility: { L: 6 }, aux: 0 },
      ]},
    ],
  },

  'Menacing Corvette': {
    base: { hull: 200, evasion: 0.60, speed: 160, cost: 300, buildTime: 30 },
    groups: [
      { id: 'main', label: 'Section', options: [
        { name: 'Brawler',     weapons: ['S','M'],     utility: { S: 3 }, aux: 2 },
        { name: 'Interceptor', weapons: ['S','S','S'], utility: { S: 3 }, aux: 2 },
      ]},
    ],
  },

  'Menacing Destroyer': {
    base: { hull: 1200, evasion: 0.25, speed: 140, cost: 550, buildTime: 60 },
    groups: [
      { id: 'main', label: 'Section', options: [
        { name: 'Artillery', weapons: ['L','S','S'],         utility: { M: 3 }, aux: 2 },
        { name: 'Multirole', weapons: ['M','G','S','PD'],    utility: { M: 3 }, aux: 2 },
      ]},
    ],
  },

  'Menacing Cruiser': {
    base: { hull: 2400, evasion: 0.10, speed: 140, cost: 900, buildTime: 120 },
    groups: [
      { id: 'main', label: 'Section', options: [
        { name: 'Menacing Cruiser', weapons: ['L','M','M','S','S'], utility: { M: 6 }, aux: 2 },
      ]},
    ],
  },

  'Star-Eater': {
    base: { hull: 150000, evasion: 0.05, speed: 120, cost: 10000, buildTime: 6000 },
    groups: [
      { id: 'main', label: 'Section', options: [
        { name: 'Star-Eater',
          weapons: ['W','H','H','H','H','L','L','L','M','M','M','M','M','M','M','M','M','S','S','S','S','S','S','PD','PD','PD','PD','PD','PD'],
          utility: { L: 20 }, aux: 4 },
      ]},
    ],
  },

  'Nanite Swarmer': {
    base: { hull: 50, evasion: 0.60, speed: 140, cost: 500, buildTime: 24 },
    groups: [
      { id: 'main', label: 'Section', options: [
        { name: 'Carrier', weapons: ['H'],             utility: {}, aux: 1 },
        { name: 'Gunship', weapons: ['M','M'],         utility: {}, aux: 1 },
        { name: 'Torpedo', weapons: ['G','G'],         utility: {}, aux: 1 },
        { name: 'Screen',  weapons: ['PD','PD','PD','PD'], utility: {}, aux: 1 },
      ]},
    ],
  },

  'Nanite Interdictor': {
    base: { hull: 2000, evasion: 0.20, speed: 120, cost: 7500, buildTime: 240 },
    groups: [
      { id: 'main', label: 'Section', options: [
        { name: 'Torpedo', weapons: ['G','G','G','G','G','S','S','S','S'], utility: { L: 3 }, aux: 1 },
      ]},
    ],
  },

  'Riddle Escort': {
    base: { hull: 2000, evasion: 0.50, speed: 140, cost: 500, buildTime: 200 },
    groups: [
      { id: 'main', label: 'Section', options: [
        { name: 'Artillery Frame', weapons: ['S','S','S','S','PD','PD','PD','PD','L','L'],          utility: { M: 6 }, aux: 2 },
        { name: 'Torpedo Frame',   weapons: ['S','S','S','S','PD','PD','PD','PD','G','G','G'],      utility: { M: 6 }, aux: 2 },
      ]},
    ],
  },

  'Enigma Battlecruiser': {
    base: { hull: 10000, evasion: 0.10, speed: 100, cost: 2000, buildTime: 600 },
    groups: [
      { id: 'main', label: 'Section', options: [
        { name: 'Artillery Frame', weapons: ['X','X','M','M','M','M','H','H','L','L','L','L'],  utility: { L: 8 }, aux: 3 },
        { name: 'Torpedo Frame',   weapons: ['X','X','M','M','M','M','H','H','G','G','G','G'],  utility: { L: 8 }, aux: 3 },
      ]},
    ],
  },

  'Paradox Titan': {
    base: { hull: 40000, evasion: 0.02, speed: 100, cost: 10000, buildTime: 1800 },
    groups: [
      { id: 'main', label: 'Section', options: [
        { name: 'Paradox Titan',
          weapons: ['T','T','H','H','H','H','L','L','L','L','L','L','L','L','M','M','M','M'],
          utility: { L: 20 }, aux: 4 },
      ]},
    ],
  },

  'Ion Cannon': {
    base: { hull: 10000, evasion: 0.0, speed: 0, cost: 1000, buildTime: 480 },
    groups: [
      { id: 'main', label: 'Section', options: [
        { name: 'Ion Cannon', weapons: ['T'], utility: { L: 6 }, aux: 3 },
      ]},
    ],
  },

  'Defense Platform': {
    base: { hull: 3000, evasion: 0.0, speed: 0, cost: 60, buildTime: 60 },
    groups: [
      { id: 'main', label: 'Section', options: [
        { name: 'Light',         weapons: ['S','S','S','S'], utility: { M: 3 }, aux: 1 },
        { name: 'Medium',        weapons: ['M','M'],         utility: { M: 3 }, aux: 1 },
        { name: 'Heavy',         weapons: ['L'],             utility: { M: 3 }, aux: 1 },
        { name: 'Point-Defense', weapons: ['PD','PD','PD','PD'], utility: { M: 3 }, aux: 1 },
        { name: 'Missile',       weapons: ['G','G'],         utility: { M: 3 }, aux: 1 },
        { name: 'Hangar',        weapons: ['H'],             utility: { M: 3 }, aux: 1 },
      ]},
    ],
  },
};

/* Map slot code to the weapon size string used in data.js */
window.SLOT_TO_SIZE = {
  S: 'Small', M: 'Medium', L: 'Large', X: 'X-Large',
  G: 'Guided', H: 'Hangar', PD: 'PD', T: 'Titan', W: 'World',
};
window.SLOT_LABEL = {
  S:'Small', M:'Medium', L:'Large', X:'X-Large',
  G:'Guided', H:'Hangar', PD:'Point-Defense', T:'Titan', W:'World',
};
