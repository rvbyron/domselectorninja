/**
 * CSS selector generation functionality
 */
import { SelectorItem, CombinatorSelector, ElementData, AncestorElement } from '../types';

// Store selected selectors for each element in the hierarchy, mapping element index to list of selected selectors
export const selectedSelectors = new Map<string, Set<string>>();

// Flags for state tracking
export let isPseudoElementSelected = false;
export let isIdSelectorSelected = false;

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

  // Add pseudo-classes to the class selectors list
  const pseudoClasses = [
    // State pseudo-classes
    ':active', ':focus', ':focus-visible', ':focus-within', ':hover', ':target', ':visited',
    // Form pseudo-classes
    ':checked', ':disabled', ':enabled', ':indeterminate', ':placeholder-shown', ':read-only', 
    ':read-write', ':required', ':optional', ':valid', ':invalid',
    // Structural pseudo-classes
    ':empty', ':first-child', ':first-of-type', ':last-child', ':last-of-type', 
    ':only-child', ':only-of-type', ':root',
    // Nth pseudo-classes
    ':nth-child(n)', ':nth-last-child(n)', ':nth-of-type(n)', ':nth-last-of-type(n)',
    // Other pseudo-classes
    ':fullscreen', ':defined'
  ];

  // Add all pseudo-classes to the class selectors
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
      attributeSelectors.push(attrSelector);
    });
  }
  
  // Define combinator selectors
  const combinatorSelectors: CombinatorSelector[] = [
    { value: ' ', display: 'Descendant' },
    { value: '>', display: 'Child' },
    { value: '+', display: 'Adjacent', disabled: true, tooltip: 'Adjacent combinator is not implemented yet' },
    { value: '~', display: 'Sibling', disabled: true, tooltip: 'Sibling combinator is not implemented yet' }
  ];
  
  // Build the HTML for the selector lists
  return buildSelectorListsHTML(coreSelectors, classSelectors, attributeSelectors, combinatorSelectors, index);
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
