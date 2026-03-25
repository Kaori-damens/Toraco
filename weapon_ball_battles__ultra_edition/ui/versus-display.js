import { Sword, Dagger, Spear } from '../weapon.js';
import { Unarmed } from '../weapon.js';
import { Bow } from '../weapon.js';
import { Shuriken } from '../weapon.js'; // NEW: Import Shuriken
import { Scythe } from '../weapon.js'; // NEW: Import Scythe
import { Crusher } from '../weapon.js'; // NEW: Import Crusher
import { Grower } from '../weapon.js';  // NEW: Grower
import { Shrinker } from '../weapon.js'; // NEW: Shrinker
import { Axe } from '../weapon.js'; // NEW: Axe
import { Staff } from '../weapon.js'; // NEW: Staff
import { AK47 } from '../weapon.js'; // NEW: AK-47
import { Fuse } from '../weapon.js'; // NEW: Fuse
import { Duplicator, Lance } from '../weapon.js';
import { RocketLauncher, Hammer, Flamethrower, Slingshot, Rapier, Epee, SlimeGun, Tranquilizer, Lightsaber, WaterGun, LavaGun, Katana, Bomb, Bat, Mop, Paintbrush, Wand, Flail, Boomerang, Club } from '../weapon.js';
import { players } from '../state.js';
import { France, Italy, Germany, FireGod, GrassGod, WaterGod, AirGod, SoilGod } from '../weapon.js';

