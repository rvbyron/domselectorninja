// Background script for DOM Selector Ninja extension

// Initialize settings on extension install
chrome.runtime.onInstalled.addListener(function(details) {
  console.log('Extension installed/updated:', details.reason);
  
  // Only set default if not already set
  chrome.storage.sync.get(['disableParentElements'], function(result) {
    if (typeof result.disableParentElements === 'undefined') {
      chrome.storage.sync.set({ disableParentElements: true });
    }
  });

  // Initialize settings with default values
  if (details.reason === 'install') {
    const defaultSettings = {
      disableParentElements: true
    };
    
    chrome.storage.sync.set(defaultSettings, function() {
      console.log('Default settings initialized:', defaultSettings);
    });
  }
  
  // For debugging: log all storage contents after installation
  chrome.storage.sync.get(null, function(items) {
    console.log('Current storage contents:', items);
  });
});

// Listen for messages to get settings
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'getSettings') {
    chrome.storage.sync.get(['disableParentElements'], function(result) {
      console.log('Sending settings to content script:', result);
      sendResponse(result);
    });
    return true; // Required for async sendResponse
  }
});

// For debugging: log storage changes
chrome.storage.onChanged.addListener(function(changes, namespace) {
  console.log('Storage changes:', changes);
  console.log('Storage namespace:', namespace);
});
