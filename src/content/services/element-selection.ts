/**
 * Manages element selection interactions
 */
import { ElementSelectionOptions } from '../utils/types';
import { isAnalyzeFunctionInitialized, analyzeSelectedElementFn } from '../shared';
import { UIManager, clearHighlightedElements } from './ui-manager';
import { StatusMessage, showStatusMessage, hideStatusMessage } from '../components/status-message';

console.debug('DSN: Element selection module loaded');

let isElementSelectionActive = false;

/**
 * Initialize element selection functionality
 */
export function initializeElementSelection(
  options?: ElementSelectionOptions
): void {
  console.debug('DSN: Initializing element selection...');
  
  // Check if the analyze function is initialized
  if (!isAnalyzeFunctionInitialized()) {
    console.error('DSN: analyzeSelectedElementFn is not initialized. Cannot initialize element selection.');
    return;
  }
  
  // Set up click handler for element selection
  document.addEventListener('click', handleElementClick);
  console.debug('DSN: Element selection initialized with options:', options);
}

/**
 * Begin the element selection process
 */
export function beginElementSelection(): void {
  console.debug('DSN: Beginning element selection process...');
  
  // Show a message to the user
  showStatusMessage('Click on any element to analyze it');
  
  // Clear any previously highlighted elements
  clearHighlightedElements();
  
  // Enable selection mode
  enableElementSelection();
}

/**
 * Handle click events for element selection
 */
function handleElementClick(event: MouseEvent): void {
  console.debug('DSN: Element click detected');
  
  // Skip if element selection isn't active
  if (!isElementSelectionActive) {
    return;
  }
  
  try {
    console.debug('DSN: Calling analyzeSelectedElementFn...');
    analyzeSelectedElementFn(event);
  } catch (error) {
    console.error('Error in handleElementClick:', error);
  }
}

/**
 * Enable element selection mode
 */
export function enableElementSelection(): void {
  isElementSelectionActive = true;
  console.debug('DSN: Element selection mode enabled');
}

/**
 * Disable element selection mode
 */
export function disableElementSelection(): void {
  isElementSelectionActive = false;
  hideStatusMessage();
  console.debug('DSN: Element selection mode disabled');
}