export function updateVersusDisplay(player1State, player2State) {
    const versusDisplay = document.getElementById('versus-display');
    versusDisplay.innerHTML = ''; // Clear previous content

    const p1Type = player1State.type;
    const p2Type = player2State.type;
    
    function createVersusElement(type, isPlayer2 = false) {
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.gap = '15px';

        const text = document.createElement('span');
        text.className = 'versus-text';
        text.textContent = type.charAt(0).toUpperCase() + type.slice(1);
        
        let icon = null;
        let weaponColor = 'white'; // Default for 'basic'

        if (type === 'sword') {
            icon = document.createElement('img');
            icon.src = Sword.icon;
            icon.alt = 'Sword Icon';
            weaponColor = Sword.color;
        } else if (type === 'dagger') {
            icon = document.createElement('img');
            icon.src = Dagger.icon;
            icon.alt = 'Dagger Icon';
            weaponColor = Dagger.color;
        } else if (type === 'rapier') {
            icon = document.createElement('img');
            icon.src = Rapier.icon;
            icon.alt = 'Rapier Icon';
            weaponColor = Rapier.color;
        } else if (type === 'epee') {
            icon = document.createElement('img');
            icon.src = Epee.icon;
            icon.alt = 'Épée Icon';
            weaponColor = Epee.color;
        } else if (type === 'katana') {
            icon = document.createElement('img');
            icon.src = Katana.icon;
            icon.alt = 'Katana Icon';
            weaponColor = Katana.color;
        } else if (type === 'spear') {
            icon = document.createElement('img');
            icon.src = Spear.icon;
            icon.alt = 'Spear Icon';
            weaponColor = Spear.color;
        } else if (type === 'unarmed') {
            icon = document.createElement('img');
            icon.src = Unarmed.icon;
            icon.alt = 'Unarmed Icon';
            weaponColor = Unarmed.color;
        } else if (type === 'bow') {
            icon = document.createElement('img');
            icon.src = Bow.icon;
            icon.alt = 'Bow Icon';
            weaponColor = Bow.color;
        } else if (type === 'slingshot') {
            icon = document.createElement('img');
            icon.src = Slingshot.icon;
            icon.alt = 'Slingshot Icon';
            weaponColor = Slingshot.color;
        } else if (type === 'scythe') {
            icon = document.createElement('img');
            icon.src = Scythe.icon;
            icon.alt = 'Scythe Icon';
            weaponColor = Scythe.color;
        } else if (type === 'crusher') {
            icon = document.createElement('img');
            icon.src = Crusher.icon;
            icon.alt = 'Crusher Icon';
            weaponColor = Crusher.color;
        } else if (type === 'grower') {
            icon = document.createElement('img');
            icon.src = Grower.icon;
            icon.alt = 'Grower Icon';
            weaponColor = Grower.color;
        } else if (type === 'shrinker') {
            icon = document.createElement('img');
            icon.src = Shrinker.icon;
            icon.alt = 'Shrinker Icon';
            weaponColor = Shrinker.color;
        } else if (type === 'axe') {
            icon = document.createElement('img');
            icon.src = Axe.icon;
            icon.alt = 'Axe Icon';
            weaponColor = Axe.color;
        } else if (type === 'hammer') {
            icon = document.createElement('img');
            icon.src = Hammer.icon;
            icon.alt = 'Hammer Icon';
            weaponColor = Hammer.color;
        } else if (type === 'bat') {
            icon = document.createElement('img');
            icon.src = Bat.icon;
            icon.alt = 'Bat Icon';
            weaponColor = Bat.color;
        } else if (type === 'mop') {
            icon = document.createElement('img');
            icon.src = Mop.icon;
            icon.alt = 'Mop Icon';
            weaponColor = Mop.color;
        } else if (type === 'shuriken') {
            icon = document.createElement('img');
            icon.src = Shuriken.icon;
            icon.alt = 'Shuriken Icon';
            weaponColor = Shuriken.color;
        } else if (type === 'staff') {
            icon = document.createElement('img');
            icon.src = Staff.icon;
            icon.alt = 'Staff Icon';
            weaponColor = Staff.color;
        } else if (type === 'wand') {
            icon = document.createElement('img');
            icon.src = Wand.icon;
            icon.alt = 'Wand Icon';
            weaponColor = Wand.color;
        } else if (type === 'duplicator') {
            icon = document.createElement('img');
            icon.src = Duplicator.icon;
            icon.alt = 'Duplicator Icon';
            weaponColor = Duplicator.color;
        } else if (type === 'lance') {
            icon = document.createElement('img');
            icon.src = Lance.icon;
            icon.alt = 'Lance Icon';
            weaponColor = Lance.color;
        } else if (type === 'ak47') {
            icon = document.createElement('img');
            icon.src = AK47.icon;
            icon.alt = 'AK-47 Icon';
            weaponColor = AK47.color;
        } else if (type === 'rocket') {
            icon = document.createElement('img');
            icon.src = RocketLauncher.icon;
            icon.alt = 'Rocket Icon';
            weaponColor = RocketLauncher.color;
        } else if (type === 'slimegun') {
            icon = document.createElement('img');
            icon.src = SlimeGun.icon;
            icon.alt = 'Slime Gun Icon';
            weaponColor = SlimeGun.color;
        } else if (type === 'tranquilizer') {
            icon = document.createElement('img');
            icon.src = Tranquilizer.icon;
            icon.alt = 'Tranquilizer Icon';
            weaponColor = Tranquilizer.color;
        } else if (type === 'flamethrower') {
            icon = document.createElement('img');
            icon.src = Flamethrower.icon;
            icon.alt = 'Flamethrower Icon';
            weaponColor = Flamethrower.color;
        } else if (type === 'watergun') {
            icon = document.createElement('img');
            icon.src = WaterGun.icon;
            icon.alt = 'Water Gun Icon';
            weaponColor = WaterGun.color;
        } else if (type === 'lavagun') {
            icon = document.createElement('img');
            icon.src = LavaGun.icon;
            icon.alt = 'Lava Gun Icon';
            weaponColor = LavaGun.color;
        } else if (type === 'bomb') {
            icon = document.createElement('img');
            icon.src = Bomb.icon;
            icon.alt = 'Bomb Icon';
            weaponColor = Bomb.color;
        } else if (type === 'lightsaber') {
            icon = document.createElement('img');
            icon.src = Lightsaber.icon;
            icon.alt = 'Lightsaber Icon';
            weaponColor = Lightsaber.color;
        } else if (type === 'paintbrush') {
            icon = document.createElement('img');
            icon.src = Paintbrush.icon;
            icon.alt = 'Paintbrush Icon';
            weaponColor = Paintbrush.color;
        } else if (type === 'duplicator') {
            icon = document.createElement('img');
            icon.src = Duplicator.icon;
            icon.alt = 'Duplicator Icon';
            weaponColor = Duplicator.color;
        } else if (type === 'dummyball') {
            icon = document.createElement('img');
            icon.src = DummyBall.icon;
            icon.alt = 'Dummy Ball Icon';
            weaponColor = DummyBall.color;
        } else if (type === 'fuse') {
            icon = document.createElement('img');
            icon.src = Fuse.icon;
            icon.alt = 'Fuse Icon';
            weaponColor = Fuse.color;
        } else if (type === 'france') {
            icon = document.createElement('img');
            icon.src = France.icon;
            weaponColor = France.color;
        } else if (type === 'italy') {
            icon = document.createElement('img');
            icon.src = Italy.icon;
            weaponColor = Italy.color;
        } else if (type === 'germany') {
            icon = document.createElement('img');
            icon.src = Germany.icon;
            weaponColor = Germany.color;
        } else if (type === 'fire_god') {
            icon = document.createElement('img');
            icon.src = FireGod.icon;
            weaponColor = FireGod.color;
        } else if (type === 'grass_god') {
            icon = document.createElement('img');
            icon.src = GrassGod.icon;
            weaponColor = GrassGod.color;
        } else if (type === 'water_god') {
            icon = document.createElement('img');
            icon.src = WaterGod.icon;
            weaponColor = WaterGod.color;
        } else if (type === 'air_god') {
            icon = document.createElement('img');
            icon.src = AirGod.icon;
            weaponColor = AirGod.color;
        } else if (type === 'soil_god') {
            icon = document.createElement('img');
            icon.src = SoilGod.icon;
            weaponColor = SoilGod.color;
        }
        
        text.style.color = weaponColor; // Set color based on weapon type

        if (icon) {
            icon.className = 'versus-icon';
            if (isPlayer2) {
                icon.classList.add('flipped');
            }
        }

        if (isPlayer2) {
            if(icon) container.appendChild(icon);
            container.appendChild(text);
        } else {
            container.appendChild(text);
            if(icon) container.appendChild(icon);
        }
        
        if (isPlayer2) {
            container.id = 'versus-p2-container';
        } else {
            container.id = 'versus-p1-container';
        }

        return container;
    }

    const p1Display = createVersusElement(p1Type);
    versusDisplay.appendChild(p1Display);

    const vsText = document.createElement('span');
    vsText.className = 'versus-text';
    vsText.id = 'vs-text'; // Add ID to target the VS text specifically
    vsText.textContent = 'VS';
    vsText.style.color = 'white'; // VS text is always white
    versusDisplay.appendChild(vsText);

    const p2Display = createVersusElement(p2Type, true);
    versusDisplay.appendChild(p2Display);
}

