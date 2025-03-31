/**
 * Background script for DOM Selector Ninja
 * Handles extension initialization and communication with content scripts
 */

// Create context menu item when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'analyzeDomElement',
    title: 'Analyze with DOM Selector Ninja',
    contexts: ['all']
  });

  console.log('DOM Selector Ninja extension installed');
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'analyzeDomElement' && tab && tab.id) {
    // Send message to content script to start the element selection process
    chrome.tabs.sendMessage(tab.id, { action: 'initializeSelector' });
    console.log('Sent initializeSelector message to tab', tab.id);
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    // Open the popup UI
    chrome.action.openPopup();
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'showSelectorPanel') {
    // Handle request to show the selector panel
    sendResponse({ success: true });
  }
  return true;
});