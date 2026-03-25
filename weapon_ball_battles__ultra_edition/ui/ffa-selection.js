import { Sword, Dagger, Spear } from '../weapon.js';
import { playClickSound } from '../audio.js';
import { Unarmed } from '../weapon.js';
import { Basic } from '../weapon.js';
import { Bow } from '../weapon.js';
import { Shuriken } from '../weapon.js';
import { Scythe } from '../weapon.js'; // NEW: Scythe
import { Crusher } from '../weapon.js'; // NEW: Crusher
import { Grower } from '../weapon.js';  // NEW: Grower
import { Shrinker } from '../weapon.js'; // NEW: Shrinker
import { Axe } from '../weapon.js'; // NEW: Axe
import { Staff } from '../weapon.js'; // NEW: Staff
import { SpeedBall } from '../weapon.js'; // NEW: SpeedBall
import { Duplicator, Lance } from '../weapon.js'; // NEW: Duplicator + Lance
import { AK47 } from '../weapon.js'; // NEW: AK-47
import { RocketLauncher, Hammer, Flamethrower, Slingshot, Rapier, Epee, SlimeGun, Tranquilizer, Lightsaber, WaterGun, LavaGun, Katana, Bomb, Bat, Mop, Paintbrush, Wand } from '../weapon.js';
import { DummyBall, TestBall } from '../weapon.js';
import { Fuse } from '../weapon.js'; // NEW: Fuse
import { France, Italy, Germany, FireGod, GrassGod, WaterGod, AirGod, SoilGod } from '../weapon.js'; // FIX: static import for country weapons

let selectedBalls = [];

// New function to clear the selected balls for FFA mode
export function clearFFABallSelections() {
    selectedBalls = [];
}

