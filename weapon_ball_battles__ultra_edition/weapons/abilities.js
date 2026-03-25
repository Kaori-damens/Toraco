/*
  Assign short, unique ability descriptions to every exported weapon class.
  This module is imported and run once during startup to ensure UI and tooltips
  consistently show an ability for each ball type.
*/
import * as W from '../weapon.js';

export function setupWeaponAbilities() {
  const set = (Cls, text) => { if (Cls) Cls.ability = text; };

  // Core / basic
  set(W.Basic, 'No weapon — simple ball');
  set(W.NoWeapon, 'None');

  // Melee / blades
  set(W.Sword, 'Powerful parry • grants brief immunity on hit');
  set(W.Dagger, 'Very fast strikes • mini cooldown between hits');
  set(W.Rapier, 'Finesse thrusts • quick recovery');
  set(W.Epee, 'Precision fencing • slightly heavier than rapier');
  set(W.Katana, 'Swift slashes • high single-hit damage');
  set(W.Lightsaber, 'Instant reach beam • continuous blade');

  // Polearms / spears
  set(W.Spear, 'Grows damage & range on hit');
  set(W.Lance, 'Joust: heavy knockback & long reach on hit');

  // Throwers / projectiles
  set(W.Bow, 'Fires arrows • gains speed as more are active');
  set(W.Slingshot, 'Arcing pebbles • single-shot cadence');
  set(W.Shuriken, 'Thrown stars • increases bounces when hitting');
  set(W.Boomerang, 'Returns to owner • homes back after outward flight');
  set(W.RocketLauncher, 'Single explosive rocket • AoE damage');
  set(W.AK47, 'Rapid bullets • consistent ranged pressure');
  set(W.Tranquilizer, 'Darts that briefly stun on hit');

  // Guns / flame / liquid
  set(W.SlimeGun, 'Sticky blobs that slow targets');
  set(W.WaterGun, 'Short-range push cone');
  set(W.LavaGun, 'Hot projectiles • medium damage');
  set(W.Flamethrower, 'Cone of flame particles • tick damage');

  // Specialty ranged
  set(W.Bomb, 'Tosses explosives • large AoE blast');

  // Large / physics
  set(W.Crusher, 'Heavy body • squishes enemies into walls/corners');
  set(W.Grower, 'Grows over time • explodes at max size');
  set(W.Shrinker, 'Shrinks over time • pops when reaching zero');
  set(W.Duplicator, 'Duplicates on wall bounce • clones are basic and limited');
  set(W.SpeedBall, 'Speeds up on bounces • zaps nearest enemy at high speed');

  // Utility / weird
  set(W.Staff, 'Cycles magic modes (forcefield/expand/shrink/shadow/poison)');
  set(W.Wand, 'Minor magical pushes/heals');
  set(W.Paintbrush, 'Splashes colourful blobs (visual, slight damage)');

  // Heavy hitters / blunt
  set(W.Axe, 'Heavy hit • stuns + applies bleed');
  set(W.Hammer, 'Brutal blunt • stuns on hit');
  set(W.Bat, 'Short-range blunt swipes');
  set(W.Club, 'Heavy club • strong stun on hit');

  // Novel / national / gag weapons
  set(W.France, 'Baguette knockback • pushes targets');
  set(W.Italy, 'Pizza lure • tugs nearby enemies');
  set(W.Germany, 'Beer bubbles • daze/dizzy effect');

  // Elemental gods
  set(W.FireGod, 'Heat aura • burns nearby foes');
  set(W.GrassGod, 'Lifesteal on hit • roots enemies');
  set(W.WaterGod, 'Massive knockback on hit');
  set(W.AirGod, 'High speed • periodic lightning zaps');
  set(W.SoilGod, 'Heavy mass • earthquake stun on bounces');

  // Miscellaneous / support
  set(W.Fuse, 'Combines two weapons into one fused set');
  set(W.CustomWeapon, 'User-generated weapon (AI or saved custom)');
  set(W.TestBall, 'Test ball for debugging');
  set(W.DummyBall, 'Training dummy — infinite health if set');

  // Safety: ensure anything exported but without ability gets a default string
  Object.keys(W).forEach(key => {
    const Cls = W[key];
    if (typeof Cls === 'function' && typeof Cls.ability === 'undefined') {
      Cls.ability = 'Unique ability pending';
    }
  });
}