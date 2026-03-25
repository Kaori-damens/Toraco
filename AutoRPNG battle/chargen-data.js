// CHARGEN DATA
// ============================================================
const WHEEL_PALETTE = [
  '#e74c3c','#e67e22','#f1c40f','#2ecc71','#1abc9c','#3498db',
  '#9b59b6','#e91e63','#00bcd4','#8bc34a','#ff5722','#607d8b',
  '#673ab7','#03a9f4','#cddc39','#ff9800','#795548','#9c27b0',
  '#f44336','#4caf50','#2196f3','#ff4081'
];
function wColor(i){ return WHEEL_PALETTE[i % WHEEL_PALETTE.length]; }

const STAT_COLORS = [
  '#e74c3c','#e67e22','#f39c12','#f1c40f','#2ecc71',
  '#1abc9c','#3498db','#2980b9','#8e44ad','#6c3483'
];

// Races available (13 specified)
const CG_RACES = [
  { id:'goblin',    name:'Goblin',          emoji:'👺', weight:6.5,  subKey:'goblinHorde', trait:null },
  { id:'gnome',     name:'Gnome',           emoji:'🧙', weight:6.5,  subKey:null,          trait:null },
  { id:'human',     name:'Human',           emoji:'👤', weight:6.5,  subKey:null,          trait:null },
  { id:'dwarf',     name:'Dwarf',           emoji:'⛏️', weight:6.5,  subKey:null,          trait:null },
  { id:'skeleton',  name:'Skeleton',        emoji:'💀', weight:5.25, subKey:'boneLineage',  trait:'2 PvP wins → Lich (IQ fixed 8). 4 wins → Lich King (+1 all stats). Immune to AIDS.' },
  { id:'troll',     name:'Troll',           emoji:'🧌', weight:5.25, subKey:'trollType',   trait:null },
  { id:'orc',       name:'Orc',             emoji:'🗡️', weight:5.25, subKey:null,          trait:'Win: +2 lowest stat. Lose: -3 highest stat.' },
  { id:'giant',     name:'Giant',           emoji:'🏔️', weight:4.0,  subKey:null,          trait:'After stat roll: if IQ>STR → +5 IQ/-5 STR; if STR>IQ → +5 STR/-5 IQ; if equal → +3 both.' },
  { id:'dragon',    name:'Dragon',          emoji:'🐉', weight:4.0,  subKey:'dragonType',  trait:null },
  { id:'angel',     name:'Angel',           emoji:'👼', weight:3.5,  subKey:'angelRank',   trait:'Starts with Archetype "Pacifist" (will receive one more Archetype).' },
  { id:'primordial',name:'Primordial Being',emoji:'🌌', weight:3.5,  subKey:'elementalWheel', trait:'Each Combat win → receive Elemental Wheel again.' },
  { id:'demon',     name:'Demon',           emoji:'😈', weight:2.5,  subKey:'demonSin',    trait:null },
  { id:'god',       name:'God',             emoji:'✨', weight:2.5,  subKey:'godGift',     trait:null },
];

