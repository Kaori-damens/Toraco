/* Katana: faster, longer blade - stylistic differences from sword */
import { Sword } from './sword.js';
import { playSwordHitSound } from '../audio.js';

export class Katana extends Sword {
  static color = '#ffffff';
  static icon = 'katana_icon.png';
  constructor(player) {
    super(player);
    this.damage = 1.6;
    this.spinSpeed = 0.12;
  }
  getDamageDisplayText() { return `Katana • Dmg: ${this.damage}`; }
  playHitSound() { playSwordHitSound(); }
}