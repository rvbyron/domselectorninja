/**
 * Utility for generating optimal CSS selectors for DOM elements
 */

/**
 * Generate an optimal CSS selector for the given element
 */
export function generateOptimalSelector(element: HTMLElement): string {
  console.debug('DSN: Generating selector for element:', element);
  
  // Start with simplest possible selector
  let selector = getSimpleSelector(element);
  
  // Check if the selector is unique
  if (document.querySelectorAll(selector).length === 1) {
    return selector;
  }
  
  // If not unique, generate a more specific selector with ancestry
  return generateSpecificSelector(element);
}

/**
 * Get a simple selector for an element (id or element type with class)
 */
function getSimpleSelector(element: HTMLElement): string {
  // Try ID selector first if available
  if (element.id) {
    return `#${element.id}`;
  }
  
  // Use element type with classes
  const classes = Array.from(element.classList).join('.');
  return classes ? `${element.tagName.toLowerCase()}.${classes}` : element.tagName.toLowerCase();
}

/**
 * Generate a more specific selector using parent elements when needed
 */
function generateSpecificSelector(element: HTMLElement): string {
  let currentElement: HTMLElement | null = element;
  const selectorParts: string[] = [];
  
  // Build selector moving up through parents (max 5 levels deep)
  while (currentElement && currentElement !== document.body && selectorParts.length < 5) {
    const simpleSel = getSimpleSelector(currentElement);
    selectorParts.unshift(simpleSel);
    
    // Check if current selector is unique
    const selector = selectorParts.join(' > ');
    if (document.querySelectorAll(selector).length === 1) {
      return selector;
    }
    
    currentElement = currentElement.parentElement;
  }
  
  // Return the built selector even if not completely unique
  return selectorParts.join(' > ');
}
