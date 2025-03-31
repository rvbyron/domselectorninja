/**
 * Content script for DOM Selector Ninja
 * Handles UI interactions on the page and communicates with the background script
 */

console.log('DSN: DOM Selector Ninja content script loaded');

import { DomAnalyzer } from '@services/dom-analyzer';
import { ElementData, AncestorElement } from '@utils/types';
import './content.css'; // CSS will be injected by style-loader

// Create a variable to store the selected element
let selectedElement: Element | null = null;

// Store selected selectors for each element in the hierarchy, mapping element index to list of selected selectors
let selectedSelectors = new Map<string, Set<string>>();

// Add a flag to track if any pseudo-element is selected
let isPseudoElementSelected = false;

// Add a flag to track if an ID selector is selected
let isIdSelectorSelected = false;

// Message handler
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('DSN: Content script received message:', message);
  
  if (message.action === 'initializeSelector') {
    console.log('DSN: Initializing selector...');
    // Begin the element selection process
    beginElementSelection();
    sendResponse({ success: true });
    return true; // Indicate that we'll call sendResponse asynchronously
  }
  
  // Return false by default to indicate no asynchronous response
  return false;
});

/**
 * Begin the element selection process
 * Adds click listeners to the page and highlights elements on hover
 */
function beginElementSelection() {
  console.log('DSN: Beginning element selection process...');
  
  // Show a message to the user
  showStatusMessage('Click on any element to analyze it');
  
  // Track original styles to restore them later
  const originalStyles = new Map<HTMLElement, string>();
  let hoveredElement: HTMLElement | null = null;
  
  // Clear any previously highlighted elements
  clearHighlightedElements();

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
 * Clear any highlighted elements from previous selections
 */
function clearHighlightedElements() {
  // Remove any existing highlights from previous selections
  const highlighted = document.querySelectorAll('.dsn-highlighted-element');
  highlighted.forEach(el => {
    el.classList.remove('dsn-highlighted-element');
    (el as HTMLElement).style.outline = '';
    (el as HTMLElement).style.outlineOffset = '';
  });
}

/**
 * Show a status message to the user
 */
function showStatusMessage(message: string) {
  // Create message element if it doesn't exist
  let messageEl = document.getElementById('dsn-status-message');
  if (!messageEl) {
    messageEl = document.createElement('div');
    messageEl.id = 'dsn-status-message';
    messageEl.classList.add('dsn-status-message');
    document.body.appendChild(messageEl);
  }
  
  messageEl.textContent = message;
  messageEl.style.display = 'block'; // We still need this for dynamic showing/hiding
}

/**
 * Hide the status message
 */
function hideStatusMessage() {
  const messageEl = document.getElementById('dsn-status-message');
  if (messageEl) {
    messageEl.style.display = 'none';
  }
}

/**
 * Analyze the selected element and show the selector panel
 */
function analyzeSelectedElement() {
  if (!selectedElement) {
    console.error('DSN: No element selected');
    return;
  }
  
  // Clear previous highlighted elements
  clearHighlightedElements();
  
  // Temporarily add highlight class to the newly selected element for visual feedback
  selectedElement.classList.add('dsn-highlighted-element');
  
  console.log('DSN: Analyzing element:', selectedElement);
  
  // Remove any existing panel before creating a new one
  const existingPanel = document.getElementById('dsn-panel-container');
  if (existingPanel) {
    existingPanel.remove();
  }
  
  // Remove the highlight class before analyzing to ensure it doesn't appear in the panel
  // Use setTimeout to provide a brief visual feedback of the selection
  setTimeout(() => {
    if (selectedElement) {
      selectedElement.classList.remove('dsn-highlighted-element');
      
      // Use the DomAnalyzer to get information about the element
      const elementData = DomAnalyzer.analyzeElement(selectedElement);
      const ancestorElements = DomAnalyzer.getAncestors(selectedElement);
      
      // Create and inject the UI
      injectSelectorPanel(elementData, ancestorElements);
    }
  }, 150); // Brief delay for visual feedback
}

/**
 * Interface for selector items with type information
 */
interface SelectorItem {
  selector: string;
  type: string;
  displaySelector?: string; // Optional display version for pseudo-elements
}

/**
 * Generate selector lists for an element
 */
function generateSelectorLists(element: AncestorElement | ElementData, index: string): string {
  // Generate consolidated core and pseudo-element selectors
  const coreSelectors: SelectorItem[] = [];
  
  // First add the tag name (if available)
  const tagName = 'tagName' in element ? element.tagName.toLowerCase() : '';
  if (tagName) {
    coreSelectors.push({
      selector: tagName,
      type: 'tag'
    });
  }
  
  // Then add ID (if available)
  if ('id' in element && element.id) {
    coreSelectors.push({
      selector: `#${element.id}`,
      type: 'id'
    });
  }
  
  // Then add pseudo-elements with tag name prepended
  const pseudoElements = [
    '::after',
    '::before',
    '::first-letter',
    '::first-line',
    '::selection',
    '::placeholder',
    '::marker',
    '::backdrop',
    '::cue'
  ];
  
  pseudoElements.forEach(pseudo => {
    // Only add pseudo-elements if we have a tag name
    if (tagName) {
      coreSelectors.push({
        // Store just the pseudo part to use in selector construction
        selector: pseudo,
        // Store the combined version for display purposes
        displaySelector: `${tagName}${pseudo}`,
        type: 'pseudo'
      });
    }
  });
  
  // Generate class selectors
  const classSelectors: string[] = [];
  if ('classNames' in element && element.classNames && element.classNames.length) {
    // Direct classNames array from ElementData
    element.classNames.forEach(cls => {
      if (cls && cls.trim()) { // Only add non-empty class names
        classSelectors.push(`.${cls.trim()}`);
      }
    });
  } else if ('className' in element && element.className) {
    // Process className string from AncestorElement
    const normalizedClassName = element.className
      .replace(/\s+/g, ' ') // Replace all whitespace sequences with a single space
      .trim(); // Remove leading/trailing spaces
    
    // Split and filter out empty class names
    normalizedClassName.split(' ')
      .filter(cls => cls.length > 0)
      .forEach(cls => {
        classSelectors.push(`.${cls}`);
      });
  }

  // Add pseudo-classes to the class selectors list (except :not)
  const pseudoClasses = [
    // State pseudo-classes
    ':active',
    ':focus',
    ':focus-visible',
    ':focus-within',
    ':hover',
    ':target',
    ':visited',
    // Form pseudo-classes
    ':checked',
    ':disabled',
    ':enabled',
    ':indeterminate',
    ':placeholder-shown',
    ':read-only',
    ':read-write',
    ':required',
    ':optional',
    ':valid',
    ':invalid',
    // Structural pseudo-classes
    ':empty',
    ':first-child',
    ':first-of-type',
    ':last-child',
    ':last-of-type',
    ':only-child',
    ':only-of-type',
    ':root',
    // Nth pseudo-classes
    ':nth-child(n)',
    ':nth-last-child(n)',
    ':nth-of-type(n)',
    ':nth-last-of-type(n)',
    // Other pseudo-classes
    ':fullscreen',
    ':defined'
  ];

  // Add all pseudo-classes to the class selectors (except :not)
  pseudoClasses.forEach(pseudoClass => {
    classSelectors.push(pseudoClass);
  });
  
  // Generate attribute selectors
  const attributeSelectors: string[] = [];
  if ('attributes' in element && element.attributes) {
    Object.entries(element.attributes).forEach(([attr, value]) => {
      // Skip empty style attributes
      if (attr === 'style' && (!value || value.trim() === '')) {
        return;
      }
      
      // Properly escape quotes in attribute values
      const escapedValue = value.replace(/"/g, '\\"');
      const attrSelector = `[${attr}="${escapedValue}"]`;
      // Encode the selector for safe storage in HTML data attribute
      attributeSelectors.push(attrSelector);
    });
  }
  
  // Define interface for combinator selectors
  interface CombinatorSelector {
    value: string;
    display: string;
    disabled?: boolean;
    tooltip?: string;
  }

  // Define each combinator selector using the interface
  const combinatorSelector1: CombinatorSelector = { value: ' ', display: 'Descendant' };
  const combinatorSelector2: CombinatorSelector = { value: '>', display: 'Child' };
  const combinatorSelector3: CombinatorSelector = { value: '+', display: 'Adjacent', disabled: true, tooltip: 'Adjacent combinator is not implemented yet' };
  const combinatorSelector4: CombinatorSelector = { value: '~', display: 'Sibling', disabled: true, tooltip: 'Sibling combinator is not implemented yet' };
  
  // Put them in an array
  const combinatorSelectors: CombinatorSelector[] = [
    combinatorSelector1,
    combinatorSelector2,
    combinatorSelector3,
    combinatorSelector4
  ];
  
  // Generate HTML for the lists - now showing ALL selectors instead of limiting to 6
  return `
    <div class="dsn-selector-grid">
      <!-- Core Selectors (includes tag, ID and pseudo-elements) -->
      <div>
        <h4 class="dsn-category-title">Core</h4>
        <ul class="dsn-selector-list" data-type="core">
          ${coreSelectors.map(item => `
            <li class="dsn-selector-item${item.type === 'pseudo' ? ' dsn-pseudo-item' : ''}" 
                data-selector="${encodeURIComponent(item.selector)}" 
                data-element-index="${index}"
                ${item.type === 'pseudo' ? 'data-selector-type="pseudo"' : ''}>
              ${item.displaySelector || item.selector}
            </li>
          `).join('')}
        </ul>
      </div>
      
      <!-- Class Selectors -->
      <div>
        <h4 class="dsn-category-title">Class</h4>
        <ul class="dsn-selector-list" data-type="class">
          ${classSelectors.map(selector => {
            // Check if this is a pseudo-class
            const isPseudoClass = selector.startsWith(':');
            const isNthPseudoClass = selector.includes('(n)');
            const needsEllipsis = !isPseudoClass && selector.startsWith('.');
            
            return `
              <li class="dsn-selector-item ${isPseudoClass ? 'dsn-pseudo-class-item' : ''}" 
                  data-selector="${encodeURIComponent(selector)}" 
                  data-element-index="${index}"
                  data-original-selector="${encodeURIComponent(selector)}"
                  ${isPseudoClass ? 'data-selector-type="pseudo-class"' : ''}
                  ${isNthPseudoClass ? 'data-selector-type="nth-pseudo-class" data-param="n"' : ''}>
                ${selector}
                ${needsEllipsis ? `<div class="dsn-ellipsis-icon" data-for-selector="${encodeURIComponent(selector)}"><span></span></div>` : ''}
                ${needsEllipsis ? `
                <div class="dsn-item-context-menu">
                  <label class="dsn-menu-item">
                    <input type="checkbox" class="dsn-menu-checkbox dsn-not-toggle">
                    :not() modifier
                  </label>
                </div>` : ''}
              </li>
            `;
          }).join('')}
        </ul>
      </div>
      
      <!-- Attribute Selectors -->
      <div>
        <h4 class="dsn-category-title">Attribute</h4>
        <ul class="dsn-selector-list" data-type="attribute">
          ${attributeSelectors.map(selector => {
            // Extract attribute name and value for the data attributes
            const attrMatch = selector.match(/\[([^\=\^\$\*\~\|]+)(?:([\=\^\$\*\~\|])?=?"?([^"]*)"?)?\]/);
            const attrName = attrMatch ? attrMatch[1] : '';
            const attrOperator = attrMatch && attrMatch[2] ? attrMatch[2] : '=';
            const attrValue = attrMatch && attrMatch[3] ? attrMatch[3].replace(/\\"/g, '"') : '';
            
            return `
              <li class="dsn-selector-item" 
                  data-selector="${encodeURIComponent(selector)}" 
                  data-element-index="${index}"
                  data-original-selector="${encodeURIComponent(selector)}"
                  data-attr-name="${encodeURIComponent(attrName)}"
                  data-attr-operator="${encodeURIComponent(attrOperator)}"
                  data-attr-value="${encodeURIComponent(attrValue)}"
                  data-original-attr-value="${encodeURIComponent(attrValue)}">
                ${selector}
                <div class="dsn-ellipsis-icon" data-for-selector="${encodeURIComponent(selector)}"><span></span></div>
                <div class="dsn-item-context-menu">
                  <div class="dsn-menu-heading">Attribute Options</div>
                  
                  <label class="dsn-menu-item dsn-full-width-menu-item">
                    <input type="checkbox" class="dsn-menu-checkbox dsn-not-toggle">
                    Apply :not() modifier
                  </label>
                  
                  <div class="dsn-menu-divider"></div>
                  
                  <div class="dsn-menu-group">
                    <label class="dsn-menu-label">Operator:</label>
                    <div class="dsn-select-container">
                      <select class="dsn-attribute-operator">
                        <option value="=" ${attrOperator === '=' ? 'selected' : ''}>= (Exact match)</option>
                        <option value="*=" ${attrOperator === '*' ? 'selected' : ''}>*= (Contains)</option>
                        <option value="^=" ${attrOperator === '^' ? 'selected' : ''}>^= (Starts with)</option>
                        <option value="$=" ${attrOperator === '$' ? 'selected' : ''}>$= (Ends with)</option>
                        <option value="~=" ${attrOperator === '~' ? 'selected' : ''}>~= (Word in list)</option>
                        <option value="|=" ${attrOperator === '|' ? 'selected' : ''}>|= (Starts with prefix)</option>
                        <option value="" ${!attrOperator ? 'selected' : ''}>(Attribute exists)</option>
                      </select>
                      <div class="dsn-select-arrow"></div>
                    </div>
                  </div>
                  
                  <div class="dsn-menu-group">
                    <label class="dsn-menu-label">Value:</label>
                    <div class="dsn-input-container">
                      <input type="text" class="dsn-attribute-value" value="${attrValue.replace(/"/g, '&quot;')}">
                      <button class="dsn-reset-button" title="Reset to original value">↺</button>
                    </div>
                  </div>
                </div>
              </li>
            `;
          }).join('')}
        </ul>
      </div>

      <!-- Combinator Selectors -->
      <div>
        <h4 class="dsn-category-title">Combinator</h4>
        <ul class="dsn-selector-list dsn-combinator-list" data-type="combinator">
          ${combinatorSelectors.map(combo => {
            // Use a different formatting to clearly separate the symbol from description
            const displayChar = combo.value === ' ' ? '&nbsp;' : combo.value;
            
            // Add disabled class and tooltip for unsupported combinators
            const disabledClass = combo.disabled ? 'dsn-combinator-disabled' : '';
            
            return `<li class="dsn-selector-item ${disabledClass}" 
                      data-selector="${combo.value}" 
                      data-element-index="${index}" 
                      data-selector-type="combinator"
                      ${combo.disabled ? 'data-disabled="true"' : ''}>
                     <span class="dsn-combinator-symbol">${displayChar}</span>
                     <span class="dsn-combinator-description">${combo.display}</span>
                     ${combo.disabled ? `<span class="dsn-tooltip">${combo.tooltip}</span>` : ''}
                   </li>`;
          }).join('')}
        </ul>
      </div>
    </div>
  `;
}

