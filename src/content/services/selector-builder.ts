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
 * Process selectors for an element and return organized selector parts
 */
function processElementSelectors(elementSelectors: Set<string>, skipCombinators: boolean = false): {
  selectorParts: string[];
  combinatorValue: string;
  notSelectors: string[];
} {
  const tagSelectors: string[] = [];
  const idSelectors: string[] = [];
  const classSelectors: string[] = [];
  const attrSelectors: string[] = [];
  const pseudoClassSelectors: string[] = [];
  const pseudoElementSelectors: string[] = [];
  const notSelectors: string[] = [];
  let combinatorValue = ' '; // Default to descendant combinator
  
  elementSelectors.forEach(selector => {
    const [type, ...valueParts] = selector.split(':');
    const value = valueParts.join(':');
    
    // Handle combinator
    if (type === 'combinator') {
      if (!skipCombinators) {
        combinatorValue = value;
      }
      return;
    }
    
    // Handle :not selectors (check both type and value for :not patterns)
    if (type === 'not' || value.startsWith(':not(')) {
      notSelectors.push(value);
      return;
    }
    
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
        classSelectors.push(value);
    }
  });
  
  // Combine selectors in proper CSS precedence order
  // Note: :not selectors must be integrated here to maintain proper CSS syntax order
  const consolidatedNotSelector = notSelectors.length > 0 ? consolidateNotSelectors(notSelectors) : '';
  
  const selectorParts = [
    ...tagSelectors,
    ...idSelectors,
    ...classSelectors,
    ...attrSelectors,
    ...pseudoClassSelectors,
    ...(consolidatedNotSelector ? [consolidatedNotSelector] : []), // Add :not before pseudo-elements
    ...pseudoElementSelectors
  ];
  
  return { selectorParts, combinatorValue, notSelectors: [] }; // Return empty notSelectors since they're now integrated
}

/**
 * Consolidate multiple :not() selectors into a single :not() with comma-separated values
 * Example: :not(.class1):not(.class2) becomes :not(.class1, .class2)
 */
function consolidateNotSelectors(notSelectors: string[]): string {
  console.log('DSN-DEBUG: consolidateNotSelectors called with:', notSelectors);
  if (notSelectors.length === 0) return '';
  if (notSelectors.length === 1) {
    console.log('DSN-DEBUG: Only one not selector, returning as-is:', notSelectors[0]);
    return notSelectors[0];
  }
  
  // Extract the content from each :not() selector
  const notContents: string[] = [];
  
  for (const notSelector of notSelectors) {
    console.log('DSN-DEBUG: Processing not selector:', notSelector);
    // Match :not(...) and extract the content inside parentheses
    const match = notSelector.match(/^:not\((.+)\)$/);
    if (match) {
      console.log('DSN-DEBUG: Extracted content:', match[1]);
      notContents.push(match[1]);
    } else {
      // If it doesn't match the expected format, add as-is (fallback)
      console.log('DSN-DEBUG: No match, adding as-is:', notSelector);
      notContents.push(notSelector);
    }
  }
  
  // Combine all contents into a single :not() selector
  const result = `:not(${notContents.join(', ')})`;
  console.log('DSN-DEBUG: Final consolidated result:', result);
  return result;
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

  // Process selectors in ascending order of element index (closest to root to furthest)
  const indices = Array.from(selectedSelectorsMap.keys())
    .filter(index => index !== 'selected') // Handle 'selected' separately
    .map(index => parseInt(index))
    .sort((a, b) => a - b); // Sort in ascending order (ancestors first)

  // Add selectors for each ancestor element
  for (const index of indices) {
    const elementSelectors = selectedSelectorsMap.get(index.toString());
    if (!elementSelectors || elementSelectors.size === 0) continue;

    const { selectorParts: elementSelectorParts, combinatorValue } = processElementSelectors(elementSelectors, false);
    
    // If we have selectors for this element, add them with the appropriate combinator
    if (elementSelectorParts.length > 0) {
      // Add the combinator if we already have selectors
      if (selectorParts.length > 0) {
        selectorParts.push(combinatorValue);
      }
      
      // Add all the element's selectors joined with logical AND
      selectorParts.push(elementSelectorParts.join(''));
    }
  }
  
  // Add selectors for the selected element itself
  const selectedSelectors = selectedSelectorsMap.get('selected');
  if (selectedSelectors && selectedSelectors.size > 0) {
    const { selectorParts: selectedParts } = processElementSelectors(selectedSelectors, true);
    
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
  
  // Note: :not selectors are now integrated into compound selectors at the proper position
  // No need to add them separately at the end
  
  // Log the constructed selector for debugging
  console.log('DSN-DEBUG: Generated selector:', finalSelector);
  
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