const CG_SUBRACES = {
  goblinHorde: [
    { label:'×1',      weight:5,  desc:'-1 all stats. +1 all stats per PvP win.' },
    { label:'×50',     weight:10, desc:'-1 all stats.' },
    { label:'×100',    weight:25, desc:"You're just a Goblin." },
    { label:'×1,000',  weight:20, desc:'+1 Strength.' },
    { label:'×5,000',  weight:15, desc:'+1 Strength, +1 Speed.' },
    { label:'×10,000', weight:15, desc:'+2 Strength, +2 Speed.' },
    { label:'×100,000',weight:10, desc:'+1 all stats, 1 Gear, guaranteed Unique Weapon.' },
  ],
  trollType: [
    { label:'Regular',  weight:42, desc:'Just a Troll.' },
    { label:'Ice',      weight:30, desc:'In combat: enemy -2 Speed.' },
    { label:'Mountain', weight:25, desc:'+3 Durability.' },
    { label:'Lich',     weight:3,  desc:'Gain 1 Power from a dead player after each battle.' },
  ],
  dragonType: [
    { label:'Crimson',  weight:9,  desc:'+2 Base IQ, +1 Base Durability.' },
    { label:'Stone',    weight:9,  desc:'+2 Base Durability.' },
    { label:'Amethyst', weight:9,  desc:'-1 all stats, +4 Powers.' },
    { label:'Ancient',  weight:9,  desc:"In combat: disable opponent's weapon." },
    { label:'Undead',   weight:9,  desc:'1 Summon, +1 Durability.' },
    { label:'Zephyrian',weight:9,  desc:'1 Power, 1 Quirk.' },
    { label:'Tideborn', weight:9,  desc:'+3 Base Strength.' },
    { label:'Thunder',  weight:10, desc:'[PvE] +1 starting point. No penalty on loss.' },
    { label:'Flame',    weight:12, desc:'1 Power, +2 to lowest stat.' },
    { label:'Ice',      weight:10, desc:'+1 Char Dev, +2 to lowest stat.' },
    { label:'Chaos',    weight:5,  desc:'3 Quirks.' },
  ],
  angelRank: [
    { label:'Angels',        weight:40, desc:'Nothing special.' },
    { label:'Archangels',    weight:21, desc:'+2 Speed, +1 Martial Arts.' },
    { label:'Principalities',weight:9,  desc:'After combat: +2 to lowest stat.' },
    { label:'Powers',        weight:8,  desc:'Archetype "Paladin", +2 MA.' },
    { label:'Virtues',       weight:7,  desc:'Cannot be debuffed.' },
    { label:'Dominions',     weight:6,  desc:'2 Powers.' },
    { label:'Ophanim',       weight:5,  desc:'+1 all stats.' },
    { label:'Cherubim',      weight:4,  desc:'+2 all stats.' },
  ],
  elementalWheel: [
    { label:'Air',   weight:25, desc:'Power "Blowing Leaves", +1 Speed, +1 to lowest stat.' },
    { label:'Water', weight:25, desc:'Power "Water Breathing", +1 BIQ, +1 to highest stat.' },
    { label:'Fire',  weight:25, desc:'Power "Fire Control", +1 MA, +1 Power.' },
    { label:'Earth', weight:25, desc:'Power "Earth-Shaking", +1 Strength, +1 Quirk.' },
  ],
  demonSin: [
    { label:'Lucifer',    weight:14.28, desc:'Archetype "Egoist". Power wheel maxes at 4.' },
    { label:'Beelzebub',  weight:14.28, desc:'Quirk "Slow Metabolism". 1 random stat maxes at 10.' },
    { label:'Leviathan',  weight:14.28, desc:'6 players gain Gear "Leviathan\'s Mark". When all die: +6 lowest stat.' },
    { label:'Behemoth',   weight:14.28, desc:'Lose: 1 random stat → 0. Win: 1 random stat +2.' },
    { label:'Mammon',     weight:14.28, desc:'-2 all stats. Win: 2 PvP rewards.' },
    { label:'Belphegor',  weight:14.28, desc:'First 2 rounds: 66% no point on win. +1 starting point.' },
    { label:'Asmodeus',   weight:14.28, desc:'Power "AIDS" (incurable). vs AIDS opponent: +1 starting point.' },
  ],
  godGift: [
    { label:'Cursed Sword',       weight:30, desc:'-1 all stats.' },
    { label:'War',                weight:7,  desc:'+3 Strength.' },
    { label:'Love',               weight:7,  desc:'1 Lover, 50% Archetype "Femboy".' },
    { label:'Time',               weight:7,  desc:'+3 Speed.' },
    { label:'Fortune',            weight:7,  desc:'3× Gear "Golden Coin".' },
    { label:'Secret Evil',        weight:7,  desc:'In combat: +2 to both highest and lowest stats.' },
    { label:'Knowledge',          weight:7,  desc:'+3 IQ.' },
    { label:'Arts & Magic',       weight:7,  desc:'2 Powers.' },
    { label:'Wilderness & Sea',   weight:7,  desc:'1 Summon wheel, 1 Elemental wheel.' },
    { label:'Creation',           weight:7,  desc:"1 Creator's Favor." },
    { label:'Moon',               weight:7,  desc:'Archetype "Pacifist" (+1 more Archetype).' },
  ],
  boneLineage: [
    { label:'Goblin Bones',           weight:6.5,  raceId:'goblin'     },
    { label:'Gnome Bones',            weight:6.5,  raceId:'gnome'      },
    { label:'Human Bones',            weight:6.5,  raceId:'human'      },
    { label:'Dwarf Bones',            weight:6.5,  raceId:'dwarf'      },
    { label:'Troll Bones',            weight:5.25, raceId:'troll'      },
    { label:'Orc Bones',              weight:5.25, raceId:'orc'        },
    { label:'Giant Bones',            weight:4.0,  raceId:'giant'      },
    { label:'Dragon Bones',           weight:4.0,  raceId:'dragon'     },
    { label:'Angel Bones',            weight:3.5,  raceId:'angel'      },
    { label:'Primordial Being Bones', weight:3.5,  raceId:'primordial' },
    { label:'Demon Bones',            weight:2.5,  raceId:'demon'      },
    { label:'God Bones',              weight:2.5,  raceId:'god'        },
  ],
};