/**
 * Count the number of elements matching a CSS selector
 */
function countSelectorMatches(selector: string): number {
  try {
    return document.querySelectorAll(selector).length;
  } catch (err) {
    console.error('DSN: Invalid selector', err);
    return 0;
  }
}

/**
 * Update the combined selector display
 */
function updateCombinedSelector(container: HTMLElement) {
  const combinedSelectorElement = container.querySelector('#dsn-combined-selector');
  const matchCountElement = container.querySelector('#dsn-match-count');
  if (!combinedSelectorElement || !matchCountElement) return;
  
  // Get all indexes in order (ancestors first, then selected element)
  const indexes: string[] = [];
  const ancestorCount = container.querySelectorAll('.dsn-card-header[data-index]').length - 1; // Exclude selected
  
  // Add ancestor indexes in correct order (top to bottom)
  for (let i = 0; i < ancestorCount; i++) {
    indexes.push(i.toString());
  }
  
  // Add the selected element index
  indexes.push('selected');
  
  // Check if any pseudo-element is selected
  let hasPseudo = false;
  
  if (selectedSelectors.has('selected')) {
    selectedSelectors.get('selected')!.forEach(selector => {
      if (selector.startsWith('::')) {
        hasPseudo = true;
      }
    });
  }
  
  // Check if any ID selector is selected
  let hasIdSelector = false;
  let idSelectedIndex: string | null = null;
  
  // Check all selectors to find if any ID selector is selected
  selectedSelectors.forEach((selectors, index) => {
    selectors.forEach(selector => {
      if (selector.startsWith('#')) {
        hasIdSelector = true;
        idSelectedIndex = index;
      }
    });
  });
  
  // If pseudo-element is selected, only use the selected element (ignore ancestors)
  let activeIndexes: string[];
  
  if (hasPseudo) {
    // When pseudo-element is selected, only use the selected element's selectors
    activeIndexes = ['selected'];
  } else if (hasIdSelector && idSelectedIndex) {
    // When ID selector is selected, only use elements from that point onward
    const idIndex = parseInt(idSelectedIndex) || (idSelectedIndex === 'selected' ? indexes.length - 1 : -1);
    activeIndexes = indexes.filter(index => {
      const indexNum = index === 'selected' ? indexes.length - 1 : parseInt(index);
      return indexNum >= idIndex && 
        selectedSelectors.has(index) && 
        Array.from(selectedSelectors.get(index)!).some(sel => !sel.startsWith('combinator:'));
    });
  } else {
    // Normal case - filter indexes that have selectors
    activeIndexes = indexes.filter(index => 
      selectedSelectors.has(index) && 
      Array.from(selectedSelectors.get(index)!).some(sel => !sel.startsWith('combinator:'))
    );
  }
  
  // Define the parts array before using it
  const parts: string[] = [];
  
  // Process each active index and build the selector parts array
  activeIndexes.forEach((index, arrayIndex) => {
    // Get selectors and ensure proper order
    const selectors = Array.from(selectedSelectors.get(index)!);
    
    // Category positions to ensure proper order
    let tagName = '';
    let idSelector = '';
    const classSelectors: string[] = [];
    const attributeSelectors: string[] = [];
    const notSelectors: string[] = [];
    let pseudoElementSelector = '';
    let combinator = ' '; // Default is descendant (space)
    
    // Sort selectors into their respective categories
    selectors.forEach(selector => {
      if (selector.startsWith('combinator:')) {
        combinator = selector.replace('combinator:', '');
      } else if (selector.startsWith('#')) {
        idSelector = selector;
      } else if (selector.startsWith(':not(')) {
        // Extract the selector inside :not() and add to notSelectors
        const match = selector.match(/:not\((.*)\)/);
        if (match && match[1]) {
          notSelectors.push(match[1]);
        }
      } else if (selector.startsWith('.')) {
        classSelectors.push(selector);
      } else if (selector.startsWith('[')) {
        attributeSelectors.push(selector);
      } else if (selector.startsWith('::')) {
        pseudoElementSelector = selector;
      } else {
        // Must be a tag name
        tagName = selector;
      }
    });
    
    // Combine in the correct order: tag, id, classes, attributes, :not(), pseudo-element
    let combinedElementSelector = '';
    
    if (tagName) {
      combinedElementSelector += tagName;
    }
    
    if (idSelector) {
      combinedElementSelector += idSelector;
    }
    
    if (classSelectors.length > 0) {
      combinedElementSelector += classSelectors.join('');
    }
    
    if (attributeSelectors.length > 0) {
      combinedElementSelector += attributeSelectors.join('');
    }
    
    // Add combined :not() selector if there are any
    if (notSelectors.length > 0) {
      combinedElementSelector += `:not(${notSelectors.join(', ')})`;
    }
    
    if (pseudoElementSelector) {
      combinedElementSelector += pseudoElementSelector;
    }
    
    // Add combinator AFTER this element (instead of before) if this isn't the last element
    if (arrayIndex < activeIndexes.length - 1) {
      parts.push(`${combinedElementSelector}${combinator}`);
    } else {
      parts.push(combinedElementSelector);
    }
  });
  
  // Join the parts to create the final selector
  const combinedSelector = parts.join('');
  
  // Update the display
  if (combinedSelectorElement) {
    combinedSelectorElement.textContent = combinedSelector || 'No elements selected';
    
    // Add/remove a class to indicate if there's a valid selector
    if (combinedSelector && combinedSelector !== 'No elements selected') {
      combinedSelectorElement.classList.add('has-selector');
      
      // Add additional class if using pseudo-element
      if (hasPseudo) {
        combinedSelectorElement.classList.add('dsn-has-pseudo');
      } else {
        combinedSelectorElement.classList.remove('dsn-has-pseudo');
      }
    } else {
      combinedSelectorElement.classList.remove('has-selector');
      combinedSelectorElement.classList.remove('dsn-has-pseudo');
    }
  }
  
  // Count and display matches if we have a valid selector
  if (combinedSelector && combinedSelector !== 'No elements selected') {
    const matchCount = countSelectorMatches(combinedSelector);
    matchCountElement.textContent = `${matchCount} matching element${matchCount !== 1 ? 's' : ''}`;
    
    // Set color based on match count using classes
    matchCountElement.classList.remove('dsn-match-zero', 'dsn-match-one', 'dsn-match-many');
    if (matchCount === 0) {
      matchCountElement.classList.add('dsn-match-zero');
    } else if (matchCount === 1) {
      matchCountElement.classList.add('dsn-match-one');
    } else {
      matchCountElement.classList.add('dsn-match-many');
    }
  } else {
    matchCountElement.textContent = 'No matches';
    matchCountElement.classList.remove('dsn-match-zero', 'dsn-match-one', 'dsn-match-many');
  }
  
  // After updating the combined selector, also update the bold styling in hierarchy
  updateHierarchyBoldStyling(container);
  
  // After updating, make sure the messages are in correct order
  reorderStatusMessages(container);
}

