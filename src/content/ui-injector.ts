/**
 * UI Injector
 * Handles injecting the selector panel UI into the page
 */

import { ElementData } from '@utils/types';

/**
 * Inject the selector panel into the page
 */
export function injectSelectorPanel(elementData: ElementData) {
  // Create iframe for the selector panel
  const iframe = document.createElement('iframe');
  iframe.id = 'dom-selector-ninja-panel';
  iframe.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 400px;
    height: 600px;
    border: none;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    z-index: 2147483647;
    background: white;
  `;
  
  // Append the iframe to the body
  document.body.appendChild(iframe);
  
  // Create a draggable header for the iframe
  const dragHandle = document.createElement('div');
  dragHandle.id = 'dom-selector-ninja-drag-handle';
  dragHandle.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 400px;
    height: 30px;
    background: #232323;
    cursor: move;
    border-radius: 8px 8px 0 0;
    z-index: 2147483648;
  `;
  
  // Append the drag handle to the body
  document.body.appendChild(dragHandle);
  
  // Initialize iframe content after it loads
  iframe.onload = () => {
    initializeIframeContent(iframe, elementData);
  };
  
  // Set iframe source to selector panel HTML
  iframe.src = chrome.runtime.getURL('selector.html');
  
  // Make the panel draggable
  makePanelDraggable(dragHandle, iframe);
  
  // Add close button to drag handle
  addCloseButton(dragHandle, iframe);
}

/**
 * Initialize iframe content with element data
 */
function initializeIframeContent(iframe: HTMLIFrameElement, elementData: ElementData) {
  if (!iframe.contentWindow) return;
  
  // Send element data to iframe
  iframe.contentWindow.postMessage({
    action: 'initializePanel',
    data: elementData
  }, '*');
  
  // Listen for close event from iframe
  window.addEventListener('message', (event) => {
    if (event.data.action === 'closePanel') {
      closePanel(iframe);
    }
  });
}

/**
 * Make the panel draggable
 */
function makePanelDraggable(dragHandle: HTMLElement, iframe: HTMLIFrameElement) {
  let offsetX = 0;
  let offsetY = 0;
  let isDragging = false;
  
  dragHandle.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - dragHandle.getBoundingClientRect().left;
    offsetY = e.clientY - dragHandle.getBoundingClientRect().top;
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const x = e.clientX - offsetX;
    const y = e.clientY - offsetY;
    
    dragHandle.style.left = x + 'px';
    dragHandle.style.top = y + 'px';
    iframe.style.left = x + 'px';
    iframe.style.top = y + 'px';
  });
  
  document.addEventListener('mouseup', () => {
    isDragging = false;
  });
}

/**
 * Add close button to drag handle
 */
function addCloseButton(dragHandle: HTMLElement, iframe: HTMLIFrameElement) {
  const closeButton = document.createElement('div');
  closeButton.style.cssText = `
    position: absolute;
    top: 5px;
    right: 10px;
    width: 20px;
    height: 20px;
    cursor: pointer;
    color: white;
    font-size: 18px;
    line-height: 20px;
    text-align: center;
  `;
  closeButton.textContent = '×';
  closeButton.title = 'Close';
  
  closeButton.addEventListener('click', () => {
    closePanel(iframe);
  });
  
  dragHandle.appendChild(closeButton);
}

/**
 * Close the panel
 */
function closePanel(iframe: HTMLIFrameElement) {
  const dragHandle = document.getElementById('dom-selector-ninja-drag-handle');
  if (dragHandle) {
    dragHandle.remove();
  }
  iframe.remove();
}