export function setupFFABallSelection(resetGameCallback) {
    const leftSelectionBox = document.getElementById('selection-box-left');
    leftSelectionBox.innerHTML = ''; // Clear existing content

    const weaponContainer = document.createElement('div');
    weaponContainer.className = 'weapon-container';
    weaponContainer.style.display = 'flex';
    weaponContainer.style.flexDirection = 'column';
    weaponContainer.style.alignItems = 'stretch';
    weaponContainer.style.gap = '10px';
    weaponContainer.style.width = '100%';
    weaponContainer.style.height = '100%';
    weaponContainer.style.overflowX = 'hidden'; // Ensure no horizontal overflow here

    // Top section: weapon choices list (scrollable if needed)
    const listSection = document.createElement('div');
    listSection.style.display = 'flex';
    listSection.style.flexDirection = 'column';
    listSection.style.alignItems = 'center';
    listSection.style.gap = '10px';
    listSection.style.width = '100%';
    listSection.style.flex = '1 1 auto'; // grow to fill, allow scroll
    listSection.style.overflowY = 'auto';
    listSection.style.overflowX = 'hidden'; // Explicitly hide horizontal scroll for the list

    // Bottom section: actions
    const actionsSection = document.createElement('div');
    actionsSection.style.display = 'flex';
    actionsSection.style.flex = '0 0 auto';
    actionsSection.style.justifyContent = 'center';
    actionsSection.style.paddingTop = '6px';

    // Create weapon selection buttons (including basic)
    // Swapped order: Bow before Unarmed
    // NEW: Add Duplicator
    const weaponTypes = [
        { type: 'basic', weapon: Basic, name: 'Basic' },
        { type: 'sword', weapon: Sword, name: 'Sword' },
        { type: 'dagger', weapon: Dagger, name: 'Dagger' },
        { type: 'rapier', weapon: Rapier, name: 'Rapier' },
        { type: 'epee', weapon: Epee, name: 'Épée' },
        { type: 'katana', weapon: Katana, name: 'Katana' },
        { type: 'spear', weapon: Spear, name: 'Spear' },
        { type: 'lance', weapon: Lance, name: 'Lance' },
        { type: 'unarmed', weapon: Unarmed, name: 'Unarmed' },
        { type: 'bow', weapon: Bow, name: 'Bow' },
        { type: 'slingshot', weapon: Slingshot, name: 'Slingshot' },
        { type: 'scythe', weapon: Scythe, name: 'Scythe' },   // NEW
        { type: 'axe', weapon: Axe, name: 'Axe' },            // NEW
        { type: 'hammer', weapon: Hammer, name: 'Hammer' },
        { type: 'bat', weapon: Bat, name: 'Bat' },
        { type: 'mop', weapon: Mop, name: 'Mop' },
        { type: 'staff', weapon: Staff, name: 'Staff' },       // NEW
        { type: 'wand', weapon: Wand, name: 'Wand' },
        { type: 'crusher', weapon: Crusher, name: 'Crusher' }, // NEW
        { type: 'grower', weapon: Grower, name: 'Grower' },     // NEW
        { type: 'shrinker', weapon: Shrinker, name: 'Shrinker' }, // NEW
        { type: 'shuriken', weapon: Shuriken, name: 'Shuriken' },
        { type: 'speedball', weapon: SpeedBall, name: 'SpeedBall' }, // NEW: SpeedBall
        { type: 'duplicator', weapon: Duplicator, name: 'Duplicator' }, // NEW: Duplicator
        { type: 'dummyball', weapon: DummyBall, name: 'Dummy Ball' }, // NEW: Dummy Ball
        { type: 'ak47', weapon: AK47, name: 'AK-47' }, // NEW: AK-47
        { type: 'rocket', weapon: RocketLauncher, name: 'Rocket' },
        { type: 'slimegun', weapon: SlimeGun, name: 'Slime Gun' },
        { type: 'tranquilizer', weapon: Tranquilizer, name: 'Tranquilizer' },
        { type: 'flamethrower', weapon: Flamethrower, name: 'Flamethrower' },
        { type: 'watergun', weapon: WaterGun, name: 'Water Gun' },
        { type: 'lavagun', weapon: LavaGun, name: 'Lava Gun' },
        { type: 'bomb', weapon: Bomb, name: 'Bomb' },
        { type: 'lightsaber', weapon: Lightsaber, name: 'Lightsaber' },
        { type: 'paintbrush', weapon: Paintbrush, name: 'Paintbrush' },
        { type: 'france', weapon: France, name: 'France' },
        { type: 'italy', weapon: Italy, name: 'Italy' },
        { type: 'germany', weapon: Germany, name: 'Germany' },
        { type: 'fire_god', weapon: FireGod, name: 'Fire God' },
        { type: 'grass_god', weapon: GrassGod, name: 'Grass God' },
        { type: 'water_god', weapon: WaterGod, name: 'Water God' },
        { type: 'air_god', weapon: AirGod, name: 'Air God' },
        { type: 'soil_god', weapon: SoilGod, name: 'Soil God' }
    ];

    // Keep references to displays by type for reliable counter updates
    const displaysByType = {};

    weaponTypes.forEach(weaponType => {
        // Create container for weapon display and buttons
        const weaponItemContainer = document.createElement('div');
        weaponItemContainer.style.display = 'flex';
        weaponItemContainer.style.flexDirection = 'column';
        weaponItemContainer.style.alignItems = 'center';
        weaponItemContainer.style.gap = '8px';
        weaponItemContainer.style.width = '100%';

        const weaponDisplay = document.createElement('div');
        weaponDisplay.className = 'weapon-display';
        weaponDisplay.style.position = 'relative';
        weaponDisplay.style.backgroundColor = weaponType.weapon.color;

        const icon = document.createElement('img');
        icon.src = weaponType.weapon.icon;
        icon.alt = weaponType.name;
        icon.style.width = '60px';   // Same as classic
        icon.style.height = '60px';  // Same as classic
        icon.style.imageRendering = 'pixelated';
        weaponDisplay.appendChild(icon);

        // Create buttons container
        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.display = 'flex';
        buttonsContainer.style.gap = '8px';
        buttonsContainer.style.alignItems = 'center';

        // Create count display
        const countDisplay = document.createElement('span');
        countDisplay.style.fontSize = '18px';
        countDisplay.style.fontFamily = 'Anton, sans-serif';
        countDisplay.style.color = 'white';
        countDisplay.style.minWidth = '20px';
        countDisplay.style.textAlign = 'center';
        countDisplay.style.textShadow = '-2px -2px 0 black, 2px -2px 0 black, -2px 2px 0 black, 2px 2px 0 black, 4px 4px 6px rgba(0,0,0,0.4)';
        countDisplay.textContent = '0';

        // Create minus button
        const minusButton = document.createElement('button');
        minusButton.textContent = '-';
        minusButton.style.width = '24px';
        minusButton.style.height = '24px';
        minusButton.style.fontSize = '16px';
        minusButton.style.fontWeight = 'bold';
        minusButton.style.backgroundColor = '#f44336';
        minusButton.style.color = 'white';
        minusButton.style.border = '2px solid black';
        minusButton.style.borderRadius = '4px';
        minusButton.style.cursor = 'pointer';
        minusButton.style.fontFamily = 'Arial, sans-serif'; // Changed to Arial
        minusButton.style.display = 'flex';
        minusButton.style.alignItems = 'center';
        minusButton.style.justifyContent = 'center';
        minusButton.style.padding = '0';

        // Create plus button
        const plusButton = document.createElement('button');
        plusButton.textContent = '+';
        plusButton.style.width = '24px';
        plusButton.style.height = '24px';
        plusButton.style.fontSize = '16px';
        plusButton.style.fontWeight = 'bold';
        plusButton.style.backgroundColor = '#4CAF50';
        plusButton.style.color = 'white';
        plusButton.style.border = '2px solid black';
        plusButton.style.borderRadius = '4px';
        plusButton.style.cursor = 'pointer';
        plusButton.style.fontFamily = 'Arial, sans-serif'; // Changed to Arial
        plusButton.style.display = 'flex';
        plusButton.style.alignItems = 'center';
        plusButton.style.justifyContent = 'center';
        plusButton.style.padding = '0';

        // Add event listeners
        plusButton.addEventListener('click', async () => {
            await playClickSound();
            selectedBalls.push({ type: weaponType.type, color: weaponType.weapon.color, name: weaponType.name });
            updateWeaponCounters();
            resetGameCallback();
        });

        minusButton.addEventListener('click', async () => {
            await playClickSound();
            const index = selectedBalls.findIndex(ball => ball.type === weaponType.type);
            if (index !== -1) {
                selectedBalls.splice(index, 1);
                updateWeaponCounters();
                resetGameCallback();
            }
        });

        // Assemble buttons container
        buttonsContainer.appendChild(minusButton);
        buttonsContainer.appendChild(countDisplay);
        buttonsContainer.appendChild(plusButton);

        // Assemble weapon item
        weaponItemContainer.appendChild(weaponDisplay);
        weaponItemContainer.appendChild(buttonsContainer);

        displaysByType[weaponType.type] = { display: weaponDisplay, counter: countDisplay };
        listSection.appendChild(weaponItemContainer);
    });

    // Clear button (moved to the bottom actions section, text black)
    const clearButton = document.createElement('button');
    clearButton.textContent = 'Clear All';
    clearButton.className = 'ffa-clear-btn'; // Use a class for styling

    clearButton.addEventListener('click', async () => {
        await playClickSound();
        selectedBalls = [];
        updateWeaponCounters();
        resetGameCallback();
    });

    // "Add All" button - adds one of each weapon type to the selection
    const addAllButton = document.createElement('button');
    addAllButton.textContent = 'Add All';
    addAllButton.style.width = '84px';
    addAllButton.style.height = '36px';
    addAllButton.style.fontSize = '14px';
    addAllButton.style.border = '4px solid var(--black)';
    addAllButton.style.borderRadius = '6px';
    addAllButton.style.backgroundColor = 'var(--btn-yellow)';
    addAllButton.style.color = 'black';
    addAllButton.style.cursor = 'pointer';
    addAllButton.style.fontFamily = 'Anton, sans-serif';
    addAllButton.addEventListener('click', async () => {
        await playClickSound();
        // Add one entry of each weapon type to the selection (preserve existing selections)
        weaponTypes.forEach(wt => {
            selectedBalls.push({ type: wt.type, color: wt.weapon.color, name: wt.name });
        });
        updateWeaponCounters();
        resetGameCallback();
    });

    actionsSection.appendChild(addAllButton);
    actionsSection.appendChild(clearButton);

    // Assemble sections
    weaponContainer.appendChild(listSection);
    weaponContainer.appendChild(actionsSection);
    leftSelectionBox.appendChild(weaponContainer);

    function updateWeaponCounters() {
        const counters = {};
        selectedBalls.forEach(ball => {
            counters[ball.type] = (counters[ball.type] || 0) + 1;
        });

        weaponTypes.forEach(weaponType => {
            const { counter } = displaysByType[weaponType.type];
            const count = counters[weaponType.type] || 0;
            counter.textContent = count;
        });
    }

    // Call update to reflect the current state of selectedBalls on setup
    updateWeaponCounters();
}