/**
 * Reorder status messages to ensure consistent display
 */
function reorderStatusMessages(container: HTMLElement) {
  const resultSection = container.querySelector('.dsn-result-section');
  if (!resultSection) return;
  
  const idMessage = resultSection.querySelector('.dsn-id-message');
  const pseudoMessage = resultSection.querySelector('.dsn-pseudo-message');
  
  // If both messages exist, ensure ID message (preceding disabled) comes before pseudo message (descendants disabled)
  if (idMessage && pseudoMessage) {
    resultSection.insertBefore(idMessage, resultSection.firstChild);
    resultSection.insertBefore(pseudoMessage, idMessage.nextSibling);
  }
}

/**
 * Check if any pseudo-element is selected and update UI accordingly
 */
function updateDescendantsBasedOnPseudoElements(container: HTMLElement) {
  // Check if any pseudo-element is selected
  let hasPseudoElement = false;
  let pseudoElementIndex = null;
  
  // Find if any pseudo-element is selected and get its element index
  selectedSelectors.forEach((selectors, index) => {
    selectors.forEach(selector => {
      if (selector.startsWith('::')) {
        hasPseudoElement = true;
        pseudoElementIndex = index;
      }
    });
  });
  
  // Update the global flag
  isPseudoElementSelected = hasPseudoElement;
  
  if (hasPseudoElement && pseudoElementIndex) {
    // Add or update a message to show that descendants are disabled
    let pseudoMessage = container.querySelector('.dsn-pseudo-message');
    if (!pseudoMessage) {
      pseudoMessage = document.createElement('div');
      pseudoMessage.className = 'dsn-pseudo-message';
      pseudoMessage.textContent = 'Pseudo-element selected: descendants are disabled';
      const selectorContainer = container.querySelector('.dsn-result-section');
      if (selectorContainer) {
        selectorContainer.prepend(pseudoMessage);
        // Ensure correct message ordering after adding
        reorderStatusMessages(container);
      }
    }
    
    // Get all header elements (both ancestors and descendants)
    const allHeaders = Array.from(container.querySelectorAll('.dsn-card-header[data-index]'));
    
    // Convert index to numeric for comparison
    const pseudoElemIdx = pseudoElementIndex === 'selected' ? 
      allHeaders.length - 1 : parseInt(pseudoElementIndex);
    
    // Disable all elements AFTER the one with pseudo-element
    allHeaders.forEach((header) => {
      const headerIndex = header.getAttribute('data-index');
      const headerIdxNum = headerIndex === 'selected' ? 
        allHeaders.length - 1 : parseInt(headerIndex!);
      
      // Disable elements that come AFTER the one with pseudo-element
      if (headerIdxNum > pseudoElemIdx) {
        (header as HTMLElement).classList.add('dsn-disabled');
        (header as HTMLElement).classList.add('dsn-disabled-pseudo'); // Add specific class for pseudo-element
        (header as HTMLElement).classList.remove('dsn-disabled-id'); // Remove ID-specific class if present
        (header as HTMLElement).style.opacity = '0.5';
        (header as HTMLElement).style.pointerEvents = 'none';
        
        // Clear any selections for this element
        if (headerIndex && selectedSelectors.has(headerIndex)) {
          // Clear selections but keep the set to avoid errors
          selectedSelectors.set(headerIndex, new Set<string>());
          
          // Remove visual selected state from items
          const items = container.querySelectorAll(`.dsn-selector-item[data-element-index="${headerIndex}"]`);
          items.forEach(item => {
            (item as HTMLElement).classList.remove('selected');
            (item as HTMLElement).style.border = '';
            (item as HTMLElement).style.backgroundColor = '#f5f5f5';
          });
        }
      }
    });
  } else {
    // Remove the message if it exists
    const pseudoMessage = container.querySelector('.dsn-pseudo-message');
    if (pseudoMessage) {
      pseudoMessage.remove();
    }
    
    // Re-enable all elements if they're not disabled due to ID selector
    const allHeaders = container.querySelectorAll('.dsn-card-header.dsn-disabled-pseudo');
    allHeaders.forEach(header => {
      // Remove the pseudo-element disabled class
      (header as HTMLElement).classList.remove('dsn-disabled-pseudo');
      
      // Only completely re-enable if not disabled by ID selector
      if (!(header as HTMLElement).classList.contains('dsn-disabled-id')) {
        (header as HTMLElement).classList.remove('dsn-disabled');
        (header as HTMLElement).style.opacity = '';
        (header as HTMLElement).style.pointerEvents = '';
      }
    });
  }
}

/**
 * Check if any ID selector is selected and update UI accordingly
 */
