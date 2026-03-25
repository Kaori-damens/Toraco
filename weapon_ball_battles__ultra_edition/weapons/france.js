import { Weapon } from './base.js';

export class France extends Weapon {
  static color = '#0055A4';
  static icon = 'france_icon.png';
  constructor(player){ super(player); this.damage = 1.2; this.breadLen = 110; }
  update(stunned){ if(!stunned) this.angle += 0.08 * this.spinDirection; }
  onHit(def){ // strong knockback along baguette direction
    const ca = Math.cos(this.angle), sa = Math.sin(this.angle);
    def.vx += ca * 8; def.vy += sa * 8;
  }
  getHitStunDurations(){ return { attacker: 4, defender: 8 }; }
  canAttack(s){ return !s; }
  getDamageDisplayText(){ return 'Baguette • Knockback'; }
  getCollisionPoints(){
    const pts = this._points; pts.length = 0;
    const s = this.getScale(), n=5, r=10*s, base=this.player.radius+6, step=(this.breadLen*s-20*s)/(n-1);
    const ca=Math.cos(this.angle), sa=Math.sin(this.angle);
    for(let i=0;i<n;i++){ const d=base+i*step; pts.push({x:this.player.x+ca*d,y:this.player.y+sa*d,radius:r}); }
    return pts;
  }
  draw(ctx){
    ctx.save(); ctx.translate(this.player.x,this.player.y); ctx.rotate(this.angle);
    const s=this.getScale(), L=this.breadLen*s, W=Math.max(8,14*s);
    ctx.fillStyle='#C68642'; ctx.strokeStyle='#000'; ctx.lineWidth=2;
    ctx.fillRect(this.player.radius,-W/2,L,W); ctx.strokeRect(this.player.radius,-W/2,L,W);
    ctx.restore();
  }
}

