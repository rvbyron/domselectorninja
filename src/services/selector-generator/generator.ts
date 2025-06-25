/**
 * Functions for generating CSS selectors
 */
import { isSelectorUnique } from '@services/dom-analyzer/element-finder';
import { SelectorInfo, SelectorType } from '@utils/types';

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
    specificity: 1,
    isUnique: isSelectorUnique(tagSelector, element),
    isValid: true,
    description: `Tag selector for ${tagSelector} elements`
  });
  
  // ID selector (if present)
  if (element.id) {
    const idSelector = `#${element.id}`;
    selectors.push({
      type: 'core',
      selector: idSelector,
      specificity: 100,
      isUnique: isSelectorUnique(idSelector, element),
      isValid: true,
      description: `ID selector for element with id="${element.id}"`
    });
  }
  
  // Universal selector
  selectors.push({
    type: 'core',
    selector: '*',
    specificity: 0,
    isUnique: false, // Universal is never unique
    isValid: true,
    description: 'Universal selector - matches any element'
  });
  
  // Pseudo-classes (examples)
  if (element.matches(':first-child')) {
    selectors.push({
      type: 'core',
      selector: `:first-child`,
      specificity: 10,
      isUnique: isSelectorUnique(`:first-child`, element),
      isValid: true,
      description: 'Selects the first child element'
    });
  }
  
  if (element.matches(':last-child')) {
    selectors.push({
      type: 'core',
      selector: `:last-child`,
      specificity: 10,
      isUnique: isSelectorUnique(`:last-child`, element),
      isValid: true,
      description: 'Selects the last child element'
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
      specificity: 10,
      isUnique: isSelectorUnique(classSelector, element),
      isValid: true,
      description: `Class selector for "${className}"`
    });
  }
  
  // Combinations of classes (if more than one)
  if (element.classList.length > 1) {
    const combinedClassSelector = `.${Array.from(element.classList).join('.')}`;
    selectors.push({
      type: 'class',
      selector: combinedClassSelector,
      specificity: element.classList.length * 10,
      isUnique: isSelectorUnique(combinedClassSelector, element),
      isValid: true,
      description: `Combined class selector for ${element.classList.length} classes`
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
      specificity: 10,
      isUnique: isSelectorUnique(attrSelector, element),
      isValid: true,
      description: `Attribute selector for ${attr.name}="${attr.value}"`
    });
    
    // Contains
    const containsSelector = `[${attr.name}*="${attr.value}"]`;
    selectors.push({
      type: 'attribute',
      selector: containsSelector,
      specificity: 10,
      isUnique: isSelectorUnique(containsSelector, element),
      isValid: true,
      description: `Attribute contains selector for ${attr.name}*="${attr.value}"`
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
      specificity: 2,
      isUnique: isSelectorUnique(childSelector, element),
      isValid: true,
      description: `Child selector: ${parentTag} direct child ${element.tagName.toLowerCase()}`
    });
  }
  
  // Sibling selectors
  const prevSibling = element.previousElementSibling;
  if (prevSibling) {
    const siblingSelector = `${prevSibling.tagName.toLowerCase()} + ${element.tagName.toLowerCase()}`;
    selectors.push({
      type: 'combinator',
      selector: siblingSelector,
      specificity: 2,
      isUnique: isSelectorUnique(siblingSelector, element),
      isValid: true,
      description: `Adjacent sibling: ${prevSibling.tagName.toLowerCase()} followed by ${element.tagName.toLowerCase()}`
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
      specificity: 11,
      isUnique: isSelectorUnique(nthSelector, element),
      isValid: true,
      description: `nth-child: ${index}${index === 1 ? 'st' : index === 2 ? 'nd' : index === 3 ? 'rd' : 'th'} child of type ${element.tagName.toLowerCase()}`
    });
  }
  
  return selectors;
}