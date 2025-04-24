/**
 * Selector Display
 * Handles selector visualization and UI interactions
 */

import { calculateSpecificity, formatSpecificity, countMatchingElements, isValidSelector, parseSelector } from './selector-parser';

/**
 * Update the selector display in the panel
 * @param {string} selector - The CSS selector to display
 */
export function updateSelectorDisplay(selector = '') {
  const combinedSelector = document.getElementById('dsn-combined-selector');
  if (!combinedSelector) return;
  
  if (!selector || selector === '') {
    combinedSelector.textContent = 'No elements selected';
    updateSpecificityDisplay([0, 0, 0]);
    updateMatchCount(0);
    return;
  }
  
  // Update the selector display
  combinedSelector.textContent = selector;
  
  // Update the specificity and match count displays
  updateSpecificityDisplay(calculateSpecificity(selector));
  updateMatchCountDisplay(selector);
  
  // Dispatch event for selector update
  document.dispatchEvent(new CustomEvent('dsn-selector-updated', {
    detail: { selector }
  }));
}

/**
 * Update the specificity display
 * @param {number[]} specificity - Specificity array [a, b, c]
 */
export function updateSpecificityDisplay(specificity) {
  const specificityElement = document.getElementById('dsn-specificity-value');
  if (!specificityElement) return;
  
  const specificityText = formatSpecificity(specificity);
  specificityElement.textContent = specificityText;
  
  // Set data attribute for styling
  specificityElement.setAttribute('data-specificity', JSON.stringify(specificity));
  
  // Apply appropriate color based on specificity value
  applySpecificityColor(specificityElement, specificity);
}

/**
 * Apply color to specificity element based on value
 * @param {HTMLElement} element - The element to style
 * @param {number[]} specificity - Specificity array [a, b, c]
 */
function applySpecificityColor(element, specificity) {
  // Remove all existing color classes
  element.classList.remove('dsn-specificity-low', 'dsn-specificity-medium', 'dsn-specificity-high');
  
  // Calculate total score (weighted)
  const score = specificity[0] * 100 + specificity[1] * 10 + specificity[2];
  
  // Apply appropriate class based on score
  if (score === 0) {
    element.classList.add('dsn-specificity-low');
  } else if (score < 100) { // No IDs and moderate class usage
    element.classList.add('dsn-specificity-medium');
  } else {
    element.classList.add('dsn-specificity-high');
  }
}

/**
 * Update the match count display
 * @param {string} selector - The CSS selector to count matches for
 */
export function updateMatchCountDisplay(selector) {
  const matchCount = document.getElementById('dsn-match-count');
  if (!matchCount) return;
  
  // Get the number of matching elements
  const count = countMatchingElements(selector);
  
  // Update the display
  matchCount.textContent = count.toString();
  
  // Set a data attribute for styling
  if (count === 0) {
    matchCount.setAttribute('data-count', '0');
  } else if (count === 1) {
    matchCount.setAttribute('data-count', '1');
  } else {
    matchCount.setAttribute('data-count', 'multiple');
  }
  
  // Apply color based on count
  applyMatchCountColor(matchCount, count);
}

/**
 * Apply color to match count element based on count value
 * @param {HTMLElement} element - The element to style
 * @param {number} count - Number of matching elements
 */
function applyMatchCountColor(element, count) {
  // Remove all existing color classes
  element.classList.remove('dsn-count-zero', 'dsn-count-unique', 'dsn-count-multiple');
  
  // Apply appropriate class based on count
  if (count === 0) {
    element.classList.add('dsn-count-zero');
  } else if (count === 1) {
    element.classList.add('dsn-count-unique');
  } else {
    element.classList.add('dsn-count-multiple');
  }
}

/**
 * Highlight elements that match the selector
 * @param {string} selector - The CSS selector to highlight
 * @param {string} highlightClass - CSS class to use for highlighting
 */
export function highlightMatchingElements(selector, highlightClass = 'dsn-highlighted-element') {
  // Remove existing highlights
  clearHighlights(highlightClass);
  
  if (!selector || !isValidSelector(selector)) return;
  
  try {
    // Find and highlight matching elements
    const matchingElements = document.querySelectorAll(selector);
    matchingElements.forEach(element => {
      // Skip highlighting the panel itself or its children
      if (element.closest('#dsn-panel-container')) return;
      
      // Add highlight class
      element.classList.add(highlightClass);
      
      // Add outline style
      if (element instanceof HTMLElement) {
        element.style.outline = '2px solid rgba(59, 130, 246, 0.7)';
        element.style.outlineOffset = '2px';
      }
    });
  } catch (e) {
    console.error('Error highlighting elements:', e);
  }
}

/**
 * Clear highlighted elements
 * @param {string} highlightClass - CSS class used for highlighting
 */
export function clearHighlights(highlightClass = 'dsn-highlighted-element') {
  const highlightedElements = document.querySelectorAll(`.${highlightClass}`);
  highlightedElements.forEach(element => {
    element.classList.remove(highlightClass);
    
    if (element instanceof HTMLElement) {
      element.style.outline = '';
      element.style.outlineOffset = '';
    }
  });
}

/**
 * Syntax highlight a selector string
 * @param {string} selector - The CSS selector to highlight
 * @returns {string} HTML with syntax highlighting
 */
export function syntaxHighlightSelector(selector) {
  if (!selector || selector === 'No elements selected') {
    return '<span class="dsn-dim">No elements selected</span>';
  }
  
  const parsed = parseSelector(selector);
  if (!parsed.valid) {
    return `<span class="dsn-invalid">${selector}</span>`;
  }
  
  // Create highlighted HTML
  let html = '';
  let position = 0;
  
  parsed.components.forEach((component, index) => {
    // Add element tag
    if (component.element) {
      html += `<span class="dsn-tag">${component.element}</span>`;
    }
    
    // Add ID
    if (component.id) {
      html += `<span class="dsn-id">#${component.id}</span>`;
    }
    
    // Add classes
    component.classes.forEach(cls => {
      html += `<span class="dsn-class">.${cls}</span>`;
    });
    
    // Add attributes
    component.attributes.forEach(attr => {
      let attrHtml = `<span class="dsn-attribute">[${attr.name}`;
      if (attr.operator) {
        attrHtml += `${attr.operator}"<span class="dsn-value">${attr.value}</span>"`;
      }
      attrHtml += ']</span>';
      html += attrHtml;
    });
    
    // Add pseudo-classes
    component.pseudoClasses.forEach(pseudo => {
      let pseudoHtml = `<span class="dsn-pseudo-class">:${pseudo.name}`;
      if (pseudo.parameter) {
        pseudoHtml += `(<span class="dsn-parameter">${pseudo.parameter}</span>)`;
      }
      pseudoHtml += '</span>';
      html += pseudoHtml;
    });
    
    // Add pseudo-element
    if (component.pseudoElement) {
      html += `<span class="dsn-pseudo-element">::${component.pseudoElement}</span>`;
    }
    
    // Add combinator if not the last component
    if (component.combinator && index < parsed.components.length - 1) {
      html += `<span class="dsn-combinator">${component.combinator === ' ' ? ' ' : ` ${component.combinator} `}</span>`;
    }
  });
  
  return html;
}

/**
 * Copy the selector to clipboard
 * @param {string} selector - The CSS selector to copy
 * @returns {Promise<boolean>} Success status
 */
export async function copySelectorToClipboard(selector) {
  if (!selector || selector === 'No elements selected') {
    return false;
  }
  
  try {
    await navigator.clipboard.writeText(selector);
    return true;
  } catch (err) {
    console.error('Failed to copy selector:', err);
    return false;
  }
}
