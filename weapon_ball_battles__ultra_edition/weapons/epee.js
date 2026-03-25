/* Epee: similar to rapier but slightly heavier, good precision weapon */
import { Rapier } from './rapier.js';

export class Epee extends Rapier {
  static color = '#dfe6ff';
  static icon = 'epee_icon.png';
  constructor(player) {
    super(player);
    this.damage = 1.0;
    this.spinSpeed = 0.14;
  }
  getDamageDisplayText() { return `Epee • Dmg: ${this.damage}`; }
}