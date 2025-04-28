/**
 * Handles building CSS selectors from user selections
 */

// Maintain a global map to store selected selectors for each element
(window as any).dsnSelectedSelectors = (window as any).dsnSelectedSelectors || new Map<string, Set<string>>();

/**
 * Add a selector for an element
 */
export function selectSelector(elementIndex: string, selector: string, selectorType: string): void {
  const selectedSelectors = (window as any).dsnSelectedSelectors;
  
  // Create a set for this element if it doesn't exist
  if (!selectedSelectors.has(elementIndex)) {
    selectedSelectors.set(elementIndex, new Set<string>());
  }
  
  // Add the selector to the set
  const selectorSet = selectedSelectors.get(elementIndex);
  selectorSet.add(`${selectorType}:${selector}`);
  
  // Update the displayed combined selector
  updateCombinedSelector();
}

/**
 * Remove a selector for an element
 */
export function deselectSelector(elementIndex: string, selector: string, selectorType: string): void {
  const selectedSelectors = (window as any).dsnSelectedSelectors;
  
  // Check if this element has any selectors
  if (!selectedSelectors.has(elementIndex)) {
    return;
  }
  
  // Remove the selector from the set
  const selectorSet = selectedSelectors.get(elementIndex);
  selectorSet.delete(`${selectorType}:${selector}`);
  
  // Remove the element from the map if it has no selectors
  if (selectorSet.size === 0) {
    selectedSelectors.delete(elementIndex);
  }
  
  // Update the displayed combined selector
  updateCombinedSelector();
}

/**
 * Update the combined selector displayed to the user
 */
