/* Rapier: quick finesse thrust with short reach and fast recovery */
import { Sword } from './sword.js';
import { playSwordHitSound } from '../audio.js';

export class Rapier extends Sword {
  static color = '#c7c7e6';
  static icon = 'rapier_icon.png';
  constructor(player) {
    super(player);
    this.damage = 0.8;
    this.spinSpeed = 0.18;
  }
  getDamageDisplayText() { return `Rapier • Dmg: ${this.damage}`; }
  playHitSound() { playSwordHitSound(); }
}