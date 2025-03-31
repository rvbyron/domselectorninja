/**
 * Common type definitions for the application
 */

// Selector Types
export type SelectorType = "core" | "class" | "attribute" | "combinator";

export interface SelectorInfo {
  selector: string;
  type: SelectorType;
  specificity: number;
  isValid: boolean;
  isUnique?: boolean; // Added isUnique property that's used in selector-panel.ts
  description: string;
}

export interface SelectorGroups {
  core: SelectorInfo[];
  class: SelectorInfo[];
  attribute: SelectorInfo[];
  combinator: SelectorInfo[];
}

// Element Data Types
export interface ElementData {
  tagName: string;
  id?: string;
  classNames?: string[];
  attributes?: Record<string, string>;
  path?: string[];
  html?: string;
  selectors?: SelectorGroups; // Add selectors property to ElementData
}

// Add the missing AncestorElement interface with attributes property
export interface AncestorElement {
  tagName: string;
  id: string;
  className: string;
  htmlPreview: string;
  depth?: number;
  index?: number;
  attributes?: Record<string, string>; // Add the missing attributes property
  path?: string[]; // Add the missing path property
}

// Remove the component implementations from this file
// They should be in their own files