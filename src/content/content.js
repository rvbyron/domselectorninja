// Initialize extension with settings
function initializeExtension() {
  // Load settings from storage
  chrome.storage.sync.get(['disableParentElements'], function(result) {
    // Set default to true if not found
    if (result.disableParentElements === undefined) {
      chrome.storage.sync.set({ disableParentElements: true });
    }
    
    // Store setting in window object for access by TypeScript modules
    (window as any).dsnDisableParentElements = result.disableParentElements !== false;
  });
}

// Run initialization
initializeExtension();