/**
 * DOM analyzer service
 */

import { ElementData, AncestorElement } from '@utils/types';
import { UIManager } from './ui-manager';

export class DOMAnalyzer {
  /**
   * Analyze an element and extract its key properties
   */
  static analyzeElement(element: Element): ElementData {
    const attributes: Record<string, string> = {};
    
    // Extract all attributes
    Array.from(element.attributes).forEach(attr => {
      // Skip id and class attributes as they're already displayed in separate lists
      if (attr.name === 'id' || attr.name === 'class') {
        return;
      }
      
      // Skip empty style attributes
      if (attr.name === 'style' && (!attr.value || attr.value.trim() === '')) {
        return;
      }
      attributes[attr.name] = attr.value;
    });

    return {
      tagName: element.tagName,
      id: element.id,
      classNames: element.classList.length ? Array.from(element.classList) : [],
      attributes: attributes
    };
  }

  /**
   * Get all ancestor elements of the given element
   */
  static getAncestors(element: Element): AncestorElement[] {
    const ancestors: AncestorElement[] = [];
    let current = element.parentElement;
    
    while (current) {
      const attributes: Record<string, string> = {};
      
      // Extract all attributes for the ancestor
      Array.from(current.attributes).forEach(attr => {
        // Skip id and class attributes as they're already displayed in separate lists
        if (attr.name === 'id' || attr.name === 'class') {
          return;
        }
        
        // Skip empty style attributes
        if (attr.name === 'style' && (!attr.value || attr.value.trim() === '')) {
          return;
        }
        attributes[attr.name] = attr.value;
      });
      
      // Create HTML preview for this ancestor
      const htmlPreview = this.createHtmlPreview(current);
      
      ancestors.push({
        tagName: current.tagName,
        id: current.id,
        className: current.className,
        attributes: attributes,
        htmlPreview: htmlPreview
      });
      
      current = current.parentElement;
    }
    
    return ancestors;
  }
  
  /**
   * Create a simplified HTML preview string for an element
   */
  private static createHtmlPreview(element: Element): string {
    // Create a simple HTML representation
    const tagName = element.tagName.toLowerCase();
    
    // Build attribute string with all attributes
    let attributesStr = '';
    Array.from(element.attributes).forEach(attr => {
      // Include all attributes (including id and class)
      let value = attr.value;
      
      // Truncate long attribute values
      if (value.length > 30) {
        value = value.substring(0, 27) + '...';
      }
      
      // Escape quotes in attribute values
      value = value.replace(/"/g, '&quot;');
      
      attributesStr += ` ${attr.name}="${value}"`;
    });
    
    // Get a preview of the inner content if present
    let contentPreview = '';
    if (element.textContent) {
      // Limit the length and sanitize text content
      const text = element.textContent.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;');
      contentPreview = text.length > 20 ? `${text.substring(0, 20)}...` : text;
    }
    
    return `<${tagName}${attributesStr}>${contentPreview ? contentPreview : ''}</${tagName}>`;
  }
  
  /**
   * Highlight an element on the page
   */
  public static highlightElement(element: Element): void {
    // First clear any existing highlights
    UIManager.clearHighlightedElements();
    
    // Then add our highlight class
    element.classList.add('dsn-highlighted-element');
    
    // Could also add outline style directly
    (element as HTMLElement).style.outline = '2px solid #3b82f6';
    (element as HTMLElement).style.outlineOffset = '2px';
  }
}
