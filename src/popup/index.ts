/**
 * Popup Script for DOM Selector Ninja
 * Handles the extension popup UI and functionality
 */

// Import popup styles
import '../styles/popup.css';

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM Selector Ninja popup initialized');
  
  // Initialize settings
  initializeSettings();
  
  // Set up event listeners for the popup interface
  const openOptionsButton = document.getElementById('open-options');
  if (openOptionsButton) {
    openOptionsButton.addEventListener('click', () => {
      if (chrome.runtime && chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
      }
    });
  }
});

/**
 * Initialize settings functionality
 */
function initializeSettings(): void {
  const disableParentElementsCheckbox = document.getElementById('disable-parent-elements') as HTMLInputElement;
  
  if (!disableParentElementsCheckbox) {
    console.error('Settings checkbox not found in popup');
    return;
  }
  
  // Load current setting value
  if (chrome && chrome.storage) {
    chrome.storage.sync.get(['disableParentElements'], (result) => {
      // Default to true if not set
      const currentValue = result.disableParentElements !== false;
      disableParentElementsCheckbox.checked = currentValue;
      console.log('Loaded setting disableParentElements:', currentValue);
    });
    
    // Save setting when changed
    disableParentElementsCheckbox.addEventListener('change', () => {
      const newValue = disableParentElementsCheckbox.checked;
      chrome.storage.sync.set({ disableParentElements: newValue }, () => {
        console.log('Saved setting disableParentElements:', newValue);
      });
    });
  } else {
    console.error('Chrome storage API not available');
  }
}