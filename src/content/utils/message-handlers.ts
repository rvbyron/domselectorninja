/**
 * Handles extension messaging
 */
import { ContentMessage } from '../types';
import { beginElementSelection } from '../services/element-selection';
import { clearHighlightedElements } from '../services/ui-manager';

/**
 * Sets up message handlers for communication with the extension
 */
export function setupMessageHandlers(): void {
  console.log('DSN: Setting up message handlers');
  
  chrome.runtime.onMessage.addListener((message: ContentMessage, _sender, sendResponse) => {
    console.log('DSN: Content script received message:', message);
    
    switch (message.action) {
      case 'ping':
        console.log('DSN: Received ping, responding...');
        sendResponse({ success: true, message: 'Content script is active' });
        break;
        
      case 'initializeSelector':
        console.log('DSN: Initializing selector...');
        beginElementSelection();
        sendResponse({ success: true, message: 'Selector initialized' });
        break;
        
      case 'clearHighlights':
        console.log('DSN: Clearing highlights...');
        clearHighlightedElements();
        sendResponse({ success: true, message: 'Highlights cleared' });
        break;
        
      default:
        console.log(`DSN: Unknown message action: ${message.action}`);
        sendResponse({ success: false, message: 'Unknown action' });
    }
    
    return true; // Indicate we want to send a response asynchronously
  });
}