function updateAncestorsBasedOnIdSelector(container: HTMLElement) {
  // Find if any ID selector is selected and get its element index
  let idSelectedIndex: string | null = null;
  let hasIdSelector = false;
  
  // Use the parameter name index, but rename it to avoid the "declared but never read" error
  selectedSelectors.forEach((selectors, index) => {
    selectors.forEach(selector => {
      if (selector.startsWith('#')) {
        hasIdSelector = true;
        idSelectedIndex = index;
      }
    });
  });
  
  // Update the global flag
  isIdSelectorSelected = hasIdSelector;
  
  // Get all ancestor header elements
  const allHeaders = Array.from(container.querySelectorAll('.dsn-card-header[data-index]'));
  
  if (hasIdSelector && idSelectedIndex) {
    // Add or update a message to show that preceding elements are disabled
    let idMessage = container.querySelector('.dsn-id-message');
    if (!idMessage) {
      idMessage = document.createElement('div');
      idMessage.className = 'dsn-id-message';
      idMessage.textContent = 'ID selector selected: preceding elements are disabled';
      const selectorContainer = container.querySelector('.dsn-result-section');
      if (selectorContainer) {
        selectorContainer.prepend(idMessage);
        // Ensure correct message ordering after adding
        reorderStatusMessages(container);
      }
    }
    
    // Disable all elements before the ID selector element
    const idIndex = idSelectedIndex === 'selected' ? allHeaders.length - 1 : parseInt(idSelectedIndex!);
    
    allHeaders.forEach((header) => {
      const headerIndex = header.getAttribute('data-index');
      const headerIdxNum = headerIndex === 'selected' ? allHeaders.length - 1 : parseInt(headerIndex!);
      
      // Disable elements before the one with ID
      if (headerIdxNum < idIndex) {
        (header as HTMLElement).classList.add('dsn-disabled');
        (header as HTMLElement).classList.add('dsn-disabled-id'); // Add specific class for ID selector
        (header as HTMLElement).classList.remove('dsn-disabled-pseudo'); // Remove pseudo-specific class if present
        (header as HTMLElement).style.opacity = '0.5';
        (header as HTMLElement).style.pointerEvents = 'none';
        
        // Clear any selections for this element
        if (headerIndex && selectedSelectors.has(headerIndex)) {
          // Clear selections but keep the set to avoid errors
          selectedSelectors.set(headerIndex, new Set<string>());
          
          // Remove visual selected state from items
          const items = container.querySelectorAll(`.dsn-selector-item[data-element-index="${headerIndex}"]`);
          items.forEach(item => {
            (item as HTMLElement).classList.remove('selected');
            (item as HTMLElement).style.border = '';
            (item as HTMLElement).style.backgroundColor = '#f5f5f5';
          });
        }
      }
    });
  } else {
    // Remove the message if it exists
    const idMessage = container.querySelector('.dsn-id-message');
    if (idMessage) {
      idMessage.remove();
    }
    
    // Only re-enable headers if they're not disabled due to pseudo-elements
    allHeaders.forEach(header => {
      // Remove the ID-specific disabled class
      (header as HTMLElement).classList.remove('dsn-disabled-id');
      
      // Only completely re-enable if not disabled by pseudo-element
      if (!(header as HTMLElement).classList.contains('dsn-disabled-pseudo')) {
        (header as HTMLElement).classList.remove('dsn-disabled');
        (header as HTMLElement).style.opacity = '';
        (header as HTMLElement).style.pointerEvents = '';
      }
    });
  }
}

/**
 * Make an element draggable by its header
 */
function makeDraggable(element: HTMLElement, dragHandle: HTMLElement) {
  let isDragging = false;
  let startX = 0, startY = 0;
  let startPosX = 0, startPosY = 0;
  
  console.log('DSN: Setting up draggable element', element.id);
  
  // Clean up any existing inline styles that might interfere
  element.style.position = 'fixed';
  element.style.margin = '0';
  
  // Make sure the cursor shows it can be dragged
  dragHandle.style.cursor = 'move';
  
  const startDrag = (e: MouseEvent) => {
    // Stop default behaviors
    e.preventDefault();
    e.stopPropagation();
    
    console.log('DSN: Starting drag operation');
    
    // Record starting positions
    startX = e.clientX;
    startY = e.clientY;
    
    const rect = element.getBoundingClientRect();
    startPosX = rect.left;
    startPosY = rect.top;
    
    console.log('DSN: Start position', { startX, startY, startPosX, startPosY });
    
    isDragging = true;
    
    // Add event listeners for during and after dragging
    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
    
    // Add a class for visual feedback
    element.classList.add('dsn-dragging');
  };
  
  const doDrag = (e: MouseEvent) => {
    if (!isDragging) return;
    
    // Calculate how far the mouse has moved
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    
    // Calculate new position
    let newLeft = startPosX + dx;
    let newTop = startPosY + dy;
    
    // Get viewport and element dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const elementWidth = element.offsetWidth;
    const elementHeight = element.offsetHeight;
    
    // Keep the panel within viewport bounds
    newLeft = Math.max(10, Math.min(newLeft, viewportWidth - Math.min(100, elementWidth * 0.25)));
    newTop = Math.max(10, Math.min(newTop, viewportHeight - Math.min(50, elementHeight * 0.25)));
    
    // Update element position
    element.style.left = `${newLeft}px`;
    element.style.top = `${newTop}px`;
    
    console.log('DSN: New position', { left: element.style.left, top: element.style.top });
    
    e.preventDefault();
    e.stopPropagation();
  };
  
  const stopDrag = () => {
    console.log('DSN: Stopping drag operation');
    isDragging = false;
    document.removeEventListener('mousemove', doDrag);
    document.removeEventListener('mouseup', stopDrag);
    element.classList.remove('dsn-dragging');
  };
  
  // Attach events to the handle
  dragHandle.addEventListener('mousedown', startDrag);
  
  // Clean up when removed
  element.addEventListener('remove', () => {
    dragHandle.removeEventListener('mousedown', startDrag);
    document.removeEventListener('mousemove', doDrag);
    document.removeEventListener('mouseup', stopDrag);
  });
  
  // Return handle to the cleanup function
  return () => {
    dragHandle.removeEventListener('mousedown', startDrag);
    document.removeEventListener('mousemove', doDrag);
    document.removeEventListener('mouseup', stopDrag);
  };
}

/**
 * Inject the selector panel into the page
 */
