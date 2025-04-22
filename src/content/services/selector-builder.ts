/**
 * CSS selector generation functionality
 */
import { SelectorItem, CombinatorSelector, ElementData, AncestorElement } from '../types';
import { PSEUDO_ELEMENTS, PSEUDO_CLASSES, COMBINATOR_SELECTORS, SELECTOR_TYPE_ORDER } from '../constants/selector-constants';

// Store selected selectors for each element in the hierarchy, mapping element index to list of selected selectors
export const selectedSelectors = new Map<string, Set<string>>();

// Map to store selected combinators between elements
export const selectedCombinators = new Map<string, string>();

// Default combinator (Descendant - space)
const DEFAULT_COMBINATOR = ' ';

// Expose selected selectors and combinators to window for cross-file access
(window as any).dsnSelectedSelectors = selectedSelectors;
(window as any).dsnSelectedCombinators = selectedCombinators;

// Flags for state tracking
export let isPseudoElementSelected = false;
export let isIdSelectorSelected = false;

// Keep track of which pseudo-element is selected (null if none)
export let selectedPseudoElement: string | null = null;

// Listen for reset events
document.addEventListener('dsn-reset-selectors', () => {
  resetSelectors();
});

/**
 * Select a selector for an element
 */
export function selectSelector(elementIndex: string, selector: string, selectorType: string): void {
  console.log(`DSN-DEBUG: Selecting selector: ${selector}, type: ${selectorType}, for element: ${elementIndex}`);
  
  // Create selector set if it doesn't exist for this element
  if (!selectedSelectors.has(elementIndex)) {
    selectedSelectors.set(elementIndex, new Set());
  }
  
  const selectorSet = selectedSelectors.get(elementIndex);
  if (!selectorSet) return;

  // Handle mutual exclusivity between tag and ID selectors
  if (selectorType === 'id') {
    isIdSelectorSelected = true;
    
    // If an ID is selected, clear any previously selected tag selectors
    const tagsToRemove: string[] = [];
    selectorSet.forEach(sel => {
      if (sel.startsWith('tag:')) {
        tagsToRemove.push(sel);
      }
    });
    
    tagsToRemove.forEach(tag => selectorSet.delete(tag));
  } else if (selectorType === 'tag') {
    // If a tag is selected, clear any previously selected ID selectors
    const idsToRemove: string[] = [];
    selectorSet.forEach(sel => {
      if (sel.startsWith('id:')) {
        idsToRemove.push(sel);
        isIdSelectorSelected = false;
      }
    });
    
    idsToRemove.forEach(id => selectorSet.delete(id));
  }
  
  // Handle pseudo-element exclusivity
  if (selectorType === 'pseudo') {
    // If we're selecting a new pseudo-element
    if (selector !== selectedPseudoElement) {
      // If there was a previously selected pseudo-element, remove it
      if (selectedPseudoElement) {
        selectorSet.delete(`pseudo:${selectedPseudoElement}`);
      }
      
      // Set the new selected pseudo-element
      selectedPseudoElement = selector;
      isPseudoElementSelected = true;
    }
  }
  
  // If this is a combinator, handle it differently
  if (selectorType === 'combinator') {
    // Get the current index number (or use 0 for 'selected')
    const currentIndex = elementIndex === 'selected' ? 0 : parseInt(elementIndex);
    
    // Store combinator for the next element
    // We store it with the index of the element *before* the combinator
    selectedCombinators.set(currentIndex.toString(), selector);
    
    // Refresh the UI to reflect the new combinator
    document.dispatchEvent(new CustomEvent('dsn-combinator-changed', {
      detail: {
        elementIndex: currentIndex.toString(),
        combinator: selector
      }
    }));
  } else {
    // Add the selector with its type prefix for easy identification
    selectorSet.add(`${selectorType}:${selector}`);
  }
  
  // Update the combined selector
  updateCombinedSelector();
  
  // Trigger an event so other components can react to selector changes
  const event = new CustomEvent('dsn-selector-changed', {
    detail: { elementIndex, selector, selectorType, selected: true }
  });
  document.dispatchEvent(event);
}

/**
 * Deselect a selector for an element
 */
export function deselectSelector(elementIndex: string, selector: string, selectorType: string): void {
  const selectorSet = selectedSelectors.get(elementIndex);
  if (!selectorSet) return;
  
  // Remove the selector
  selectorSet.delete(`${selectorType}:${selector}`);
  
  // Update flags
  if (selectorType === 'id') {
    isIdSelectorSelected = false;
  }
  
  if (selectorType === 'pseudo' && selector === selectedPseudoElement) {
    selectedPseudoElement = null;
    isPseudoElementSelected = false;
  }
  
  // If this is a combinator, remove it
  if (selectorType === 'combinator') {
    // Get the current index number (or use 0 for 'selected')
    const currentIndex = elementIndex === 'selected' ? 0 : parseInt(elementIndex);
    
    // Remove the combinator
    selectedCombinators.delete(currentIndex.toString());
    
    // Refresh the UI to reflect the combinator change
    document.dispatchEvent(new CustomEvent('dsn-combinator-changed', {
      detail: {
        elementIndex: currentIndex.toString(),
        combinator: null
      }
    }));
  }
  
  // Update the combined selector
  updateCombinedSelector();
  
  // Trigger an event so other components can react to selector changes
  const event = new CustomEvent('dsn-selector-changed', {
    detail: { elementIndex, selector, selectorType, selected: false }
  });
  document.dispatchEvent(event);
}

