/**
 * DOM Selector Ninja - Content Script Entry Point
 * This is the main entry point for the content script that runs in the context of web pages.
 */

import './content.css';
import { setupMessageListeners } from './utils/message-handlers';
import { beginElementSelection } from './services/element-selection';
import { UIManager } from './services/ui-manager';
import { DomAnalyzer } from '@services/dom-analyzer';

console.log('DSN-DEBUG: Content script loaded at', new Date().toISOString());
console.log('DSN-DEBUG: Window location:', window.location.href);
console.log('DSN-DEBUG: Document readyState:', document.readyState);

// Initialize the extension
(function initialize() {
  try {
    console.log('DSN-DEBUG: Initializing extension...');
    
    // Check if key dependencies are available
    console.log('DSN-DEBUG: UIManager available:', !!UIManager);
    console.log('DSN-DEBUG: DomAnalyzer available:', !!DomAnalyzer);
    console.log('DSN-DEBUG: beginElementSelection available:', !!beginElementSelection);
    
    // Set up message handlers for extension communication
    setupMessageListeners();
    console.log('DSN-DEBUG: Message listeners set up successfully');
    
    // Export services for debugging in development environments
    if (process.env.NODE_ENV === 'development') {
      (window as any).__DSN = {
        beginElementSelection,
        UIManager,
        DomAnalyzer
      };
      console.log('DSN-DEBUG: Debug object attached to window.__DSN');
    }
    
    // Log DOM information
    console.log('DSN-DEBUG: Document body exists:', !!document.body);
    console.log('DSN-DEBUG: Document head exists:', !!document.head);
    
    console.log('DSN-DEBUG: Content script initialization complete');
  } catch (error) {
    console.error('DSN-DEBUG: Error during initialization:', error);
  }
})();

// Add a simple test function to check if injection is working properly
(window as any).testDSN = () => {
  console.log('DSN-DEBUG: Test function called at', new Date().toISOString());
  return 'DSN is loaded';
};
