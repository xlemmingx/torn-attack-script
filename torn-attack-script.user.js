// ==UserScript==
// @name         Torn Attack Script
// @namespace    http://tampermonkey.net/
// @version      1.7.0
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
    // Keeps a single fixed overlay button where "Start fight" normally sits.
    // Each physical click triggers exactly one game action (no auto-attacking):
    //   - fight not started yet -> click the native Start/Join fight button
    //   - fight running          -> click the configured weapon slot to attack
    // This lets the user spam clicks in one spot without moving the mouse.
    let overlayEl = null;
    // Whether the opener weapon has already been fired in the current fight
    let openerUsed = false;

    function setupSpamButton() {
        waitForElement('.torn-btn.silver', function(startBtn) {
            debugLog('Start fight button found, creating spam overlay');
            createOverlay(startBtn);
        }, 15000);
    }

    // Find the native Start/Join fight button regardless of the volatile build hash
    function findStartButton() {
        const buttons = document.querySelectorAll('.torn-btn');
        for (const btn of buttons) {
            const text = (btn.textContent || '').trim().toLowerCase();
            if (text === 'start fight' || text === 'join fight') {
                return btn;
            }
        }
        // Fallback: on the attack page "silver" is unique to the start button
        return document.querySelector('.torn-btn.silver');
    }

    function createOverlay(refEl) {
        if (!overlayEl) {
            overlayEl = document.createElement('button');
            overlayEl.type = 'button';
            overlayEl.className = 'torn-spam-button';
            overlayEl.title = 'Attack button (Ctrl+Click a weapon slot to choose the weapon)';
            overlayEl.addEventListener('click', onSpamClick);
            document.body.appendChild(overlayEl);
        }
        positionOverlay(refEl);
        updateOverlayLabel();

        // Keep the overlay aligned while the native button is still around
        window.addEventListener('resize', repositionOverlay);
        window.addEventListener('scroll', repositionOverlay, true);
    }

    function positionOverlay(refEl) {
        const rect = refEl.getBoundingClientRect();
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

    function repositionOverlay() {
        if (!overlayEl) return;
        const startBtn = findStartButton();
        if (startBtn) positionOverlay(startBtn);
    }

    function onSpamClick() {
        // One physical click == one game action (ToS-friendly, no automation)
        const startBtn = findStartButton();
        if (startBtn && document.body.contains(startBtn)) {
            debugLog('Overlay click -> Start/Join fight');
            openerUsed = false; // new fight: arm the opener again
            startBtn.click();
            updateOverlayLabel();
            return;
        }

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