export function setupTeamsBallSelection(resetGameCallback) {
    const leftSelectionBox = document.getElementById('selection-box-left');
    const rightSelectionBox = document.getElementById('selection-box-right');
    
    // Setup left team (blue)
    setupTeamSidebar(leftSelectionBox, 'blue', resetGameCallback);
    
    // Setup right team (red)
    setupTeamSidebar(rightSelectionBox, 'red', resetGameCallback);
}

function setupTeamSidebar(selectionBox, teamColor, resetGameCallback) {
    selectionBox.innerHTML = ''; // Clear existing content

    const weaponContainer = document.createElement('div');
    weaponContainer.className = 'weapon-container';
    weaponContainer.style.display = 'flex';
    weaponContainer.style.flexDirection = 'column';
    weaponContainer.style.alignItems = 'stretch';
    weaponContainer.style.gap = '10px';
    weaponContainer.style.width = '100%';
    weaponContainer.style.height = '100%';
    weaponContainer.style.overflowX = 'hidden';

    // Top section: weapon choices list (scrollable if needed)
    const listSection = document.createElement('div');
    listSection.style.display = 'flex';
    listSection.style.flexDirection = 'column';
    listSection.style.alignItems = 'center';
    listSection.style.gap = '10px';
    listSection.style.width = '100%';
    listSection.style.flex = '1 1 auto';
    listSection.style.overflowY = 'auto';
    listSection.style.overflowX = 'hidden';

    // Bottom section: actions
    const actionsSection = document.createElement('div');
    actionsSection.style.display = 'flex';
    actionsSection.style.flex = '0 0 auto';
    actionsSection.style.justifyContent = 'center';
    actionsSection.style.paddingTop = '6px';

    // Create weapon selection buttons (including basic)
    // Swapped order: Bow before Unarmed
    // NEW: Add Duplicator
    const weaponTypes = [
        { type: 'basic', weapon: Basic, name: 'Basic' },
        { type: 'sword', weapon: Sword, name: 'Sword' },
        { type: 'dagger', weapon: Dagger, name: 'Dagger' },
        { type: 'rapier', weapon: Rapier, name: 'Rapier' },
        { type: 'epee', weapon: Epee, name: 'Épée' },
        { type: 'katana', weapon: Katana, name: 'Katana' },
        { type: 'spear', weapon: Spear, name: 'Spear' },
        { type: 'lance', weapon: Lance, name: 'Lance' },
        { type: 'unarmed', weapon: Unarmed, name: 'Unarmed' },
        { type: 'bow', weapon: Bow, name: 'Bow' },
        { type: 'slingshot', weapon: Slingshot, name: 'Slingshot' },
        { type: 'scythe', weapon: Scythe, name: 'Scythe' },
        { type: 'axe', weapon: Axe, name: 'Axe' },
        { type: 'hammer', weapon: Hammer, name: 'Hammer' },
        { type: 'bat', weapon: Bat, name: 'Bat' },
        { type: 'mop', weapon: Mop, name: 'Mop' },
        { type: 'staff', weapon: Staff, name: 'Staff' },
        { type: 'wand', weapon: Wand, name: 'Wand' },
        { type: 'crusher', weapon: Crusher, name: 'Crusher' },
        { type: 'grower', weapon: Grower, name: 'Grower' },       // NEW
        { type: 'shrinker', weapon: Shrinker, name: 'Shrinker' }, // NEW
        { type: 'shuriken', weapon: Shuriken, name: 'Shuriken' },
        { type: 'speedball', weapon: SpeedBall, name: 'SpeedBall' }, // NEW: SpeedBall
        { type: 'duplicator', weapon: Duplicator, name: 'Duplicator' }, // NEW: Duplicator
        { type: 'dummyball', weapon: DummyBall, name: 'Dummy Ball' }, // NEW: Dummy Ball
        { type: 'ak47', weapon: AK47, name: 'AK-47' }, // NEW: AK-47
        { type: 'rocket', weapon: RocketLauncher, name: 'Rocket' },
        { type: 'slimegun', weapon: SlimeGun, name: 'Slime Gun' },
        { type: 'tranquilizer', weapon: Tranquilizer, name: 'Tranquilizer' },
        { type: 'flamethrower', weapon: Flamethrower, name: 'Flamethrower' },
        { type: 'watergun', weapon: WaterGun, name: 'Water Gun' },
        { type: 'lavagun', weapon: LavaGun, name: 'Lava Gun' },
        { type: 'bomb', weapon: Bomb, name: 'Bomb' },
        { type: 'lightsaber', weapon: Lightsaber, name: 'Lightsaber' },
        { type: 'paintbrush', weapon: Paintbrush, name: 'Paintbrush' },
        { type: 'france', weapon: France, name: 'France' },
        { type: 'italy', weapon: Italy, name: 'Italy' },
        { type: 'germany', weapon: Germany, name: 'Germany' },
        { type: 'fire_god', weapon: FireGod, name: 'Fire God' },
        { type: 'grass_god', weapon: GrassGod, name: 'Grass God' },
        { type: 'water_god', weapon: WaterGod, name: 'Water God' },
        { type: 'air_god', weapon: AirGod, name: 'Air God' },
        { type: 'soil_god', weapon: SoilGod, name: 'Soil God' }
    ];

    const displaysByType = {};
    const teamBgColor = teamColor === 'blue' ? '#2196f3' : '#f44336';

    weaponTypes.forEach(weaponType => {
        // Create container for weapon display and buttons
        const weaponItemContainer = document.createElement('div');
        weaponItemContainer.style.display = 'flex';
        weaponItemContainer.style.flexDirection = 'column';
        weaponItemContainer.style.alignItems = 'center';
        weaponItemContainer.style.gap = '8px';
        weaponItemContainer.style.width = '100%';

        const weaponDisplay = document.createElement('div');
        weaponDisplay.className = 'weapon-display';
        weaponDisplay.style.position = 'relative';
        weaponDisplay.style.backgroundColor = teamBgColor; // Always team color

        const icon = document.createElement('img');
        icon.src = weaponType.weapon.icon;
        icon.alt = weaponType.name;
        icon.style.width = '60px';   // Same as classic
        icon.style.height = '60px';  // Same as classic
        icon.style.imageRendering = 'pixelated';
        weaponDisplay.appendChild(icon);

        // Create buttons container
        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.display = 'flex';
        buttonsContainer.style.gap = '8px';
        buttonsContainer.style.alignItems = 'center';

        // Create count display
        const countDisplay = document.createElement('span');
        countDisplay.style.fontSize = '18px';
        countDisplay.style.fontFamily = 'Anton, sans-serif';
        countDisplay.style.color = 'white';
        countDisplay.style.minWidth = '20px';
        countDisplay.style.textAlign = 'center';
        countDisplay.style.textShadow = '-2px -2px 0 black, 2px -2px 0 black, -2px 2px 0 black, 2px 2px 0 black, 4px 4px 6px rgba(0,0,0,0.4)';
        countDisplay.textContent = '0';

        // Create minus button
        const minusButton = document.createElement('button');
        minusButton.textContent = '-';
        minusButton.style.width = '24px';
        minusButton.style.height = '24px';
        minusButton.style.fontSize = '16px';
        minusButton.style.fontWeight = 'bold';
        minusButton.style.backgroundColor = '#f44336';
        minusButton.style.color = 'white';
        minusButton.style.border = '2px solid black';
        minusButton.style.borderRadius = '4px';
        minusButton.style.cursor = 'pointer';
        minusButton.style.fontFamily = 'Arial, sans-serif';
        minusButton.style.display = 'flex';
        minusButton.style.alignItems = 'center';
        minusButton.style.justifyContent = 'center';
        minusButton.style.padding = '0';

        // Create plus button
        const plusButton = document.createElement('button');
        plusButton.textContent = '+';
        plusButton.style.width = '24px';
        plusButton.style.height = '24px';
        plusButton.style.fontSize = '16px';
        plusButton.style.fontWeight = 'bold';
        plusButton.style.backgroundColor = '#4CAF50';
        plusButton.style.color = 'white';
        plusButton.style.border = '2px solid black';
        plusButton.style.borderRadius = '4px';
        plusButton.style.cursor = 'pointer';
        plusButton.style.fontFamily = 'Arial, sans-serif';
        plusButton.style.display = 'flex';
        plusButton.style.alignItems = 'center';
        plusButton.style.justifyContent = 'center';
        plusButton.style.padding = '0';

        // Add event listeners (teams combine both team selections for now)
        plusButton.addEventListener('click', async () => {
            await playClickSound();
            selectedBalls.push({ 
                type: weaponType.type, 
                color: teamBgColor, // Use team color instead of weapon color
                name: weaponType.name,
                team: teamColor
            });
            updateWeaponCounters();
            resetGameCallback();
        });

        minusButton.addEventListener('click', async () => {
            await playClickSound();
            // Remove the last ball of this type and team
            for (let i = selectedBalls.length - 1; i >= 0; i--) {
                if (selectedBalls[i].type === weaponType.type && selectedBalls[i].team === teamColor) {
                    selectedBalls.splice(i, 1);
                    break;
                }
            }
            updateWeaponCounters();
            resetGameCallback();
        });

        // Assemble buttons container
        buttonsContainer.appendChild(minusButton);
        buttonsContainer.appendChild(countDisplay);
        buttonsContainer.appendChild(plusButton);

        // Assemble weapon item
        weaponItemContainer.appendChild(weaponDisplay);
        weaponItemContainer.appendChild(buttonsContainer);

        displaysByType[weaponType.type] = { display: weaponDisplay, counter: countDisplay };
        listSection.appendChild(weaponItemContainer);
    });

    // Clear button
    const clearButton = document.createElement('button');
    clearButton.textContent = 'Clear All';
    clearButton.className = 'ffa-clear-btn';

    clearButton.addEventListener('click', async () => {
        await playClickSound();
        // Remove all balls of this team
        selectedBalls = selectedBalls.filter(ball => ball.team !== teamColor);
        updateWeaponCounters();
        resetGameCallback();
    });

    actionsSection.appendChild(clearButton);

    // Assemble sections
    weaponContainer.appendChild(listSection);
    weaponContainer.appendChild(actionsSection);
    selectionBox.appendChild(weaponContainer);

    function updateWeaponCounters() {
        const counters = {};
        selectedBalls.forEach(ball => {
            if (ball.team === teamColor) {
                counters[ball.type] = (counters[ball.type] || 0) + 1;
            }
        });

        weaponTypes.forEach(weaponType => {
            const { counter } = displaysByType[weaponType.type];
            const count = counters[weaponType.type] || 0;
            counter.textContent = count;
        });
    }

    // Call update to reflect the current state
    updateWeaponCounters();
}

