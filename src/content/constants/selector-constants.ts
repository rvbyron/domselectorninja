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
  // Nth pseudo-classes (these will have parameter options)
  ':nth-child(odd)', ':nth-last-child(odd)', ':nth-of-type(odd)', ':nth-last-of-type(odd)',
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

// :nth pseudo-selector parameter options
export const NTH_SELECTOR_OPTIONS = [
  { value: 'odd', display: 'Odd (1st, 3rd, 5th, ...)', description: 'Selects odd-numbered elements' },
  { value: 'even', display: 'Even (2nd, 4th, 6th, ...)', description: 'Selects even-numbered elements' },
  { value: '1', display: 'First element', description: 'Selects the first element' },
  { value: '2', display: 'Second element', description: 'Selects the second element' },
  { value: '3', display: 'Third element', description: 'Selects the third element' },
  { value: 'n', display: 'All elements (n)', description: 'Selects every element' },
  { value: '2n', display: 'Every 2nd (2n)', description: 'Selects every 2nd element (same as even)' },
  { value: '2n+1', display: 'Every 2nd starting from 1st (2n+1)', description: 'Selects every 2nd element starting from 1st (same as odd)' },
  { value: '3n', display: 'Every 3rd (3n)', description: 'Selects every 3rd element' },
  { value: '3n+1', display: 'Every 3rd starting from 1st (3n+1)', description: 'Selects 1st, 4th, 7th, ...' },
  { value: '3n+2', display: 'Every 3rd starting from 2nd (3n+2)', description: 'Selects 2nd, 5th, 8th, ...' },
  { value: 'custom', display: 'Custom formula...', description: 'Enter a custom nth formula' }
];

// :nth pseudo-selector types that support parameters
export const NTH_PSEUDO_TYPES = [
  ':nth-child',
  ':nth-last-child', 
  ':nth-of-type',
  ':nth-last-of-type'
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
