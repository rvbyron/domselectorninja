/**
 * Shared constants for selector-related functionality
 */

// Pseudo-elements
export const PSEUDO_ELEMENTS = [
  '::after',
  '::before',
  '::first-letter',
  '::first-line',
  '::selection',
  '::placeholder',
  '::marker',
  '::backdrop',
  '::cue'
];

// Pseudo-classes
export const PSEUDO_CLASSES = [
  // State pseudo-classes
  ':active', ':focus', ':focus-visible', ':focus-within', ':hover', ':target', ':visited',
  // Form pseudo-classes
  ':checked', ':disabled', ':enabled', ':indeterminate', ':placeholder-shown', ':read-only', 
  ':read-write', ':required', ':optional', ':valid', ':invalid',
  // Structural pseudo-classes
  ':empty', ':first-child', ':first-of-type', ':last-child', ':last-of-type', 
  ':only-child', ':only-of-type', ':root',
  // Nth pseudo-classes 
  ':nth-child(n)', ':nth-last-child(n)', ':nth-of-type(n)', ':nth-last-of-type(n)',
  // Other pseudo-classes
  ':fullscreen', ':defined'
];

// Combinator selectors
export const COMBINATOR_SELECTORS = [
  { value: ' ', display: 'Descendant' },
  { value: '>', display: 'Child' },
  { value: '+', display: 'Adjacent', disabled: true, tooltip: 'Adjacent combinator is not implemented yet' },
  { value: '~', display: 'Sibling', disabled: true, tooltip: 'Sibling combinator is not implemented yet' }
];

// Selector type ordering for proper CSS precedence
export const SELECTOR_TYPE_ORDER = [
  'tag',         // First: tag names (div, span)
  'id',          // Next: ID selectors (#main)
  'class',       // Next: Class selectors (.btn)
  'attribute',   // Next: Attribute selectors ([type="text"])
  'pseudo-class', // Next: Pseudo-classes (:hover)
  'pseudo'       // Last: Pseudo-elements (::before)
];
