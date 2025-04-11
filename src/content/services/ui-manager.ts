/**
 * Service for managing UI elements and interactions
 */
export class UIManager {
  // Store original styles to restore them later
  private static originalStyles = new Map<HTMLElement, {
    outline: string;
    position: string;
    zIndex: string;
  }>();
  
  /**
   * Highlight a selected element
   */
  static highlightElement(element: HTMLElement): void {
    console.debug('DSN: Highlighting element:', element);
    
    // Store original styles
    this.originalStyles.set(element, {
      outline: element.style.outline,
      position: element.style.position,
      zIndex: element.style.zIndex
    });
    
    // Apply highlighting styles
    element.style.outline = '2px solid red';
    element.style.position = element.style.position || 'relative';
    element.style.zIndex = '9999';
  }
  
  /**
   * Remove highlighting from all elements
   */
  static clearHighlights(): void {
    this.originalStyles.forEach((styles, element) => {
      if (element) {
        element.style.outline = styles.outline;
        element.style.position = styles.position;
        element.style.zIndex = styles.zIndex;
      }
    });
    
    this.originalStyles.clear();
  }
  
  /**
   * Clear any highlighted elements from previous selections
   */
  static clearHighlightedElements(): void {
    // Remove any existing highlights from previous selections
    const highlighted = document.querySelectorAll('.dsn-highlighted-element');
    highlighted.forEach(el => {
      el.classList.remove('dsn-highlighted-element');
      (el as HTMLElement).style.outline = '';
      (el as HTMLElement).style.outlineOffset = '';
    });
  }
  
  /**
   * Make an element draggable by its header
   */
  static makeDraggable(element: HTMLElement, dragHandle: HTMLElement): () => void {
    let isDragging = false;
    let startX = 0, startY = 0;
    let startPosX = 0, startPosY = 0;
    
    // Set up styles for dragging
    element.style.position = 'fixed';
    element.style.margin = '0';
    dragHandle.style.cursor = 'move';
    
    const startDrag = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Record starting positions
      startX = e.clientX;
      startY = e.clientY;
      
      const rect = element.getBoundingClientRect();
      startPosX = rect.left;
      startPosY = rect.top;
      
      isDragging = true;
      
      // Add event listeners for during and after dragging
      document.addEventListener('mousemove', doDrag);
      document.addEventListener('mouseup', stopDrag);
      
      // Add a class for visual feedback
      element.classList.add('dsn-dragging');
    };
    
    const doDrag = (e: MouseEvent) => {
      if (!isDragging) return;
      
      // Calculate how far the mouse has moved
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      
      // Calculate new position
      let newLeft = startPosX + dx;
      let newTop = startPosY + dy;
      
      // Keep the panel within viewport bounds
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const elementWidth = element.offsetWidth;
      const elementHeight = element.offsetHeight;
      
      newLeft = Math.max(10, Math.min(newLeft, viewportWidth - Math.min(100, elementWidth * 0.25)));
      newTop = Math.max(10, Math.min(newTop, viewportHeight - Math.min(50, elementHeight * 0.25)));
      
      // Update element position
      element.style.left = `${newLeft}px`;
      element.style.top = `${newTop}px`;
      
      e.preventDefault();
      e.stopPropagation();
    };
    
    const stopDrag = () => {
      isDragging = false;
      document.removeEventListener('mousemove', doDrag);
      document.removeEventListener('mouseup', stopDrag);
      element.classList.remove('dsn-dragging');
    };
    
    // Attach events to the handle
    dragHandle.addEventListener('mousedown', startDrag);
    
    // Return cleanup function
    return () => {
      dragHandle.removeEventListener('mousedown', startDrag);
      document.removeEventListener('mousemove', doDrag);
      document.removeEventListener('mouseup', stopDrag);
    };
  }
}

// Export the instance methods as standalone functions
export const clearHighlightedElements = UIManager.clearHighlightedElements.bind(UIManager);
