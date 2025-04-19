/**
 * CSS selector generation functionality
 */
import { SelectorItem, CombinatorSelector, ElementData, AncestorElement } from '../types';
import { PSEUDO_ELEMENTS, PSEUDO_CLASSES, COMBINATOR_SELECTORS, SELECTOR_TYPE_ORDER } from '../constants/selector-constants';

// Store selected selectors for each element in the hierarchy, mapping element index to list of selected selectors
export const selectedSelectors = new Map<string, Set<string>>();

// Expose selected selectors to window for cross-file access
(window as any).dsnSelectedSelectors = selectedSelectors;

// Flags for state tracking
export let isPseudoElementSelected = false;
export let isIdSelectorSelected = false;

// Keep track of which pseudo-element is selected (null if none)
export let selectedPseudoElement: string | null = null;

// Listen for reset events
document.addEventListener('dsn-reset-selectors', () => {
  // Clear all selectors
  selectedSelectors.clear();
  
  // Reset state flags
  isPseudoElementSelected = false;
  isIdSelectorSelected = false;
  selectedPseudoElement = null;
  
  // Update the combined selector display
  updateCombinedSelector();
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
  
  // Add the selector with its type prefix for easy identification
  selectorSet.add(`${selectorType}:${selector}`);
  
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
  
  // Trigger an event so other components can react to selector changes
  const event = new CustomEvent('dsn-selector-changed', {
    detail: { elementIndex, selector, selectorType, selected: false }
  });
  document.dispatchEvent(event);
  
  // Update the combined selector
  updateCombinedSelector();
}

/**
 * Update the combined selector display
 */
export function updateCombinedSelector(): void {
  const combinedSelectorElement = document.getElementById('dsn-combined-selector');
  if (!combinedSelectorElement) return;
  
  console.log('DSN-DEBUG: Updating combined selector with map:', Array.from(selectedSelectors.entries()));
  
  // Get all selected selectors and sort by element index
  const allSelectors: {index: string, selectors: string[]}[] = [];
  
  selectedSelectors.forEach((selectorSet, elementIndex) => {
    if (selectorSet.size > 0) {
      // Group selectors by their type to ensure proper ordering
      const tagSelectors: string[] = [];
      const idSelectors: string[] = [];
      const classSelectors: string[] = [];
      const attrSelectors: string[] = [];
      const pseudoClassSelectors: string[] = [];
      const pseudoElementSelectors: string[] = [];
      
      // Sort selectors into appropriate groups
      selectorSet.forEach(sel => {
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
      
      console.log('DSN-DEBUG: Selector groups for element', elementIndex, {
        tagSelectors,
        idSelectors,
        classSelectors,
        attrSelectors,
        pseudoClassSelectors,
        pseudoElementSelectors
      });
      
      // Build element selector with correct precedence
      const elementSelector = [
        ...tagSelectors,           // 1. Tag names first (div, span)
        ...idSelectors,            // 2. Then IDs (#id)
        ...classSelectors,         // 3. Then classes (.class)
        ...attrSelectors,          // 4. Then attributes ([attr=val])
        ...pseudoClassSelectors,   // 5. Then pseudo-classes (:hover)
        ...pseudoElementSelectors  // 6. Pseudo-elements last (::before)
      ];
      
      allSelectors.push({
        index: elementIndex,
        selectors: elementSelector
      });
    }
  });
  
  // Sort elements by index
  allSelectors.sort((a, b) => {
    // Handle 'selected' element specially - should come last
    if (a.index === 'selected') return 1;
    if (b.index === 'selected') return -1;
    
    // Otherwise sort numerically
    return parseInt(a.index) - parseInt(b.index);
  });
  
  // Build the combined selector
  let combinedSelector = '';
  
  allSelectors.forEach((element, i) => {
    // Add combinator between elements if necessary
    if (i > 0) {
      combinedSelector += ' > '; // Default to child combinator for now
    }
    
    // Join the element's selectors
    combinedSelector += element.selectors.join('');
  });
  
  // Set the combined selector text
  if (combinedSelector) {
    combinedSelectorElement.textContent = combinedSelector;
    
    // Update match count
    updateMatchCount(combinedSelector);
  } else {
    combinedSelectorElement.textContent = 'No elements selected';
    
    const matchCountElement = document.getElementById('dsn-match-count');
    if (matchCountElement) {
      matchCountElement.textContent = 'No matches found on page';
    }
  }
}

/**
 * Update the match count for a selector
 */
function updateMatchCount(selector: string): void {
  const matchCountElement = document.getElementById('dsn-match-count');
  if (!matchCountElement) return;
  
  try {
    // Try to query the document with the selector
    const matches = document.querySelectorAll(selector);
    const count = matches.length;
    
    // Update the match count text
    if (count === 0) {
      matchCountElement.textContent = 'No matches found on page';
    } else if (count === 1) {
      matchCountElement.textContent = '1 match found on page';
    } else {
      matchCountElement.textContent = `${count} matches found on page`;
    }
    
    // Add classes to highlight matching elements
    matches.forEach(el => {
      el.classList.add('dsn-selector-match');
    });
  } catch (error) {
    // Invalid selector
    matchCountElement.textContent = 'Invalid selector';
  }
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