function injectSelectorPanel(elementData: ElementData, ancestorElements: AncestorElement[]): void {
  console.log('DSN: Element data:', elementData);
  console.log('DSN: Ancestors:', ancestorElements);
  
  // Reset selected selectors for this new panel
  selectedSelectors = new Map<string, Set<string>>();
  
  // Reset the pseudo-element flag
  isPseudoElementSelected = false;
  
  // Create container for the panel
  const panelContainer = document.createElement('div');
  panelContainer.id = 'dsn-panel-container';
  panelContainer.classList.add('dsn-panel-container');
  
  // Format element attributes for display
  const formatElementAttributes = (element: ElementData | AncestorElement): string => {
    let attributesStr = '';
    
    // Handle ID
    if ('id' in element && element.id) {
      attributesStr += ` id="${element.id}"`;
    }
    
    // Handle classes
    if ('classNames' in element && element.classNames && element.classNames.length) {
      attributesStr += ` class="${element.classNames.join(' ')}"`;
    } else if ('className' in element && element.className) {
      attributesStr += ` class="${element.className}"`;
    }
    
    // Handle other attributes
    if ('attributes' in element && element.attributes) {
      for (const [name, value] of Object.entries(element.attributes)) {
        // Sanitize the attribute value to avoid breaking the HTML
        const safeValue = value.replace(/"/g, '&quot;');
        attributesStr += ` ${name}="${safeValue}"`;
      }
    }
    
    return attributesStr;
  };
  
  // Basic panel content
  panelContainer.innerHTML = `
    <div id="dsn-panel-header" class="dsn-panel-header">
      <h2 class="dsn-panel-title">DOM Selector Ninja</h2>
      <button id="dsn-close-button" class="dsn-close-button">&times;</button>
    </div>
    
    <div class="dsn-panel-content">
      <div class="dsn-section">
        <h3 class="dsn-section-title">Element Hierarchy</h3>
        <div id="dsn-hierarchy-container" class="dsn-hierarchy-container">
          ${ancestorElements.slice().reverse().map((ancestor: AncestorElement, index: number) => `
            <div class="dsn-card">
              <div class="dsn-card-header ${index % 2 === 0 ? 'dsn-card-header-even' : ''}" data-index="${index}">
                <div>
                  &lt;${ancestor.tagName.toLowerCase()}${formatElementAttributes(ancestor)}&gt;
                </div>
                <div class="dsn-chevron">&#9660;</div>
              </div>
              <div class="dsn-card-content">
                ${generateSelectorLists(ancestor, index.toString())}
              </div>
            </div>
          `).join('')}
          <div class="dsn-card-header dsn-card-header-selected" data-index="selected">
            <div>
              &lt;${elementData.tagName.toLowerCase()}${formatElementAttributes(elementData)}&gt;
            </div>
            <div class="dsn-chevron" data-index="selected">&#9660;</div>
          </div>
          <div class="dsn-card-content dsn-card-content-selected" data-for="selected">
            ${generateSelectorLists(elementData, 'selected')}
          </div>
        </div>
      </div>
      
      <h3 class="dsn-section-title">Generated Selector</h3>
      <div class="dsn-result-section">
        <div class="dsn-code-container" tabindex="0">
          <code id="dsn-combined-selector" class="dsn-combined-selector" contenteditable="true" spellcheck="false">No elements selected</code>
          <button id="dsn-copy-selector-button" class="dsn-copy-button" title="Copy selector to clipboard">
            <div class="dsn-copy-icon">
              <div class="dsn-copy-front"></div>
              <div class="dsn-copy-back"></div>
            </div>
            <span class="dsn-copy-tooltip">Copied!</span>
          </button>
        </div>
        <div>
          <span id="dsn-match-count" class="dsn-match-count">No matches found on page</span>
        </div>
      </div>
    </div>
    
    <button id="dsn-panel-close-button" class="dsn-panel-close-button">Close</button>
  `;
  
  // Add to the page
  document.body.appendChild(panelContainer);
  
  // Extra safety check to ensure the highlight class is removed
  if (selectedElement) {
    selectedElement.classList.remove('dsn-highlighted-element');
  }
  
  // Calculate safe dimensions based on viewport
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const panelWidth = Math.min(750, viewportWidth * 0.9); // Increased from 600px to 750px
  const panelHeight = Math.min(550, viewportHeight * 0.8); // Increased from 500px to 550px
  
  // Set appropriate size
  panelContainer.style.width = `${panelWidth}px`;
  panelContainer.style.height = `${panelHeight}px`;
  
  // Set panel position to be centered and fully visible
  const left = Math.max(10, Math.floor((viewportWidth - panelWidth) / 2));
  const top = Math.max(10, Math.floor((viewportHeight - panelHeight) / 2));
  panelContainer.style.left = `${left}px`;
  panelContainer.style.top = `${top}px`;
  
  // Set min/max dimensions
  panelContainer.style.minWidth = '400px';
  panelContainer.style.minHeight = '300px';
  panelContainer.style.maxWidth = `${viewportWidth - 20}px`;
  panelContainer.style.maxHeight = `${viewportHeight - 20}px`;
  
  // Make sure the panel is resizable
  panelContainer.style.resize = 'both';
  panelContainer.style.overflow = 'hidden';
  
  // Add bounds checking for panel resize
  const resizeObserver = new ResizeObserver(entries => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect;
      console.log('DSN: Panel resized', { width, height });
      
      // Check if panel is still within viewport bounds after resize
      const rect = panelContainer.getBoundingClientRect();
      
      // Adjust if panel exceeds right edge
      if (rect.right > viewportWidth - 10) {
        panelContainer.style.width = `${viewportWidth - rect.left - 10}px`;
      }
      
      // Adjust if panel exceeds bottom edge
      if (rect.bottom > viewportHeight - 10) {
        panelContainer.style.height = `${viewportHeight - rect.top - 10}px`;
      }
    }
  });
  
  resizeObserver.observe(panelContainer);
  
  // Add event listener for manual resize detection
  panelContainer.addEventListener('mousedown', (e) => {
    // Check if the click is near the bottom right corner (resize handle area)
    const rect = panelContainer.getBoundingClientRect();
    const isNearCorner = 
      e.clientX > rect.right - 20 && 
      e.clientY > rect.bottom - 20;
    
    if (isNearCorner) {
      console.log('DSN: Resize handle clicked');
      
      const onMouseMove = () => {
        console.log('DSN: Resizing', { 
          width: panelContainer.offsetWidth,
          height: panelContainer.offsetHeight 
        });
      };
      
      const onMouseUp = () => {
        console.log('DSN: Resize complete');
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };
      
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    }
  });
  
  // Make the panel draggable by its header
  const panelHeader = document.getElementById('dsn-panel-header');
  if (panelHeader) {
    makeDraggable(panelContainer, panelHeader);
  }
  
  // Add event listeners
  document.getElementById('dsn-close-button')?.addEventListener('click', () => {
    // Call the same cleanup if selection is still active
    const closeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(closeEvent);
    panelContainer.remove();
  });
  
  document.getElementById('dsn-panel-close-button')?.addEventListener('click', () => {
    // Call the same cleanup if selection is still active
    const closeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(closeEvent);
    panelContainer.remove();
    
    // Enable selecting another element
    beginElementSelection();
  });
  
  document.getElementById('dsn-copy-selector-button')?.addEventListener('click', () => {
    const combinedSelector = document.getElementById('dsn-combined-selector')?.textContent;
    
    if (combinedSelector && combinedSelector !== 'No elements selected') {
      // Copy to clipboard
      navigator.clipboard.writeText(combinedSelector)
        .then(() => {
          const button = document.getElementById('dsn-copy-selector-button');
          if (button) {
            // Provide visual feedback
            button.classList.add('copied');
            
            // Show the tooltip
            const tooltip = button.querySelector('.dsn-copy-tooltip');
            if (tooltip) {
              tooltip.classList.add('show');
              
              // Hide after animation completes
              setTimeout(() => {
                tooltip.classList.remove('show');
                button.classList.remove('copied');
              }, 2000);
            }
          }
        })
        .catch(err => {
          console.error('DSN: Failed to copy selector', err);
          alert(`Failed to copy selector: ${err.message}`);
        });
    } else {
      alert('Please select at least one element from the hierarchy');
    }
  });
  
  // Since we're adding event listeners to DOM elements, we need to do this after adding to the document
  setTimeout(() => {
    // Add event listeners for selectable items
    const selectorItemElements = Array.from(document.querySelectorAll('.dsn-selector-item'))
      .map(item => item as HTMLElement);
    
    selectorItemElements.forEach(htmlItem => {
      htmlItem.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        // Decode the selector to restore special characters like quotes
        const selector = target.dataset.selector ? decodeURIComponent(target.dataset.selector) : '';
        const elementIndex = target.dataset.elementIndex;
        const isCombinator = target.dataset.selectorType === 'combinator';
        const isPseudo = target.dataset.selectorType === 'pseudo' || selector.startsWith('::');
        
        // Add explicit check for disabled items and return early if disabled
        if (target.dataset.disabled === "true") {
          // Do nothing for disabled items
          return;
        }
        
        if (!selector || !elementIndex) return;
        
        // Check if we're trying to select an ancestor after a pseudo-element has been selected
        if (isPseudoElementSelected && elementIndex !== 'selected' && !target.classList.contains('selected')) {
          // Block selection if a pseudo-element is already in use
          return;
        }
        
        // Block selection if we're trying to select an element before one with an ID selected
        if (isIdSelectorSelected && !target.classList.contains('selected')) {
          // Find if any ID selector is selected and get its element index
          let idSelectedIndex: string | null = null;
          let idSelectedElementIndex: number = -1;
          
          selectedSelectors.forEach((selectors, index) => {
            selectors.forEach(selector => {
              if (selector.startsWith('#')) {
                idSelectedIndex = index;
                idSelectedElementIndex = index === 'selected' ? 
                  panelContainer.querySelectorAll('.dsn-card-header[data-index]').length - 1 : 
                  parseInt(index);
              }
            });
          });
          
          // If ID is selected, block selecting elements before it
          if (idSelectedIndex) {
            const currentElementIdx = elementIndex === 'selected' ? 
              panelContainer.querySelectorAll('.dsn-card-header[data-index]').length - 1 : 
              parseInt(elementIndex);
              
            if (currentElementIdx < idSelectedElementIndex) {
              return; // Block selection of elements before the ID
            }
          }
        }
        
        // Get or create the set of selectors for this element
        if (!selectedSelectors.has(elementIndex)) {
          selectedSelectors.set(elementIndex, new Set<string>());
        }
        
        // Handle pseudo-elements specially
        if (isPseudo) {
          if (target.classList.contains('selected')) {
            // Remove the selected styles
            target.classList.remove('selected');
            target.style.border = '';
            target.style.backgroundColor = '#f5f5f5';
            
            // Remove selector from the set
            selectedSelectors.get(elementIndex)!.delete(selector);
          } else {
            // Deselect all other pseudo-elements first
            const allPseudos = Array.from(document.querySelectorAll('.dsn-selector-item[data-selector-type="pseudo"]'))
              .map(el => el as HTMLElement);
              
            allPseudos.forEach(pseudoEl => {
              const pseudoSelector = pseudoEl.dataset.selector ? decodeURIComponent(pseudoEl.dataset.selector) : '';
              const pseudoIndex = pseudoEl.dataset.elementIndex;
              
              if (pseudoSelector && pseudoIndex) {
                pseudoEl.classList.remove('selected');
                pseudoEl.style.border = '';
                pseudoEl.style.backgroundColor = '#f5f5f5';
                
                if (selectedSelectors.has(pseudoIndex)) {
                  selectedSelectors.get(pseudoIndex)!.delete(pseudoSelector);
                }
              }
            });
            
            // Add the selected styles
            target.classList.add('selected');
            target.style.border = '2px solid #3b82f6';
            target.style.backgroundColor = '#e6f7ff';
            
            // Add selector to the set
            selectedSelectors.get(elementIndex)!.add(selector);
            
            // If this is a newly selected pseudo-element, clear any ancestor selections
            if (elementIndex === 'selected' && selector.startsWith('::')) {
              // Clear all ancestor selections since they'll be disabled and not used
              selectedSelectors.forEach((_, index) => {
                if (index !== 'selected') {
                  selectedSelectors.set(index, new Set<string>());
                  
                  // Also clear the visual selection state
                  const ancestorItems = panelContainer.querySelectorAll(`.dsn-selector-item[data-element-index="${index}"]`);
                  ancestorItems.forEach((item: Element) => {
                    (item as HTMLElement).classList.remove('selected');
                    (item as HTMLElement).style.border = '';
                    (item as HTMLElement).style.backgroundColor = '#f5f5f5';
                  });
                }
              });
            }
          }
          
          // Check if we need to disable ancestors
          updateDescendantsBasedOnPseudoElements(panelContainer);
        } else if (isCombinator) {
          // Handle combinator selectors
          // If this item is already selected, do nothing (can't deselect a combinator)
          if (target.classList.contains('selected') || target.classList.contains('dsn-combinator-disabled')) {
            return;
          }
          
          // Remove selection from all other combinators in this list
          const list = target.closest('.dsn-combinator-list') as HTMLElement;
          if (list) {
            // Create an array of HTMLElements directly
            const listItems = Array.from(list.querySelectorAll('.dsn-selector-item'))
              .map(el => el as HTMLElement);
            
            listItems.forEach(itemElement => {
              // These are now definitely HTMLElements
              itemElement.classList.remove('selected');
              itemElement.style.border = '';
              itemElement.style.backgroundColor = '#f5f5f5';
              
              // Also remove the value from our selected set
              const itemSelector = itemElement.dataset.selector;
              if (itemSelector) {
                selectedSelectors.get(elementIndex)!.delete(`combinator:${itemSelector}`);
              }
            });
          }
          
          // Add this selector
          target.classList.add('selected');
          target.style.border = '2px solid #3b82f6';
          target.style.backgroundColor = '#e6f7ff';
          selectedSelectors.get(elementIndex)!.add(`combinator:${selector}`);
        } else {
          // Normal selector handling (toggle selection)
          const isSelected = target.classList.toggle('selected');
          
          if (isSelected) {
            // Add the selected styles
            target.style.border = '2px solid #3b82f6';
            target.style.backgroundColor = '#e6f7ff';
            
            // Add selector to the set
            selectedSelectors.get(elementIndex)!.add(selector);
            
            // If this is an ID selector, disable all elements before this one
            if (selector.startsWith('#')) {
              updateAncestorsBasedOnIdSelector(panelContainer);
            }
          } else {
            // Remove the selected styles
            target.style.border = '';
            target.style.backgroundColor = '#f5f5f5';
            
            // Remove selector from the set
            selectedSelectors.get(elementIndex)!.delete(selector);
            
            // Check if we need to re-enable elements after removing an ID selector
            if (selector.startsWith('#')) {
              updateAncestorsBasedOnIdSelector(panelContainer);
            }
          }
        }
        
        // Update the combined selector display
        updateCombinedSelector(panelContainer);
      });
    });
    
    // Keep track of the currently open menu
    let openMenuIcon: HTMLElement | null = null;
    
    // Add event listeners for ellipsis icons
    const ellipsisIcons = Array.from(document.querySelectorAll('.dsn-ellipsis-icon'))
      .map(icon => icon as HTMLElement);
    
    ellipsisIcons.forEach(icon => {
      icon.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent triggering the selector item click
        
        // Find the menu for this icon
        const menu = icon.nextElementSibling as HTMLElement;
        if (!menu || !menu.classList.contains('dsn-item-context-menu')) return;
        
        // If this menu is already open, close it
        if (menu.style.display === 'block') {
          menu.style.display = 'none';
          openMenuIcon = null;
          return;
        }
        
        // Close any other open menu first
        if (openMenuIcon && openMenuIcon !== icon) {
          const openMenu = openMenuIcon.nextElementSibling as HTMLElement;
          if (openMenu && openMenu.classList.contains('dsn-item-context-menu')) {
            openMenu.style.display = 'none';
          }
        }
        
        // Open this menu
        openMenuIcon = icon;
        
        // First display the menu but make it invisible to calculate its dimensions
        menu.style.visibility = 'hidden';
        menu.style.display = 'block';
        
        // Calculate positions
        const iconRect = icon.getBoundingClientRect();
        const menuRect = menu.getBoundingClientRect();
        const listContainer = icon.closest('.dsn-selector-list');
        
        // Reset positioning from any previous calculation
        menu.style.top = '';
        menu.style.left = '';
        menu.style.right = '';
        menu.style.bottom = '';
        
        // Position relative to the icon - initially next to the icon (to its right)
        const positionMenu = () => {
          // Start with default position (top right of ellipsis)
          let top = iconRect.top;
          let left = iconRect.right + 2; // 2px offset from icon
          
          // Check if menu would extend beyond the list container
          if (listContainer) {
            const listRect = listContainer.getBoundingClientRect();
            
            // Check if menu would go below the visible area of the list
            if (top + menuRect.height > listRect.bottom) {
              // Position above the bottom edge of the list container
              top = Math.max(listRect.top, listRect.bottom - menuRect.height);
            }
            
            // Check if menu would go off the right edge of the container
            if (left + menuRect.width > listRect.right) {
              // Position to the left of the icon instead
              left = Math.max(listRect.left, iconRect.left - menuRect.width - 2);
            }
          }
          
          // Position relative to the viewport
          menu.style.position = 'fixed';
          menu.style.top = `${top}px`;
          menu.style.left = `${left}px`;
        };
        
        // Position the menu
        positionMenu();
        
        // Make the menu visible after positioning
        menu.style.visibility = 'visible';
        
        // Set up event handlers for menu items
        const selectorItem = icon.closest('.dsn-selector-item') as HTMLElement;
        if (!selectorItem) return;
        
        // Add a click handler to the entire menu to prevent propagation
        menu.addEventListener('click', (e) => {
          e.stopPropagation();  // Prevent clicks within menu from affecting elements underneath
        });
        
        // Handle attribute operator dropdown if present
        const operatorDropdown = menu.querySelector('.dsn-attribute-operator') as HTMLSelectElement;
        if (operatorDropdown) {
          // Set up event listener after ensuring the previous one is removed to avoid duplicates
          const newOperatorDropdown = operatorDropdown.cloneNode(true) as HTMLSelectElement;
          operatorDropdown.parentNode?.replaceChild(newOperatorDropdown, operatorDropdown);
          
          newOperatorDropdown.addEventListener('change', (e) => {
            e.stopPropagation();  // Added to prevent propagation
            // Update attribute selector with the new operator
            updateAttributeSelectorWithOperator(selectorItem, newOperatorDropdown.value);
            // Update the combined selector display
            updateCombinedSelector(panelContainer);
          });
          
          // Stop propagation on focus/click events too
          newOperatorDropdown.addEventListener('mousedown', (e) => e.stopPropagation());
          newOperatorDropdown.addEventListener('focus', (e) => e.stopPropagation());
        }
        
        // Handle attribute value input if present
        const valueInput = menu.querySelector('.dsn-attribute-value') as HTMLInputElement;
        if (valueInput) {
          // Set up event listener after ensuring the previous one is removed to avoid duplicates
          const newValueInput = valueInput.cloneNode(true) as HTMLInputElement;
          valueInput.parentNode?.replaceChild(newValueInput, valueInput);
          
          // Listen for both input and blur events to update as typing occurs and when focus leaves
          newValueInput.addEventListener('input', (e) => {
            e.stopPropagation();  // Added to prevent propagation
            updateAttributeSelectorWithValue(selectorItem, newValueInput.value);
            updateCombinedSelector(panelContainer);
          });
          
          // Stop propagation on these events too
          newValueInput.addEventListener('mousedown', (e) => e.stopPropagation());
          newValueInput.addEventListener('click', (e) => e.stopPropagation());
          newValueInput.addEventListener('focus', (e) => e.stopPropagation());
          
          // Add listener to reset button
          const resetButton = menu.querySelector('.dsn-reset-button') as HTMLButtonElement;
          if (resetButton) {
            const newResetButton = resetButton.cloneNode(true) as HTMLButtonElement;
            resetButton.parentNode?.replaceChild(newResetButton, resetButton);
            
            newResetButton.addEventListener('click', (e) => {
              e.stopPropagation();
              const originalValue = selectorItem.dataset.originalAttrValue 
                ? decodeURIComponent(selectorItem.dataset.originalAttrValue)
                : '';
              
              // Update the input field
              newValueInput.value = originalValue;
              
              // Update the selector
              updateAttributeSelectorWithValue(selectorItem, originalValue);
              updateCombinedSelector(panelContainer);
            });
          }
        }
        
        // Handle :not toggle
        const notToggle = menu.querySelector('.dsn-not-toggle') as HTMLInputElement;
        if (notToggle) {
          // Set initial state based on current class and data attribute
          notToggle.checked = selectorItem.classList.contains('dsn-has-not-modifier') || 
                              selectorItem.dataset.notModifier === 'true';
          
          // Remove previous event listeners to avoid duplicates
          const newNotToggle = notToggle.cloneNode(true) as HTMLInputElement;
          notToggle.parentNode?.replaceChild(newNotToggle, notToggle);
          
          // Add event listeners to the label to stop propagation
          const label = newNotToggle.closest('label');
          if (label) {
            label.addEventListener('mousedown', (e) => e.stopPropagation());
            label.addEventListener('click', (e) => e.stopPropagation());
          }
          
          // Add new event listener
          newNotToggle.addEventListener('change', (e) => {
            e.stopPropagation();
            if (selectorItem) {
              toggleNotModifier(selectorItem, newNotToggle.checked);
              
              // Update the visual state of the selector item
              if (newNotToggle.checked) {
                selectorItem.classList.add('dsn-has-not-modifier');
              } else {
                selectorItem.classList.remove('dsn-has-not-modifier');
              }
              
              // Update the combined selector display
              updateCombinedSelector(panelContainer);
            }
          });
          
          // Add extra stop propagation for checkbox interactions
          newNotToggle.addEventListener('mousedown', (e) => e.stopPropagation());
          newNotToggle.addEventListener('click', (e) => e.stopPropagation());
        }
      });
    });
    
    // Close context menu when clicking elsewhere
    document.addEventListener('click', (e) => {
      if (openMenuIcon && !(e.target as HTMLElement).closest('.dsn-item-context-menu')) {
        const menu = openMenuIcon.nextElementSibling as HTMLElement;
        if (menu && menu.classList.contains('dsn-item-context-menu')) {
          menu.style.display = 'none';
          openMenuIcon = null;
        }
      }
    });
    
    // Add event listeners for expandable cards
    const cardHeaderElements = Array.from(panelContainer.querySelectorAll('.dsn-card-header, .dsn-chevron'))
      .map(header => header as HTMLElement);
      
    cardHeaderElements.forEach(header => {
      header.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const index = target.dataset.index || (target.parentElement as HTMLElement | null)?.dataset.index;
        if (!index) return;
        
        // Set the selected element for visual highlight
        toggleCardVisibility(panelContainer, index);
        
        // If this click was on the element itself (not just the chevron)
        if (!target.classList.contains('dsn-chevron')) {
          // Update visuals for the selected card
          updateSelectedCardVisuals(panelContainer, 
            target.classList.contains('dsn-card-header') 
              ? target 
              : (target.closest('.dsn-card-header') as HTMLElement));
        }
      });
    });
    
    // Always mark the target element as selected by default when opening the panel
    const selectedHeader = panelContainer.querySelector('.dsn-card-header[data-index="selected"]') as HTMLElement;
    if (selectedHeader) {
      updateSelectedCardVisuals(panelContainer, selectedHeader);
    }
    
    // Initialize the bold styling for any pre-selected elements
    updateHierarchyBoldStyling(panelContainer);
  }, 0);
  
  // Add context menu functionality
  setTimeout(() => {
    // ...existing code for event listeners...

    // Add context menu functionality
    setupContextMenus(panelContainer);
    
    // ...existing code...
  }, 0);
}

