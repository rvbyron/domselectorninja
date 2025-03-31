/**
 * Helper functions for DOM element type casting
 */

/**
 * Cast any Element to HTMLElement safely
 */
export function asHTMLElement(element: Element): HTMLElement {
  return element as HTMLElement;
}

/**
 * Cast a NodeList to an array of HTMLElements
 */
export function nodeListToHTMLElements(nodeList: NodeListOf<Element>): HTMLElement[] {
  return Array.from(nodeList).map(el => el as HTMLElement);
}