export function updateCombinedSelector(): void {
  // Get the combined selector element
  const combinedSelector = document.getElementById('dsn-combined-selector');
  if (!combinedSelector) return;

  // Get the selected selectors map
  const selectedSelectorsMap: Map<string, Set<string>> = (window as any).dsnSelectedSelectors;
  if (!selectedSelectorsMap || selectedSelectorsMap.size === 0) {
    // No selectors selected, show default message
    combinedSelector.textContent = 'No elements selected';
    updateSpecificityAndMatchCount('');
    return;
  }

  // Collect all selector parts
  const selectorParts: string[] = [];
  const notSelectorContents: string[] = []; // Store just the content inside :not()

  // Process selectors in descending order of element index (furthest from root to closest)
  const indices = Array.from(selectedSelectorsMap.keys())
    .filter(index => index !== 'selected') // Handle 'selected' separately
    .map(index => parseInt(index))
    .sort((a, b) => b - a); // Sort in descending order

  // Add selectors for each ancestor element
  for (const index of indices) {
    const elementSelectors = selectedSelectorsMap.get(index.toString());
    if (!elementSelectors || elementSelectors.size === 0) continue;

    // Organize selectors into groups by type to ensure proper precedence
    let tagSelectors: string[] = [];
    let idSelectors: string[] = [];
    let classSelectors: string[] = [];
    let attrSelectors: string[] = [];
    let pseudoClassSelectors: string[] = [];
    let pseudoElementSelectors: string[] = [];
    let combinatorValue = ' '; // Default to descendant combinator
    
    // Process regular selectors first
    elementSelectors.forEach(selector => {
      // Split the selector entry into type and value
      const [type, ...valueParts] = selector.split(':');
      const value = valueParts.join(':'); // Rejoin in case the value contains colons
      
      // Handle combinator separately
      if (type === 'combinator') {
        combinatorValue = value;
        return;
      }
      
      // Check if this is a :not selector
      if (type === 'not') {
        // Extract the inner content from the :not() selector
        const notContent = value.match(/^\:not\(([^\)]+)\)$/);
        if (notContent && notContent[1]) {
          notSelectorContents.push(notContent[1]);
        } else {
          // Fallback for direct extraction if regex fails
          const innerContent = value.substring(5, value.length - 1);
          if (innerContent) {
            notSelectorContents.push(innerContent);
          }
        }
      } else {
        // Sort other selectors into their respective groups
        switch (type) {
          case 'tag':
            tagSelectors.push(value);
            break;
          case 'id':
            idSelectors.push(value);
            break;
          case 'class':
            classSelectors.push(value);
            break;
          case 'attribute':
            attrSelectors.push(value);
            break;
          case 'pseudo-class':
            pseudoClassSelectors.push(value);
            break;
          case 'pseudo':
            pseudoElementSelectors.push(value);
            break;
          default:
            // Any unknown types
            classSelectors.push(value);
        }
      }
    });
    
    // Combine selectors in proper order: tag > id > class > attr > pseudo-class > pseudo-element
    const elementSelectorParts: string[] = [
      ...tagSelectors,
      ...idSelectors,
      ...classSelectors,
      ...attrSelectors,
      ...pseudoClassSelectors,
      ...pseudoElementSelectors
    ];
    
    // If we have selectors for this element, add them with the appropriate combinator
    if (elementSelectorParts.length > 0) {
      // Add the combinator if we already have selectors
      if (selectorParts.length > 0) {
        // Don't add combinator if it's the first element
        selectorParts.push(combinatorValue);
      }
      
      // Add all the element's selectors joined with logical AND
      selectorParts.push(elementSelectorParts.join(''));
    }
  }
  
  // Add selectors for the selected element itself
  const selectedSelectors = selectedSelectorsMap.get('selected');
  if (selectedSelectors && selectedSelectors.size > 0) {
    // Organize selectors into groups by type to ensure proper precedence
    let tagSelectors: string[] = [];
    let idSelectors: string[] = [];
    let classSelectors: string[] = [];
    let attrSelectors: string[] = [];
    let pseudoClassSelectors: string[] = [];
    let pseudoElementSelectors: string[] = [];
    
    selectedSelectors.forEach(selector => {
      // Split the selector entry into type and value
      const [type, ...valueParts] = selector.split(':');
      const value = valueParts.join(':'); // Rejoin in case the value contains colons
      
      // Skip combinators, they don't apply to the selected element
      if (type === 'combinator') return;
      
      // Handle not selectors
      if (type === 'not') {
        // Extract the inner content from the :not() selector
        const notContent = value.match(/^\:not\(([^\)]+)\)$/);
        if (notContent && notContent[1]) {
          notSelectorContents.push(notContent[1]);
        } else {
          // Fallback for direct extraction if regex fails
          const innerContent = value.substring(5, value.length - 1);
          if (innerContent) {
            notSelectorContents.push(innerContent);
          }
        }
      } else {
        // Sort other selectors into their respective groups
        switch (type) {
          case 'tag':
            tagSelectors.push(value);
            break;
          case 'id':
            idSelectors.push(value);
            break;
          case 'class':
            classSelectors.push(value);
            break;
          case 'attribute':
            attrSelectors.push(value);
            break;
          case 'pseudo-class':
            pseudoClassSelectors.push(value);
            break;
          case 'pseudo':
            pseudoElementSelectors.push(value);
            break;
          default:
            // Any unknown types
            classSelectors.push(value);
        }
      }
    });
    
    // Combine selectors in proper order: tag > id > class > attr > pseudo-class > pseudo-element
    const selectedParts: string[] = [
      ...tagSelectors,
      ...idSelectors,
      ...classSelectors,
      ...attrSelectors,
      ...pseudoClassSelectors,
      ...pseudoElementSelectors
    ];
    
    // Add the selected element selectors with appropriate combinator if needed
    if (selectedParts.length > 0) {
      // Only add space combinator if we already have other selectors
      if (selectorParts.length > 0) {
        selectorParts.push(' '); // Always use descendant combinator for selected element
      }
      
      // Add all selected element selectors joined together
      selectorParts.push(selectedParts.join(''));
    }
  }
  
  // Create the final selector string
  let finalSelector = selectorParts.join('');
  
  // Add the grouped :not() expression if we have any not selectors
  if (notSelectorContents.length > 0) {
    finalSelector += `:not(${notSelectorContents.join(', ')})`;
  }
  
  // Log the constructed selector for debugging
  console.log('DSN-DEBUG: Generated selector:', finalSelector);
  console.log('DSN-DEBUG: Not contents:', notSelectorContents);
  
  // Update the displayed selector
  combinedSelector.textContent = finalSelector || 'No elements selected';
  
  // Update specificity and match count
  updateSpecificityAndMatchCount(finalSelector);
}