// NEW: Boss mode selection
export function setupBossBallSelection(resetGameCallback) {
    const leftSelectionBox = document.getElementById('selection-box-left');
    const rightSelectionBox = document.getElementById('selection-box-right');
    leftSelectionBox.innerHTML = '';
    rightSelectionBox.innerHTML = '';

    // Left: Blue team (multiple)
    setupTeamSidebar(leftSelectionBox, 'blue', resetGameCallback);

    // Right: Boss picker (single)
    const bossContainer = document.createElement('div');
    bossContainer.className = 'weapon-container';
    bossContainer.style.display = 'flex';
    bossContainer.style.flexDirection = 'column';
    bossContainer.style.alignItems = 'stretch';
    bossContainer.style.gap = '10px';
    bossContainer.style.width = '100%';
    bossContainer.style.height = '100%';
    bossContainer.style.overflowX = 'hidden';

    const list = document.createElement('div');
    list.style.display = 'flex';
    list.style.flexDirection = 'column';
    list.style.alignItems = 'center';
    list.style.gap = '10px';
    list.style.width = '100%';
    list.style.flex = '1 1 auto';
    list.style.overflowY = 'auto';

    const weaponTypes = [
        { type: 'basic', weapon: Basic, name: 'Basic' },
        { type: 'sword', weapon: Sword, name: 'Sword' },
        { type: 'dagger', weapon: Dagger, name: 'Dagger' },
        { type: 'rapier', weapon: Rapier, name: 'Rapier' },
        { type: 'epee', weapon: Epee, name: 'Épée' },
        { type: 'katana', weapon: Katana, name: 'Katana' },
        { type: 'spear', weapon: Spear, name: 'Spear' },
        { type: 'lance', weapon: Lance, name: 'Lance' },
        { type: 'unarmed', weapon: Unarmed, name: 'Unarmed' },
        { type: 'bow', weapon: Bow, name: 'Bow' },
        { type: 'slingshot', weapon: Slingshot, name: 'Slingshot' },
        { type: 'scythe', weapon: Scythe, name: 'Scythe' },
        { type: 'axe', weapon: Axe, name: 'Axe' },
        { type: 'hammer', weapon: Hammer, name: 'Hammer' },
        { type: 'bat', weapon: Bat, name: 'Bat' },
        { type: 'mop', weapon: Mop, name: 'Mop' },
        { type: 'staff', weapon: Staff, name: 'Staff' },
        { type: 'wand', weapon: Wand, name: 'Wand' },
        { type: 'crusher', weapon: Crusher, name: 'Crusher' },
        { type: 'grower', weapon: Grower, name: 'Grower' },
        { type: 'shrinker', weapon: Shrinker, name: 'Shrinker' },
        { type: 'shuriken', weapon: Shuriken, name: 'Shuriken' },
        { type: 'speedball', weapon: SpeedBall, name: 'SpeedBall' }, // NEW: SpeedBall
        { type: 'duplicator', weapon: Duplicator, name: 'Duplicator' }, // NEW: Duplicator
        { type: 'testball', weapon: TestBall, name: 'TestBall' }, // NEW: TestBall
        { type: 'ak47', weapon: AK47, name: 'AK-47' }, // NEW: AK-47
        { type: 'rocket', weapon: RocketLauncher, name: 'Rocket' },
        { type: 'slimegun', weapon: SlimeGun, name: 'Slime Gun' },
        { type: 'tranquilizer', weapon: Tranquilizer, name: 'Tranquilizer' },
        { type: 'flamethrower', weapon: Flamethrower, name: 'Flamethrower' },
        { type: 'watergun', weapon: WaterGun, name: 'Water Gun' },
        { type: 'lavagun', weapon: LavaGun, name: 'Lava Gun' },
        { type: 'bomb', weapon: Bomb, name: 'Bomb' },
        { type: 'lightsaber', weapon: Lightsaber, name: 'Lightsaber' },
        { type: 'paintbrush', weapon: Paintbrush, name: 'Paintbrush' },
        { type: 'fuse', weapon: Fuse, name: 'Fuse' }, // NEW: Fuse
        { type: 'france', weapon: France, name: 'France' },
        { type: 'italy', weapon: Italy, name: 'Italy' },
        { type: 'germany', weapon: Germany, name: 'Germany' },
        { type: 'fire_god', weapon: FireGod, name: 'Fire God' },
        { type: 'grass_god', weapon: GrassGod, name: 'Grass God' },
        { type: 'water_god', weapon: WaterGod, name: 'Water God' },
        { type: 'air_god', weapon: AirGod, name: 'Air God' },
        { type: 'soil_god', weapon: SoilGod, name: 'Soil God' }
    ];

    let currentBossType = null;

    function setBossType(type, color) {
        // Remove existing red boss entry
        selectedBalls = selectedBalls.filter(b => b.team !== 'red');
        // Add one boss entry
        selectedBalls.push({
            type,
            color: '#f44336', // Red team frame color
            name: 'Boss',
            team: 'red'
        });
        currentBossType = type;
        resetGameCallback();
        updateSelectedHighlight();
    }

    function updateSelectedHighlight() {
        const cards = list.querySelectorAll('.weapon-display');
        cards.forEach(card => {
            if (card.dataset.type === currentBossType) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });
    }

    weaponTypes.forEach(w => {
        const card = document.createElement('div');
        card.className = 'weapon-display';
        card.style.backgroundColor = '#f44336';
        card.style.cursor = 'pointer';
        card.dataset.type = w.type;

        const icon = document.createElement('img');
        icon.src = w.weapon.icon;
        icon.alt = w.name;
        icon.style.width = '60px';
        icon.style.height = '60px';
        icon.style.imageRendering = 'pixelated';

        card.appendChild(icon);
        card.addEventListener('click', async (e) => {
            // Remove explicit click sound here to avoid double-playing;
            // the global .weapon-display click handler will play it once.
            // e.stopPropagation(); // Optional: keep default so global plays it
            setBossType(w.type, '#f44336');
        });

        list.appendChild(card);
    });

    // Ensure there's always exactly one boss by default (default to Basic)
    if (!selectedBalls.some(b => b.team === 'red')) {
        setBossType('basic', '#f44336');
    } else {
        currentBossType = selectedBalls.find(b => b.team === 'red')?.type || null;
        updateSelectedHighlight();
    }

    bossContainer.appendChild(list);
    rightSelectionBox.appendChild(bossContainer);
}

