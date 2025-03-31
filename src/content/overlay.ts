/**
 * Handles creation and display of the selector overlay UI
 */
import { getElementAncestors } from '@services/dom-analyzer/ancestry';
import { generateAllSelectors } from '@services/selector-generator/generator';

// Shadow DOM container for our overlay
let overlayContainer: HTMLElement | null = null;
let shadowRoot: ShadowRoot | null = null;

/**
 * Creates the selector overlay for the given element
 */
export function createSelectorOverlay(element: Element): void {
  // Remove existing overlay if any
  removeExistingOverlay();
  
  // Create overlay container
  overlayContainer = document.createElement('div');
  overlayContainer.id = 'dom-selector-ninja-overlay';
  document.body.appendChild(overlayContainer);
  
  // Create shadow DOM for isolation
  shadowRoot = overlayContainer.attachShadow({ mode: 'open' });
  
  // Create iframe to load our UI
  const iframe = document.createElement('iframe');
  iframe.src = chrome.runtime.getURL('selector.html');
  iframe.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 400px;
    height: 600px;
    border: none;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 2147483647;
  `;
  
  shadowRoot.appendChild(iframe);
  
  // Get ancestors and analysis data to pass to UI
  const ancestors = getElementAncestors(element);
  const elementData = generateAllSelectors(element, ancestors);
  
  // When iframe loads, pass the element data
  iframe.onload = () => {
    iframe.contentWindow?.postMessage({
      action: 'initialize',
      data: {
        elementData,
        ancestors
      }
    }, '*');
  };
  
  // Add close button
  addCloseButton(shadowRoot);
}

/**
 * Adds close button to the overlay
 */
function addCloseButton(root: ShadowRoot): void {
  const closeButton = document.createElement('button');
  closeButton.textContent = '×';
  closeButton.style.cssText = `
    position: fixed;
    top: 22px;
    right: 22px;
    width: 20px;
    height: 20px;
    border: none;
    background: #555;
    color: white;
    border-radius: 50%;
    font-size: 16px;
    line-height: 1;
    cursor: pointer;
    z-index: 2147483648;
  `;
  
  closeButton.addEventListener('click', removeExistingOverlay);
  root.appendChild(closeButton);
}

/**
 * Removes any existing overlay
 */
function removeExistingOverlay(): void {
  if (overlayContainer) {
    document.body.removeChild(overlayContainer);
    overlayContainer = null;
    shadowRoot = null;
  }
}