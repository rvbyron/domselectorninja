/**
 * Interface for element data structure
 */
export interface ElementData {
  id: string;
  tagName: string;
  classNames: string[];
  attributes: Record<string, string>;
}

/**
 * Interface for ancestor element data structure
 */
export interface AncestorElement {
  tagName: string;
  id?: string;
  className?: string;
  attributes?: Record<string, string>;
}

/**
 * Options for element selection functionality
 */
export interface ElementSelectionOptions {
  highlightColor?: string;
  highlightBorder?: string;
  enableOverlay?: boolean;
  selectionMode?: 'single' | 'multiple';
}