/**
 * Update the specificity and match count for a given selector
 * @param selector The CSS selector to analyze
 */
function updateSpecificityAndMatchCount(selector: string): void {
  // If selector is empty, reset values to default
  if (!selector) {
    const specificityElement = document.getElementById('dsn-specificity-value');
    const matchCountElement = document.getElementById('dsn-match-count');
    
    if (specificityElement) specificityElement.textContent = '0,0,0';
    if (matchCountElement) matchCountElement.textContent = '0';
    return;
  }
  
  // Calculate specificity
  const specificity = calculateSpecificity(selector);
  
  // Count matching elements in the document
  let matchCount = 0;
  try {
    matchCount = document.querySelectorAll(selector).length;
  } catch (error) {
    console.error('DSN-DEBUG: Error counting matches:', error);
    matchCount = 0;
  }
  
  // Update the UI
  const specificityElement = document.getElementById('dsn-specificity-value');
  const matchCountElement = document.getElementById('dsn-match-count');
  
  if (specificityElement) {
    specificityElement.textContent = `${specificity.a},${specificity.b},${specificity.c}`;
  }
  
  if (matchCountElement) {
    matchCountElement.textContent = matchCount.toString();
  }
}

/**
 * Calculate the CSS specificity for a selector
 * @param selector The CSS selector
 * @returns An object with a, b, c components of specificity
 */
function calculateSpecificity(selector: string): { a: number, b: number, c: number } {
  // Default values
  let a = 0; // ID selectors
  let b = 0; // Classes, attributes, pseudo-classes
  let c = 0; // Elements, pseudo-elements
  
  try {
    // Handle empty or invalid selectors
    if (!selector || selector === 'No elements selected') {
      return { a, b, c };
    }
    
    // Count ID selectors (#foo)
    const idCount = (selector.match(/#[a-zA-Z0-9_-]+/g) || []).length;
    a += idCount;
    
    // Count class selectors (.foo), attribute selectors ([attr=val]), and pseudo-classes (:hover)
    const classCount = (selector.match(/\.[a-zA-Z0-9_-]+/g) || []).length;
    const attrCount = (selector.match(/\[[^\]]+\]/g) || []).length;
    const pseudoClassCount = (selector.match(/:[a-zA-Z-]+(?!\()/g) || []).length;
    b += classCount + attrCount + pseudoClassCount;
    
    // Count element selectors (div, span) and pseudo-elements (::before)
    const elementCount = (selector.match(/[a-zA-Z]+(?=[\s\.\#\:\[>+~]|$)/g) || []).length;
    const pseudoElementCount = (selector.match(/::[a-zA-Z-]+/g) || []).length;
    c += elementCount + pseudoElementCount;
    
    // Adjust for nested selectors in :not(), :has(), etc.
    const nestedSelectors = selector.match(/:[a-zA-Z-]+\(([^()]+)\)/g) || [];
    for (const nestedSelector of nestedSelectors) {
      // Extract the selector inside parentheses
      const innerSelector = nestedSelector.match(/\(([^()]+)\)/)?.[1];
      if (innerSelector) {
        // Calculate specificity for the inner selector
        const innerSpecificity = calculateSpecificity(innerSelector);
        a += innerSpecificity.a;
        b += innerSpecificity.b;
        c += innerSpecificity.c;
      }
    }
    
  } catch (error) {
    console.error('DSN-DEBUG: Error calculating specificity:', error);
  }
  
  return { a, b, c };
}

// Initialize the module
document.addEventListener('dsn-reset-selectors', () => {
  console.log('DSN-DEBUG: Resetting all selectors');
  // Clear all selectors
  (window as any).dsnSelectedSelectors = new Map<string, Set<string>>();
  // Update the UI
  updateCombinedSelector();
});