/**
 * Toggle the visibility of a card's content and update selected state
 */
function toggleCardVisibility(container: HTMLElement, index: string) {
  // Find the content corresponding to this index
  const isSelected = index === 'selected';
  let content: HTMLElement | null;
  let header: HTMLElement | null;

  if (isSelected) {
    content = container.querySelector(`.dsn-card-content[data-for="selected"]`) as HTMLElement;
    header = container.querySelector(`.dsn-card-header[data-index="selected"]`) as HTMLElement;
  } else {
    header = container.querySelector(`.dsn-card-header[data-index="${index}"]`) as HTMLElement;
    content = header?.nextElementSibling as HTMLElement;
  }

  if (!content || !header) return;
  
  // Mark this card as the currently selected one in the hierarchy
  updateSelectedCardVisuals(container, header);

  // Check if the clicked card is already open
  const isCurrentlyOpen = content.style.display === 'block';

  // Find the corresponding chevron
  const chevron = isSelected
    ? (container.querySelector(`.dsn-chevron[data-index="selected"]`) as HTMLElement)
    : (container.querySelector(`.dsn-card-header[data-index="${index}"] .dsn-chevron`) as HTMLElement);

  if (isCurrentlyOpen) {
    // If already open, just close this card
    content.style.display = 'none';
    if (chevron) {
      chevron.innerHTML = '&#9660;'; // Down chevron (closed state)
    }
    return;
  }

  // Otherwise, close all cards first
  const allContents = container.querySelectorAll('.dsn-card-content');
  allContents.forEach((element) => {
    (element as HTMLElement).style.display = 'none';
  });

  const allChevrons = container.querySelectorAll('.dsn-chevron');
  allChevrons.forEach((element) => {
    (element as HTMLElement).innerHTML = '&#9660;'; // Down chevron (closed state)
  });

  // Open the selected card
  content.style.display = 'block';
  content.classList.add('dsn-card-content-selected');

  // Update chevron
  if (chevron) {
    chevron.innerHTML = '&#9650;'; // Up chevron (open state)
  }
  
  // Update the bold styling for the hierarchy after any changes
  updateHierarchyBoldStyling(container);
}

