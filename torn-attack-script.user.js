// ==UserScript==
// @name         Torn Attack Script
// @namespace    http://tampermonkey.net/
// @version      1.8.1
// @description  Attack enhancements for Torn City
// @author       xlemmingx [2035104]
// @match        https://www.torn.com/page.php?sid=attack*
// @grant        none
// @run-at       document-end
// @updateURL    https://github.com/xlemmingx/torn-attack-script/raw/main/torn-attack-script.user.js
// @downloadURL  https://github.com/xlemmingx/torn-attack-script/raw/main/torn-attack-script.user.js
// ==/UserScript==

(function() {
    'use strict';

    // === CONFIGURATION ===
    const DEFAULT_CONFIG = {
        // Main weapon slot (used for the rest of the fight):
        // 'weapon_main', 'weapon_second', 'weapon_melee', 'weapon_temp'
        targetWeaponSlot: 'weapon_main',

        // Optional opener weapon slot, fired exactly once at the start of a fight.
        // Empty string = disabled (single-weapon mode).
        openerWeaponSlot: '',

        // Overlay button styling
        buttonOpacity: 0.9,
        buttonBackground: 'rgba(255, 255, 255, 0.1)',
        buttonBorder: '2px solid rgba(255, 255, 255, 0.3)',

        // Debug settings
        enableDebugLogs: false
    };

    // Load configuration from localStorage or use defaults
    const CONFIG = {
        ...DEFAULT_CONFIG,
        ...JSON.parse(localStorage.getItem('tornAttackScriptConfig') || '{}')
    };

    const WEAPON_SLOTS = ['weapon_main', 'weapon_second', 'weapon_melee', 'weapon_temp'];

    // Save configuration to localStorage
    function saveConfig() {
        localStorage.setItem('tornAttackScriptConfig', JSON.stringify(CONFIG));
        debugLog('Configuration saved:', CONFIG);
    }

    // Debug logging function
    function debugLog(...args) {
        if (CONFIG.enableDebugLogs) {
            console.log('[Torn Attack Script]', ...args);
        }
    }

    // Wait for page to fully load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeScript);
    } else {
        initializeScript();
    }

    function initializeScript() {
        debugLog('Torn Attack Script loaded');

        // Wait for Torn's content to load, then wire everything up
        waitForElement('.content-wrapper', function() {
            debugLog('Torn content loaded, applying enhancements...');
            setupWeaponSlotSelection();
            setupSpamButton();
        });
    }

    // === SPAM BUTTON ===
    // Shows a single fixed overlay button where "Start fight" sat — but only
    // while a fight is actually running. The user starts the fight with Torn's
    // own button, then spams our overlay in the same spot to attack.
    //   - before fight (Start/Join button visible) -> overlay hidden
    //   - fight running                            -> overlay visible, clicks attack
    //   - fight finished (outcome shown)           -> overlay hidden
    // Each physical click triggers exactly one attack (no auto-attacking).
    let overlayEl = null;
    // Last known position of the native Start/Join button (where the overlay goes)
    let lastRect = null;
    // Whether the opener weapon has already been fired in the current fight
    let openerUsed = false;

    function setupSpamButton() {
        waitForElement('.torn-btn.silver', function() {
            debugLog('Attack page ready, watching fight state');
            watchFightState();
        }, 15000);
    }

    // Find the native Start/Join fight button (build-hash independent, text based)
    function findStartButton() {
        const buttons = document.querySelectorAll('.torn-btn');
        for (const btn of buttons) {
            const text = (btn.textContent || '').trim().toLowerCase();
            if (text === 'start fight' || text === 'join fight') {
                return btn;
            }
        }
        return null;
    }

    // The fight is over once Torn fills the outcome "result" box (e.g. "WON 790",
    // "LOST ..."). Pre-fight and during the fight these boxes exist but are empty,
    // so any non-empty result box means the fight has ended (win or loss). This is
    // stable across both post-fight states (mug/leave/hospitalize and CONTINUE).
    function isFightOver() {
        const results = document.querySelectorAll('[class*="result___"]');
        for (const r of results) {
            if ((r.textContent || '').trim() !== '') return true;
        }
        return false;
    }

    // Recompute overlay visibility/position from the current fight state.
    function updateOverlayVisibility() {
        const startBtn = findStartButton();
        if (startBtn) {
            // Pre-fight: keep our button hidden, remember where to place it later,
            // and keep the opener armed.
            lastRect = startBtn.getBoundingClientRect();
            openerUsed = false;
            hideOverlay();
            return;
        }
        if (isFightOver()) {
            hideOverlay();
            return;
        }
        // Fight is running: show the overlay at the remembered spot.
        showOverlay();
    }

    // Coalesce bursts of DOM mutations into one update per frame (keeps it cheap
    // during fight animations without adding any latency to clicks).
    let updateScheduled = false;
    function scheduleUpdate() {
        if (updateScheduled) return;
        updateScheduled = true;
        requestAnimationFrame(function() {
            updateScheduled = false;
            updateOverlayVisibility();
        });
    }

    function watchFightState() {
        ensureOverlay();
        updateOverlayVisibility();

        const container = document.querySelector('.content-wrapper') || document.body;
        const observer = new MutationObserver(scheduleUpdate);
        observer.observe(container, { childList: true, subtree: true });

        window.addEventListener('resize', scheduleUpdate);
        window.addEventListener('scroll', scheduleUpdate, true);
    }

    function ensureOverlay() {
        if (overlayEl) return;
        overlayEl = document.createElement('button');
        overlayEl.type = 'button';
        overlayEl.className = 'torn-spam-button';
        overlayEl.title = 'Attack button (Ctrl+Click = main weapon, Shift+Click = opener)';
        overlayEl.style.display = 'none';
        overlayEl.addEventListener('click', onSpamClick);
        document.body.appendChild(overlayEl);
    }

    function showOverlay() {
        if (!lastRect) return; // never saw the start button -> nothing to anchor to
        ensureOverlay();
        positionOverlay(lastRect);
        updateOverlayLabel();
        overlayEl.style.display = 'flex';
    }

    function hideOverlay() {
        if (overlayEl) overlayEl.style.display = 'none';
    }

    function positionOverlay(rect) {
        overlayEl.style.cssText = `
            position: fixed;
            top: ${rect.top}px;
            left: ${rect.left}px;
            min-width: ${rect.width}px;
            height: ${rect.height}px;
            padding: 0 12px;
            z-index: 100000;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            font-weight: 700;
            font-size: 12px;
            line-height: 1;
            color: #fff;
            white-space: nowrap;
            border: none;
            border-radius: 5px;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
            background: linear-gradient(180deg, #7ec24a 0%, #5ba033 100%);
            text-shadow: 0 1px 1px rgba(0, 0, 0, 0.35);
            opacity: ${CONFIG.buttonOpacity};
            box-sizing: border-box;
        `;
    }

    // Read the weapon name from a slot's aria-label ("Attack with X")
    function getWeaponName(slotId) {
        const slot = document.getElementById(slotId);
        const label = slot && slot.getAttribute('aria-label');
        if (label) {
            return label.replace(/^Attack with\s*/i, '').trim();
        }
        // Fallback to a readable slot name
        return slotId.replace('weapon_', '');
    }

    // The weapon slot the next click will trigger (opener while it is still pending)
    function nextWeaponSlot() {
        if (CONFIG.openerWeaponSlot && !openerUsed) return CONFIG.openerWeaponSlot;
        return CONFIG.targetWeaponSlot;
    }

    function updateOverlayLabel() {
        if (!overlayEl) return;
        const slotId = nextWeaponSlot();
        const openerPending = CONFIG.openerWeaponSlot && !openerUsed;
        overlayEl.textContent = `⚔ ${openerPending ? '1× ' : ''}${getWeaponName(slotId)}`;
    }

    function onSpamClick() {
        // The overlay is only visible while a fight is running, so a click here
        // is always an attack. One physical click == one attack (no automation).
        const slotId = nextWeaponSlot();
        const weapon = document.getElementById(slotId);
        if (weapon) {
            debugLog(`Overlay click -> attack with ${slotId}`);
            weapon.click();
            // Consume the opener after its single use
            if (CONFIG.openerWeaponSlot && !openerUsed && slotId === CONFIG.openerWeaponSlot) {
                openerUsed = true;
                updateOverlayLabel();
            }
        } else {
            debugLog(`Weapon slot "${slotId}" not found`);
        }
    }

    // === WEAPON SLOT SELECTION ===
    // Ctrl+Click a weapon slot to set it as the attack target for the overlay.
    function setupWeaponSlotSelection() {
        debugLog('Setting up weapon slot selection...');

        WEAPON_SLOTS.forEach(slotId => {
            waitForElement(`#${slotId}`, function(slot) {
                debugLog(`Adding Ctrl+Click handler to ${slotId}`);

                slot.addEventListener('click', function(event) {
                    // Ctrl+Click = main weapon, Shift+Click = opener weapon (1x at start)
                    if (!event.ctrlKey && !event.shiftKey) return;

                    event.preventDefault();
                    event.stopPropagation();
                    event.stopImmediatePropagation();

                    let flashColor;
                    if (event.shiftKey) {
                        // Toggle: Shift+Click the current opener again to disable it
                        if (CONFIG.openerWeaponSlot === slotId) {
                            CONFIG.openerWeaponSlot = '';
                            debugLog(`Opener weapon cleared (was ${slotId})`);
                        } else {
                            CONFIG.openerWeaponSlot = slotId;
                            debugLog(`Opener weapon set to: ${slotId}`);
                        }
                        openerUsed = false; // re-arm so the label reflects the new opener
                        flashColor = '#4a9bff'; // blue = opener
                    } else {
                        CONFIG.targetWeaponSlot = slotId;
                        debugLog(`Main weapon set to: ${slotId}`);
                        flashColor = '#ff6b6b'; // red = main
                    }

                    saveConfig();
                    updateOverlayLabel();

                    // Brief visual feedback (outline avoids layout shift)
                    slot.style.outline = `3px solid ${flashColor}`;
                    setTimeout(() => { slot.style.outline = ''; }, 300);
                }, true); // capture phase to beat Torn's own handlers

                slot.style.cursor = 'pointer';
            });
        });

        debugLog(`Current target: ${CONFIG.targetWeaponSlot}`);
    }

    // === HELPERS ===
    function waitForElement(selector, callback, timeout = 10000) {
        const startTime = Date.now();

        function check() {
            const element = document.querySelector(selector);
            if (element) {
                callback(element);
            } else if (Date.now() - startTime < timeout) {
                setTimeout(check, 100);
            }
        }

        check();
    }

})();
