// ==UserScript==
// @name         Torn Attack Script
// @namespace    http://tampermonkey.net/
// @version      1.6.1
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
        // Target weapon slot: 'weapon_main', 'weapon_second', 'weapon_melee', 'weapon_temp'
        targetWeaponSlot: 'weapon_main',

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

    // Read the weapon name from the configured slot's aria-label ("Attack with X")
    function getWeaponName() {
        const slot = document.getElementById(CONFIG.targetWeaponSlot);
        const label = slot && slot.getAttribute('aria-label');
        if (label) {
            return label.replace(/^Attack with\s*/i, '').trim();
        }
        // Fallback to a readable slot name
        return CONFIG.targetWeaponSlot.replace('weapon_', '');
    }

    function updateOverlayLabel() {
        if (!overlayEl) return;
        overlayEl.textContent = `⚔ ${getWeaponName()}`;
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
            startBtn.click();
        } else {
            const weapon = document.getElementById(CONFIG.targetWeaponSlot);
            if (weapon) {
                debugLog(`Overlay click -> attack with ${CONFIG.targetWeaponSlot}`);
                weapon.click();
            } else {
                debugLog(`Weapon slot "${CONFIG.targetWeaponSlot}" not found`);
            }
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
                    if (!event.ctrlKey) return;

                    event.preventDefault();
                    event.stopPropagation();
                    event.stopImmediatePropagation();

                    CONFIG.targetWeaponSlot = slotId;
                    saveConfig();
                    updateOverlayLabel();
                    debugLog(`Target weapon slot changed to: ${slotId}`);

                    // Brief visual feedback (outline avoids layout shift)
                    slot.style.outline = '3px solid #ff6b6b';
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