// NEW: Single mode selection (choose exactly one ball)
export function setupSingleBallSelection(resetGameCallback) {
    const leftSelectionBox = document.getElementById('selection-box-left');
    const rightSelectionBox = document.getElementById('selection-box-right');
    leftSelectionBox.innerHTML = '';
    if (rightSelectionBox) rightSelectionBox.style.display = 'none';

    // Reuse FFA list but enforce single selection
    const container = document.createElement('div');
    container.className = 'weapon-container';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'stretch';
    container.style.gap = '10px';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.overflowX = 'hidden';

    const list = document.createElement('div');
    list.style.display = 'flex';
    list.style.flexDirection = 'column';
    list.style.alignItems = 'center';
    list.style.gap = '10px';
    list.style.width = '100%';
    list.style.flex = '1 1 auto';
    list.style.overflowY = 'auto';

    const weaponTypes = [
        { type: 'basic', weapon: Basic, name: 'Basic' },
        { type: 'sword', weapon: Sword, name: 'Sword' },
        { type: 'dagger', weapon: Dagger, name: 'Dagger' },
        { type: 'rapier', weapon: Rapier, name: 'Rapier' },
        { type: 'epee', weapon: Epee, name: 'Épée' },
        { type: 'katana', weapon: Katana, name: 'Katana' },
        { type: 'spear', weapon: Spear, name: 'Spear' },
        { type: 'lance', weapon: Lance, name: 'Lance' },
        { type: 'unarmed', weapon: Unarmed, name: 'Unarmed' },
        { type: 'bow', weapon: Bow, name: 'Bow' },
        { type: 'slingshot', weapon: Slingshot, name: 'Slingshot' },
        { type: 'scythe', weapon: Scythe, name: 'Scythe' },
        { type: 'axe', weapon: Axe, name: 'Axe' },
        { type: 'hammer', weapon: Hammer, name: 'Hammer' },
        { type: 'bat', weapon: Bat, name: 'Bat' },
        { type: 'mop', weapon: Mop, name: 'Mop' },
        { type: 'staff', weapon: Staff, name: 'Staff' },
        { type: 'wand', weapon: Wand, name: 'Wand' },
        { type: 'crusher', weapon: Crusher, name: 'Crusher' },
        { type: 'grower', weapon: Grower, name: 'Grower' },
        { type: 'shrinker', weapon: Shrinker, name: 'Shrinker' },
        { type: 'shuriken', weapon: Shuriken, name: 'Shuriken' },
        { type: 'speedball', weapon: SpeedBall, name: 'SpeedBall' }, // NEW: SpeedBall
        { type: 'duplicator', weapon: Duplicator, name: 'Duplicator' }, // NEW: Duplicator
        { type: 'testball', weapon: TestBall, name: 'TestBall' }, // NEW: TestBall
        { type: 'ak47', weapon: AK47, name: 'AK-47' }, // NEW: AK-47
        { type: 'rocket', weapon: RocketLauncher, name: 'Rocket' },
        { type: 'slimegun', weapon: SlimeGun, name: 'Slime Gun' },
        { type: 'tranquilizer', weapon: Tranquilizer, name: 'Tranquilizer' },
        { type: 'flamethrower', weapon: Flamethrower, name: 'Flamethrower' },
        { type: 'watergun', weapon: WaterGun, name: 'Water Gun' },
        { type: 'lavagun', weapon: LavaGun, name: 'Lava Gun' },
        { type: 'bomb', weapon: Bomb, name: 'Bomb' },
        { type: 'lightsaber', weapon: Lightsaber, name: 'Lightsaber' },
        { type: 'paintbrush', weapon: Paintbrush, name: 'Paintbrush' },
        { type: 'fuse', weapon: Fuse, name: 'Fuse' }, // NEW: Fuse
        { type: 'france', weapon: France, name: 'France' },
        { type: 'italy', weapon: Italy, name: 'Italy' },
        { type: 'germany', weapon: Germany, name: 'Germany' },
        { type: 'fire_god', weapon: FireGod, name: 'Fire God' },
        { type: 'grass_god', weapon: GrassGod, name: 'Grass God' },
        { type: 'water_god', weapon: WaterGod, name: 'Water God' },
        { type: 'air_god', weapon: AirGod, name: 'Air God' },
        { type: 'soil_god', weapon: SoilGod, name: 'Soil God' }
    ];

    function setSingle(type, color) {
        selectedBalls = [{ type, color, name: 'Single' }];
        resetGameCallback();
        updateSelectedHighlight();
    }

    function updateSelectedHighlight() {
        const cards = list.querySelectorAll('.weapon-display');
        const currentType = selectedBalls[0]?.type || null;
        cards.forEach(card => {
            if (card.dataset.type === currentType) card.classList.add('selected');
            else card.classList.remove('selected');
        });
    }

    weaponTypes.forEach(w => {
        const card = document.createElement('div');
        card.className = 'weapon-display';
        card.style.backgroundColor = w.weapon.color;
        card.dataset.type = w.type;

        const icon = document.createElement('img');
        icon.src = w.weapon.icon;
        icon.alt = w.name;
        icon.style.width = '60px';
        icon.style.height = '60px';
        icon.style.imageRendering = 'pixelated';

        card.appendChild(icon);
        card.addEventListener('click', async () => {
            await playClickSound();
            setSingle(w.type, w.weapon.color);
        });
        list.appendChild(card);
    });

    // Clear button
    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.justifyContent = 'center';
    actions.style.paddingTop = '6px';
    const clearBtn = document.createElement('button');
    clearBtn.textContent = 'Clear';
    clearBtn.className = 'ffa-clear-btn';
    clearBtn.addEventListener('click', async () => {
        await playClickSound();
        selectedBalls = [];
        resetGameCallback();
        updateSelectedHighlight();
    });
    actions.appendChild(clearBtn);

    container.appendChild(list);
    container.appendChild(actions);
    leftSelectionBox.appendChild(container);

    updateSelectedHighlight();
}

export function getSelectedBalls() {
    return [...selectedBalls];
}