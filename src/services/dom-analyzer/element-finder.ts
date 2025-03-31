/**
 * Utilities for finding elements in the DOM and checking selectors
 */

/**
 * Find element from coordinates (used when right-clicking)
 */
export function findElementFromPoint(x: number, y: number): Element | null {
  return document.elementFromPoint(x, y);
}

/**
 * Check if a selector uniquely identifies an element in the document
 */
export function isSelectorUnique(selector: string, targetElement: Element): boolean {
  try {
    const document = targetElement.ownerDocument;
    const elements = document.querySelectorAll(selector);
    
    // Selector is unique if it matches exactly one element and that element is our target
    return elements.length === 1 && elements[0] === targetElement;
  } catch (error) {
    // In case of invalid selectors
    console.error(`Error checking selector uniqueness: ${error}`);
    return false;
  }
}

/**
 * Find all elements matching a selector
 */
export function findElements(selector: string, document: Document): Element[] {
  try {
    return Array.from(document.querySelectorAll(selector));
  } catch (error) {
    console.error(`Error finding elements: ${error}`);
    return [];
  }
}

/**
 * Test if a selector is valid CSS
 */
export function isSelectorValid(selector: string): boolean {
  try {
    // Use document.querySelector as a way to test selector validity
    document.querySelector(selector);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Find the shortest unique selector for an element
 */
export function findShortestUniqueSelector(element: Element): string {
  // Try ID first (most specific)
  if (element.id) {
    return `#${element.id}`;
  }
  
  // Try classes
  if (element.classList.length > 0) {
    const classSelector = `.${Array.from(element.classList).join('.')}`;
    if (isSelectorUnique(classSelector, element)) {
      return classSelector;
    }
    
    // Try individual classes
    for (const className of element.classList) {
      const singleClassSelector = `.${className}`;
      if (isSelectorUnique(singleClassSelector, element)) {
        return singleClassSelector;
      }
    }
  }
  
  // Try tag with nth-child
  const parent = element.parentElement;
  if (parent) {
    const children = Array.from(parent.children);
    const index = children.indexOf(element as HTMLElement) + 1;
    const nthSelector = `${element.tagName.toLowerCase()}:nth-child(${index})`;
    if (isSelectorUnique(nthSelector, element)) {
      return nthSelector;
    }
  }
  
  // Build path to element as last resort
  return buildSelectorPath(element);
}

/**
 * Build a selector path from the element up to a unique ancestor
 */
function buildSelectorPath(element: Element): string {
  const segments: string[] = [];
  let current: Element | null = element;
  
  while (current && current !== document.documentElement) {
    // Build a selector for this element
    let selector = current.tagName.toLowerCase();
    
    if (current.id) {
      selector = `#${current.id}`;
      segments.unshift(selector);
      break; // ID is unique, we can stop here
    } else {
      // Add nth-child for more specificity
      const parent = current.parentElement;
      if (parent) {
        const children = Array.from(parent.children).filter(
          child => child.tagName === current?.tagName
        );
        
        if (children.length > 1) {
          const index = children.indexOf(current) + 1;
          selector += `:nth-of-type(${index})`;
        }
      }
    }
    
    segments.unshift(selector);
    current = current.parentElement;
  }
  
  return segments.join(' > ');
}