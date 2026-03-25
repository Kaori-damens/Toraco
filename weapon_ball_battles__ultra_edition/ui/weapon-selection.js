import { Sword, Dagger, Spear } from '../weapon.js';
import { Unarmed } from '../weapon.js';
import { Basic } from '../weapon.js';
import { Bow } from '../weapon.js';
import { Scythe } from '../weapon.js'; 
import { Crusher } from '../weapon.js'; 
import { Grower } from '../weapon.js';  
import { Shrinker } from '../weapon.js'; 
import { Axe } from '../weapon.js'; 
import { Staff } from '../weapon.js'; 
import { SpeedBall } from '../weapon.js'; 
import { Duplicator } from '../weapon.js'; 
import { DummyBall } from '../weapons/dummyball.js'; 
import { AK47 } from '../weapon.js'; 
import { Fuse } from '../weapon.js'; 
import { FireGod, GrassGod, WaterGod, AirGod, SoilGod, Lance, Rapier, Epee, SlimeGun, Tranquilizer, Lightsaber, Flamethrower, WaterGun, LavaGun, Katana, Hammer, Bomb, Bat, Mop, Paintbrush, Wand, Slingshot, Flail, Boomerang, Club, France, Italy, Germany, Shuriken } from '../weapon.js';

export async function createWeaponDisplay(weaponType) {
    const display = document.createElement('div');
    display.className = 'weapon-display';
    
    let icon = null, color = '#fff', ability = '';
    switch(weaponType) {
        case 'basic':
            icon = Basic.icon;
            color = Basic.color;
            ability = Basic.ability || 'No special ability';
            break;
        case 'sword':
            icon = Sword.icon;
            color = Sword.color;
            ability = Sword.ability || 'Powerful parry';
            break;
        case 'dagger':
            icon = Dagger.icon;
            color = Dagger.color;
            ability = Dagger.ability || 'Fast multi-hits';
            break;
        case 'spear':
            icon = Spear.icon;
            color = Spear.color;
            ability = Spear.ability || 'Grows on hit';
            break;
        case 'unarmed':
            icon = Unarmed.icon;
            color = Unarmed.color;
            ability = Unarmed.ability || 'Charge slam';
            break;
        case 'bow':
            icon = Bow.icon;
            color = Bow.color;
            ability = Bow.ability || 'Arrows gain speed with count';
            break;
        case 'scythe':
            icon = Scythe.icon;
            color = Scythe.color;
            ability = Scythe.ability || 'Applies stacking poison';
            break;
        case 'crusher':
            icon = Crusher.icon;
            color = Crusher.color;
            ability = Crusher.ability || 'Squishes against walls';
            break;
        case 'grower':
            icon = Grower.icon;
            color = Grower.color;
            ability = Grower.ability || 'Explodes at max size';
            break;
        case 'shrinker':
            icon = Shrinker.icon;
            color = Shrinker.color;
            ability = Shrinker.ability || 'Shrinks to pop';
            break;
        case 'axe':
            icon = Axe.icon;
            color = Axe.color;
            ability = Axe.ability || 'Heavy stun + bleed';
            break;
        case 'staff':
            icon = Staff.icon;
            color = Staff.color;
            ability = Staff.ability || 'Cycles magic modes';
            break;
        case 'shuriken': {
            const mod = await import('../weapon.js');
            icon = mod.Shuriken.icon;
            color = mod.Shuriken.color;
            ability = mod.Shuriken.ability || 'Thrown, bounces';
            break;
        }
        case 'speedball': { 
            const mod = await import('../weapon.js');
            icon = mod.SpeedBall.icon;
            color = mod.SpeedBall.color;
            ability = mod.SpeedBall.ability || 'Speeds up and zaps';
            break;
        }
        case 'duplicator': { 
            const mod = await import('../weapon.js');
            icon = mod.Duplicator.icon;
            color = mod.Duplicator.color;
            ability = mod.Duplicator.ability || 'Duplicates on bounce';
            break;
        }
        case 'lance': {
            // Use the dedicated lance icon and color
            icon = Lance.icon;
            color = Lance.color;
            ability = Lance.ability || 'Joust impulse on hit';
            break;
        }
        case 'ak47': {
            icon = AK47.icon;
            color = AK47.color;
            ability = AK47.ability || 'Fires bullets';
            break;
        }
        case 'dummyball': { 
            const mod = await import('../weapons/dummyball.js');
            icon = mod.DummyBall.icon;
            color = mod.DummyBall.color;
            ability = mod.DummyBall.ability || 'Infinite health (training)';
            break;
        }
        case 'fuse': {
            icon = Fuse.icon;
            color = Fuse.color;
            ability = Fuse.ability || 'Combines two weapons';
            break;
        }
        case 'rocket': {
            // lightweight placeholder icon/color for RocketLauncher
            icon = 'pixil-frame-0%20(3).png';
            color = '#FF6B6B';
            ability = 'Single explosive rocket';
            break;
        }
        case 'hammer': {
            icon = Hammer.icon;
            color = Hammer.color;
            ability = Hammer.ability || 'Heavy stun';
            break;
        }
        case 'bomb': {
            icon = Bomb.icon;
            color = Bomb.color;
            ability = Bomb.ability || 'AoE explosion';
            break;
        }
        case 'flamethrower': {
            icon = Flamethrower?.icon || 'pixil-frame-0%20(4).png';
            color = Flamethrower?.color || '#FF8C00';
            ability = Flamethrower?.ability || 'Cone flame particles';
            break;
        }
        case 'slingshot': {
            icon = Slingshot.icon;
            color = Slingshot.color;
            ability = Slingshot.ability || 'Arcing pebbles';
            break;
        }
        case 'rapier': {
            icon = Rapier.icon;
            color = Rapier.color;
            ability = Rapier.ability || 'Quick thrusts';
            break;
        }
        case 'epee': {
            icon = Epee.icon;
            color = Epee.color;
            ability = Epee.ability || 'Precise fencing';
            break;
        }
        case 'slimegun': {
            icon = SlimeGun.icon;
            color = SlimeGun.color;
            ability = SlimeGun.ability || 'Sticky slowing blobs';
            break;
        }
        case 'tranquilizer': {
            icon = Tranquilizer.icon;
            color = Tranquilizer.color;
            ability = Tranquilizer.ability || 'Darts that stun';
            break;
        }
        case 'lightsaber': {
            icon = Lightsaber.icon;
            color = Lightsaber.color;
            ability = Lightsaber.ability || 'Instant reach beam';
            break;
        }
        case 'watergun': {
            icon = WaterGun.icon;
            color = WaterGun.color;
            ability = WaterGun.ability || 'Short push cone';
            break;
        }
        case 'lavagun': {
            icon = LavaGun.icon;
            color = LavaGun.color;
            ability = LavaGun.ability || 'Hot projectiles';
            break;
        }
        case 'katana': {
            icon = Katana.icon;
            color = Katana.color;
            ability = Katana.ability || 'Fast slashes';
            break;
        }
        case 'bat': {
            icon = Bat.icon;
            color = Bat.color;
            ability = Bat.ability || 'Blunt short-range hits';
            break;
        }
        case 'mop': {
            icon = Mop.icon;
            color = Mop.color;
            ability = Mop.ability || 'Wide smear slows targets';
            break;
        }
        case 'paintbrush': {
            icon = Paintbrush.icon;
            color = Paintbrush.color;
            ability = Paintbrush.ability || 'Splashes visual blobs';
            break;
        }
        case 'wand': {
            icon = Wand.icon;
            color = Wand.color;
            ability = Wand.ability || 'Minor magical pushes/heals';
            break;
        }
        case 'france': {
            const mod = await import('../weapon.js');
            icon = mod.France.icon; color = mod.France.color; ability = mod.France.ability || 'Baguette knockback'; break;
        }
        case 'italy': {
            const mod = await import('../weapon.js');
            icon = mod.Italy.icon; color = mod.Italy.color; ability = mod.Italy.ability || 'Pizza lure'; break;
        }
        case 'germany': {
            const mod = await import('../weapon.js');
            icon = mod.Germany.icon; color = mod.Germany.color; ability = mod.Germany.ability || 'Beer projectiles daze'; break;
        }
        case 'fire_god':
            icon = FireGod.icon; color = FireGod.color; ability = FireGod.ability || 'Heat aura'; break;
        case 'grass_god':
            icon = GrassGod.icon; color = GrassGod.color; ability = GrassGod.ability || 'Lifesteal on hit'; break;
        case 'water_god':
            icon = WaterGod.icon; color = WaterGod.color; ability = WaterGod.ability || 'Pushes on hit'; break;
        case 'air_god':
            icon = AirGod.icon; color = AirGod.color; ability = AirGod.ability || 'Speed zaps'; break;
        case 'soil_god':
            icon = SoilGod.icon; color = SoilGod.color; ability = SoilGod.ability || 'Quake on bounce'; break;
    }
    
    if (icon) {
        // include a small ability label underneath the icon for clarity
        display.innerHTML = `
          <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
            <img src="${icon}" alt="${weaponType}" style="width: 60px; height: 60px;">
            <div class="weapon-ability" style="font-size:12px;text-align:center;padding:2px 6px;color:#000;background:rgba(255,255,255,0.8);border-radius:6px;border:2px solid #000;min-width:120px;">
              ${ability}
            </div>
          </div>
        `;
        display.style.backgroundColor = color;
    }
    
    return display;
}

