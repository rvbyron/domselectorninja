/**
 * Selector Parser
 * Handles CSS selector parsing, validation, and analysis
 */

/**
 * Parse a CSS selector into its component parts
 * @param {string} selector - The CSS selector to parse
 * @returns {object} Object containing the parsed selector components
 */
export function parseSelector(selector) {
  if (!selector || selector === 'No elements selected') {
    return { valid: false, components: [] };
  }
  
  try {
    const components = [];
    // Split by combinators while preserving them
    const parts = selector.split(/(\s+|\s*>\s*|\s*\+\s*|\s*~\s*)/).filter(Boolean);
    
    let currentElement = null;
    
    parts.forEach(part => {
      // Check if it's a combinator
      if (/^\s*[>+~]?\s*$/.test(part)) {
        // It's a combinator
        const trimmedPart = part.trim();
        const combinator = trimmedPart || ' '; // ' ' represents descendant combinator
        
        if (currentElement) {
          currentElement.combinator = combinator;
          components.push(currentElement);
          currentElement = null;
        }
      } else {
        // It's a selector part
        currentElement = parseSelectorPart(part);
      }
    });
    
    // Add the last element if there is one
    if (currentElement) {
      components.push(currentElement);
    }
    
    return {
      valid: components.length > 0,
      components,
      originalSelector: selector
    };
  } catch (e) {
    console.error('Error parsing selector:', e);
    return { valid: false, components: [], error: e.message };
  }
}

/**
 * Parse a single selector part (without combinators)
 * @param {string} part - Part of a CSS selector
 * @returns {object} Object representing the selector part
 */
function parseSelectorPart(part) {
  const result = {
    element: null,
    id: null,
    classes: [],
    attributes: [],
    pseudoClasses: [],
    pseudoElements: null,
    combinator: null // To be filled later
  };
  
  // Extract element type
  const elementMatch = part.match(/^[a-zA-Z0-9\-_]+/);
  if (elementMatch) {
    result.element = elementMatch[0];
    part = part.substring(elementMatch[0].length);
  }
  
  // Extract ID
  const idMatch = part.match(/#([a-zA-Z0-9\-_]+)/);
  if (idMatch) {
    result.id = idMatch[1];
    part = part.replace(idMatch[0], '');
  }
  
  // Extract classes
  const classMatches = part.match(/\.([a-zA-Z0-9\-_]+)/g);
  if (classMatches) {
    result.classes = classMatches.map(cls => cls.substring(1));
    classMatches.forEach(cls => {
      part = part.replace(cls, '');
    });
  }
  
  // Extract attributes
  const attrMatches = part.match(/\[[^\]]+\]/g);
  if (attrMatches) {
    result.attributes = attrMatches.map(attr => {
      const match = attr.match(/\[([^~|^$*=]+)(?:([~|^$*]?=)"?([^"]*)"?)?\]/);
      if (match) {
        return {
          name: match[1],
          operator: match[2] || '',
          value: match[3] || ''
        };
      }
      return { name: attr.substring(1, attr.length - 1), operator: '', value: '' };
    });
    
    attrMatches.forEach(attr => {
      part = part.replace(attr, '');
    });
  }
  
  // Extract pseudo-classes
  const pseudoClassMatches = part.match(/:[a-zA-Z\-]+(?:\([^)]+\))?/g);
  if (pseudoClassMatches) {
    result.pseudoClasses = pseudoClassMatches.map(pseudo => {
      const paramMatch = pseudo.match(/:([a-zA-Z\-]+)(?:\(([^)]+)\))?/);
      if (paramMatch) {
        return {
          name: paramMatch[1],
          parameter: paramMatch[2] || null
        };
      }
      return { name: pseudo.substring(1), parameter: null };
    });
    
    pseudoClassMatches.forEach(pseudo => {
      part = part.replace(pseudo, '');
    });
  }
  
  // Extract pseudo-element (there can be only one per selector part)
  const pseudoElementMatch = part.match(/::[a-zA-Z\-]+/);
  if (pseudoElementMatch) {
    result.pseudoElement = pseudoElementMatch[0].substring(2);
    part = part.replace(pseudoElementMatch[0], '');
  }
  
  return result;
}

/**
 * Calculate the specificity of a CSS selector
 * Returns an array [a, b, c] where:
 * - a: Number of ID selectors
 * - b: Number of class selectors, attribute selectors, and pseudo-classes
 * - c: Number of element (tag) selectors and pseudo-elements
 * @param {string} selector - The CSS selector to analyze
 * @returns {number[]} Array representing specificity as [a, b, c]
 */
export function calculateSpecificity(selector) {
  if (!selector || selector === 'No elements selected') {
    return [0, 0, 0];
  }
  
  // Initialize specificity values
  let a = 0; // ID selectors
  let b = 0; // Class selectors, attribute selectors, and pseudo-classes
  let c = 0; // Element selectors and pseudo-elements
  
  try {
    // Count ID selectors (#id)
    a = (selector.match(/#[a-zA-Z0-9_-]+/g) || []).length;
    
    // Count class selectors (.class)
    const classes = (selector.match(/\.[a-zA-Z0-9_-]+/g) || []).length;
    
    // Count attribute selectors ([attr=value])
    const attributes = (selector.match(/\[[^\]]+\]/g) || []).length;
    
    // Count pseudo-classes (:hover, :first-child, etc.)
    // Note: This won't count :not() contents, which is a simplification
    const pseudoClasses = (selector.match(/:[a-zA-Z-]+(?:\([^)]*\))?/g) || [])
      .filter(p => !p.startsWith('::')).length;
    
    b = classes + attributes + pseudoClasses;
    
    // Count element selectors (tag) and pseudo-elements (::before)
    const elements = selector.split(/[.#\[\]:>+~\s]/)
      .filter(s => s && /^[a-zA-Z0-9_-]+$/.test(s)).length;
    
    const pseudoElements = (selector.match(/::[a-zA-Z-]+/g) || []).length;
    
    c = elements + pseudoElements;
  } catch (e) {
    console.error('Error calculating specificity:', e);
  }
  
  return [a, b, c];
}

/**
 * Format specificity for display
 * @param {number[]} specificity - Specificity array [a, b, c]
 * @returns {string} Formatted specificity string
 */
export function formatSpecificity(specificity) {
  return `${specificity[0]},${specificity[1]},${specificity[2]}`;
}

/**
 * Validate a CSS selector
 * @param {string} selector - The CSS selector to validate
 * @returns {boolean} Whether the selector is valid
 */
export function isValidSelector(selector) {
  if (!selector || selector === 'No elements selected') {
    return false;
  }
  
  try {
    // Use document.querySelector to check if the selector is valid
    // This will throw a SyntaxError if the selector is invalid
    document.querySelector(selector);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Count how many elements match the selector
 * @param {string} selector - The CSS selector to check
 * @returns {number} Number of matching elements
 */
export function countMatchingElements(selector) {
  if (!selector || selector === 'No elements selected' || !isValidSelector(selector)) {
    return 0;
  }
  
  try {
    return document.querySelectorAll(selector).length;
  } catch (e) {
    return 0;
  }
}
