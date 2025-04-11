/**
 * Shared functions and variables used across multiple modules
 * Avoids circular dependencies by providing a central location for shared functionality
 */

// Track initialization status
let _analyzeInitialized = false;

// Default implementation that throws a clear error
export let analyzeSelectedElementFn = (_event?: Event): void => {
  throw new Error('DSN: analyzeSelectedElementFn not properly initialized. Ensure registerAnalyzeFunction is called before usage.');
};

/**
 * Register the implementation of the element analysis function
 */
export function registerAnalyzeFunction(fn: (event?: Event) => void): void {
  console.debug('DSN: Registering analyzeSelectedElementFn');
  analyzeSelectedElementFn = fn;
  _analyzeInitialized = true;
  console.debug('DSN: analyzeSelectedElementFn registered successfully');
}

/**
 * Check if the analyze function has been initialized properly
 */
export function isAnalyzeFunctionInitialized(): boolean {
  return _analyzeInitialized;
}

/**
 * Combined selector update function placeholder
 */
export let updateCombinedSelectorFn: (container: HTMLElement) => void = () => {
  console.error('DSN: updateCombinedSelectorFn not properly initialized');
};

/**
 * Register the combined selector update function
 */
export function registerUpdateCombinedSelectorFunction(fn: (container: HTMLElement) => void): void {
  updateCombinedSelectorFn = fn;
}
