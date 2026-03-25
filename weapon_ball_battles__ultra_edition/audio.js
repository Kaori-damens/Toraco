// Complete rewrite to properly define and export audio functions

let audioContext = null;
let soundsLoaded = false;
let isLoading = false;
const audioBuffers = {};
let menuMusicSource = null; // To store the AudioBufferSourceNode for menu music
let menuMusicGainNode = null; // To control the volume of menu music

/**
 * Initializes the AudioContext and loads all sound files.
 * This should be called once on page load.
 * @param {Function} onStateChange - Callback to notify UI of loading state changes.
 */
export async function setupAudio(onStateChange) {
    if (isLoading || soundsLoaded) return; // Prevent multiple loading attempts
    isLoading = true;
    if (onStateChange) onStateChange(true); // Notify UI that loading has started

    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        window.audioContext = audioContext; // Expose to global for direct access by other modules
        
        // Load sound files
        await Promise.all([
            loadSoundFile('swordHit', '/11L-A_sword_slashing_int-1754445544888.mp3'), // Changed to the specified sword slashing sound
            loadSoundFile('parry', '/11L-A_sword_slash.-1754445653447.mp3'),
            loadSoundFile('clickSound', '/mouse-click-290204.mp3'), // Load click sound
            loadSoundFile('menuSong', '/WBB_song.mp3'), // Load menu background song
            loadSoundFile('startupSound', '/Windows XP Startup.mp3'), // NEW: Load Windows XP Startup sound
            loadSoundFile('daggerHit', '/dagger_sfx.mp3'), // NEW: Load dagger hit sound
            loadSoundFile('spearHit', '/spear_sfx.mp3'), // Load spear hit sound
            loadSoundFile('unarmedHit', '/unarmed_sfx.mp3'), // NEW: Load unarmed hit sound
            loadSoundFile('bowHit', '/ARROWSHOOTSKELETON.mp3'), // NEW: Load bow shoot sound
            // Updated: use the requested arrow hit sound effect
            loadSoundFile('bowImpact', '/Hit6.wav'), // NEW: Bow impact sound
            // NEW: Shuriken SFX
            loadSoundFile('shurikenThrow', '/shuriken_sfx1.mp3'),
            loadSoundFile('shurikenBounce', '/shuriken_sfx2.mp3'),
            // NEW: Generic hitHurt sound for shuriken hits
            loadSoundFile('hitHurt', '/hitHurt.wav'),
            // NEW: Scythe hit SFX
            loadSoundFile('scytheHit', '/scythe_sfx.mp3'),
            // NEW: Boing sound for wall bounces
            loadSoundFile('boing', '/boing.mp3'),
            // NEW: Lightning zap sound for SpeedBall
            loadSoundFile('lightningZap', '/lightning_zap.mp3'),
            // NEW: Gun shot for AK-47
            loadSoundFile('gunShot', '/gun_shot.mp3')
        ]);
        
        soundsLoaded = true;
    } catch (e) {
        console.error("Could not create AudioContext or load audio assets:", e);
    } finally {
        isLoading = false;
        if (onStateChange) onStateChange(false); // Notify UI that loading is complete (or failed)
    }
}

/**
 * Attempts to resume the AudioContext.
 * This should be called in response to a user gesture (e.g., a button click).
 */
export async function resumeAudioContext() {
    if (!audioContext) {
        console.warn("AudioContext not yet initialized for resume.");
        return;
    }
    // Only attempt to resume if it's suspended. If it's already running, no-op.
    // If it's 'closed', it cannot be resumed and trying will throw.
    if (audioContext.state === 'suspended') {
        try {
            await audioContext.resume();
            console.log('AudioContext resumed.');
        } catch (e) {
            console.error('Failed to resume AudioContext:', e);
            // Do not re-throw here; handle gracefully.
        }
    }
}

/**
 * Loads a single sound file into an AudioBuffer.
 * @param {string} name - The key to store the audio buffer under.
 * @param {string} url - The URL of the audio file.
 */
async function loadSoundFile(name, url) {
    if (!audioContext) return;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        const decoded = await audioContext.decodeAudioData(arrayBuffer);
        audioBuffers[name] = decoded;
    } catch (e) {
        console.warn(`Audio asset '${name}' failed to load:`, e.message);
        // Do not rethrow; allowing the rest of the game to load without this specific SFX
    }
}

/**
 * Plays a loaded sound from the audioBuffers.
 * Ensures AudioContext is running before playing.
 * @param {string} name - The name of the sound to play.
 * @param {number} volume - The volume level (0.0 to 1.0).
 */
async function playSound(name, volume = 0.3) {
    if (!audioContext || !audioBuffers[name]) {
        console.warn(`Cannot play sound '${name}': AudioContext not ready or buffer missing.`);
        return;
    }

    try {
        await resumeAudioContext();
    } catch (e) {
        console.warn(`Failed to resume AudioContext for sound '${name}'. Sound will not play.`, e);
        return;
    }

    if (audioContext.state === 'running') {
        const src = audioContext.createBufferSource();
        src.buffer = audioBuffers[name];
        
        const gainNode = audioContext.createGain();
        gainNode.gain.value = volume; 
        
        src.connect(gainNode);
        gainNode.connect(audioContext.destination);
        src.start(0);
    } else {
        console.warn(`AudioContext is not running after resume attempt for sound '${name}'.`);
        // Do not return a rejected promise; just log and return.
    }
}

