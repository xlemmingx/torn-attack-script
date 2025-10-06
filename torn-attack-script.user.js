// ==UserScript==
// @name         Torn Attack Script
// @namespace    http://tampermonkey.net/
// @version      1.1.0
// @description  Attack enhancements for Torn City
// @author       You
// @match        https://www.torn.com/loader.php*
// @grant        none
// @run-at       document-end
// @updateURL    https://github.com/xlemmingx/torn-attack-script/raw/master/torn-attack-script.user.js
// @downloadURL  https://github.com/xlemmingx/torn-attack-script/raw/master/torn-attack-script.user.js
// ==/UserScript==

(function() {
    'use strict';

    // === CONFIGURATION ===
    const CONFIG = {
        // Target weapon slot: 'weapon_main', 'weapon_second', 'weapon_melee', 'weapon_temp'
        targetWeaponSlot: 'weapon_main',

        // Button styling
        buttonOpacity: 0.15,
        buttonBackground: 'rgba(255, 255, 255, 0.05)',
        buttonBorder: '1px solid rgba(255, 255, 255, 0.1)'
    };

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
            moveButtonToWeaponSlot();
        });
    }

    function moveButtonToWeaponSlot() {
        // Find button with specific classes and move to configured weapon slot
        waitForElement('.torn-btn.btn___RxE8_.silver', function(button) {
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

                // Move the button
                buttonContainer.appendChild(button);
                console.log(`Button moved to ${CONFIG.targetWeaponSlot} successfully`);

                // Update UI panel
                updatePanelStatus(`✓ Button moved to ${CONFIG.targetWeaponSlot}`);
            } else {
                console.error(`Target weapon slot "${CONFIG.targetWeaponSlot}" not found`);
                updatePanelStatus(`✗ Error: ${CONFIG.targetWeaponSlot} not found`);
            }
        }, 15000); // Wait up to 15 seconds for the button to appear
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