import { ElementData, AncestorElement } from '../utils/types';
import { registerAnalyzeFunction } from '../shared';
import { UIManager } from './ui-manager';
import { generateOptimalSelector } from '../utils/selector-builder';
import { Panel } from '../components/panel';

console.debug('DSN: Analyzer module loaded');

/**
 * Analyzes the selected DOM element
 */
function analyzeElement(event?: Event): void {
  console.debug('DSN: Beginning element selection process...');
  
  if (event) {
    event.preventDefault();
    event.stopPropagation();
    
    // Only process clicks, not other events
    if (event.type !== 'click') {
      return;
    }
    
    const clickEvent = event as MouseEvent;
    const targetElement = document.elementFromPoint(
      clickEvent.clientX, 
      clickEvent.clientY
    ) as HTMLElement;
    
    if (targetElement) {
      const result = processElement(targetElement);
      handleAnalysisResult(result, targetElement);
    }
  }
}

/**
 * Process an individual element and generate analysis
 */
function processElement(element: HTMLElement) {
  try {
    console.debug('DSN: Processing element:', element);
    
    // Create element data object
    const elementData: ElementData = {
      id: element.id || '',
      tagName: element.tagName,
      classNames: Array.from(element.classList),
      attributes: {}
    };
    
    // Collect attributes
    Array.from(element.attributes).forEach(attr => {
      elementData.attributes[attr.name] = attr.value;
    });
    
    // Get ancestor elements
    const ancestorElements = getAncestors(element);
    
    return { elementData, ancestorElements };
  } catch (error) {
    console.error('DSN: Error processing element:', error);
    return null;
  }
}

/**
 * Get ancestor elements of the target element
 */
function getAncestors(element: HTMLElement): AncestorElement[] {
  const ancestors: AncestorElement[] = [];
  let current = element.parentElement;
  
  while (current && current !== document.documentElement) {
    ancestors.push({
      tagName: current.tagName,
      id: current.id,
      className: current.className,
      attributes: {}
    });
    
    // Collect attributes
    Array.from(current.attributes).forEach(attr => {
      if (!ancestors[ancestors.length - 1].attributes) {
        ancestors[ancestors.length - 1].attributes = {};
      }
      ancestors[ancestors.length - 1].attributes![attr.name] = attr.value;
    });
    
    current = current.parentElement;
  }
  
  return ancestors;
}

/**
 * Handle the result of element analysis
 */
function handleAnalysisResult(result: any, element: HTMLElement): void {
  if (result) {
    console.debug('DSN: Analysis successful:', result);
    UIManager.highlightElement(element);
    
    // Create and inject the panel using the Panel class
    Panel.injectSelectorPanel(result.elementData, result.ancestorElements);
  } else {
    console.error('DSN: Analysis failed');
  }
}

/**
 * Initialize the analyzer module
 */
export function initializeAnalyzer(): void {
  console.debug('DSN: Initializing analyzer...');
  registerAnalyzeFunction(analyzeElement);
}