/**
 * Reset all selected selectors
 */
export function resetSelectors(): void {
  selectedSelectors.clear();
  selectedCombinators.clear();
  
  // Reset state flags
  isPseudoElementSelected = false;
  isIdSelectorSelected = false;
  selectedPseudoElement = null;
  
  // Update the combined selector display
  updateCombinedSelector();
}

/**
 * Get the combinator to use between two elements
 */
function getCombinator(previousIndex: number): string {
  // Check if a specific combinator is selected for this pair
  const selectedCombinator = selectedCombinators.get(previousIndex.toString());
  if (selectedCombinator) {
    return selectedCombinator;
  }
  
  // Default to descendant combinator
  return DEFAULT_COMBINATOR;
}

/**
 * Calculate the specificity of a CSS selector
 * Returns an array [a, b, c] where:
 * - a: Number of ID selectors
 * - b: Number of class selectors, attribute selectors, and pseudo-classes
 * - c: Number of element (tag) selectors and pseudo-elements
 */
export function calculateSpecificity(selector: string): [number, number, number] {
  if (!selector || selector === 'No elements selected') {
    return [0, 0, 0];
  }
  
  // Initialize specificity values
  let a = 0; // ID selectors
  let b = 0; // Class selectors, attribute selectors, and pseudo-classes
  let c = 0; // Element selectors and pseudo-elements
  
  try {
    // Count ID selectors (#id)
    a = (selector.match(/#[a-zA-Z0-9_-]+/g) || []).length;
    
    // Count class selectors (.class)
    const classes = (selector.match(/\.[a-zA-Z0-9_-]+/g) || []).length;
    
    // Count attribute selectors ([attr=value])
    const attributes = (selector.match(/\[[^\]]+\]/g) || []).length;
    
    // Count pseudo-classes (:hover, :first-child, etc.)
    // Note: This won't count :not() contents, which is a simplification
    const pseudoClasses = (selector.match(/:[a-zA-Z-]+(?:\([^)]*\))?/g) || [])
      .filter(p => !p.startsWith('::')).length;
    
    b = classes + attributes + pseudoClasses;
    
    // Count element selectors (tag) and pseudo-elements (::before)
    const elements = selector.split(/[.#\[\]:>+~\s]/)
      .filter(s => s && /^[a-zA-Z0-9_-]+$/.test(s)).length;
    
    const pseudoElements = (selector.match(/::[a-zA-Z-]+/g) || []).length;
    
    c = elements + pseudoElements;
  } catch (e) {
    console.error('Error calculating specificity:', e);
  }
  
  return [a, b, c];
}

/**
 * Format specificity for display
 */
export function formatSpecificity(specificity: [number, number, number]): string {
  return `${specificity[0]},${specificity[1]},${specificity[2]}`;
}

/**
 * Update the match count display
 */
export function updateMatchCount(count: number): void {
  const matchCount = document.getElementById('dsn-match-count');
  if (!matchCount) return;
  
  // Set the count text
  matchCount.textContent = count.toString();
  
  // Set a data attribute for styling
  if (count === 0) {
    matchCount.setAttribute('data-count', '0');
  } else if (count === 1) {
    matchCount.setAttribute('data-count', '1');
  } else {
    matchCount.setAttribute('data-count', 'unique');
  }
}

/**
 * Update the combined selector based on current selections
 */
export function updateCombinedSelector(): void {
  const combinedSelectorElement = document.getElementById('dsn-combined-selector');
  if (!combinedSelectorElement) return;
  
  let selectorString = '';
  let previousIndex: number | null = null;
  
  // Sort keys numerically to maintain correct order
  const keys = Array.from(selectedSelectors.keys())
    .sort((a, b) => {
      // Sort numerically, with 'selected' at the end
      if (a === 'selected') return 1;
      if (b === 'selected') return -1;
      return parseInt(a) - parseInt(b);
    });
  
  // Build selector with combinators between elements
  for (const key of keys) {
    // Skip keys with no selectors
    if (!selectedSelectors.has(key) || selectedSelectors.get(key)!.size === 0) {
      continue;
    }
    
    // For each element that has selectors
    const currentIndex = key === 'selected' ? Infinity : parseInt(key);
    const selectorForElement = buildElementSelector(selectedSelectors.get(key)!);
    
    if (selectorForElement) {
      // If this isn't the first element, add a combinator
      if (selectorString && previousIndex !== null) {
        // Get the appropriate combinator (selected or default)
        const combinator = getCombinator(previousIndex);
        selectorString += combinator;
      }
      
      // Add this element's selector
      selectorString += selectorForElement;
      previousIndex = currentIndex;
    }
  }
  
  if (selectorString) {
    combinedSelectorElement.textContent = selectorString;
    
    // Update match count
    try {
      if (selectorString && selectorString !== 'No elements selected') {
        const matchCount = document.querySelectorAll(selectorString).length;
        updateMatchCount(matchCount);
      } else {
        updateMatchCount(0);
      }
    } catch (e) {
      // If there's an error in the selector, show 0 matches
      updateMatchCount(0);
    }
  } else {
    combinedSelectorElement.textContent = 'No elements selected';
    
    const matchCountElement = document.getElementById('dsn-match-count');
    if (matchCountElement) {
      matchCountElement.textContent = 'No matches found on page';
    }
  }
  
  // After setting the selectorString, update the specificity display
  const specificityElement = document.getElementById('dsn-specificity-value');
  if (specificityElement) {
    const specificity = calculateSpecificity(selectorString);
    specificityElement.textContent = formatSpecificity(specificity);
    
    // Set a data attribute for potential styling based on specificity
    specificityElement.setAttribute('data-specificity', JSON.stringify(specificity));
  }
}

// Function to build selector for a single element
function buildElementSelector(selectors: Set<string>): string {
  const tagSelectors: string[] = [];
  const idSelectors: string[] = [];
  const classSelectors: string[] = [];
  const attrSelectors: string[] = [];
  const pseudoClassSelectors: string[] = [];
  const pseudoElementSelectors: string[] = [];
  
  selectors.forEach(sel => {
    const [type, ...parts] = sel.split(':');
    const selector = parts.join(':');
    
    switch(type) {
      case 'tag':
        tagSelectors.push(selector);
        break;
      case 'id':
        idSelectors.push(selector);
        break;
      case 'class':
        classSelectors.push(selector);
        break;
      case 'attribute':
        attrSelectors.push(selector);
        break;
      case 'pseudo-class':
        pseudoClassSelectors.push(selector);
        break;
      case 'pseudo':
        pseudoElementSelectors.push(selector);
        break;
    }
  });
  
  return [
    ...tagSelectors,           // 1. Tag names first (div, span)
    ...idSelectors,            // 2. Then IDs (#id)
    ...classSelectors,         // 3. Then classes (.class)
    ...attrSelectors,          // 4. Then attributes ([attr=val])
    ...pseudoClassSelectors,   // 5. Then pseudo-classes (:hover)
    ...pseudoElementSelectors  // 6. Pseudo-elements last (::before)
  ].join('');
}

/**
 * Generate selector lists for an element
 */
export function generateSelectorLists(element: AncestorElement | ElementData, index: string): string {
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
  
  // Add pseudo-elements without tag name prepended
  PSEUDO_ELEMENTS.forEach(pseudo => {
    coreSelectors.push({
      selector: pseudo,
      type: 'pseudo'
    });
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

  // Add pseudo-classes to the class selectors list
  classSelectors.push(...PSEUDO_CLASSES);
  
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
      attributeSelectors.push(attrSelector);
    });
  }
  
  // Build the HTML for the selector lists
  return buildSelectorListsHTML(coreSelectors, classSelectors, attributeSelectors, COMBINATOR_SELECTORS, index);
}

/**
 * Build HTML for selector lists
 */
function buildSelectorListsHTML(
  coreSelectors: SelectorItem[], 
  classSelectors: string[],
  attributeSelectors: string[],
  combinatorSelectors: CombinatorSelector[],
  index: string
): string {
  return `
    <div class="dsn-selector-grid">
      <!-- Core Selectors -->
      <div>
        <h4 class="dsn-category-title">Core</h4>
        <ul class="dsn-selector-list" data-type="core">
          ${coreSelectors.map(item => `
            <li class="dsn-selector-item${item.type === 'pseudo' ? ' dsn-pseudo-item' : ''}" 
                data-selector="${encodeURIComponent(item.selector)}" 
                data-element-index="${index}"
                data-selector-type="${item.type}">
              ${item.selector}
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
          ${buildAttributeSelectorsHTML(attributeSelectors, index)}
        </ul>
      </div>

      <!-- Combinator Selectors -->
      <div>
        <h4 class="dsn-category-title">Combinator</h4>
        <ul class="dsn-selector-list dsn-combinator-list" data-type="combinator">
          ${combinatorSelectors.map(combo => {
            const displayChar = combo.value === ' ' ? '&nbsp;' : combo.value;
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
 * Build HTML for attribute selectors
 */
function buildAttributeSelectorsHTML(attributeSelectors: string[], index: string): string {
  return attributeSelectors.map(selector => {
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
          <!-- Attribute options menu content -->
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
  }).join('');
}
