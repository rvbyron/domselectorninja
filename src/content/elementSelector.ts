/**
 * Element selection functionality
 * Handles element highlighting and selection
 */

import { DomAnalyzer } from '@services/dom-analyzer';
import { UIManager } from './services/ui-manager';

// Create a variable to store the selected element
let selectedElement: Element | null = null;

/**
 * Begin the element selection process
 */
export function beginElementSelection(): void {
  console.log('DSN: Beginning element selection process...');
  
  // Show a message to the user
  showStatusMessage('Click on any element to analyze it');
  
  // Track original styles to restore them later
  const originalStyles = new Map<HTMLElement, string>();
  let hoveredElement: HTMLElement | null = null;
  
  // Clear any previously highlighted elements
  UIManager.clearHighlightedElements();

  function stopElementSelection() {
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
    console.log('DSN: Click event triggered');
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
      stopElementSelection();
    }
  };
  
  // Add event listeners
  document.addEventListener('mouseover', handleMouseOver, true);
  document.addEventListener('click', handleClick, true);
  document.addEventListener('keydown', handleKeyDown, true);
  console.log('DSN: Event listeners added');
}

/**
 * Show a status message to the user
 */
function showStatusMessage(message: string): void {
  // Create message element if it doesn't exist
  let messageEl = document.getElementById('dsn-status-message');
  if (!messageEl) {
    messageEl = document.createElement('div');
    messageEl.id = 'dsn-status-message';
    messageEl.classList.add('dsn-status-message');
    document.body.appendChild(messageEl);
  }
  
  messageEl.textContent = message;
  messageEl.style.display = 'block';
}

/**
 * Hide the status message
 */
function hideStatusMessage(): void {
  const messageEl = document.getElementById('dsn-status-message');
  if (messageEl) {
    messageEl.style.display = 'none';
  }
}

/**
 * Analyze the selected element and show the selector panel
 */
function analyzeSelectedElement(): void {
  if (!selectedElement) {
    console.error('DSN: No element selected');
    return;
  }
  
  // Clear previous highlighted elements
  UIManager.clearHighlightedElements();
  
  // Temporarily add highlight class to the newly selected element for visual feedback
  selectedElement.classList.add('dsn-highlighted-element');
  
  console.log('DSN: Analyzing element:', selectedElement);
  
  // Remove the highlight class before analyzing to ensure it doesn't appear in the panel
  // Use setTimeout to provide a brief visual feedback of the selection
  setTimeout(() => {
    if (selectedElement) {
      selectedElement.classList.remove('dsn-highlighted-element');
      
      // Use the DomAnalyzer to get information about the element
      const elementData = DomAnalyzer.analyzeElement(selectedElement);
      const ancestorElements = DomAnalyzer.getAncestors(selectedElement);
      
      // Show the selector panel using UIManager
      UIManager.showSelectorPanel(selectedElement, elementData, ancestorElements);
    }
  }, 150); // Brief delay for visual feedback
}