/**
 * Update visuals for selected card header
 */
function updateSelectedCardVisuals(container: HTMLElement, selectedHeader: HTMLElement) {
  // First, remove the selected style from all headers
  const allHeaders = container.querySelectorAll('.dsn-card-header');
  allHeaders.forEach((header) => {
    header.classList.remove('dsn-currently-selected');
  });
  
  // Add the selected style to the currently selected header
  selectedHeader.classList.add('dsn-currently-selected');
  
  // When a card is selected in the panel, ensure the element on page is not highlighted
  if (selectedElement) {
    selectedElement.classList.remove('dsn-highlighted-element');
  }
}

/**
 * Set up context menus for selector items
 */
function setupContextMenus(container: HTMLElement) {
  // Get all class selector items 
  const classItems = Array.from(container.querySelectorAll('.dsn-selector-list[data-type="class"] .dsn-selector-item'));
  const nthPseudoClassItems = Array.from(container.querySelectorAll('.dsn-selector-item[data-selector-type="nth-pseudo-class"]'));
  
  // Set up context menu for class items 
  classItems.forEach(item => {
    item.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      
      // Only show context menu for real class selectors (starting with dot), not pseudo-classes
      const selector = (item as HTMLElement).dataset.selector 
        ? decodeURIComponent((item as HTMLElement).dataset.selector || '') 
        : '';
      
      if (selector.startsWith('.')) {
        showContextMenu(e as MouseEvent, item as HTMLElement, 'class');
      }
    });
  });
  
  // Setup context menu for nth-pseudo-class items
  nthPseudoClassItems.forEach(item => {
    item.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      showContextMenu(e as MouseEvent, item as HTMLElement, 'nth-pseudo-class');
    });
  });
  
  // Close context menu when clicking elsewhere
  document.addEventListener('click', () => {
    const contextMenus = Array.from(container.querySelectorAll('.dsn-context-menu'));
    contextMenus.forEach(menu => {
      (menu as HTMLElement).style.display = 'none';
    });
  });
}

/**
 * Show context menu at the position of the event
 */
function showContextMenu(event: MouseEvent, targetItem: HTMLElement, menuType: 'class' | 'nth-pseudo-class') {
  // Find the element index from the target item
  const elementIndex = targetItem.dataset.elementIndex;
  if (!elementIndex) return;
  
  // Find the context menu for this element
  const contextMenu = document.getElementById(`dsn-context-menu-${elementIndex}`);
  if (!contextMenu) return;
  
  // Position the context menu
  contextMenu.style.left = `${event.pageX}px`;
  contextMenu.style.top = `${event.pageY}px`;
  contextMenu.style.display = 'block';
  
  // Configure menu items based on type
  const toggleNotItem = contextMenu.querySelector('[data-action="toggle-not"]');
  const editNthItem = contextMenu.querySelector('[data-action="edit-nth"]');
  
  if (toggleNotItem) {
    if (menuType === 'class') {
      (toggleNotItem as HTMLElement).textContent = 
        targetItem.dataset.notModifier === 'true' ? 'Remove :not() modifier' : 'Apply :not() modifier';
      (toggleNotItem as HTMLElement).style.display = 'block';
      
      // Clear any existing event listener
      toggleNotItem.replaceWith(toggleNotItem.cloneNode(true));
      const newToggleNotItem = contextMenu.querySelector('[data-action="toggle-not"]');
      
      if (newToggleNotItem) {
        newToggleNotItem.addEventListener('click', () => {
          toggleNotModifier(targetItem);
          contextMenu.style.display = 'none';
        });
      }
    } else {
      (toggleNotItem as HTMLElement).style.display = 'none';
    }
  }
  
  if (editNthItem) {
    if (menuType === 'nth-pseudo-class') {
      (editNthItem as HTMLElement).style.display = 'block';
      
      // Clear any existing event listener
      editNthItem.replaceWith(editNthItem.cloneNode(true));
      const newEditNthItem = contextMenu.querySelector('[data-action="edit-nth"]');
      
      if (newEditNthItem) {
        newEditNthItem.addEventListener('click', () => {
          configureNthValue(targetItem);
          contextMenu.style.display = 'none';
        });
      }
    } else {
      (editNthItem as HTMLElement).style.display = 'none';
    }
  }
}

/**
 * Toggle :not() modifier for a class selector
 */
function toggleNotModifier(targetItem: HTMLElement, applyNot?: boolean): void {
  // Get the selector and original selector
  const selector = targetItem.dataset.selector 
    ? decodeURIComponent(targetItem.dataset.selector) 
    : '';
  
  const originalSelector = targetItem.dataset.originalSelector
    ? decodeURIComponent(targetItem.dataset.originalSelector)
    : selector;
    
  // Determine if we need to apply or remove :not
  const isNotModifier = targetItem.dataset.notModifier === 'true';
  const shouldApplyNot = applyNot !== undefined ? applyNot : !isNotModifier;
  
  if (shouldApplyNot) {
    // Apply :not() modifier
    const notSelector = `:not(${originalSelector})`;
    targetItem.dataset.selector = encodeURIComponent(notSelector);
    targetItem.dataset.notModifier = 'true';
    
    // Update the text content to show the not syntax
    // Find the text node (first child) and update it
    let updated = false;
    for (let i = 0; i < targetItem.childNodes.length; i++) {
      const node = targetItem.childNodes[i];
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent = notSelector;
        updated = true;
        break;
      }
    }
    
    // If no text node was found, prepend one
    if (!updated) {
      const textNode = document.createTextNode(notSelector);
      targetItem.insertBefore(textNode, targetItem.firstChild);
    }
    
    // Add the not-modifier class for styling
    targetItem.classList.add('dsn-has-not-modifier');
  } else {
    // Remove :not() modifier
    targetItem.dataset.selector = encodeURIComponent(originalSelector);
    targetItem.dataset.notModifier = 'false';
    
    // Update the text content to remove the not syntax
    let updated = false;
    for (let i = 0; i < targetItem.childNodes.length; i++) {
      const node = targetItem.childNodes[i];
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent = originalSelector;
        updated = true;
        break;
      }
    }
    
    // If no text node was found, prepend one
    if (!updated) {
      const textNode = document.createTextNode(originalSelector);
      targetItem.insertBefore(textNode, targetItem.firstChild);
    }
    
    // Remove the not-modifier class
    targetItem.classList.remove('dsn-has-not-modifier');
  }
  
  // Update selection state if item is selected
  if (targetItem.classList.contains('selected')) {
    // Find the index
    const elementIndex = targetItem.dataset.elementIndex;
    if (elementIndex && selectedSelectors.has(elementIndex)) {
      // Remove the old selector
      selectedSelectors.get(elementIndex)!.delete(selector);
      // Add the new one
      const newSelector = targetItem.dataset.selector 
        ? decodeURIComponent(targetItem.dataset.selector)
        : '';
      selectedSelectors.get(elementIndex)!.add(newSelector);
    }
  }
}

