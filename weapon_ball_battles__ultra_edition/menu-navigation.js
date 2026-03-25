import { playClickSound, playStartupSound } from './audio.js';
import { pauseMenu, cleanupMenu, setupMenu, resumeMenu } from './menu.js';
import { DEFAULT_ARENA_WIDTH, DEFAULT_ARENA_HEIGHT } from './state.js';
import { resetGame } from './game.js';
import { syncSidePanelsToCanvas } from './ui-state.js';
import { ensureFullscreen } from './fullscreen.js'; // NEW: Fullscreen helper
// NEW: Import WebsimSocket for leaderboard
import { WebsimSocket } from '@websim/websim-socket';

// NEW: Initialize WebsimSocket for leaderboard
const room = new WebsimSocket();

export function setupMenuNavigation() {
    const startButton = document.getElementById('startButton');
    const creditsButton = document.getElementById('creditsButton');
    const leaderboardButton = document.getElementById('leaderboardButton');
    // NEW: How To Play elements
    const howToPlayButton = document.getElementById('howToPlayButton');
    const howtoMenu = document.getElementById('howto-menu');
    const howtoBackButton = document.getElementById('howtoBackButton');

    const creditsMenu = document.getElementById('credits-menu');
    const leaderboardMenu = document.getElementById('leaderboard-menu');
    const creditsBackButton = document.getElementById('creditsBackButton');
    const leaderboardBackButton = document.getElementById('leaderboardBackButton');
    const mainMenu = document.getElementById('main-menu');
    const gameContainer = document.getElementById('game-container');
    const canvas = document.getElementById('gameCanvas');

    // Cache original credits HTML so we can restore on each open
    const creditsTrackEl = document.querySelector('#credits-menu .credits-track');
    const originalCreditsHTML = creditsTrackEl ? creditsTrackEl.innerHTML : '';

    startButton.addEventListener('click', async () => {
        await playClickSound();
        playStartupSound();

        // NEW: Request fullscreen when starting the game
        ensureFullscreen();

        mainMenu.classList.add('sliding-out-left');

        setTimeout(() => {
            // Only stop music and tear down when starting the actual game
            cleanupMenu();
            
            mainMenu.style.display = 'none';
            
            gameContainer.style.display = 'flex';
            canvas.width = DEFAULT_ARENA_WIDTH;
            canvas.height = DEFAULT_ARENA_HEIGHT;
            syncSidePanelsToCanvas();
            resetGame(canvas.width, canvas.height);

            requestAnimationFrame(() => { 
                gameContainer.style.opacity = '1';
            });

        }, 800);
    });

    creditsButton.addEventListener('click', async () => {
        await playClickSound();

        // Restore credits content and restart animation each time it's opened
        const track = document.querySelector('#credits-menu .credits-track');
        if (track) {
            track.innerHTML = originalCreditsHTML;
            // Restart CSS animation
            track.style.animation = 'none';
            // Force reflow
            void track.offsetHeight;
            track.style.animation = '';
            // Ensure it uses the single-run animation
            track.style.animation = 'creditsScrollOnce 30s linear forwards';

            // After animation ends, clear the credits
            track.addEventListener('animationend', () => {
                track.innerHTML = '';
            }, { once: true });
        }
        
        // Keep menu music/loop alive; just hide the main menu UI
        mainMenu.style.display = 'none';
        
        creditsMenu.style.display = 'flex';
        creditsMenu.style.opacity = '0';
        creditsMenu.style.pointerEvents = 'auto';
        
        // Smooth fade in
        requestAnimationFrame(() => {
            creditsMenu.style.opacity = '1';
        });
    });

    leaderboardButton.addEventListener('click', async () => {
        await playClickSound();
        
        // Keep menu music/loop alive; just hide the main menu UI
        mainMenu.style.display = 'none';
        
        leaderboardMenu.style.display = 'flex';
        leaderboardMenu.style.opacity = '0';
        leaderboardMenu.style.pointerEvents = 'auto';
        
        // Smooth fade in
        requestAnimationFrame(() => {
            leaderboardMenu.style.opacity = '1';
        });
        
        loadLeaderboardData();
    });

    // NEW: How To Play open
    howToPlayButton.addEventListener('click', async () => {
        await playClickSound();

        mainMenu.style.display = 'none';

        howtoMenu.style.display = 'flex';
        howtoMenu.style.opacity = '0';
        howtoMenu.style.pointerEvents = 'auto';

        requestAnimationFrame(() => {
            howtoMenu.style.opacity = '1';
        });
    });

    creditsBackButton.addEventListener('click', async () => {
        await playClickSound();
        
        // Do NOT cleanup menu here; we want music and background to continue
        creditsMenu.style.display = 'none';
        mainMenu.style.display = 'flex';
        mainMenu.style.opacity = '1';
        mainMenu.style.pointerEvents = 'auto';
        // No re-setup; the menu is still running behind the scenes
    });

    leaderboardBackButton.addEventListener('click', async () => {
        await playClickSound();
        
        // Do NOT cleanup menu here; we want music and background to continue
        leaderboardMenu.style.display = 'none';
        mainMenu.style.display = 'flex';
        mainMenu.style.opacity = '1';
        mainMenu.style.pointerEvents = 'auto';
        // No re-setup; the menu is still running behind the scenes
    });

    // NEW: How To Play back
    howtoBackButton.addEventListener('click', async () => {
        await playClickSound();

        howtoMenu.style.display = 'none';
        mainMenu.style.display = 'flex';
        mainMenu.style.opacity = '1';
        mainMenu.style.pointerEvents = 'auto';
    });

    // NEW: Load real leaderboard data from Websim
    async function loadLeaderboardData() {
        const leaderboardList = document.getElementById('leaderboard-list');
        
        try {
            leaderboardList.innerHTML = '<div class="leaderboard-loading">Loading leaderboard...</div>';
            
            // Get current project info
            const project = await window.websim.getCurrentProject();
            const projectId = project.id;

            // Helper: fetch recent pages of tip comments
            async function fetchRecentTipComments(projectId) {
                const all = [];
                let after = null;
                let hasNext = true;
                let pagesFetched = 0;
                const maxPages = 3; // Limit to 300 comments to prevent timeouts on popular projects
                
                while (hasNext && pagesFetched < maxPages) {
                    const params = new URLSearchParams();
                    params.append('only_tips', 'true');
                    params.append('first', '100');
                    if (after) params.append('after', after);
                    
                    try {
                        const resp = await fetch(`/api/v1/projects/${projectId}/comments?${params}`);
                        if (!resp.ok) break;
                        const data = await resp.json();
                        const page = (data && data.comments && data.comments.data) ? data.comments.data : [];
                        all.push(...page);
                        const meta = data && data.comments && data.comments.meta ? data.comments.meta : {};
                        hasNext = !!meta.has_next_page;
                        after = meta.end_cursor || null;
                        pagesFetched++;
                    } catch (e) {
                        console.warn("Leaderboard page fetch failed:", e);
                        break;
                    }
                }
                return all;
            }
            
            const allTipComments = await fetchRecentTipComments(projectId);
            
            // Aggregate tips by username
            const tipsByUser = {};
            allTipComments.forEach(entry => {
                const comment = entry.comment;
                if (comment && comment.card_data && comment.card_data.type === 'tip_comment') {
                    const username = comment.author && comment.author.username ? comment.author.username : 'unknown';
                    const credits = comment.card_data.credits_spent || 0;
                    tipsByUser[username] = (tipsByUser[username] || 0) + credits;
                }
            });

            // Sort and take top 10
            const leaderboardData = Object.entries(tipsByUser)
                .map(([username, totalCredits]) => ({ username, totalCredits }))
                .sort((a, b) => b.totalCredits - a.totalCredits)
                .slice(0, 10);

            if (leaderboardData.length > 0) {
                leaderboardList.innerHTML = leaderboardData.map((item, index) => {
                    const avatarUrl = `https://images.websim.com/avatar/${encodeURIComponent(item.username)}`;
                    return `
                        <div class="leaderboard-item">
                            <span class="rank">${index + 1}.</span>
                            <span class="username">
                                <img class="avatar" src="${avatarUrl}" alt="@${item.username}" />
                                @${item.username}
                            </span>
                            <span class="amount">${item.totalCredits} credits</span>
                        </div>
                    `;
                }).join('');
            } else {
                leaderboardList.innerHTML = `
                    <div class="leaderboard-item">
                        <span class="username" style="text-align: center; width: 100%;">No tips found</span>
                    </div>
                `;
            }

            // Listen for real-time new comments to keep leaderboard fresh
            window.websim.addEventListener('comment:created', (data) => {
                const c = data && data.comment;
                if (!c || !c.card_data || c.card_data.type !== 'tip_comment') return;
                // Re-load to update totals
                loadLeaderboardData();
            });
        } catch (error) {
            console.error('Failed to load leaderboard:', error);
            leaderboardList.innerHTML = `
                <div class="leaderboard-item">
                    <span class="username" style="text-align: center; width: 100%; color: #f44336;">Failed to load leaderboard</span>
                </div>
            `;
        }
    }
}