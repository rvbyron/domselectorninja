/**
 * Shared type definitions for DOM Selector Ninja
 */

/**
 * Element data structure containing all properties needed for analysis
 */
export interface ElementData {
  tagName: string;
  id: string;
  classNames: string[];
  attributes: Record<string, string>;
  path?: string;
}

/**
 * Simplified ancestor element data
 */
export interface AncestorElement {
  tagName: string;
  id: string;
  className: string;
  attributes: Record<string, string>;
}

/**
 * Analysis result from the element analyzer
 */
export interface AnalyzerResult {
  success: boolean;
  message?: string;
  selector?: string;
  element?: HTMLElement;
}

/**
 * Message structure for communication
 */
export interface ContentMessage {
  action: string;
  payload?: any;
}

/**
 * Selector item with type information
 */
export interface SelectorItem {
  selector: string;
  type: string;
  displaySelector?: string; // Optional display version for pseudo-elements
}

/**
 * Combinator selector structure
 */
export interface CombinatorSelector {
  value: string;
  display: string;
  disabled?: boolean;
  tooltip?: string;
}

// Global extension namespace
declare global {
  interface Window {
    DomSelectorNinja: {
      debug: {
        beginElementSelection: () => void;
      };
    };
  }
}
