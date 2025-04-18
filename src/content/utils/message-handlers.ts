/**
 * Handles messages from the background script or popup
 */

// Update the import path to match the actual structure
import { beginElementSelection } from '../services/element-selection';

/**
 * Set up listeners for messages from the extension
 */
export function setupMessageListeners(): void {
  console.log('DSN-DEBUG: Setting up message listeners');
  
  try {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('DSN-DEBUG: Message received:', message);
      console.log('DSN-DEBUG: Sender:', sender);
      
      if (message.action === 'initializeSelector') {
        console.log('DSN-DEBUG: Initialize selector action received');
        
        try {
          // Check if beginElementSelection is properly imported
          console.log('DSN-DEBUG: beginElementSelection type:', typeof beginElementSelection);
          
          // Begin the element selection process
          console.log('DSN-DEBUG: Calling beginElementSelection()');
          beginElementSelection();
          console.log('DSN-DEBUG: beginElementSelection() completed');
          
          sendResponse({ success: true });
          console.log('DSN-DEBUG: Success response sent back');
        } catch (error: unknown) {
          // Properly type the error and handle it
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error('DSN-DEBUG: Error in initializeSelector handler:', errorMessage);
          sendResponse({ success: false, error: errorMessage });
        }
        
        return true; // Indicate that we'll call sendResponse asynchronously
      }
      
      console.log('DSN-DEBUG: No handler for message action:', message.action);
      // Return false by default to indicate no asynchronous response
      return false;
    });
    
    console.log('DSN-DEBUG: Message listener successfully added');
    
    // Add a test message handler for debugging
    (window as any).testDSNMessageHandler = () => {
      console.log('DSN-DEBUG: Testing message handler');
      try {
        beginElementSelection();
        return 'Message handler test successful - beginElementSelection called';
      } catch (error: unknown) {
        // Properly type the error
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('DSN-DEBUG: Error in test message handler:', errorMessage);
        return 'Error: ' + errorMessage;
      }
    };
  } catch (error: unknown) {
    // Properly type the error
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('DSN-DEBUG: Error setting up message listeners:', errorMessage);
  }
}