export async function playSwordHitSound() {
    return playSound('swordHit', 0.2); // Adjusted volume
}

export async function playParrySound() {
    return playSound('parry', 0.15); // Reduced volume
}

export async function playClickSound() {
    return playSound('clickSound', 0.2); // Reduced volume
}

// NEW: Function to play startup sound
export async function playStartupSound() {
    return playSound('startupSound', 0.25); // Reduced volume
}

// NEW: Function to play dagger hit sound
export async function playDaggerHitSound() {
    return playSound('daggerHit', 0.3); // Reduced volume
}

// NEW: Function to play spear hit sound
export async function playSpearHitSound() {
    return playSound('spearHit', 0.3);
}

// NEW: Function to play unarmed hit sound
export async function playUnarmedHitSound() {
    return playSound('unarmedHit', 0.3);
}

// NEW: Function to play bow hit sound (shoot/release)
export async function playBowHitSound() {
    return playSound('bowHit', 0.3);
}

// UPDATED: Bow impact (on-hit) uses Hit6.wav
export async function playBowImpactSound() {
    return playSound('bowImpact', 0.28);
}

// NEW: Shuriken sounds
export async function playShurikenThrowSound() {
    return playSound('shurikenThrow', 0.35);
}
export async function playShurikenBounceSound() {
    // Make bounce sound much quieter
    return playSound('shurikenBounce', 0.06);
}

// NEW: Generic hit-hurt sound (used by Shuriken hits)
export async function playHitHurtSound() {
    return playSound('hitHurt', 0.28);
}

// NEW: Scythe hit sound
export async function playScytheHitSound() {
    // Increased volume for a more impactful scythe hit
    return playSound('scytheHit', 0.55);
}

// NEW: Boing sound for ball wall bounces
export async function playBoingSound() {
    return playSound('boing', 0.22);
}

/**
 * Play the boing sound with a custom playback rate (pitch).
 * playbackRate < 1 lowers pitch (bigger balls), > 1 raises pitch (smaller balls).
 */
export async function playBoingSoundWithPitch(playbackRate = 1, volume = 0.22) {
    if (!audioContext || !audioBuffers.boing) {
        console.warn(`Cannot play boing with pitch: AudioContext not ready or buffer missing.`);
        return;
    }

    try {
        await resumeAudioContext();
    } catch (e) {
        console.error(`Failed to resume AudioContext for boing pitched:`, e);
        return;
    }

    if (audioContext.state === 'running') {
        const src = audioContext.createBufferSource();
        src.buffer = audioBuffers['boing'];
        src.playbackRate.value = Math.max(0.25, Math.min(4, playbackRate)); // safe clamp

        const gainNode = audioContext.createGain();
        gainNode.gain.value = volume;

        src.connect(gainNode);
        gainNode.connect(audioContext.destination);
        src.start(0);
    }
}

// NEW: Lightning zap sound
export async function playLightningZapSound() {
    return playSound('lightningZap', 0.4);
}

// NEW: Gun shot sound
export async function playGunShotSound() {
    return playSound('gunShot', 0.35);
}

/**
 * Plays the menu background music on loop.
 */
export async function playMenuMusic() {
    if (!audioContext || !audioBuffers.menuSong || menuMusicSource) {
        return; // Already playing or not ready
    }

    try {
        await resumeAudioContext(); // Ensure context is running
    } catch (e) {
        console.error("Failed to resume AudioContext for menu music:", e);
        return;
    }

    menuMusicSource = audioContext.createBufferSource();
    menuMusicSource.buffer = audioBuffers.menuSong;
    menuMusicSource.loop = true; // Loop the music

    menuMusicGainNode = audioContext.createGain();
    menuMusicGainNode.gain.value = 0.4; // Reduced menu music volume
    
    menuMusicSource.connect(menuMusicGainNode);
    menuMusicGainNode.connect(audioContext.destination);

    menuMusicSource.start(0);
    console.log('Menu music started.');
}

/**
 * Fades out the menu music and stops it.
 */
export function fadeMenuMusicOut() {
    if (menuMusicSource && menuMusicGainNode) {
        const fadeDuration = 0.5; // seconds
        const currentTime = audioContext.currentTime;

        menuMusicGainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + fadeDuration); // Fade to near zero
        menuMusicSource.stop(currentTime + fadeDuration); // Stop after fade

        menuMusicSource.onended = () => {
            menuMusicSource.disconnect();
            menuMusicGainNode.disconnect();
            menuMusicSource = null;
            menuMusicGainNode = null;
            console.log('Menu music faded out and stopped.');
        };
    }
}

/**
 * Checks if sounds have been loaded and the audio context is ready to play (or be resumed).
 * @returns {boolean} True if sounds are ready, false otherwise.
 */
export function areSoundsReady() {
    return soundsLoaded && (audioContext && (audioContext.state === 'running' || audioContext.state === 'suspended'));
}