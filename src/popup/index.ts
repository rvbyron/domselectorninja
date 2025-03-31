/**
 * Popup Script for DOM Selector Ninja
 * Handles the extension popup UI and functionality
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM Selector Ninja popup initialized');
  
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