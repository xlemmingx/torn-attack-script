// ==UserScript==
// @name         Torn Attack Script
// @namespace    http://tampermonkey.net/
// @version      1.2.5
// @description  Attack enhancements for Torn City
// @author       You
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
        buttonBorder: '2px solid rgba(255, 255, 255, 0.3)'
    };

    // Load configuration from localStorage or use defaults
    const CONFIG = {
        ...DEFAULT_CONFIG,
        ...JSON.parse(localStorage.getItem('tornAttackScriptConfig') || '{}')
    };

    // Save configuration to localStorage
    function saveConfig() {
        localStorage.setItem('tornAttackScriptConfig', JSON.stringify(CONFIG));
        console.log('Configuration saved:', CONFIG);
    }

    // Wait for page to fully load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeScript);
    } else {
        initializeScript();
    }

    function initializeScript() {
        console.log('Torn Attack Script loaded');

        // Main enhancement functions
        addCustomUI();
        enhanceAttackFeatures();
        addUtilityFeatures();
    }

    function addCustomUI() {
        // Create enhancement panel
        const panel = document.createElement('div');
        panel.id = 'torn-attack-panel';
        panel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            width: 250px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 15px;
            border-radius: 8px;
            z-index: 9999;
            font-family: Arial, sans-serif;
            font-size: 12px;
            border: 1px solid #333;
        `;

        panel.innerHTML = `
            <h3 style="margin: 0 0 10px 0; color: #ff6b6b;">Torn Attack Script</h3>
            <div id="attack-content">
                <p>✓ Script loaded successfully!</p>
                <div id="attack-stats"></div>
            </div>
        `;

        document.body.appendChild(panel);
    }

    function enhanceAttackFeatures() {
        console.log('Attack enhancements applied');

        // Wait for Torn's content to load
        waitForElement('.content-wrapper', function() {
            console.log('Torn content loaded, applying enhancements...');
            setupWeaponSlotSelection();
            moveButtonToWeaponSlot();
        });
    }

    function moveButtonToWeaponSlot(existingButton = null) {
        // Use existing button if provided, otherwise search for it
        const button = existingButton || document.querySelector('.torn-btn.btn___RxE8_.silver');

        if (button) {
            console.log(`Found button, moving to ${CONFIG.targetWeaponSlot}`);
            moveButtonToSlot(button);
        } else {
            console.log('Button not found, waiting for it to appear...');
            // Wait for button to appear
            waitForElement('.torn-btn.btn___RxE8_.silver', function(foundButton) {
                console.log('Button found via waitForElement, moving to slot');
                moveButtonToSlot(foundButton);
            }, 15000);
        }
    }

    function moveButtonToSlot(button) {
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
                    console.log('Button clicked, hiding button...');

                    // Hide the button
                    buttonContainer.style.display = 'none';

                    // Update status
                    updatePanelStatus('✓ Button used and hidden');
                }
            });

            // Move the button
            buttonContainer.appendChild(button);
            console.log(`Button moved to ${CONFIG.targetWeaponSlot} successfully`);

            // Update UI panel
            updatePanelStatus(`✓ Button moved to ${CONFIG.targetWeaponSlot}`);
        } else {
            console.error(`Target weapon slot "${CONFIG.targetWeaponSlot}" not found or button missing`);
            updatePanelStatus(`✗ Error: ${CONFIG.targetWeaponSlot} not found`);
        }
    }

    function setupWeaponSlotSelection() {
        // Add Ctrl+Click handlers to weapon slots for configuration
        const weaponSlots = ['weapon_main', 'weapon_second', 'weapon_melee', 'weapon_temp'];

        console.log('Setting up weapon slot selection...');

        weaponSlots.forEach(slotId => {
            waitForElement(`#${slotId}`, function(slot) {
                console.log(`Adding Ctrl+Click handler to ${slotId}`);

                // Use capture phase to catch events before other handlers
                slot.addEventListener('click', function(event) {
                    console.log(`Click on ${slotId}, Ctrl pressed: ${event.ctrlKey}`);

                    if (event.ctrlKey) {
                        event.preventDefault();
                        event.stopPropagation();
                        event.stopImmediatePropagation();

                        console.log(`Ctrl+Click detected on ${slotId}`);

                        // Update configuration
                        CONFIG.targetWeaponSlot = slotId;
                        saveConfig();

                        // Show feedback
                        updatePanelStatus(`✓ Target set to ${slotId}`);
                        console.log(`Target weapon slot changed to: ${slotId}`);

                        // Flash the selected slot briefly
                        const originalBorder = slot.style.border;
                        slot.style.border = '3px solid #ff6b6b';
                        setTimeout(() => {
                            slot.style.border = originalBorder;
                        }, 500);

                        // Restart button placement if button exists
                        const existingButton = document.querySelector('.torn-btn.btn___RxE8_.silver');
                        if (existingButton) {
                            console.log('Repositioning existing button to new slot...');

                            // Remove all existing button containers
                            document.querySelectorAll('.torn-script-button-container').forEach(container => {
                                container.remove();
                            });

                            // Reset button styles to original
                            existingButton.style.position = '';
                            existingButton.style.width = '';
                            existingButton.style.height = '';
                            existingButton.style.top = '';
                            existingButton.style.left = '';
                            existingButton.style.opacity = '';
                            existingButton.style.background = '';
                            existingButton.style.border = '';

                            // Re-apply button to new slot immediately
                            setTimeout(() => {
                                console.log('Moving button to new slot now...');
                                moveButtonToWeaponSlot(existingButton);
                            }, 50);
                        } else {
                            console.log('No existing button found to reposition');
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

        updatePanelStatus(`Current target: ${CONFIG.targetWeaponSlot}`);
    }

    function addUtilityFeatures() {
        // Add utility features like:
        // - Quick navigation
        // - Information displays
        // - Time tracking
        // - Notification enhancements

        console.log('Utility features added');
    }

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

    function updatePanelStatus(message) {
        const panel = document.getElementById('attack-content');
        if (panel) {
            const statusDiv = panel.querySelector('#attack-stats');
            if (statusDiv) {
                statusDiv.innerHTML = `<p style="color: #4CAF50;">${message}</p>`;
            }
        }
    }

})();