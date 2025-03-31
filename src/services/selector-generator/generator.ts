/**
 * Functions for generating CSS selectors
 */
import { isSelectorUnique } from '@services/dom-analyzer/element-finder';

export interface SelectorInfo {
  type: 'core' | 'class' | 'attribute' | 'combinator';
  selector: string;
  isUnique: boolean;
  isValid: boolean;
}

export interface ElementSelectorData {
  element: Element;
  selectors: {
    core: SelectorInfo[];
    class: SelectorInfo[];
    attribute: SelectorInfo[];
    combinator: SelectorInfo[];
  }
}

/**
 * Generate all possible selectors for an element
 */
export function generateAllSelectors(
  element: Element, 
  ancestors: Element[]
): ElementSelectorData {
  return {
    element,
    selectors: {
      core: generateCoreSelectors(element),
      class: generateClassSelectors(element),
      attribute: generateAttributeSelectors(element),
      combinator: generateCombinatorSelectors(element, ancestors)
    }
  };
}

/**
 * Generate core selectors (tag, ID, universal, pseudo)
 */
function generateCoreSelectors(element: Element): SelectorInfo[] {
  const selectors: SelectorInfo[] = [];
  
  // Tag selector
  const tagSelector = element.tagName.toLowerCase();
  selectors.push({
    type: 'core',
    selector: tagSelector,
    isUnique: isSelectorUnique(tagSelector, element),
    isValid: true
  });
  
  // ID selector (if present)
  if (element.id) {
    const idSelector = `#${element.id}`;
    selectors.push({
      type: 'core',
      selector: idSelector,
      isUnique: isSelectorUnique(idSelector, element),
      isValid: true
    });
  }
  
  // Universal selector
  selectors.push({
    type: 'core',
    selector: '*',
    isUnique: false, // Universal is never unique
    isValid: true
  });
  
  // Pseudo-classes (examples)
  if (element.matches(':first-child')) {
    selectors.push({
      type: 'core',
      selector: `:first-child`,
      isUnique: isSelectorUnique(`:first-child`, element),
      isValid: true
    });
  }
  
  if (element.matches(':last-child')) {
    selectors.push({
      type: 'core',
      selector: `:last-child`,
      isUnique: isSelectorUnique(`:last-child`, element),
      isValid: true
    });
  }
  
  return selectors;
}

/**
 * Generate class selectors
 */
function generateClassSelectors(element: Element): SelectorInfo[] {
  const selectors: SelectorInfo[] = [];
  
  // Individual classes
  for (const className of element.classList) {
    const classSelector = `.${className}`;
    selectors.push({
      type: 'class',
      selector: classSelector,
      isUnique: isSelectorUnique(classSelector, element),
      isValid: true
    });
  }
  
  // Combinations of classes (if more than one)
  if (element.classList.length > 1) {
    const combinedClassSelector = `.${Array.from(element.classList).join('.')}`;
    selectors.push({
      type: 'class',
      selector: combinedClassSelector,
      isUnique: isSelectorUnique(combinedClassSelector, element),
      isValid: true
    });
  }
  
  return selectors;
}

/**
 * Generate attribute selectors
 */
function generateAttributeSelectors(element: Element): SelectorInfo[] {
  const selectors: SelectorInfo[] = [];
  
  // All attributes
  for (const attr of Array.from(element.attributes)) {
    if (attr.name === 'class' || attr.name === 'id') continue; // Skip handled separately
    
    // Exact match
    const attrSelector = `[${attr.name}="${attr.value}"]`;
    selectors.push({
      type: 'attribute',
      selector: attrSelector,
      isUnique: isSelectorUnique(attrSelector, element),
      isValid: true
    });
    
    // Contains
    const containsSelector = `[${attr.name}*="${attr.value}"]`;
    selectors.push({
      type: 'attribute',
      selector: containsSelector,
      isUnique: isSelectorUnique(containsSelector, element),
      isValid: true
    });
  }
  
  return selectors;
}

/**
 * Generate combinator selectors (child, descendant, etc.)
 */
function generateCombinatorSelectors(element: Element, _ancestors: Element[]): SelectorInfo[] {
  const selectors: SelectorInfo[] = [];
  
  // Child selector
  if (element.parentElement) {
    const parentTag = element.parentElement.tagName.toLowerCase();
    const childSelector = `${parentTag} > ${element.tagName.toLowerCase()}`;
    selectors.push({
      type: 'combinator',
      selector: childSelector,
      isUnique: isSelectorUnique(childSelector, element),
      isValid: true
    });
  }
  
  // Sibling selectors
  const prevSibling = element.previousElementSibling;
  if (prevSibling) {
    const siblingSelector = `${prevSibling.tagName.toLowerCase()} + ${element.tagName.toLowerCase()}`;
    selectors.push({
      type: 'combinator',
      selector: siblingSelector,
      isUnique: isSelectorUnique(siblingSelector, element),
      isValid: true
    });
  }
  
  // nth-child
  if (element.parentElement) {
    const children = Array.from(element.parentElement.children);
    const index = children.indexOf(element as HTMLElement) + 1;
    const nthSelector = `${element.tagName.toLowerCase()}:nth-child(${index})`;
    selectors.push({
      type: 'combinator',
      selector: nthSelector,
      isUnique: isSelectorUnique(nthSelector, element),
      isValid: true
    });
  }
  
  return selectors;
}