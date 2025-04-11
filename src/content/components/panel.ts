import { ElementData, AncestorElement } from '../utils/types';

/**
 * Class for managing the selector panel UI
 */
export class Panel {
  /**
   * Inject the selector panel into the page
   */
  static injectSelectorPanel(_elementData: ElementData, _ancestorElements: AncestorElement[]): HTMLElement {
    console.log('DSN: Injecting selector panel...');
    
    // Create container for the panel
    const panelContainer = document.createElement('div');
    panelContainer.id = 'dsn-panel-container';
    panelContainer.classList.add('dsn-panel-container');
    
    // Create basic panel structure
    panelContainer.innerHTML = `
      <div id="dsn-panel-header" class="dsn-panel-header">
        <h2 class="dsn-panel-title">DOM Selector Ninja</h2>
        <button id="dsn-close-button" class="dsn-close-button">&times;</button>
      </div>
      
      <div class="dsn-panel-content">
        <!-- Panel content will be populated by the analyzer -->
      </div>
    `;
    
    // Add to the page
    document.body.appendChild(panelContainer);
    
    // Position panel
    this.positionPanel(panelContainer);
    
    return panelContainer;
  }
  
  /**
   * Position the panel within the viewport
   */
  private static positionPanel(panel: HTMLElement): void {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const panelWidth = Math.min(750, viewportWidth * 0.9);
    const panelHeight = Math.min(550, viewportHeight * 0.8);
    
    // Set appropriate size
    panel.style.width = `${panelWidth}px`;
    panel.style.height = `${panelHeight}px`;
    
    // Set panel position to be centered and fully visible
    const left = Math.max(10, Math.floor((viewportWidth - panelWidth) / 2));
    const top = Math.max(10, Math.floor((viewportHeight - panelHeight) / 2));
    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
    
    // Set min/max dimensions
    panel.style.minWidth = '400px';
    panel.style.minHeight = '300px';
    panel.style.maxWidth = `${viewportWidth - 20}px`;
    panel.style.maxHeight = `${viewportHeight - 20}px`;
    
    // Make sure the panel is resizable
    panel.style.resize = 'both';
    panel.style.overflow = 'hidden';
  }
}