// Stat weights from Chargen.md — columns: Goblin,Gnome,Human,Dwarf,Skeleton,Troll,Orc,Giant,Dragon,Angel,Primordial,Demon,God
// Rows are stat values 1-10
const CG_STAT_WEIGHTS = {
  strength: {
    goblin:[10,10,15,18,25,10,5,3,2,2], gnome:[15,10,10,13,22,15,5,5,3,2],
    human:[15,15,10,10,20,10,5,5,5,5],  dwarf:[5,7,8,7,13,20,15,10,9,6],
    skeleton:[10,10,10,10,10,10,10,10,10,10], troll:[10,5,10,5,20,20,15,5,5,5],
    orc:[2,3,4,5,6,35,20,10,8,7],       giant:[5,5,5,10,10,25,25,5,5,5],
    dragon:[12,3,3,3,3,25,31,5,5,10],   angel:[10,10,10,10,10,10,10,10,10,10],
    primordial:[15,5,5,5,5,5,35,10,5,10], demon:[20,5,5,5,5,10,10,10,15,15],
    god:[20,5,5,5,5,10,10,10,15,15]
  },
  speed: {
    goblin:[10,15,15,15,15,15,5,5,3,2], gnome:[10,15,15,15,15,15,5,5,3,2],
    human:[15,10,10,10,20,15,10,5,3,2], dwarf:[20,15,15,15,15,5,5,5,3,2],
    skeleton:[10,10,10,10,10,10,10,10,10,10], troll:[15,10,10,10,20,15,5,5,5,5],
    orc:[15,15,15,15,15,15,4,2,2,2],    giant:[15,15,15,15,15,15,4,2,2,2],
    dragon:[15,5,5,5,15,15,15,15,5,5],  angel:[10,10,10,10,10,10,10,10,10,10],
    primordial:[15,5,5,5,20,20,5,5,5,15], demon:[10,4,4,4,4,35,14,11,4,10],
    god:[15,2,3,4,4,4,44,4,5,15]
  },
  durability: {
    goblin:[10,10,15,20,15,15,10,2,2,1], gnome:[15,10,10,10,30,10,7,3,3,2],
    human:[15,7,8,9,20,16,14,6,3,2],    dwarf:[5,5,5,5,15,20,20,10,8,7],
    skeleton:[10,10,10,10,10,10,10,10,10,10], troll:[6,7,8,9,10,35,10,5,5,5],
    orc:[5,5,7,7,13,23,20,10,5,5],      giant:[5,5,5,10,10,20,20,5,5,15],
    dragon:[5,5,5,10,10,20,15,10,10,10], angel:[10,10,10,10,10,10,10,10,10,10],
    primordial:[15,5,5,10,5,25,10,10,10,5], demon:[15,5,5,5,15,15,15,5,5,15],
    god:[15,5,5,5,10,5,30,5,5,15]
  },
  iq: {
    goblin:[15,15,10,10,20,15,5,5,3,2],  gnome:[10,10,5,5,15,25,15,5,5,5],
    human:[15,5,5,5,15,15,15,12,8,5],   dwarf:[15,10,10,5,20,12,12,8,5,3],
    skeleton:[100,0,0,0,0,0,0,0,0,0],   troll:[15,15,15,5,25,10,5,5,3,2],
    orc:[15,15,15,5,25,10,5,5,3,2],     giant:[10,10,5,5,10,15,25,10,5,5],
    dragon:[15,5,5,5,15,20,5,10,15,5],  angel:[10,10,10,10,10,10,10,10,10,10],
    primordial:[15,5,5,15,5,15,15,5,5,15], demon:[20,5,5,5,20,10,5,5,5,20],
    god:[20,5,5,5,5,5,30,5,5,15]
  },
  battleiq: {
    goblin:[5,10,10,15,23,15,10,5,5,2],  gnome:[15,15,15,15,10,10,10,5,3,2],
    human:[10,5,5,5,15,15,20,10,10,5],  dwarf:[5,5,5,10,15,20,20,10,5,5],
    skeleton:[10,10,10,10,10,10,10,10,10,10], troll:[5,5,5,10,15,20,20,10,5,5],
    orc:[2,3,4,5,6,35,18,12,8,7],       giant:[15,10,10,5,15,15,5,10,10,5],
    dragon:[20,10,5,5,10,20,15,5,5,5],  angel:[10,10,10,10,10,10,10,10,10,10],
    primordial:[15,5,5,15,15,15,15,5,5,5], demon:[20,5,5,5,5,5,35,5,5,10],
    god:[20,5,5,5,5,5,20,10,5,20]
  },
  ma: {
    goblin:[15,15,15,10,10,10,10,5,5,5], gnome:[20,20,15,15,10,5,5,5,3,2],
    human:[15,5,5,5,20,10,15,5,5,15],   dwarf:[12,12,12,4,4,12,24,10,5,5],
    skeleton:[10,10,10,10,10,10,10,10,10,10], troll:[12,12,12,4,4,12,24,10,5,5],
    orc:[10,5,5,15,10,20,15,10,5,5],    giant:[40,5,5,5,5,5,20,5,5,5],
    dragon:[20,5,5,5,20,15,15,5,5,5],   angel:[10,10,10,10,10,10,10,10,10,10],
    primordial:[20,5,5,5,20,10,10,5,5,15], demon:[15,5,5,5,15,25,5,5,5,15],
    god:[20,5,5,5,25,5,5,5,5,20]
  }
};

