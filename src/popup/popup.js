// Import popup CSS - this is critical for webpack to bundle and inject the CSS
import '../styles/popup.css';

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM Selector Ninja popup initialized');
  
  // Reference to the checkbox
  const disableParentElementsCheckbox = document.getElementById('disable-parent-elements');
  
  console.log('DOM disableParentElementsCheckbox', disableParentElementsCheckbox);

  // First check which APIs are available - handle potential API differences
  let storageAPI = null;
  
  // Check for chrome.storage
  if (typeof chrome !== 'undefined' && chrome.storage) {
    console.log('Using chrome.storage API');
    storageAPI = chrome.storage;
  } 
  // Check for browser.storage (Firefox/Edge alternative)
  else if (typeof browser !== 'undefined' && browser.storage) {
    console.log('Using browser.storage API');
    storageAPI = browser.storage;
  }
  // Check for edge.storage
  else if (typeof edge !== 'undefined' && edge.storage) {
    console.log('Using edge.storage API');
    storageAPI = edge.storage;
  }
  
  if (disableParentElementsCheckbox) {
    if (storageAPI && storageAPI.sync) {
      // Load the setting from storage.sync and set checkbox state
      storageAPI.sync.get(['disableParentElements'], function(result) {
        // Default to true if not set
        disableParentElementsCheckbox.checked = result.disableParentElements !== false;
        console.log('Loaded setting:', result.disableParentElements);
      });

      // Persist the setting to storage.sync on change
      disableParentElementsCheckbox.addEventListener('change', function() {
        const value = disableParentElementsCheckbox.checked;
        storageAPI.sync.set({ disableParentElements: value }, function() {
          console.log('Saved setting:', value);
        });
      });
    } else {
      console.error('Storage API not available - this could indicate a manifest.json permissions issue');
      console.log('Check that "storage" is included in the permissions in manifest.json');
      
      // Still set up the change listener, but use localStorage as fallback
      disableParentElementsCheckbox.addEventListener('change', function() {
        const value = disableParentElementsCheckbox.checked;
        try {
          localStorage.setItem('disableParentElements', value.toString());
          console.log('Saved to localStorage as fallback:', value);
        } catch (e) {
          console.error('Could not save setting:', e);
        }
      });
      
      // Try to load from localStorage
      try {
        const storedValue = localStorage.getItem('disableParentElements');
        disableParentElementsCheckbox.checked = storedValue !== 'false'; // Default to true
        console.log('Loaded from localStorage as fallback:', storedValue);
      } catch (e) {
        console.log('Could not load setting, using default');
      }
    }
  } else {
    console.error('Checkbox element not found in popup');
  }
  
  // Optional: Add event listener for options button
  const optionsButton = document.getElementById('open-options');
  if (optionsButton) {
    optionsButton.addEventListener('click', function() {
      if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
      } else {
        window.open(chrome.runtime.getURL('options.html'));
      }
    });
  }
});