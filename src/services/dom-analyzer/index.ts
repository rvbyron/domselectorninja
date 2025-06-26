/**
 * DOM Analyzer Service
 * Analyzes DOM elements and builds hierarchical data
 */

import { ElementData, AncestorElement } from '@utils/types';
import { SelectorGenerator } from '@services/selector-generator';

export class DomAnalyzer {
  /**
   * Analyze an element and return detailed information about it
   */
  static analyzeElement(element: Element): ElementData {
    const doc = element.ownerDocument;
    
    // Basic element properties
    const data: ElementData = {
      tagName: element.tagName,
      id: element.id || undefined,
      classNames: element.classList.length > 0 ? Array.from(element.classList) : undefined,
      attributes: this.getElementAttributes(element),
      path: this.getElementPath(element),
      html: element.outerHTML,
    };
    
    // Generate selectors for the element
    data.selectors = SelectorGenerator.generateSelectors(element, doc);
    
    return data;
  }
  
  /**
   * Get all attributes from an element except for id and class
   */
  private static getElementAttributes(element: Element): Record<string, string> | undefined {
    const attributes: Record<string, string> = {};
    let hasAttributes = false;
    
    for (const attr of Array.from(element.attributes)) {
      if (attr.name !== 'id' && attr.name !== 'class') {
        attributes[attr.name] = attr.value;
        hasAttributes = true;
      }
    }
    
    return hasAttributes ? attributes : undefined;
  }
  
  /**
   * Get the element's path from root to current
   */
  private static getElementPath(element: Element): string[] {
    const path: string[] = [];
    let current: Element | null = element;
    
    while (current) {
      path.unshift(current.tagName.toLowerCase());
      current = current.parentElement;
    }
    
    return path;
  }
  
  /**
   * Get all ancestors of an element
   */
  static getAncestors(element: Element): AncestorElement[] {
    const ancestors: AncestorElement[] = [];
    let current: Element | null = element.parentElement;
    let index = 0;
    
    while (current) {
      // Create a path array for each ancestor
      const ancestorPath = this.getElementPath(current);
      
      ancestors.push({
        tagName: current.tagName,
        id: current.id,
        className: current.className,
        htmlPreview: this.getElementPreview(current),
        depth: index,
        index: index,
        attributes: this.getElementAttributes(current),
        path: ancestorPath, // Fix: Use the array path instead of a string
        element: current // Store the actual DOM element reference for hover highlighting
      });
      
      current = current.parentElement;
      index++;
    }
    
    return ancestors;
  }
  
  /**
   * Get a preview of the element's HTML
   */
  private static getElementPreview(element: Element): string {
    let html = element.outerHTML;
    if (html.length > 100) {
      html = html.substring(0, 100) + '...';
    }
    return html.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}