const STAT_DISPLAY = [
  { key:'strength',  label:'STR', emoji:'💪' },
  { key:'speed',     label:'SPD', emoji:'⚡' },
  { key:'durability',label:'DUR', emoji:'🛡️' },
  { key:'iq',        label:'IQ',  emoji:'🧠' },
  { key:'battleiq',  label:'BIQ', emoji:'⚔️' },
  { key:'ma',        label:'MA',  emoji:'🥋' },
];

const CG_WEAPONS = [
  { id:'fists',    label:'🥊 Fists' },
  { id:'sword',    label:'⚔️ Sword' },
  { id:'dagger',   label:'🗡️ Dagger' },
  { id:'spear',    label:'🔱 Spear' },
  { id:'bow',      label:'🏹 Bow' },
  { id:'scythe',   label:'🌙 Scythe' },
  { id:'hammer',   label:'🔨 Hammer' },
  { id:'shuriken', label:'⭐ Shuriken' },
];
// Armed-only list (excludes Fists — used in weapon wheel when hasWeapon = true)
const CG_WEAPONS_ARMED = CG_WEAPONS.filter(w => w.id !== 'fists');

// Skill count weights per race — index 0 = 0 skills, index 4 = 4 skills
const CG_SKILL_COUNT_WEIGHTS = {
  goblin:     [30, 30, 20, 10, 10],
  gnome:      [30, 30, 25, 10,  5],
  human:      [25, 25, 25, 15, 10],
  dwarf:      [30, 35, 20, 10,  5],
  skeleton:   [20, 20, 20, 20, 20], // equal (not specified)
  troll:      [30, 35, 20, 10,  5],
  orc:        [30, 35, 20, 10,  5],
  giant:      [45,  5, 10,  5, 35],
  dragon:     [ 5, 15, 50, 20, 10],
  angel:      [15, 20, 30, 25, 10],
  primordial: [15,  5, 25, 35, 20],
  demon:      [20,  5, 15, 35, 25],
  god:        [20,  5, 15, 35, 25],
};