/**
 * Configure the value for an nth pseudo-class
 */
function configureNthValue(targetItem: HTMLElement) {
  const selector = targetItem.dataset.selector 
    ? decodeURIComponent(targetItem.dataset.selector)
    : '';
  
  const currentParam = targetItem.dataset.param || 'n';
  
  // Create a modal dialog for inputting the nth value
  const modal = document.createElement('div');
  modal.className = 'dsn-modal';
  modal.innerHTML = `
    <div class="dsn-modal-content">
      <h3 class="dsn-modal-title">Configure nth value</h3>
      <p>Enter a value (e.g. "2n+1", "odd", "even", "3", etc.)</p>
      <input type="text" class="dsn-nth-input" value="${currentParam}" />
      <div class="dsn-modal-buttons">
        <button class="dsn-modal-button dsn-modal-cancel">Cancel</button>
        <button class="dsn-modal-button dsn-modal-apply">Apply</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Focus the input
  const input = modal.querySelector('.dsn-nth-input') as HTMLInputElement;
  if (input) {
    setTimeout(() => input.focus(), 0);
  }
  
  // Set up the event handlers
  const applyButton = modal.querySelector('.dsn-modal-apply');
  const cancelButton = modal.querySelector('.dsn-modal-cancel');
  
  if (applyButton) {
    applyButton.addEventListener('click', () => {
      if (input) {
        const newValue = input.value.trim() || 'n';
        // Update the item
        updateNthValue(targetItem, newValue);
      }
      modal.remove();
    });
  }
  
  if (cancelButton) {
    cancelButton.addEventListener('click', () => {
      modal.remove();
    });
  }
  
  // Handle Enter key
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      if (input) {
        const newValue = input.value.trim() || 'n';
        // Update the item
        updateNthValue(targetItem, newValue);
      }
      modal.remove();
    }
  });
}

/**
 * Update nth pseudo-class with new value
 */
function updateNthValue(targetItem: HTMLElement, newValue: string) {
  const selector = targetItem.dataset.selector 
    ? decodeURIComponent(targetItem.dataset.selector)
    : '';
  
  // Extract the base selector without the parameter
  const baseSelectorMatch = selector.match(/(.*)\(.*\)/);
  if (!baseSelectorMatch) return;
  
  const baseSelector = baseSelectorMatch[1];
  const newSelector = `${baseSelector}(${newValue})`;
  
  // Update the displayed text and data attributes
  targetItem.textContent = newSelector;
  targetItem.dataset.selector = encodeURIComponent(newSelector);
  targetItem.dataset.param = newValue;
  
  // Update selection state if item is selected
  if (targetItem.classList.contains('selected')) {
    // Find the index
    const elementIndex = targetItem.dataset.elementIndex;
    if (elementIndex && selectedSelectors.has(elementIndex)) {
      // Remove the old selector
      selectedSelectors.get(elementIndex)!.delete(selector);
      // Add the new one
      selectedSelectors.get(elementIndex)!.add(newSelector);
      
      // Update the combined selector display
      const container = targetItem.closest('.dsn-panel-container');
      if (container) {
        updateCombinedSelector(container as HTMLElement);
      }
    }
  }
}

/**
 * Update an attribute selector with a new operator
 */
function updateAttributeSelectorWithOperator(selectorItem: HTMLElement, newOperator: string): void {
  // Get data attributes
  const attrName = selectorItem.dataset.attrName 
    ? decodeURIComponent(selectorItem.dataset.attrName) 
    : '';
  const attrValue = selectorItem.dataset.attrValue 
    ? decodeURIComponent(selectorItem.dataset.attrValue) 
    : '';
  const originalSelector = selectorItem.dataset.originalSelector
    ? decodeURIComponent(selectorItem.dataset.originalSelector)
    : '';
  
  // Build the new selector based on the operator
  let newSelector: string;
  
  if (newOperator === '') {
    // Attribute exists selector
    newSelector = `[${attrName}]`;
  } else {
    // Attribute with operator and value
    const escapedValue = attrValue.replace(/"/g, '\\"');
    newSelector = `[${attrName}${newOperator}"${escapedValue}"]`;
  }
  
  // Update the dataset attributes
  selectorItem.dataset.attrOperator = encodeURIComponent(newOperator);
  selectorItem.dataset.selector = encodeURIComponent(newSelector);
  selectorItem.dataset.originalSelector = encodeURIComponent(newSelector);
  
  // Update the displayed text
  const currentText = selectorItem.childNodes[0];
  if (currentText && currentText.nodeType === Node.TEXT_NODE) {
    currentText.textContent = newSelector;
  } else {
    // If no text node exists for some reason, add one
    const textNode = document.createTextNode(newSelector);
    selectorItem.insertBefore(textNode, selectorItem.firstChild);
  }
  
  // Update selection state if item is selected
  if (selectorItem.classList.contains('selected')) {
    const elementIndex = selectorItem.dataset.elementIndex;
    if (elementIndex && selectedSelectors.has(elementIndex)) {
      // Remove all attribute selectors for this item (to avoid duplicates)
      Array.from(selectedSelectors.get(elementIndex)!).forEach(selector => {
        if (selector.startsWith(`[${attrName}`) && selector.endsWith(']')) {
          selectedSelectors.get(elementIndex)!.delete(selector);
        }
      });
      
      // Add the new one
      selectedSelectors.get(elementIndex)!.add(newSelector);
    }
  }
}

/**
 * Update an attribute selector with a new value
 */
function updateAttributeSelectorWithValue(selectorItem: HTMLElement, newValue: string): void {
  // Get data attributes
  const attrName = selectorItem.dataset.attrName 
    ? decodeURIComponent(selectorItem.dataset.attrName) 
    : '';
  const attrOperator = selectorItem.dataset.attrOperator 
    ? decodeURIComponent(selectorItem.dataset.attrOperator) 
    : '=';
  const originalSelector = selectorItem.dataset.selector
    ? decodeURIComponent(selectorItem.dataset.selector)
    : '';
  
  // Build the new selector based on the operator and new value
  let newSelector: string;
  
  if (attrOperator === '') {
    // Attribute exists selector (no value needed)
    newSelector = `[${attrName}]`;
  } else {
    // Attribute with operator and value
    const escapedValue = newValue.replace(/"/g, '\\"');
    newSelector = `[${attrName}${attrOperator}"${escapedValue}"]`;
  }
  
  // Update the dataset attributes
  selectorItem.dataset.attrValue = encodeURIComponent(newValue);
  selectorItem.dataset.selector = encodeURIComponent(newSelector);
  
  // Update the displayed text
  const currentText = selectorItem.childNodes[0];
  if (currentText && currentText.nodeType === Node.TEXT_NODE) {
    currentText.textContent = newSelector;
  } else {
    // If no text node exists for some reason, add one
    const textNode = document.createTextNode(newSelector);
    selectorItem.insertBefore(textNode, selectorItem.firstChild);
  }
  
  // Update selection state if item is selected
  if (selectorItem.classList.contains('selected')) {
    const elementIndex = selectorItem.dataset.elementIndex;
    if (elementIndex && selectedSelectors.has(elementIndex)) {
      // Remove all attribute selectors for this item (to avoid duplicates)
      Array.from(selectedSelectors.get(elementIndex)!).forEach(selector => {
        if (selector.startsWith(`[${attrName}`) && selector.endsWith(']')) {
          selectedSelectors.get(elementIndex)!.delete(selector);
        }
      });
      
      // Add the new one
      selectedSelectors.get(elementIndex)!.add(newSelector);
    }
  }
}

/**
 * Update bold styling for elements in the hierarchy that have selectors selected
 */
function updateHierarchyBoldStyling(container: HTMLElement) {
  // Get all card headers in the hierarchy
  const cardHeaders = container.querySelectorAll('.dsn-card-header[data-index]');
  
  cardHeaders.forEach((header) => {
    const index = header.getAttribute('data-index');
    if (!index) return;
    
    // Check if this element has any selectors selected
    const hasSelectedSelectors = selectedSelectors.has(index) && 
      selectedSelectors.get(index)!.size > 0 &&
      // Make sure at least one of the selectors is not a combinator
      Array.from(selectedSelectors.get(index)!).some(sel => !sel.startsWith('combinator:'));
    
    // Find the element tag text (first div child)
    const elementText = header.querySelector('div:first-child');
    if (!elementText) return;
    
    // Apply or remove bold styling based on whether selectors are selected
    if (hasSelectedSelectors) {
      elementText.classList.add('dsn-element-selected');
    } else {
      elementText.classList.remove('dsn-element-selected');
    }
  });
}