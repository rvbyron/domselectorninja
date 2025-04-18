/**
 * Element selection functionality
 */

import { DomAnalyzer } from '@services/dom-analyzer';
import { UIManager } from './ui-manager';

console.log('DSN-DEBUG: element-selection.ts loaded');

// Create a variable to store the selected element
let selectedElement: Element | null = null;

/**
 * Begin the element selection process
 */
export function beginElementSelection(): void {
  console.log('DSN-DEBUG: beginElementSelection() called at', new Date().toISOString());
  
  try {
    // Check if UIManager is available
    console.log('DSN-DEBUG: UIManager available:', !!UIManager);
    console.log('DSN-DEBUG: UIManager methods:', Object.keys(UIManager));
    
    // Check if DomAnalyzer is available
    console.log('DSN-DEBUG: DomAnalyzer available:', !!DomAnalyzer);
    console.log('DSN-DEBUG: DomAnalyzer methods:', Object.keys(DomAnalyzer));
    
    // Show a message to the user
    console.log('DSN-DEBUG: Creating status message');
    showStatusMessage('Click on any element to analyze it');
    
    // Track original styles to restore them later
    const originalStyles = new Map<HTMLElement, string>();
    let hoveredElement: HTMLElement | null = null;
    
    // Clear any previously highlighted elements
    console.log('DSN-DEBUG: Clearing highlighted elements');
    UIManager.clearHighlightedElements();

    function stopElementSelection() {
      console.log('DSN-DEBUG: stopElementSelection() called');
      document.removeEventListener('mouseover', handleMouseOver, true);
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('keydown', handleKeyDown, true);
      originalStyles.forEach((style, element) => {
        element.setAttribute('style', style);
      });
      hideStatusMessage();
    }
    
    // Event handlers
    const handleMouseOver = (event: MouseEvent) => {
      const target = event.target as HTMLElement; 
      if (target === hoveredElement) return;
      
      // Restore previous hovered element's style
      if (hoveredElement && originalStyles.has(hoveredElement)) {
        hoveredElement.setAttribute('style', originalStyles.get(hoveredElement) || '');
      }
      
      // Save current style and highlight new element
      hoveredElement = target;
      originalStyles.set(target, target.getAttribute('style') || '');
      target.style.outline = '2px solid #3b82f6';
      target.style.outlineOffset = '2px';
      target.style.cursor = 'pointer';
      
      // Prevent other handlers
      event.stopPropagation();
    };
    
    const handleClick = (event: MouseEvent) => {
      console.log('DSN-DEBUG: Click event triggered on element:', (event.target as Element).tagName);
      // Prevent the default action
      event.preventDefault();
      event.stopPropagation();
      
      // Get the target element
      selectedElement = event.target as Element;
      
      // Remove event listeners
      stopElementSelection();
      
      // Analyze and show the selected element
      analyzeSelectedElement();
      
      return false;
    };
    
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cancel on Escape key
      if (event.key === 'Escape') {
        console.log('DSN-DEBUG: Escape key pressed, stopping element selection');
        stopElementSelection();
      }
    };
    
    // Add event listeners
    console.log('DSN-DEBUG: Adding event listeners');
    document.addEventListener('mouseover', handleMouseOver, true);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleKeyDown, true);
    console.log('DSN-DEBUG: Event listeners successfully added');
  } catch (error) {
    console.error('DSN-DEBUG: Error in beginElementSelection:', error);
  }
}

/**
 * Show a status message to the user
 */
function showStatusMessage(message: string): void {
  console.log('DSN-DEBUG: showStatusMessage called with:', message);
  try {
    // Create message element if it doesn't exist
    let messageEl = document.getElementById('dsn-status-message');
    if (!messageEl) {
      console.log('DSN-DEBUG: Creating status message element');
      messageEl = document.createElement('div');
      messageEl.id = 'dsn-status-message';
      messageEl.classList.add('dsn-status-message');
      document.body.appendChild(messageEl);
    }
    
    messageEl.textContent = message;
    messageEl.style.display = 'block';
    console.log('DSN-DEBUG: Status message displayed');
  } catch (error) {
    console.error('DSN-DEBUG: Error showing status message:', error);
  }
}

/**
 * Hide the status message
 */
function hideStatusMessage(): void {
  console.log('DSN-DEBUG: Hiding status message');
  try {
    const messageEl = document.getElementById('dsn-status-message');
    if (messageEl) {
      messageEl.style.display = 'none';
      console.log('DSN-DEBUG: Status message hidden');
    } else {
      console.log('DSN-DEBUG: No status message element found to hide');
    }
  } catch (error) {
    console.error('DSN-DEBUG: Error hiding status message:', error);
  }
}

/**
 * Analyze the selected element and show the selector panel
 */
function analyzeSelectedElement(): void {
  console.log('DSN-DEBUG: analyzeSelectedElement() called');
  
  if (!selectedElement) {
    console.error('DSN-DEBUG: No element selected');
    return;
  }
  
  try {
    // Clear previous highlighted elements
    console.log('DSN-DEBUG: Clearing highlighted elements');
    UIManager.clearHighlightedElements();
    
    // Temporarily add highlight class to the newly selected element for visual feedback
    selectedElement.classList.add('dsn-highlighted-element');
    
    console.log('DSN-DEBUG: Selected element:', selectedElement.tagName, selectedElement.id || '(no id)');
    
    // Remove the highlight class before analyzing to ensure it doesn't appear in the panel
    // Use setTimeout to provide a brief visual feedback of the selection
    setTimeout(() => {
      if (selectedElement) {
        console.log('DSN-DEBUG: Processing selected element after timeout');
        selectedElement.classList.remove('dsn-highlighted-element');
        
        try {
          // Use the DomAnalyzer to get information about the element
          console.log('DSN-DEBUG: Calling DomAnalyzer.analyzeElement()');
          const elementData = DomAnalyzer.analyzeElement(selectedElement);
          console.log('DSN-DEBUG: Element data:', elementData);
          
          console.log('DSN-DEBUG: Calling DomAnalyzer.getAncestors()');
          const ancestorElements = DomAnalyzer.getAncestors(selectedElement);
          console.log('DSN-DEBUG: Ancestor count:', ancestorElements.length);
          
          // Check if UIManager has the showSelectorPanel method
          console.log('DSN-DEBUG: Checking UIManager.showSelectorPanel before calling');
          if (typeof UIManager.showSelectorPanel !== 'function') {
            console.error('DSN-DEBUG: UIManager.showSelectorPanel is not a function:', UIManager.showSelectorPanel);
            throw new Error('showSelectorPanel method not found on UIManager');
          }
          
          // Show the selector panel
          console.log('DSN-DEBUG: Calling UIManager.showSelectorPanel()');
          UIManager.showSelectorPanel(selectedElement, elementData, ancestorElements);
          console.log('DSN-DEBUG: UIManager.showSelectorPanel() completed');
        } catch (error) {
          console.error('DSN-DEBUG: Error analyzing element or showing panel:', error);
        }
      } else {
        console.log('DSN-DEBUG: Selected element no longer exists after timeout');
      }
    }, 150); // Brief delay for visual feedback
  } catch (error) {
    console.error('DSN-DEBUG: Error in analyzeSelectedElement:', error);
  }
}

// Expose internal functions for debugging
(window as any).dsnElementSelectionDebug = {
  beginElementSelection,
  showStatusMessage,
  hideStatusMessage,
  analyzeSelectedElement,
  getSelectedElement: () => selectedElement
};
