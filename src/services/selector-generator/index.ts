// Import types and generator functions
import { SelectorInfo, SelectorGroups } from '@utils/types';
import { generateAllSelectors } from './generator';

export class SelectorGenerator {
  /**
   * Generate all possible selectors for a given element
   */
  static generateSelectors(element: Element, _doc: Document): SelectorGroups {
    // Get ancestors for combinator selectors
    const ancestors: Element[] = [];
    let current = element.parentElement;
    while (current) {
      ancestors.push(current);
      current = current.parentElement;
    }

    const result = generateAllSelectors(element, ancestors);
    return result.selectors;
  }

  // Legacy methods for backward compatibility
  private static generateCoreSelectors(element: Element, _doc: Document): SelectorInfo[] {
    const ancestors: Element[] = [];
    let current = element.parentElement;
    while (current) {
      ancestors.push(current);
      current = current.parentElement;
    }
    return generateAllSelectors(element, ancestors).selectors.core;
  }

  private static generateClassSelectors(element: Element, _doc: Document): SelectorInfo[] {
    const ancestors: Element[] = [];
    let current = element.parentElement;
    while (current) {
      ancestors.push(current);
      current = current.parentElement;
    }
    return generateAllSelectors(element, ancestors).selectors.class;
  }

  private static generateAttributeSelectors(element: Element, _doc: Document): SelectorInfo[] {
    const ancestors: Element[] = [];
    let current = element.parentElement;
    while (current) {
      ancestors.push(current);
      current = current.parentElement;
    }
    return generateAllSelectors(element, ancestors).selectors.attribute;
  }

  private static generateCombinatorSelectors(element: Element, _doc: Document): SelectorInfo[] {
    const ancestors: Element[] = [];
    let current = element.parentElement;
    while (current) {
      ancestors.push(current);
      current = current.parentElement;
    }
    return generateAllSelectors(element, ancestors).selectors.combinator;
  }
}

// Re-export these types for convenience
export { SelectorInfo, SelectorGroups };