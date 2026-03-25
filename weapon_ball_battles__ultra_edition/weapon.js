// Tombstone refactor: this file used to contain all weapon classes and logic.
// removed class Weapon {}
// removed class NoWeapon {}
// removed class Basic {}
// removed class Unarmed {}
// removed class Sword {}
// removed class Dagger {}
// removed class Spear {}
// removed class Bow {}

// This file is now a lightweight barrel that re-exports from modularized files.
export { Weapon, NoWeapon, Basic } from './weapons/base.js';
export { Unarmed } from './weapons/unarmed.js';
export { Sword } from './weapons/sword.js';
export { Dagger } from './weapons/dagger.js';
export { Spear } from './weapons/spear.js';
export { Bow } from './weapons/bow.js';
export { Shuriken } from './weapons/shuriken.js';
export { Scythe } from './weapons/scythe.js';
export { Crusher } from './weapons/crusher.js';
export { Grower } from './weapons/grower.js';
export { Shrinker } from './weapons/shrinker.js';
export { Axe } from './weapons/axe.js';
export { Staff } from './weapons/staff.js';
export { SpeedBall } from './weapons/speedball.js';
export { Duplicator } from './weapons/duplicator.js';
export { Lance } from './weapons/lance.js';
export { CustomWeapon } from './weapons/custom.js';
export { AK47 } from './weapons/ak47.js';
export { Fuse } from './weapons/fuse.js';
export { France } from './weapons/france.js';
export { Italy } from './weapons/italy.js';
export { Germany } from './weapons/germany.js';
export { FireGod, GrassGod, WaterGod, AirGod, SoilGod } from './weapons/elements.js';
export { DummyBall, TestBall } from './weapons/dummyball.js';

/* Classic Roblox-style weapons (lightweight safe implementations) */
export { RocketLauncher } from './weapons/rocket.js';
export { Hammer } from './weapons/hammer.js';
export { Flamethrower } from './weapons/flamethrower.js';
export { Slingshot } from './weapons/slingshot.js';
export { Rapier } from './weapons/rapier.js';
export { Epee } from './weapons/epee.js';
export { SlimeGun } from './weapons/slimegun.js';
export { Tranquilizer } from './weapons/tranquilizer.js';
export { Lightsaber } from './weapons/lightsaber.js';
export { WaterGun } from './weapons/watergun.js';
export { LavaGun } from './weapons/lavagun.js';
export { Katana } from './weapons/katana.js';
export { Bomb } from './weapons/bomb.js';
export { Bat } from './weapons/bat.js';
export { Mop } from './weapons/mop.js';
export { Paintbrush } from './weapons/paintbrush.js';
export { Wand } from './weapons/wand.js';
export { Flail } from './weapons/flail.js';
export { Boomerang } from './weapons/boomerang.js';
export { Club } from './weapons/club.js';