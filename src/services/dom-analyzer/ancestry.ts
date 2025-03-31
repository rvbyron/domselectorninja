/**
 * Functions for analyzing DOM element ancestry
 */

/**
 * Get all ancestors of an element, from the element itself up to html
 */
export function getElementAncestors(element: Element): Element[] {
  const ancestors: Element[] = [];
  let current: Element | null = element;
  
  while (current) {
    ancestors.push(current);
    current = current.parentElement;
  }
  
  // Reverse so the order is from root to the element
  return ancestors.reverse();
}

/**
 * Get a simplified representation of an element for display
 */
export function getElementPreview(element: Element): string {
  const tag = element.tagName.toLowerCase();
  const id = element.id ? `#${element.id}` : '';
  const classes = element.classList.length > 0 
    ? `.${Array.from(element.classList).join('.')}`
    : '';
  
  let innerText = element.textContent?.trim() || '';
  if (innerText.length > 20) {
    innerText = innerText.substring(0, 17) + '...';
  }
  
  const textPreview = innerText ? ` "${innerText}"` : '';
  
  return `<${tag}${id}${classes}${textPreview}>`;
}