export function setupClassicWeaponSelection(leftSelectionBox, rightSelectionBox, player1State, player2State, updateCallback, resetCallback) {
    // Clear existing content to prevent duplicate weapon icons if called multiple times
    leftSelectionBox.innerHTML = '';
    rightSelectionBox.innerHTML = '';

    const leftWeaponContainer = document.createElement('div');
    leftWeaponContainer.className = 'weapon-container';

    const rightWeaponContainer = document.createElement('div');
    rightWeaponContainer.className = 'weapon-container';

    // Order: ... include Grower and Shrinker (no-weapon types like Crusher)
    // NEW: Add Duplicator
    const weapons = [
        'basic',
        'sword', 'dagger', 'rapier', 'epee', 'katana',
        'spear', 'lance',
        'unarmed',
        'bow', 'slingshot',
        'scythe', 'axe', 'hammer', 'bat', 'mop', 'staff', 'wand',
        'crusher', 'grower', 'shrinker',
        'shuriken', 'speedball', 'duplicator',
        'ak47', 'rocket',
        'slimegun', 'tranquilizer', 'flamethrower', 'watergun', 'lavagun', 'bomb', 'paintbrush',
        'france', 'italy', 'germany',
        'fire_god', 'grass_god', 'water_god', 'air_god', 'soil_god'
    ];
    let leftSelectedType = player1State.type; 
    let rightSelectedType = player2State.type; 
    
    const leftDisplays = {};
    const rightDisplays = {};

    // Helper to set color by type on select
    async function setStateColorForType(stateObj, weaponType) {
        switch(weaponType) {
            case 'basic': stateObj.color = Basic.color; break;
            case 'sword': stateObj.color = Sword.color; break;
            case 'dagger': stateObj.color = Dagger.color; break;
            case 'spear': stateObj.color = Spear.color; break;
            case 'unarmed': stateObj.color = Unarmed.color; break;
            case 'bow': stateObj.color = Bow.color; break;
            case 'scythe': stateObj.color = Scythe.color; break;
            case 'crusher': stateObj.color = Crusher.color; break;
            case 'grower': stateObj.color = Grower.color; break;
            case 'shrinker': stateObj.color = Shrinker.color; break;
            case 'axe': stateObj.color = Axe.color; break;
            case 'hammer': stateObj.color = Hammer.color; break;
            case 'bomb': stateObj.color = Bomb.color; break;
            case 'bat': stateObj.color = Bat.color; break;
            case 'mop': stateObj.color = Mop.color; break;
            case 'paintbrush': stateObj.color = Paintbrush.color; break;
            case 'staff': stateObj.color = Staff.color; break;
            case 'shuriken': stateObj.color = (await import('../weapon.js')).Shuriken.color; break;
            case 'speedball': stateObj.color = (await import('../weapon.js')).SpeedBall.color; break; 
            case 'duplicator': stateObj.color = (await import('../weapon.js')).Duplicator.color; break; 
            case 'dummyball': stateObj.color = (await import('../weapons/dummyball.js')).DummyBall.color; break; 
            case 'ak47': stateObj.color = (await import('../weapon.js')).AK47.color; break;
            case 'fuse': stateObj.color = (await import('../weapon.js')).Fuse.color; break;
            case 'slingshot': stateObj.color = Slingshot.color; break;
            case 'rapier': stateObj.color = Rapier.color; break;
            case 'epee': stateObj.color = Epee.color; break;
            case 'slimegun': stateObj.color = SlimeGun.color; break;
            case 'tranquilizer': stateObj.color = Tranquilizer.color; break;
            case 'lightsaber': stateObj.color = Lightsaber.color; break;
            case 'watergun': stateObj.color = WaterGun.color; break;
            case 'lavagun': stateObj.color = LavaGun.color; break;
            case 'katana': stateObj.color = Katana.color; break;
            case 'wand': stateObj.color = Wand.color; break;
            case 'france': stateObj.color = France.color; break;
            case 'italy': stateObj.color = Italy.color; break;
            case 'germany': stateObj.color = Germany.color; break;
            case 'fire_god': stateObj.color = FireGod.color; break;
            case 'grass_god': stateObj.color = GrassGod.color; break;
            case 'water_god': stateObj.color = WaterGod.color; break;
            case 'air_god': stateObj.color = AirGod.color; break;
            case 'soil_god': stateObj.color = SoilGod.color; break;
        }
    }

    // Helper to build a display and wire handlers
    const buildDisplay = async (weaponType, side) => {
        const el = await createWeaponDisplay(weaponType);
        if (side === 'left') {
            leftDisplays[weaponType] = el;
            if (leftSelectedType === weaponType) el.classList.add('selected');
            el.addEventListener('click', async () => {
                leftSelectedType = weaponType;
                player1State.type = weaponType;
                await setStateColorForType(player1State, weaponType);
                el.classList.add('selected');
                Object.values(leftDisplays).forEach(d => {
                    if (d !== el) d.classList.remove('selected');
                });
                updateCallback(player1State, player2State);
                resetCallback();
            });
        } else {
            rightDisplays[weaponType] = el;
            if (rightSelectedType === weaponType) el.classList.add('selected');
            el.addEventListener('click', async () => {
                rightSelectedType = weaponType;
                player2State.type = weaponType;
                await setStateColorForType(player2State, weaponType);
                el.classList.add('selected');
                Object.values(rightDisplays).forEach(d => {
                    if (d !== el) d.classList.remove('selected');
                });
                updateCallback(player1State, player2State);
                resetCallback();
            });
        }
        return el;
    };

    (async () => {
        for (const wt of weapons) {
            const lEl = await buildDisplay(wt, 'left');
            leftWeaponContainer.appendChild(lEl);

            const rEl = await buildDisplay(wt, 'right');
            rightWeaponContainer.appendChild(rEl);
        }
    })();

    leftSelectionBox.appendChild(leftWeaponContainer);
    rightSelectionBox.appendChild(rightWeaponContainer);
}