export function resetVersusUI() {
    const versusP1 = document.getElementById('versus-p1-container');
    const versusP2 = document.getElementById('versus-p2-container');
    const vsText = document.getElementById('vs-text'); // Get the VS text element

    if (vsText) {
        vsText.style.color = 'white'; // Reset VS text to white
    }
    
    // The player text color is now set by `updateVersusDisplay`, which is called
    // during a reset flow, so there's no need to manually reset colors here.
    // Removing the incorrect logic that forced them to white.

    // Restore each side's color to the current players' colors (if available)
    if (versusP1) {
        const textEl = versusP1.querySelector('.versus-text');
        if (textEl && players[0]) {
            textEl.style.color = players[0].color || 'white';
        }
    }
    if (versusP2) {
        const textEl = versusP2.querySelector('.versus-text');
        if (textEl && players[1]) {
            textEl.style.color = players[1].color || 'white';
        }
    }
}

export function updateLoserUI(loserSide) {
    const LOSER_COLOR = '#7C7879';
    
    if (loserSide === 'left') {
        const damageDisplay = document.getElementById('damage-display-left');
        const versusContainer = document.getElementById('versus-p1-container');
        if (damageDisplay) damageDisplay.style.color = LOSER_COLOR;
        if (versusContainer) {
            const textEl = versusContainer.querySelector('.versus-text');
            if (textEl) textEl.style.color = LOSER_COLOR;
        }
    } else if (loserSide === 'right') {
        const damageDisplay = document.getElementById('damage-display-right');
        const versusContainer = document.getElementById('versus-p2-container');
        if (damageDisplay) damageDisplay.style.color = LOSER_COLOR;
        if (versusContainer) {
            const textEl = versusContainer.querySelector('.versus-text');
            if (textEl) textEl.style.color = LOSER_COLOR;
        }
    }
}