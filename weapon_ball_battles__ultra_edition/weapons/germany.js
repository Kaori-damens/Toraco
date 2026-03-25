import { Weapon } from './base.js';

export class Germany extends Weapon {
  static color = '#FFCC00';
  static icon = 'germany_icon.png';
  constructor(player){
    super(player);
    this.damage = 0.8;
    this.projectiles = [];
    this.shootInterval = 36; this.timer = 0;
    this.bubbleSpeed = 8; this.bubbleLife = 90; this.bubbleRadius = 12;
    this.dizzyFrames = 120; this.dizzyStrength = 0.25;
  }
  update(stunned){
    if(!stunned){ this.angle += 0.05*this.spinDirection; this.timer--; if(this.timer<=0){ this.shoot(); this.timer=this.shootInterval; } }
    this.updateProj();
  }
  shoot(){
    const ca=Math.cos(this.angle), sa=Math.sin(this.angle);
    const x=this.player.x+ca*(this.player.radius+24), y=this.player.y+sa*(this.player.radius+24);
    this.projectiles.push({ x,y, vx:ca*this.bubbleSpeed, vy:sa*this.bubbleSpeed, life:this.bubbleLife });
  }
  updateProj(){
    const c=document.getElementById('gameCanvas');
    this.projectiles=this.projectiles.filter(p=>{
      p.x+=p.vx; p.y+=p.vy; p.life--;
      if(c){ if(p.x<-10||p.x>c.width+10||p.y<-10||p.y>c.height+10) return false; }
      return p.life>0;
    });
  }
  getCollisionPoints(){
    const pts=this._points; pts.length=0;
    this.projectiles.forEach(p=>pts.push({ x:p.x, y:p.y, radius:this.bubbleRadius, type:'beer', projectileRef:p }));
    return pts;
  }
  onHit(def){
    // If projectile made the hit, collision.js will mark life=0; apply dizzy on any successful hit
    def.dizzyFrames = Math.max(def.dizzyFrames||0, this.dizzyFrames);
    def.dizzyStrength = this.dizzyStrength;
  }
  getHitStunDurations(){ return { attacker: 4, defender: 6 }; }
  canAttack(s){ return !s; }
  getDamageDisplayText(){ return 'Beer • Dizzy'; }
  draw(ctx){
    // draw projectiles as beer mugs
    this.projectiles.forEach(p=>{
      ctx.save(); ctx.translate(p.x,p.y);
      ctx.fillStyle='#F5C542'; ctx.strokeStyle='#000'; ctx.lineWidth=2;
      ctx.fillRect(-10,-12,18,24); ctx.strokeRect(-10,-12,18,24);
      ctx.fillStyle='#fff'; ctx.fillRect(8,-6,6,12); // foam/handle
      ctx.restore();
    });
  }
}

