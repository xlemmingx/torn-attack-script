// ==UserScript==
// @name         Torn Attack Script
// @namespace    http://tampermonkey.net/
// @version      1.4.1
// @description  Attack enhancements for Torn City
// @author       xlemmingx [2035104]
// @match        https://www.torn.com/loader.php*
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

        // Button styling
        buttonOpacity: 0.7,
        buttonBackground: 'rgba(255, 255, 255, 0.1)',
        buttonBorder: '2px solid rgba(255, 255, 255, 0.3)',

        // Debug settings
        enableDebugLogs: true
    };

    // Load configuration from localStorage or use defaults
    const CONFIG = {
        ...DEFAULT_CONFIG,
        ...JSON.parse(localStorage.getItem('tornAttackScriptConfig') || '{}')
    };

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

        // Main enhancement functions - minimal for performance
        enhanceAttackFeatures();
    }

    // UI Panel removed for performance optimization

    function enhanceAttackFeatures() {
        debugLog('Attack enhancements applied');

        // Wait for Torn's content to load
        waitForElement('.content-wrapper', function() {
            debugLog('Torn content loaded, applying enhancements...');
            setupWeaponSlotSelection();
            moveButtonToWeaponSlot();
        });
    }

    // Cache DOM selectors for performance
    let cachedButton = null;
    let cachedWeaponSlots = {};

    function moveButtonToWeaponSlot(existingButton = null) {
        // Always fresh query for reliability during debugging
        const button = existingButton || document.querySelector('.torn-btn.btn___RxE8_.silver');

        if (button) {
            debugLog(`Found button, moving to ${CONFIG.targetWeaponSlot}`);
            moveButtonToSlot(button);
        } else {
            debugLog('Button not found, waiting for it to appear...');
            // Wait for button to appear
            waitForElement('.torn-btn.btn___RxE8_.silver', function(foundButton) {
                debugLog('Button found via waitForElement, moving to slot');
                moveButtonToSlot(foundButton);
            }, 15000);
        }
    }

    function moveButtonToSlot(button) {
        // Always fresh query for reliability during debugging
        const targetWeapon = document.getElementById(CONFIG.targetWeaponSlot);
        if (targetWeapon && button) {
            // Create a container for the button inside target weapon slot
            let buttonContainer = targetWeapon.querySelector('.torn-script-button-container');
            if (!buttonContainer) {
                buttonContainer = document.createElement('div');
                buttonContainer.className = 'torn-script-button-container';
                buttonContainer.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 1000;
                    pointer-events: none;
                `;
                targetWeapon.style.position = 'relative';
                targetWeapon.appendChild(buttonContainer);
            }

            // Style the button using config values
            button.style.cssText += `
                opacity: ${CONFIG.buttonOpacity};
                background: ${CONFIG.buttonBackground} !important;
                border: ${CONFIG.buttonBorder} !important;
                width: 100%;
                height: 100%;
                position: absolute;
                top: 0;
                left: 0;
                pointer-events: auto;
            `;

            // Add click handler to hide button after use
            button.addEventListener('click', function(event) {
                if (!event.ctrlKey) { // Only hide on normal clicks, not Ctrl+clicks
                    debugLog('Button clicked, hiding button...');

                    // Hide the button
                    buttonContainer.style.display = 'none';

                    // Button hidden for performance
                }
            });

            // Move the button
            buttonContainer.appendChild(button);
            debugLog(`Button moved to ${CONFIG.targetWeaponSlot} successfully`);
        } else {
            debugLog(`Target weapon slot "${CONFIG.targetWeaponSlot}" not found or button missing`);
        }
    }

    function setupWeaponSlotSelection() {
        // Add Ctrl+Click handlers to weapon slots for configuration
        const weaponSlots = ['weapon_main', 'weapon_second', 'weapon_melee', 'weapon_temp'];

        debugLog('Setting up weapon slot selection...');

        weaponSlots.forEach(slotId => {
            waitForElement(`#${slotId}`, function(slot) {
                debugLog(`Adding Ctrl+Click handler to ${slotId}`);

                // Use capture phase to catch events before other handlers
                slot.addEventListener('click', function(event) {
                    debugLog(`Click on ${slotId}, Ctrl pressed: ${event.ctrlKey}`);

                    if (event.ctrlKey) {
                        event.preventDefault();
                        event.stopPropagation();
                        event.stopImmediatePropagation();

                        debugLog(`Ctrl+Click detected on ${slotId}`);

                        // Update configuration
                        CONFIG.targetWeaponSlot = slotId;
                        saveConfig();

                        // Show feedback via debug log only
                        debugLog(`Target weapon slot changed to: ${slotId}`);

                        // Flash the selected slot briefly (optimized)
                        slot.style.border = '3px solid #ff6b6b';
                        setTimeout(() => slot.style.border = '', 300);

                        // Restart button placement if button exists (immediate execution)
                        const existingButton = document.querySelector('.torn-btn.btn___RxE8_.silver');
                        if (existingButton) {
                            debugLog('Repositioning existing button to new slot...');

                            // Remove all existing button containers (optimized)
                            const containers = document.querySelectorAll('.torn-script-button-container');
                            containers.forEach(container => container.remove());

                            // Reset button styles (individual properties for reliability)
                            existingButton.style.position = '';
                            existingButton.style.width = '';
                            existingButton.style.height = '';
                            existingButton.style.top = '';
                            existingButton.style.left = '';
                            existingButton.style.opacity = '';
                            existingButton.style.background = '';
                            existingButton.style.border = '';

                            // Re-apply button to new slot immediately (no timeout)
                            debugLog('Moving button to new slot now...');
                            moveButtonToWeaponSlot(existingButton);
                        } else {
                            debugLog('No existing button found to reposition');
                        }

                        return false;
                    }
                }, true); // Use capture phase

                // Add visual indicator that slot is Ctrl+clickable
                slot.style.cursor = 'pointer';
                const currentTitle = slot.getAttribute('title') || '';
                slot.setAttribute('title', currentTitle + ' (Ctrl+Click to set as attack button target)');
            });
        });

        debugLog(`Current target: ${CONFIG.targetWeaponSlot}`);
    }

    // Utility features removed for performance optimization

    // Helper functions
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

    function addStyle(css) {
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    }

    // Torn-specific helper functions
    function getTornData() {
        // Helper to extract data from Torn's page structure
        return {
            userId: window.userId || null,
            userName: window.userName || null
        };
    }

    // Panel status function removed for performance optimization

})();