/**
 * Manages UI interactions and panel display
 */

import { ElementData, AncestorElement } from '@utils/types';
import { asHTMLElement } from '@utils/dom-types';
import { PSEUDO_ELEMENTS, PSEUDO_CLASSES, COMBINATOR_SELECTORS, NTH_SELECTOR_OPTIONS, NTH_PSEUDO_TYPES } from '../constants/selector-constants';
import { selectSelector, deselectSelector, updateCombinedSelector } from './selector-builder';

console.log('DSN-DEBUG: ui-manager.ts loaded');

// Add this interface near the top of the file with other imports
interface CombinatorChangeDetail {
  elementIndex: string;
  combinator: string | null;
}

/**
 * Manages UI components for the DOM Selector Ninja
 */
export class UIManager {
  private static panelContainer: HTMLElement | null = null;
  private static disableParentElements = true;
  
  /**
   * Show the selector panel for the selected element
   */
  public static showSelectorPanel(
    element: Element, 
    elementData: ElementData, 
    ancestors: AncestorElement[]
  ): void {
    console.log('DSN-DEBUG: showSelectorPanel called with element:', element);
    console.log('DSN-DEBUG: elementData:', JSON.stringify(elementData, null, 2));
    console.log('DSN-DEBUG: ancestors count:', ancestors.length);
    
    try {
      // Clear all selectors before showing the panel
      this.clearAllSelectors();
      
      // Remove any existing panel first
      this.removeExistingPanel();
      
      // Create and inject the panel
      this.createSelectorPanel(element, elementData, ancestors);
      console.log('DSN-DEBUG: Panel should now be visible');
    } catch (error) {
      console.error('DSN-DEBUG: Error in showSelectorPanel:', error);
    }
  }
  
  /**
   * Clear all selected selectors
   */
  private static clearAllSelectors(): void {
    // Reset the selected selectors map
    if ((window as any).dsnSelectedSelectors) {
      (window as any).dsnSelectedSelectors.clear();
    }
    
    // Reset any selection flags in selector-builder
    if (typeof deselectSelector === 'function') {
      // Reset any global selection state
      const event = new CustomEvent('dsn-reset-selectors');
      document.dispatchEvent(event);
    }
    
    // We'll also need to update the UI when the panel is created
  }
  
  /**
   * Create and inject the selector panel into the page
   */
  private static createSelectorPanel(
    element: Element, 
    elementData: ElementData, 
    ancestors: AncestorElement[]
  ): void {
    console.log('DSN-DEBUG: Creating selector panel');
    try {
      // Use element for something - adding a data attribute to the panel
      const panel = document.createElement('div');
      panel.id = 'dsn-panel-container';
      panel.className = 'dsn-panel-container';
      
      // Create header with title and close button
      const header = document.createElement('div');
      header.className = 'dsn-panel-header';
      header.id = 'dsn-panel-header';
      
      const title = document.createElement('h2');
      title.className = 'dsn-panel-title';
      title.textContent = 'DOM Selector Ninja';
      
      const closeBtn = document.createElement('button');
      closeBtn.className = 'dsn-close-button';
      closeBtn.id = 'dsn-close-button';
      closeBtn.innerHTML = '&times;';
      closeBtn.addEventListener('click', () => this.removeExistingPanel());
      
      header.appendChild(title);
      header.appendChild(closeBtn);
      panel.appendChild(header);
      
      panel.dataset.targetElement = element.tagName;
      
      // Use percentage-based dimensions (70% of viewport)
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const panelWidth = Math.min(Math.floor(viewportWidth * 0.7), 1000); // 70% of width, max 1000px
      const panelHeight = Math.min(Math.floor(viewportHeight * 0.7), 800); // 70% of height, max 800px
      
      // Calculate panel position to be centered
      const leftPosition = Math.max(0, Math.floor((viewportWidth - panelWidth) / 2));
      const topPosition = Math.max(0, Math.floor((viewportHeight - panelHeight) / 2));
      
      // Set panel style to ensure visibility with centered position
      panel.style.position = 'fixed';
      panel.style.top = `${topPosition}px`;
      panel.style.left = `${leftPosition}px`;
      panel.style.right = 'auto'; // Clear right position
      panel.style.width = `${panelWidth}px`;
      panel.style.height = `${panelHeight}px`;
      panel.style.backgroundColor = 'white';
      panel.style.color = 'black';
      panel.style.zIndex = '2147483647';
      panel.style.border = '1px solid #ccc';
      panel.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
      panel.style.minWidth = '400px';
      panel.style.minHeight = '300px';
      panel.style.maxWidth = `${viewportWidth - 40}px`;
      panel.style.maxHeight = `${viewportHeight - 40}px`;
      
      // Disable browser's built-in resize initially, we'll manually enable it later
      panel.style.resize = 'none';
      panel.style.overflow = 'hidden';
      
      // Add content div for scrollable content
      const content = document.createElement('div');
      content.className = 'dsn-panel-content';
      panel.appendChild(content);
      
      // Create the element hierarchy section
      const hierarchySection = document.createElement('div');
      hierarchySection.className = 'dsn-section';
      
      // Create a header container for title and checkbox
      const hierarchyHeader = document.createElement('div');
      hierarchyHeader.className = 'dsn-section-header';
      
      const hierarchyTitle = document.createElement('h3');
      hierarchyTitle.className = 'dsn-section-title';
      hierarchyTitle.textContent = 'Element Hierarchy';
      
      // Create the highlight checkbox
      const checkboxContainer = document.createElement('label');
      checkboxContainer.className = 'dsn-hierarchy-checkbox-container';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = 'dsn-highlight-elements';
      checkbox.className = 'dsn-highlight-checkbox';
      checkbox.checked = true; // Default to enabled
      
      const checkboxLabel = document.createElement('span');
      checkboxLabel.textContent = 'Highlight element';
      
      checkboxContainer.appendChild(checkbox);
      checkboxContainer.appendChild(checkboxLabel);
      
      hierarchyHeader.appendChild(hierarchyTitle);
      hierarchyHeader.appendChild(checkboxContainer);
      
      hierarchySection.appendChild(hierarchyHeader);
      
      // Create a container for the hierarchy cards
      const hierarchyContainer = document.createElement('div');
      hierarchyContainer.id = 'dsn-hierarchy-container';
      hierarchyContainer.className = 'dsn-hierarchy-container';
      
      // Create cards for each ancestor (in reverse order - closest ancestors first)
      ancestors.slice().reverse().forEach((ancestor, index) => {
        // Create card for this ancestor
        const card = document.createElement('div');
        card.className = 'dsn-card';
        
        // Card header with element info
        const cardHeader = document.createElement('div');
        cardHeader.className = `dsn-card-header ${index % 2 === 0 ? 'dsn-card-header-even' : ''}`;
        cardHeader.setAttribute('data-index', index.toString());
        
        // Element tag with attributes
        const elementTag = document.createElement('div');
        elementTag.className = 'dsn-element-text'; // Add class for easy selection
        elementTag.innerHTML = this.formatElementPreview(ancestor);
        
        // Chevron for expanding
        const chevron = document.createElement('div');
        chevron.className = 'dsn-chevron';
        chevron.innerHTML = '&#9660;'; // Down arrow
        
        cardHeader.appendChild(elementTag);
        cardHeader.appendChild(chevron);
        card.appendChild(cardHeader);
        
        // Card content (collapsed by default)
        const cardContent = document.createElement('div');
        cardContent.className = 'dsn-card-content';
        cardContent.style.display = 'none';
        cardContent.innerHTML = this.generateSelectorOptions(ancestor, index.toString());
        
        card.appendChild(cardContent);
        hierarchyContainer.appendChild(card);
      });
      
      // Add the selected element card
      const selectedCard = document.createElement('div');
      selectedCard.className = 'dsn-card';
      
      // Card header for selected element
      const selectedHeader = document.createElement('div');
      selectedHeader.className = 'dsn-card-header dsn-card-header-selected';
      selectedHeader.setAttribute('data-index', 'selected');
      
      // Element tag with attributes
      const selectedElementTag = document.createElement('div');
      selectedElementTag.className = 'dsn-element-text'; // Add class for easy selection
      selectedElementTag.innerHTML = this.formatElementPreview(elementData);
      
      // Chevron for expanding
      const selectedChevron = document.createElement('div');
      selectedChevron.className = 'dsn-chevron';
      selectedChevron.innerHTML = '&#9660;'; // Down arrow
      
      selectedHeader.appendChild(selectedElementTag);
      selectedHeader.appendChild(selectedChevron);
      selectedCard.appendChild(selectedHeader);
      
      // Card content for selected element (visible by default)
      const selectedContent = document.createElement('div');
      selectedContent.className = 'dsn-card-content dsn-card-content-selected';
      selectedContent.setAttribute('data-for', 'selected');
      selectedContent.style.display = 'block'; // Open by default
      selectedContent.innerHTML = this.generateSelectorOptions(elementData, 'selected');
      
      selectedCard.appendChild(selectedContent);
      hierarchyContainer.appendChild(selectedCard);
      
      hierarchySection.appendChild(hierarchyContainer);
      content.appendChild(hierarchySection);
      
      // Add Generated Selector section
      const selectorSection = document.createElement('div');
      
      const selectorTitle = document.createElement('h3');
      selectorTitle.className = 'dsn-section-title';
      selectorTitle.textContent = 'Generated Selector';
      content.appendChild(selectorTitle);
      
      const resultSection = document.createElement('div');
      resultSection.className = 'dsn-result-section';
      
      // Code container for the selector
      const codeContainer = document.createElement('div');
      codeContainer.className = 'dsn-code-container';
      codeContainer.setAttribute('tabindex', '0');
      
      const combinedSelector = document.createElement('code');
      combinedSelector.id = 'dsn-combined-selector';
      combinedSelector.className = 'dsn-combined-selector';
      combinedSelector.setAttribute('contenteditable', 'true');
      combinedSelector.setAttribute('spellcheck', 'false');
      combinedSelector.textContent = 'No elements selected';
      
      // Add copy button
      const copyButton = document.createElement('button');
      copyButton.id = 'dsn-copy-selector-button';
      copyButton.className = 'dsn-copy-button';
      copyButton.title = 'Copy selector to clipboard';
      
      const copyIcon = document.createElement('div');
      copyIcon.className = 'dsn-copy-icon';
      
      const copyFront = document.createElement('div');
      copyFront.className = 'dsn-copy-front';
      
      const copyBack = document.createElement('div');
      copyBack.className = 'dsn-copy-back';
      
      copyIcon.appendChild(copyFront);
      copyIcon.appendChild(copyBack);
      
      const copyTooltip = document.createElement('span');
      copyTooltip.className = 'dsn-copy-tooltip';
      copyTooltip.textContent = 'Copied!';
      
      copyButton.appendChild(copyIcon);
      copyButton.appendChild(copyTooltip);
      
      copyButton.addEventListener('click', () => {
        const selector = combinedSelector.textContent;
        if (selector && selector !== 'No elements selected') {
          navigator.clipboard.writeText(selector)
            .then(() => {
              copyButton.classList.add('copied');
              copyTooltip.classList.add('show');
              setTimeout(() => {
                copyTooltip.classList.remove('show');
                copyButton.classList.remove('copied');
              }, 2000);
            })
            .catch(err => {
              console.error('Failed to copy selector:', err);
            });
        }
      });
      
      codeContainer.appendChild(combinedSelector);
      codeContainer.appendChild(copyButton);
      
      // Add statistics container to hold both specificity and match count
      const statsContainer = document.createElement('div');
      statsContainer.className = 'dsn-stats-container';

      // Add specificity display
      const specificityContainer = document.createElement('div');
      specificityContainer.className = 'dsn-stat-item';

      const specificityLabel = document.createElement('span');
      specificityLabel.className = 'dsn-stat-label';
      specificityLabel.textContent = 'Specificity:';

      const specificityValue = document.createElement('span');
      specificityValue.id = 'dsn-specificity-value';
      specificityValue.className = 'dsn-stat-value';
      specificityValue.textContent = '0,0,0';

      specificityContainer.appendChild(specificityLabel);
      specificityContainer.appendChild(specificityValue);

      // Add match count in similar format
      const matchCountContainer = document.createElement('div');
      matchCountContainer.className = 'dsn-stat-item';

      const matchCountLabel = document.createElement('span');
      matchCountLabel.className = 'dsn-stat-label';
      matchCountLabel.textContent = 'Matches:';

      const matchCountValue = document.createElement('span');
      matchCountValue.id = 'dsn-match-count';
      matchCountValue.className = 'dsn-stat-value';
      matchCountValue.textContent = '0';

      matchCountContainer.appendChild(matchCountLabel);
      matchCountContainer.appendChild(matchCountValue);

      // Add specificity tooltip
      const specificityTooltip = document.createElement('div');
      specificityTooltip.className = 'dsn-specificity-tooltip';
      specificityTooltip.innerHTML = `
        <div class="dsn-tooltip-content">
          <p>Specificity determines which CSS rules apply to elements.</p>
          <p>Format: (a,b,c)</p>
          <ul>
            <li><strong>a:</strong> ID selectors</li>
            <li><strong>b:</strong> Class selectors, attributes, and pseudo-classes</li>
            <li><strong>c:</strong> Element selectors and pseudo-elements</li>
          </ul>
          <p>Higher values have higher precedence.</p>
        </div>
      `;
      specificityContainer.appendChild(specificityTooltip);

      // Add everything to the stats container
      statsContainer.appendChild(specificityContainer);
      statsContainer.appendChild(matchCountContainer);

      // Now add components to resultSection
      resultSection.appendChild(codeContainer);
      resultSection.appendChild(statsContainer);
      
      content.appendChild(resultSection);
      
      // Add a close button
      const closeButton = document.createElement('button');
      closeButton.className = 'dsn-panel-close-button';
      closeButton.textContent = 'Close Panel';
      closeButton.addEventListener('click', () => {
        console.log('DSN-DEBUG: Close button clicked');
        this.removeExistingPanel();
      });
      panel.appendChild(closeButton);
      
      // Store reference to the panel
      this.panelContainer = panel;
      
      // Add to the page
      document.body.appendChild(panel);
      
      console.log('DSN-DEBUG: Panel created and added to the DOM');
      
      // Set up event handlers for clicking on cards
      this.setupCardEventHandlers(panel);
      
      // Set up hover event handlers for highlighting DOM elements
      this.setupHoverEventHandlers(panel, element, ancestors);
      
      // Make panel draggable by header
      this.makePanelDraggable(panel, header);
      
      // Force a browser reflow before enabling resize - this prevents the initial jerk
      void panel.offsetWidth;
      
      // Now enable resize after a very brief delay
      setTimeout(() => {
        panel.style.resize = 'both';
        // Set up resize observer after resize is enabled
        this.setupResizeObserver(panel);
      }, 50);
      
      // Set up storage change listener
      this.setupStorageChangeListener(panel);
      
    } catch (error) {
      console.error('DSN-DEBUG: Error in createSelectorPanel:', error);
    }
  }
  
  /**
   * Format an element preview for display
   */
  private static formatElementPreview(element: ElementData | AncestorElement): string {
    let attributes = '';
    
    // Add ID if available
    if ('id' in element && element.id) {
      attributes += ` id="${element.id}"`;
    }
    
    // Add classes if available
    if ('classNames' in element && element.classNames && element.classNames.length) {
      attributes += ` class="${element.classNames.join(' ')}"`;
    } else if ('className' in element && element.className) {
      attributes += ` class="${element.className}"`;
    }
    
    // Add ALL attributes instead of just a predefined list
    if ('attributes' in element && element.attributes) {
      Object.entries(element.attributes).forEach(([attr, value]) => {
        // Skip id and class as they're already added above
        if (attr === 'id' || attr === 'class') return;
        
        // Skip empty attributes
        if (!value && value !== '') return;
        
        // Truncate long values
        const displayValue = value.length > 30 ? value.substring(0, 27) + '...' : value;
        
        // Escape quotes for proper HTML display
        const escapedValue = displayValue.replace(/"/g, '&quot;');
        
        attributes += ` ${attr}="${escapedValue}"`;
      });
    }
    
    return `&lt;${element.tagName.toLowerCase()}${attributes}&gt;`;
  }
  
  /**
   * Generate selector options HTML for an element
   */
  private static generateSelectorOptions(element: ElementData | AncestorElement, index: string): string {
    // Interface for selector items with type information
    interface SelectorItem {
      selector: string;
      type: string;
      displaySelector?: string; // Optional display version for pseudo-elements
    }
    
    // Core selectors (tag, ID)
    const coreSelectors: SelectorItem[] = [];
    
    // Add tag name
    const tagName = element.tagName.toLowerCase();
    coreSelectors.push({
      selector: tagName,
      type: 'tag'
    });
    
    // Add ID if available
    if ('id' in element && element.id) {
      coreSelectors.push({
        selector: `#${element.id}`,
        type: 'id'
      });
    }
    
    // Add pseudo-elements to core selectors
    PSEUDO_ELEMENTS.forEach(pseudo => {
      coreSelectors.push({
        selector: pseudo,
        type: 'pseudo'
      });
    });
    
    // Generate class selectors - add explicit type annotation
    const classSelectors: string[] = [];
    if ('classNames' in element && element.classNames && element.classNames.length) {
      element.classNames.forEach(cls => {
        if (cls && cls.trim()) {
          classSelectors.push(`.${cls.trim()}`);
        }
      });
    } else if ('className' in element && element.className) {
      const classes = element.className.split(' ').filter(c => c.trim());
      classes.forEach(cls => {
        classSelectors.push(`.${cls}`);
      });
    }
    
    // Add pseudo-classes to class selectors (excluding :not)
    PSEUDO_CLASSES.forEach(pseudoClass => {
      classSelectors.push(pseudoClass);
    });
    
    // Generate attribute selectors - add explicit type annotation
    const attributeSelectors: string[] = [];
    if ('attributes' in element && element.attributes) {
      Object.entries(element.attributes).forEach(([attr, value]) => {
        // Skip id and class as they're already shown separately
        if (attr === 'id' || attr === 'class') return;
        
        // Skip empty style attributes
        if (attr === 'style' && (!value || value.trim() === '')) return;
        
        const escapedValue = value.replace(/"/g, '\\"');
        attributeSelectors.push(`[${attr}="${escapedValue}"]`);
      });
    }
    
    // Generate HTML for the selector grid
    return `
      <div class="dsn-selector-grid">
        <!-- Core Selectors -->
        <div>
          <h4 class="dsn-category-title">Core</h4>
          <ul class="dsn-selector-list" data-type="core">
            ${coreSelectors.map(item => {
              // Only add ellipsis menu for tag and ID selectors, not pseudo elements
              const needsEllipsis = item.type === 'tag' || item.type === 'id';
              return `
                <li class="dsn-selector-item${item.type === 'pseudo' ? ' dsn-pseudo-item' : ''}" 
                    data-selector="${encodeURIComponent(item.selector)}" 
                    data-element-index="${index}"
                    data-selector-type="${item.type}">
                  <span class="dsn-selector-text">${item.displaySelector || item.selector}</span>
                  ${needsEllipsis ? `
                  <button class="dsn-ellipsis-icon" data-for-selector="${encodeURIComponent(item.selector)}" title="Options">
                    <span>⋮</span>
                  </button>
                  <div class="dsn-item-context-menu" style="display:none;">
                    <div class="dsn-menu-heading">${item.type === 'tag' ? 'Tag' : 'ID'} Options</div>
                    <div class="dsn-menu-content">
                      <label class="dsn-menu-item dsn-full-width-menu-item">
                        <input type="checkbox" class="dsn-menu-checkbox dsn-not-toggle">
                        Apply :not() modifier
                      </label>
                    </div>
                    <div class="dsn-menu-actions">
                      <button class="dsn-menu-apply-btn">Apply</button>
                      <button class="dsn-menu-cancel-btn">Cancel</button>
                    </div>
                  </div>
                  ` : ''}
                </li>
              `;
            }).join('')}
          </ul>
        </div>
        
        <!-- Class Selectors -->
        <div>
          <h4 class="dsn-category-title">Class</h4>
          <ul class="dsn-selector-list" data-type="class">
            ${classSelectors.length ? classSelectors.map(selector => {
              const isPseudoClass = selector.startsWith(':');
              return `
                <li class="dsn-selector-item${isPseudoClass ? ' dsn-pseudo-class-item' : ''}" 
                    data-selector="${encodeURIComponent(selector)}" 
                    data-element-index="${index}"
                    data-selector-type="${isPseudoClass ? 'pseudo-class' : 'class'}">
                  <span class="dsn-selector-text">${selector}</span>
                  <button class="dsn-ellipsis-icon" data-for-selector="${encodeURIComponent(selector)}" title="Options">
                    <span>⋮</span>
                  </button>
                  <div class="dsn-item-context-menu" style="display:none;">
                    <div class="dsn-menu-heading">${isPseudoClass ? 'Pseudo-class' : 'Class'} Options</div>
                    <div class="dsn-menu-content">
                      ${this.generateNthOptionsIfApplicable(selector)}
                      <label class="dsn-menu-item dsn-full-width-menu-item">
                        <input type="checkbox" class="dsn-menu-checkbox dsn-not-toggle">
                        Apply :not() modifier
                      </label>
                    </div>
                    <div class="dsn-menu-actions">
                      <button class="dsn-menu-apply-btn">Apply</button>
                      <button class="dsn-menu-cancel-btn">Cancel</button>
                    </div>
                  </div>
                </li>
              `;
            }).join('') : '<li class="dsn-selector-item dsn-empty-list">No classes available</li>'}
          </ul>
        </div>
        
        <!-- Attribute Selectors -->
        <div>
          <h4 class="dsn-category-title">Attribute</h4>
          <ul class="dsn-selector-list" data-type="attribute">
            ${attributeSelectors.length ? attributeSelectors.map(selector => `
              <li class="dsn-selector-item" 
                  data-selector="${encodeURIComponent(selector)}" 
                  data-element-index="${index}"
                  data-selector-type="attribute">
                <span class="dsn-selector-text">${selector}</span>
                <button class="dsn-ellipsis-icon" data-for-selector="${encodeURIComponent(selector)}" title="Options">
                  <span>⋮</span>
                </button>
                <div class="dsn-item-context-menu" style="display:none;">
                  <div class="dsn-menu-heading">Attribute Options</div>
                  <div class="dsn-menu-content">
                    <label class="dsn-menu-item dsn-full-width-menu-item">
                      <input type="checkbox" class="dsn-menu-checkbox dsn-not-toggle">
                      Apply :not() modifier
                    </label>
                    
                    <div class="dsn-menu-divider"></div>
                    
                    <div class="dsn-menu-group">
                      <label class="dsn-menu-label">Operator:</label>
                      <div class="dsn-select-container">
                        <select class="dsn-attribute-operator">
                          <option value="=">= (Exact match)</option>
                          <option value="*=">*= (Contains)</option>
                          <option value="^=">^= (Starts with)</option>
                          <option value="$=">$= (Ends with)</option>
                          <option value="~=">~= (Word in list)</option>
                          <option value="|=">|= (Starts with prefix)</option>
                          <option value="">(Attribute exists)</option>
                        </select>
                      </div>
                    </div>
                    
                    <div class="dsn-menu-group">
                      <label class="dsn-menu-label">Value:</label>
                      <div class="dsn-input-container">
                        <input type="text" class="dsn-attribute-value" value="${selector.match(/="([^"]*)"/)?.[1] || ''}">
                        <button class="dsn-reset-button" title="Reset to original value">↺</button>
                      </div>
                    </div>
                  </div>
                  <div class="dsn-menu-actions">
                    <button class="dsn-menu-apply-btn">Apply</button>
                    <button class="dsn-menu-cancel-btn">Cancel</button>
                  </div>
                </div>
              </li>
            `).join('') : '<li class="dsn-selector-item dsn-empty-list">No attributes available</li>'}
          </ul>
        </div>
        
        <!-- Combinator Selectors -->
        <div>
          <h4 class="dsn-category-title">Combinator</h4>
          <ul class="dsn-selector-list dsn-combinator-list" data-type="combinator">
            ${COMBINATOR_SELECTORS.map(combo => {
              const displayChar = combo.value === ' ' ? '&nbsp;' : combo.value;
              const disabledClass = combo.disabled ? 'dsn-combinator-disabled' : '';
              
              return `<li class="dsn-selector-item ${disabledClass}" 
                        data-selector="${combo.value}" 
                        data-element-index="${index}" 
                        data-selector-type="combinator"
                        ${combo.disabled ? 'data-disabled="true"' : ''}>
                       <span class="dsn-combinator-symbol">${displayChar}</span>
                       <span class="dsn-combinator-description">${combo.display}</span>
                       ${combo.disabled && combo.tooltip ? `<span class="dsn-tooltip">${combo.tooltip}</span>` : ''}
                     </li>`;
            }).join('')}
          </ul>
        </div>
      </div>
    `;
  }
  
  /**
   * Set up listener for storage changes to update panel behavior
   */
  private static setupStorageChangeListener(panel: HTMLElement): void {
    // Listen for changes to storage
    if (chrome && chrome.storage) {
      chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'sync' && changes.disableParentElements) {
          const newValue = changes.disableParentElements.newValue;
          console.log('DSN-DEBUG: Storage setting changed - disableParentElements:', newValue);
          
          // Update our internal state
          this.disableParentElements = newValue !== false;
          
          // Re-apply ID-related disabled states based on new setting
          this.updateDisabledStatesForSetting(panel);
        }
      });
      
      // Initialize setting
      chrome.storage.sync.get(['disableParentElements'], (result) => {
        this.disableParentElements = result.disableParentElements !== false;
        console.log('DSN-DEBUG: Initialized disableParentElements:', this.disableParentElements);
        
        // Apply initial state
        if (panel) {
          this.updateDisabledStatesForSetting(panel);
        }
      });
    }
  }
  
  /**
   * Update disabled states based on current setting and ID selections
   */
  private static updateDisabledStatesForSetting(panel: HTMLElement): void {
    // Find if any ID selectors are currently selected
    const idSelectors = panel.querySelectorAll('.dsn-selector-item[data-selector-type="id"].dsn-selected');
    
    if (idSelectors.length > 0) {
      // At least one ID is selected
      
      // Find the largest index (furthest from root) of elements with ID selectors
      let idElementIndex = -1;
      idSelectors.forEach(selector => {
        const selectorIndex = selector.getAttribute('data-element-index');
        if (selectorIndex && selectorIndex !== 'selected') {
          const selectorIndexNum = parseInt(selectorIndex);
          if (selectorIndexNum > idElementIndex) {
            idElementIndex = selectorIndexNum;
          }
        }
      });
      
      if (idElementIndex > -1) {
        // If setting is enabled, disable parent elements
        if (this.disableParentElements) {
          console.log('DSN-DEBUG: Re-applying disabled state for ID at index', idElementIndex);
          this.updateElementsDisabledStateForId(panel, true, idElementIndex);
        } else {
          // Setting is disabled, remove disabled states
          console.log('DSN-DEBUG: Removing disabled state due to setting change');
          this.updateElementsDisabledStateForId(panel, false);
        }
      }
    }
    
    // Update the combined selector to reflect changes
    updateCombinedSelector();
  }
  
  /**
   * Set up event handlers for card headers and content
   */
  private static setupCardEventHandlers(panel: HTMLElement): void {
    // Find all card headers
    const cardHeaders = panel.querySelectorAll('.dsn-card-header');
    
    cardHeaders.forEach(header => {
      header.addEventListener('click', () => {
        const index = header.getAttribute('data-index');
        if (!index) return;
        
        // Find the card content
        let content: HTMLElement | null;
        
        if (index === 'selected') {
          content = panel.querySelector('.dsn-card-content[data-for="selected"]') as HTMLElement;
        } else {
          content = header.nextElementSibling as HTMLElement;
        }
        
        if (!content) return;
        
        // Check if the clicked card is already open
        const isCurrentlyOpen = content.style.display === 'block';
        
        // Find the chevron
        const chevron = header.querySelector('.dsn-chevron');
        
        // First, close all open cards
        const allCards = panel.querySelectorAll('.dsn-card-content');
        const allChevrons = panel.querySelectorAll('.dsn-chevron');
        
        allCards.forEach(card => {
          if (card !== content) {
            (card as HTMLElement).style.display = 'none';
          }
        });
        
        allChevrons.forEach(chev => {
          if (chev !== chevron) {
            chev.innerHTML = '&#9660;'; // Down arrow for closed cards
          }
        });
        
        // Toggle the clicked card as before
        if (isCurrentlyOpen) {
          content.style.display = 'none';
          if (chevron) {
            chevron.innerHTML = '&#9660;'; // Down arrow
          }
        } else {
          content.style.display = 'block';
          if (chevron) {
            chevron.innerHTML = '&#9650;'; // Up arrow
          }
        }
      });
    });
    
    // Add event handlers for selector items
    const selectorItems = panel.querySelectorAll('.dsn-selector-item');
    
    selectorItems.forEach(item => {
      const selectorElement = item as HTMLElement;
      const elementIndex = selectorElement.getAttribute('data-element-index') || '';
      
      // Initially none should be selected since we clear on panel open
      selectorElement.classList.remove('dsn-selected');
      
      item.addEventListener('click', () => {
        // Skip if disabled
        if (selectorElement.hasAttribute('data-disabled') && 
            selectorElement.getAttribute('data-disabled') === 'true') {
          return;
        }
        
        // Read current values from DOM at click time (not at setup time)
        const selector = decodeURIComponent(selectorElement.getAttribute('data-selector') || '');
        const selectorType = selectorElement.getAttribute('data-selector-type') || '';
        
        // Toggle selection state
        if (selectorElement.classList.contains('dsn-selected')) {
          // Deselect
          selectorElement.classList.remove('dsn-selected');
          deselectSelector(elementIndex, selector, selectorType);
          
          // If deselecting a pseudo-element, re-enable disabled elements
          if (selectorType === 'pseudo') {
            this.updateElementsDisabledStateForPseudo(panel, false);
          }
          
          // If deselecting an ID, re-enable disabled elements
          if (selectorType === 'id') {
            this.updateElementsDisabledStateForId(panel, false);
          }
          
          // Note: We don't restore original selector attributes when deselecting
          // The :not modifier state should persist until explicitly unchecked by the user
        } else {
          // Select
          selectorElement.classList.add('dsn-selected');
          
          // Special handling for combinators - they're mutually exclusive
          if (selectorType === 'combinator') {
            // Deselect any other selected combinator in the same group
            const combinatorList = selectorElement.closest('.dsn-combinator-list');
            if (combinatorList) {
              const otherCombinators = combinatorList.querySelectorAll('.dsn-selector-item.dsn-selected');
              otherCombinators.forEach(combo => {
                if (combo !== selectorElement) {
                  combo.classList.remove('dsn-selected');
                  const comboSelector = decodeURIComponent(combo.getAttribute('data-selector') || '');
                  const comboIndex = combo.getAttribute('data-element-index') || '';
                  // Fix: Ensure we pass string values, not unknown
                  deselectSelector(comboIndex, comboSelector, 'combinator');
                }
              });
            }
          }
          
          // Fix: Ensure all arguments are strings
          selectSelector(elementIndex, selector, selectorType);
          
          // If this is a pseudo-element, disable all elements after this in the hierarchy
          if (selectorType === 'pseudo') {
            this.updateElementsDisabledStateForPseudo(panel, true, parseInt(elementIndex) || 0);
          }
          
          // If this is an ID, check settings before disabling parent elements
          if (selectorType === 'id') {
            this.updateElementsDisabledStateForId(panel, true, parseInt(elementIndex) || 0);
          }
        }
        
        // Update hierarchy element styling based on selection state
        this.updateHierarchyElementStyling(panel);
      });
    });
    
    // Add event handlers for ellipsis icons and context menus
    const setupContextMenus = () => {
      console.log('DSN-DEBUG: Setting up context menus');
      
      // First, ensure all menus are initially hidden and have proper styles
      panel.querySelectorAll('.dsn-item-context-menu').forEach(menu => {
        (menu as HTMLElement).style.display = 'none';
        (menu as HTMLElement).style.position = 'absolute';
        (menu as HTMLElement).style.zIndex = '1000';
      });
      
      // Using event delegation for efficiency
      panel.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const ellipsisIcon = target.closest('.dsn-ellipsis-icon');
        
        if (ellipsisIcon) {
          console.log('DSN-DEBUG: Ellipsis icon clicked!', ellipsisIcon.outerHTML);
          e.preventDefault();
          e.stopPropagation(); // Prevent triggering the selector item click
          
          const selectorItem = ellipsisIcon.closest('.dsn-selector-item');
          if (!selectorItem) {
            console.error('DSN-DEBUG: Parent .dsn-selector-item not found for ellipsis.');
            return;
          }
          
          const contextMenu = selectorItem.querySelector('.dsn-item-context-menu') as HTMLElement;
          if (!contextMenu) {
            console.error('DSN-DEBUG: .dsn-item-context-menu not found within selector item.');
            console.log('DSN-DEBUG: Selector item HTML:', selectorItem.outerHTML);
            return;
          }
          
          // Hide all other menus first
          panel.querySelectorAll('.dsn-item-context-menu').forEach(menu => {
            if (menu !== contextMenu) {
              (menu as HTMLElement).style.display = 'none';
            }
          });
          
          // Toggle this menu using display property instead of class
          const isCurrentlyVisible = contextMenu.style.display === 'block';
          if (isCurrentlyVisible) {
            contextMenu.style.display = 'none';
            console.log('DSN-DEBUG: Context menu hidden');
          } else {
            // Position the menu correctly relative to the panel
            const ellipsisRect = ellipsisIcon.getBoundingClientRect();
            const selectorItemRect = selectorItem.getBoundingClientRect();
            const panelRect = panel.getBoundingClientRect();
            const panelContent = panel.querySelector('.dsn-panel-content') as HTMLElement;
            
            // First make the menu visible but with opacity 0 to measure its size
            contextMenu.style.position = 'absolute'; // Ensure position is absolute
            contextMenu.style.top = '0';
            contextMenu.style.left = '0';
            contextMenu.style.opacity = '0';
            contextMenu.style.display = 'block';
            
            // Now that it's visible, get its dimensions
            const menuWidth = contextMenu.offsetWidth;
            const menuHeight = contextMenu.offsetHeight;
            
            // Important: These coordinates are relative to the content area of the panel
            // We need to position within the panel's coordinate system
            const panelContentRect = panelContent.getBoundingClientRect();
            
            // Calculate position relative to the panel (not the page)
            // Since the menu is a child of the selector item, we need to position it
            // relative to the panel's content area origin
            console.log('DSN-DEBUG: Panel content rect:', panelContentRect);
            console.log('DSN-DEBUG: Ellipsis rect:', ellipsisRect);
            console.log('DSN-DEBUG: Selector item rect:', selectorItemRect);
            let top = selectorItemRect.bottom + 5; // 5px gap below item
            console.log('DSN-DEBUG: Top position:', top);
            let left = selectorItemRect.left + panelContentRect.left;
            console.log('DSN-DEBUG: Left position:', left);
            
            // Account for panel content scrolling
//            top += panelContent.scrollTop;
//            left += panelContent.scrollLeft;
            
            // Check boundaries and adjust
            const contentWidth = panelContent.clientWidth;
            const contentHeight = panelContent.clientHeight;
            
            // Ensure menu doesn't go off the right edge
            if (left + menuWidth > ellipsisRect.left - 10) {
              console.log('DSN-DEBUG: left + menuWidth > contentWidth - 10: ',left, menuWidth, contentWidth);
              left = ellipsisRect.left - menuWidth - 10;
            }
            
            // Ensure menu doesn't go off left edge
            if (left < 10) {
              left = 10;
            }
            
            // If menu would go off bottom edge, position it above the selector item instead
            if (top + menuHeight > panelContentRect.bottom - 10) {
              console.log('DSN-DEBUG: Changing top position:', top, panelContentRect.top, panelContentRect.bottom, menuHeight);
              top = panelContentRect.bottom - menuHeight - 5; // Position above with 5px gap
              console.log('DSN-DEBUG: Changing top position:', top);
//              top += panelContent.scrollTop; // Adjust for scroll
            }
            
            console.log('DSN-DEBUG: Top position:', top);
            // Set the final position and make visible
            contextMenu.style.top = `${top}px`;
            contextMenu.style.left = `${left}px`;
            contextMenu.style.opacity = '1';

            console.log('DSN-DEBUG: Context menu shown at', {
              top,
              left,
              selectorItemRect,
              panelContentRect,
              scrollTop: panelContent.scrollTop,
              scrollLeft: panelContent.scrollLeft
            });
          }
        }
      }, true); // Use capture phase
    };
    
    // Call the setup function
    setupContextMenus();
    
    // Close menus when clicking outside
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.dsn-item-context-menu') && !target.closest('.dsn-ellipsis-icon')) {
        console.log('DSN-DEBUG: Click outside menu/ellipsis, hiding all menus');
        panel.querySelectorAll('.dsn-item-context-menu').forEach(menu => {
          (menu as HTMLElement).style.display = 'none';
        });
      }
    }, true);
    
    // Prevent click propagation in menus, but not for buttons
    panel.querySelectorAll('.dsn-item-context-menu').forEach(menu => {
      menu.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        
        // Don't stop propagation for buttons so they can be handled by the panel click handler
        if (!target.matches('.dsn-menu-apply-btn') && !target.matches('.dsn-menu-cancel-btn')) {
          e.stopPropagation();
        }
      });
    });
    
    // Handle attribute selector menu buttons - add reset button handler
    panel.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      
      // Handle reset button for attribute value
      if (target.matches('.dsn-reset-button')) {
        console.log('DSN-DEBUG: Reset button clicked');
        e.preventDefault();
        e.stopPropagation();
        
        const menu = target.closest('.dsn-item-context-menu') as HTMLElement;
        const selectorItem = menu?.closest('.dsn-selector-item');
        if (!menu || !selectorItem) return;
        
        // Get the original selector to extract the original value
        const originalSelectorAttr = selectorItem.getAttribute('data-original-selector') || 
                                     selectorItem.getAttribute('data-selector');
        
        if (originalSelectorAttr) {
          const originalSelector = decodeURIComponent(originalSelectorAttr);
          
          // Extract the original value from the selector
          const valueMatch = originalSelector.match(/="([^"]*)"/);
          const originalValue = valueMatch ? valueMatch[1] : '';
          
          // Find the value input and reset it
          const valueInput = menu.querySelector('.dsn-attribute-value') as HTMLInputElement;
          if (valueInput) {
            console.log('DSN-DEBUG: Resetting value from', valueInput.value, 'to', originalValue);
            valueInput.value = originalValue;
            
            // Also reset the operator to its original state
            const operatorSelect = menu.querySelector('.dsn-attribute-operator') as HTMLSelectElement;
            if (operatorSelect) {
              // Determine original operator
              let originalOperator = '='; // Default
              if (originalSelector.includes('*=')) originalOperator = '*=';
              else if (originalSelector.includes('^=')) originalOperator = '^=';
              else if (originalSelector.includes('$=')) originalOperator = '$=';
              else if (originalSelector.includes('~=')) originalOperator = '~=';
              else if (originalSelector.includes('|=')) originalOperator = '|=';
              else if (!originalSelector.includes('=')) originalOperator = ''; // attribute exists only
              
              operatorSelect.value = originalOperator;
              console.log('DSN-DEBUG: Reset operator to', originalOperator);
            }
          }
        }
      }
      
      // Handle apply button
      if (target.matches('.dsn-menu-apply-btn')) {
        console.log('DSN-DEBUG: Apply button clicked');
        const menu = target.closest('.dsn-item-context-menu') as HTMLElement;
        if (menu) {
          const selectorItem = menu.closest('.dsn-selector-item') as HTMLElement;
          if (!selectorItem) return;
          
          const selectorType = selectorItem.getAttribute('data-selector-type') || '';
          const elementIndex = selectorItem.getAttribute('data-element-index') || '';
          // Use original selector if available, otherwise use current selector
          const originalSelector = selectorItem.getAttribute('data-original-selector') 
            ? decodeURIComponent(selectorItem.getAttribute('data-original-selector') || '')
            : decodeURIComponent(selectorItem.getAttribute('data-selector') || '');
          
          // Process attribute-specific changes if this is an attribute selector
          if (selectorType === 'attribute') {
            const operatorSelect = menu.querySelector('.dsn-attribute-operator') as HTMLSelectElement;
            const valueInput = menu.querySelector('.dsn-attribute-value') as HTMLInputElement;
            
            if (operatorSelect && valueInput) {
              // Process the attribute changes
              this.handleAttributeChanges(operatorSelect, valueInput, selectorItem, originalSelector, elementIndex);
            }
          }
          
          // Process nth pseudo-selector changes if this is an nth selector
          // Check current selector, not original, in case it was already modified
          const currentSelector = decodeURIComponent(selectorItem.getAttribute('data-selector') || '');
          if (this.isNthPseudoSelector(currentSelector) || this.isNthPseudoSelector(originalSelector)) {
            const nthSelect = menu.querySelector('.dsn-nth-select') as HTMLSelectElement;
            const customInput = menu.querySelector('.dsn-nth-custom') as HTMLInputElement;
            
            if (nthSelect) {
              // Process the nth parameter changes
              this.handleNthChanges(nthSelect, customInput, selectorItem, originalSelector, elementIndex);
            }
          }
          
          // Process the :not modifier for ALL selector types
          const notToggle = menu.querySelector('.dsn-not-toggle') as HTMLInputElement;
          if (notToggle) {
            // Get the updated selector after any previous changes (attribute, nth, etc.)
            const currentSelector = decodeURIComponent(selectorItem.getAttribute('data-selector') || '');
            
            // Get the original selector type (for :not modifiers, we need the underlying type)
            const originalSelectorType = selectorItem.getAttribute('data-original-type') || selectorType;
            
            // Apply or remove the :not modifier
            this.handleNotToggle(notToggle, selectorItem, currentSelector, elementIndex, originalSelectorType);
          }
          
          // Explicitly close the menu
          menu.style.display = 'none';
          console.log('DSN-DEBUG: Menu closed after apply');
          
          // Stop propagation after handling to prevent double processing
          e.stopPropagation();
        }
      }
      
      // Handle cancel button - use our centralized cancel handler
      if (target.matches('.dsn-menu-cancel-btn')) {
        console.log('DSN-DEBUG: Cancel button clicked');
        const menu = target.closest('.dsn-item-context-menu') as HTMLElement;
        if (menu) {
          const selectorItem = menu.closest('.dsn-selector-item');
          if (selectorItem) {
            // Fix the type error by casting selectorItem to HTMLElement
            this.handleMenuCancel(menu, selectorItem as HTMLElement);
          }
          
          // Stop propagation
          e.stopPropagation();
        }
      }
    }, true); // Use capture phase to ensure this runs before other handlers

    // Handle nth selector dropdown changes
    panel.addEventListener('change', (e) => {
      const target = e.target as HTMLElement;
      
      if (target.matches('.dsn-nth-select')) {
        const select = target as HTMLSelectElement;
        const customContainer = select.closest('.dsn-menu-group')?.querySelector('.dsn-custom-input-container') as HTMLElement;
        
        if (customContainer) {
          // Show/hide custom input based on selection
          if (select.value === 'custom') {
            customContainer.style.display = 'block';
            const customInput = customContainer.querySelector('.dsn-nth-custom') as HTMLInputElement;
            if (customInput) {
              customInput.focus();
            }
          } else {
            customContainer.style.display = 'none';
          }
        }
      }
    });
  }
  
  /**
   * Find the combinator list for a specific element
   */
  private static findCombinatorList(panel: HTMLElement, elementIndex: string): HTMLElement | null {
    // Find the card with this index
    const cardHeader = panel.querySelector(`.dsn-card-header[data-index="${elementIndex}"]`);
    if (!cardHeader) return null;
    
    // Find its content
    const content = elementIndex === 'selected' 
      ? panel.querySelector('.dsn-card-content[data-for="selected"]')
      : cardHeader.nextElementSibling;
    
    if (!content) return null;
    
    // Find the combinator list within content
    return content.querySelector('.dsn-combinator-list') as HTMLElement;
  }
  
  /**
   * Update the disabled state of elements after a pseudo-element selection
   */
  private static updateElementsDisabledStateForPseudo(panel: HTMLElement, isDisabled: boolean, pseudoElementIndex: number = 0): void {
    // Check if there's an active ID selector
    const hasActiveIdSelector = panel.querySelector('.dsn-disabled-id') !== null;
    
    // Get all card headers that should be affected by pseudo-element selection
    const cardHeaders = panel.querySelectorAll('.dsn-card-header');
    
    // Remove pseudo-specific disabled states when turning off
    if (!isDisabled) {
      cardHeaders.forEach(header => {
        // Only remove pseudo-related classes, preserve ID-related ones if present
        header.classList.remove('dsn-disabled-pseudo');
        
        // Only completely remove the disabled class if it's not also disabled by ID
        const headerIndex = header.getAttribute('data-index');
        if (!headerIndex) return;
        
        const index = parseInt(headerIndex);
        const isDisabledById = hasActiveIdSelector && this.shouldBeDisabledById(panel, index);
        
        if (!isDisabledById) {
          header.classList.remove('dsn-disabled');
          
          // Re-enable selector items
          const content = header.nextElementSibling as HTMLElement;
          if (content) {
            const selectors = content.querySelectorAll('.dsn-selector-item');
            selectors.forEach(selector => {
              (selector as HTMLElement).removeAttribute('data-disabled');
            });
          }
        }
      });
      
      // Handle the message
      const pseudoMessage = panel.querySelector('.dsn-pseudo-message') as HTMLElement;
      if (pseudoMessage) {
        pseudoMessage.remove();
      }
      
      // Update combined selector
      updateCombinedSelector();
      return;
    }
    
    // Only proceed with disabling if isDisabled is true
    cardHeaders.forEach(header => {
      const headerIndex = header.getAttribute('data-index');
      if (!headerIndex || headerIndex === 'selected') return;
      
      const index = parseInt(headerIndex);
      
      // Disable elements that come after the pseudo-element in the hierarchy
      if (index > pseudoElementIndex) {
        header.classList.add('dsn-disabled', 'dsn-disabled-pseudo');
        
        // Find all selector items for this element and disable them
        const content = header.nextElementSibling as HTMLElement;
        if (content) {
          const selectors = content.querySelectorAll('.dsn-selector-item');
          selectors.forEach(selector => {
            (selector as HTMLElement).setAttribute('data-disabled', 'true');
            
            // If it was selected, deselect it
            if (selector.classList.contains('dsn-selected')) {
              selector.classList.remove('dsn-selected');
              const selectorValue = selector.getAttribute('data-selector') || '';
              const selectorType = selector.getAttribute('data-selector-type') || '';
              deselectSelector(headerIndex, decodeURIComponent(selectorValue), selectorType);
            }
          });
        }
      }
    });
    
    // Update combined selector to reflect changes
    updateCombinedSelector();
  }
  
  /**
   * Update the disabled state of elements before an element with ID selection
   */
  private static updateElementsDisabledStateForId(panel: HTMLElement, isDisabled: boolean, idElementIndex: number = 0): void {
    // First check if parent elements should be disabled based on settings
    chrome.storage.sync.get(['disableParentElements'], (result) => {
      // If the setting is explicitly false, don't disable parent elements
      if (result.disableParentElements === false) {
        console.log('DSN-DEBUG: Not disabling parent elements due to user setting');
        
        // If we're turning off disabled state, continue with that
        if (!isDisabled) {
          this.removeIdRelatedDisabledState(panel);
        }
        
        // Still update the selector to reflect changes
        updateCombinedSelector();
        return;
      }
      
      // Proceed with normal behavior if setting is true or not set (default to true)
      if (!isDisabled) {
        this.removeIdRelatedDisabledState(panel);
      } else {
        this.applyIdRelatedDisabledState(panel, idElementIndex);
      }
      
      // Update combined selector to reflect changes
      updateCombinedSelector();
    });
  }
  
  /**
   * Remove ID-related disabled state from elements
   */
  private static removeIdRelatedDisabledState(panel: HTMLElement): void {
    // Check if there's an active pseudo-element selector
    const hasActivePseudoSelector = panel.querySelector('.dsn-disabled-pseudo') !== null;
    
    // Get all card headers that should be affected by ID selection
    const cardHeaders = panel.querySelectorAll('.dsn-card-header');
    
    cardHeaders.forEach(header => {
      // Only remove ID-related classes, preserve pseudo-related ones if present
      header.classList.remove('dsn-disabled-id');
      
      // Only completely remove the disabled class if it's not also disabled by pseudo
      const headerIndex = header.getAttribute('data-index');
      if (!headerIndex) return;
      
      const index = parseInt(headerIndex);
      const isDisabledByPseudo = hasActivePseudoSelector && this.shouldBeDisabledByPseudo(panel, index);
      
      if (!isDisabledByPseudo) {
        header.classList.remove('dsn-disabled');
        
        // Re-enable selector items visually, but don't change their selection state
        const content = header.nextElementSibling as HTMLElement;
        if (content) {
          const selectors = content.querySelectorAll('.dsn-selector-item');
          selectors.forEach(selector => {
            (selector as HTMLElement).removeAttribute('data-disabled');
          });
        }
      }
    });
    
    // Handle the message
    const idMessage = panel.querySelector('.dsn-id-message') as HTMLElement;
    if (idMessage) {
      idMessage.remove();
    }
  }
  
  /**
   * Apply ID-related disabled state to elements
   */
  private static applyIdRelatedDisabledState(panel: HTMLElement, idElementIndex: number): void {
    // Get all card headers that should be affected by ID selection
    const cardHeaders = panel.querySelectorAll('.dsn-card-header');
    
    cardHeaders.forEach(header => {
      const headerIndex = header.getAttribute('data-index');
      if (!headerIndex || headerIndex === 'selected') return;
      
      const index = parseInt(headerIndex);
      
      // Disable elements that come before the element with ID in the hierarchy
      if (index < idElementIndex) {
        header.classList.add('dsn-disabled', 'dsn-disabled-id');
        
        // Find all selector items for this element and mark them as disabled
        // BUT don't change their selection state
        const content = header.nextElementSibling as HTMLElement;
        if (content) {
          const selectors = content.querySelectorAll('.dsn-selector-item');
          selectors.forEach(selector => {
            (selector as HTMLElement).setAttribute('data-disabled', 'true');
          });
        }
      }
    });
  }
  
  /**
   * Helper method to check if an element should be disabled based on pseudo-element selection
   */
  private static shouldBeDisabledByPseudo(panel: HTMLElement, index: number): boolean {
    // Find the active pseudo-element index
    const pseudoSelectors = panel.querySelectorAll('.dsn-selector-item[data-selector-type="pseudo"].dsn-selected');
    if (pseudoSelectors.length === 0) return false;
    
    // Find the smallest index (closest to root) of elements with pseudo-elements
    let pseudoElementIndex = Infinity;
    pseudoSelectors.forEach(selector => {
      const selectorIndex = selector.getAttribute('data-element-index');
      if (selectorIndex && selectorIndex !== 'selected') {
        const selectorIndexNum = parseInt(selectorIndex);
        if (selectorIndexNum < pseudoElementIndex) {
          pseudoElementIndex = selectorIndexNum;
        }
      }
    });
    
    // Elements after the pseudo-element should be disabled
    return index > pseudoElementIndex;
  }
  
  /**
   * Helper method to check if an element should be disabled based on ID selection
   */
  private static shouldBeDisabledById(panel: HTMLElement, index: number): boolean {
    // Find the active ID selector index
    const idSelectors = panel.querySelectorAll('.dsn-selector-item[data-selector-type="id"].dsn-selected');
    if (idSelectors.length === 0) return false;
    
    // Find the largest index (furthest from root) of elements with ID selectors
    let idElementIndex = -1;
    idSelectors.forEach(selector => {
      const selectorIndex = selector.getAttribute('data-element-index');
      if (selectorIndex && selectorIndex !== 'selected') {
        const selectorIndexNum = parseInt(selectorIndex);
        if (selectorIndexNum > idElementIndex) {
          idElementIndex = selectorIndexNum;
        }
      }
    });
    
    // Elements before the ID should be disabled
    return index < idElementIndex;
  }
  
  /**
   * Update hierarchy element styling based on selection state
   */
  private static updateHierarchyElementStyling(panel: HTMLElement): void {
    // Get the selected selectors map
    const selectedSelectorsMap = (window as any).dsnSelectedSelectors;
    if (!selectedSelectorsMap) return;
    
    console.log('DSN-DEBUG: Updating hierarchy styling based on selections');
    
    // Log current selections to help debugging
    selectedSelectorsMap.forEach((selectors: Set<string>, index: string) => {
      console.log(`Element ${index}: ${Array.from(selectors).join(', ')}`);
    });
    
    // Find all card headers
    const cardHeaders = panel.querySelectorAll('.dsn-card-header');
    
    // Update styling for each card header based on whether it has selectors
    cardHeaders.forEach(header => {
      const elementIndex = header.getAttribute('data-index');
      if (!elementIndex) return;
      
      console.log(`DSN-DEBUG: Checking card header with index ${elementIndex}`);
      
      // Check if this element has selectors
      const hasSelectors = selectedSelectorsMap.has(elementIndex) && 
                           selectedSelectorsMap.get(elementIndex).size > 0;
      
      // Update the styling
      if (hasSelectors) {
        console.log(`DSN-DEBUG: Element ${elementIndex} has selectors, applying styles`);
        header.classList.add('dsn-element-selected');
        
        // Also make the element text inside the header bold
        const elementText = header.querySelector('.dsn-element-text');
        if (elementText) {
          elementText.classList.add('dsn-element-text-selected');
        }
      } else {
        console.log(`DSN-DEBUG: Element ${elementIndex} has no selectors, removing styles`);
        header.classList.remove('dsn-element-selected');
        
        // Remove bold from element text
        const elementText = header.querySelector('.dsn-element-text');
        if (elementText) {
          elementText.classList.remove('dsn-element-text-selected');
        }
      }
    });
  }
  
  /**
   * Check if a selector is already selected
   */
  private static isSelectorSelected(elementIndex: string, selector: string, selectorType: string): boolean {
    // Get the selected selectors from selector-builder
    const selectedSelectorsMap = (window as any).dsnSelectedSelectors;
    
    if (!selectedSelectorsMap) {
      return false;
    }
    
    // Get the set of selectors for this element
    const selectorSet = selectedSelectorsMap.get(elementIndex);
    if (!selectorSet) {
      return false;
    }
    
    // Check if this selector is in the set
    return selectorSet.has(`${selectorType}:${selector}`);
  }
  
  /**
   * Make the panel draggable by its header
   */
  private static makePanelDraggable(panel: HTMLElement, header: HTMLElement): void {
    let isDragging = false;
    let offsetX = 0, offsetY = 0;
    
    const startDrag = (e: MouseEvent) => {
      e.preventDefault();
      
      // Get cursor position relative to the panel
      const rect = panel.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      
      isDragging = true;
      panel.classList.add('dsn-dragging');
      
      console.log('DSN-DEBUG: Drag started', { offsetX, offsetY });
      
      // Add event listeners for dragging
      document.addEventListener('mousemove', doDrag);
      document.addEventListener('mouseup', stopDrag);
    };
    
    const doDrag = (e: MouseEvent) => {
      if (!isDragging) return;
      
      // Calculate new position
      let newLeft = e.clientX - offsetX;
      let newTop = e.clientY - offsetY;
      
      // Constrain to viewport
      const maxLeft = window.innerWidth - panel.offsetWidth;
      const maxTop = window.innerHeight - panel.offsetHeight;
      
      newLeft = Math.max(0, Math.min(newLeft, maxLeft));
      newTop = Math.max(0, Math.min(newTop, maxTop));
      
      // Apply new position
      panel.style.left = `${newLeft}px`;
      panel.style.top = `${newTop}px`;
      panel.style.right = 'auto'; // Clear right position to avoid conflicts
      
      e.preventDefault();
    };
    
    const stopDrag = () => {
      isDragging = false;
      panel.classList.remove('dsn-dragging');
      
      // Remove event listeners when done
      document.removeEventListener('mousemove', doDrag);
      document.removeEventListener('mouseup', stopDrag);
      
      console.log('DSN-DEBUG: Drag ended');
    };
    
    // Add event listener to header for dragging
    header.addEventListener('mousedown', startDrag);
    header.style.cursor = 'move';
    console.log('DSN-DEBUG: Panel made draggable');
  }

  /**
   * Set up resize observer to constrain panel within viewport
   */
  private static setupResizeObserver(panel: HTMLElement): void {
    // Add a custom resize handle that's more reliable than the browser's default one
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'dsn-resize-handle';
    resizeHandle.style.cssText = `
      position: absolute;
      bottom: 0;
      right: 0;
      width: 20px;
      height: 20px;
      cursor: nwse-resize;
      background-image: linear-gradient(135deg, transparent 0%, transparent 50%, #64748b 50%, #64748b 60%, transparent 60%, transparent);
      z-index: 10;
    `;
    panel.appendChild(resizeHandle);
    
    // Track resize state for our custom resize handle
    let isResizing = false;
    let startWidth = 0;
    let startHeight = 0;
    let startX = 0;
    let startY = 0;
    
    // Mouse down handler for custom resize
    const startResize = (e: MouseEvent) => {
      // Only handle right corner
      const rect = panel.getBoundingClientRect();
      const maxClickableDistance = 20; // px from corner
      
      if (rect.right - e.clientX <= maxClickableDistance && 
          rect.bottom - e.clientY <= maxClickableDistance) {
        e.preventDefault();
        
        isResizing = true;
        startWidth = panel.offsetWidth;
        startHeight = panel.offsetHeight;
        startX = e.clientX;
        startY = e.clientY;
        
        // Add resize handling events
        document.addEventListener('mousemove', doResize);
        document.addEventListener('mouseup', stopResize);
        
        // Add a class for visual feedback
        panel.classList.add('dsn-resizing');
      }
    };
    
    // Mouse move handler for resizing
    const doResize = (e: MouseEvent) => {
      if (!isResizing) return;
      
      e.preventDefault();
      
      // Calculate new dimensions
      const newWidth = startWidth + (e.clientX - startX);
      const newHeight = startHeight + (e.clientY - startY);
      
      // Apply minimum dimensions
      const minWidth = 350;
      const minHeight = 250;
      
      // Apply maximum dimensions (viewport bounds)
      const maxWidth = window.innerWidth - panel.offsetLeft - 20;
      const maxHeight = window.innerHeight - panel.offsetTop - 20;
      
      // Set new dimensions with constraints
      panel.style.width = `${Math.max(minWidth, Math.min(maxWidth, newWidth))}px`;
      panel.style.height = `${Math.max(minHeight, Math.min(maxHeight, newHeight))}px`;
    };
    
    // Mouse up handler to stop resizing
    const stopResize = () => {
      isResizing = false;
      document.removeEventListener('mousemove', doResize);
      document.removeEventListener('mouseup', stopResize);
      panel.classList.remove('dsn-resizing');
    };
    
    // Add the event listener for our custom resize
    resizeHandle.addEventListener('mousedown', startResize);
    panel.addEventListener('mousedown', startResize);
    
    // Use ResizeObserver to handle any resize (whether from our custom handler or browser's built-in)
    const resizeObserver = new ResizeObserver(() => {
      const rect = panel.getBoundingClientRect();
      
      // Constrain width if it exceeds viewport or minimum size
      if (rect.width > window.innerWidth - 20) {
        panel.style.width = `${window.innerWidth - 20}px`;
      }
      
      // Constrain height if it exceeds viewport or minimum size
      if (rect.height > window.innerHeight - 20) {
        panel.style.height = `${window.innerHeight - 20}px`;
      }
      
      // Also ensure panel stays fully on-screen if its position changed
      if (rect.right > window.innerWidth) {
        panel.style.left = `${window.innerWidth - rect.width}px`;
      }
      
      if (rect.bottom > window.innerHeight) {
        panel.style.top = `${window.innerHeight - rect.height}px`;
      }
    });
    
    resizeObserver.observe(panel);
    console.log('DSN-DEBUG: Resize observer set up');
  }
  
  /**
   * Remove the existing panel if present
   */
  private static removeExistingPanel(): void {
    console.log('DSN-DEBUG: Removing existing panel');
    try {
      const existingPanel = document.getElementById('dsn-panel-container');
      console.log('DSN-DEBUG: Existing panel found:', !!existingPanel);
      if (existingPanel) {
        existingPanel.remove();
        console.log('DSN-DEBUG: Panel removed from DOM');
      }
      this.panelContainer = null;
    } catch (error) {
      console.error('DSN-DEBUG: Error in removeExistingPanel:', error);
    }
  }
  
  /**
   * Clear any highlighted elements
   */
  public static clearHighlightedElements(): void {
    console.log('DSN-DEBUG: Clearing highlighted elements');
    try {
      const highlighted = document.querySelectorAll('.dsn-highlighted-element');
      console.log('DSN-DEBUG: Found highlighted elements:', highlighted.length);
      highlighted.forEach(el => {
        el.classList.remove('dsn-highlighted-element');
        asHTMLElement(el).style.outline = '';
        asHTMLElement(el).style.outlineOffset = '';
      });
      console.log('DSN-DEBUG: Highlighted elements cleared');
    } catch (error) {
      console.error('DSN-DEBUG: Error in clearHighlightedElements:', error);
    }
  }
  
  /**
   * Helper method for manually testing the panel
   */
  public static testShowPanel(): void {
    try {
      console.log('DSN-DEBUG: Manual panel test with body element');
      const testElement = document.body;
      const testData: ElementData = {
        tagName: testElement.tagName,
        id: testElement.id || '',
        classNames: testElement.className ? testElement.className.split(' ').filter(c => c.trim()) : [],
        attributes: {}
      };
      // Fix: Explicitly type testAncestors as AncestorElement[] to resolve TS errors
      const testAncestors: AncestorElement[] = [];
      this.showSelectorPanel(testElement, testData, testAncestors);
    } catch (error) {
      console.error('DSN-DEBUG: Error in testShowPanel:', error);
    }
  }

  /**
   * Handle attribute selector changes
   */
  private static handleAttributeChanges(operatorSelect: HTMLSelectElement, valueInput: HTMLInputElement, selectorItem: HTMLElement, originalSelector: string, elementIndex: string): void {
    // Extract attribute name from original selector
    const attrName = originalSelector.match(/\[([^\=\^\$\*\~\|]+)/)?.[1];
    if (!attrName) return;
    
    // Build new attribute selector
    let newSelector: string;
    const operator = operatorSelect.value;
    const value = valueInput.value.replace(/"/g, '\\"');
    
    if (operator === '') {
      // Just attribute existence, no operator or value
      newSelector = `[${attrName}]`;
    } else {
      // Full attribute selector with operator and value
      newSelector = `[${attrName}${operator}"${value}"]`;
    }
    
    // Check if the selector is currently selected
    const isSelected = selectorItem.classList.contains('dsn-selected');
    
    // Update UI - ensure we find and update the selector text
    const selectorText = selectorItem.querySelector('.dsn-selector-text');
    if (selectorText) {
      console.log('DSN-DEBUG: Updating selector text from', selectorText.textContent, 'to', newSelector);
      selectorText.textContent = newSelector;
    } else {
      console.error('DSN-DEBUG: Could not find .dsn-selector-text element to update');
      console.log('DSN-DEBUG: Selector item HTML:', selectorItem.outerHTML);
    }
    
    // Store original if not already stored
    if (!selectorItem.hasAttribute('data-original-selector')) {
      selectorItem.setAttribute('data-original-selector', encodeURIComponent(originalSelector));
    }
    
    // Update data-selector attribute
    selectorItem.setAttribute('data-selector', encodeURIComponent(newSelector));
    
    // If the selector is currently selected, update it
    if (isSelected) {
      // First deselect the original
      deselectSelector(elementIndex, originalSelector, 'attribute');
      
      // Then select with new selector
      selectSelector(elementIndex, newSelector, 'attribute');
    }
    
    console.log('DSN-DEBUG: Updated attribute selector:', { 
      originalSelector, 
      newSelector,
      operator,
      value
    });
  }

  /**
   * Handle toggling the :not modifier
   */
  private static handleNotToggle(checkbox: HTMLInputElement, selectorItem: HTMLElement, originalSelector: string, elementIndex: string, selectorType: string): void {
    // Check if the selector is currently selected
    const isSelected = selectorItem.classList.contains('dsn-selected');
    
    // Store original selector if not already stored
    if (!selectorItem.hasAttribute('data-original-selector')) {
      selectorItem.setAttribute('data-original-selector', encodeURIComponent(originalSelector));
    }
    
    if (checkbox.checked) {
      // Apply :not()
      selectorItem.setAttribute('data-negated', 'true');
      
      // Create the not selector
      const notSelector = `:not(${originalSelector})`;
      
      // Change visual display of the selector text
      const selectorText = selectorItem.querySelector('.dsn-selector-text');
      if (selectorText) {
        selectorText.textContent = notSelector;
      }
      
      // Update the data-selector attribute to include :not
      selectorItem.setAttribute('data-selector', encodeURIComponent(notSelector));
      
      // If the selector is currently selected, update it in the selection model
      if (isSelected) {
        // First deselect the original
        deselectSelector(elementIndex, originalSelector, selectorType);
        
        // Then select with :not
        const originalSelectorType = selectorType;
        selectorItem.setAttribute('data-selector-type', 'not');
        selectSelector(elementIndex, notSelector, 'not');
        
        // Store the original selector type for when we uncheck :not
        selectorItem.setAttribute('data-original-type', originalSelectorType);
      }
      
      console.log('DSN-DEBUG: Applied :not() modifier to', originalSelector);
    } else {
      // Remove :not()
      selectorItem.removeAttribute('data-negated');
      
      // Get the actual original selector (without :not wrapper)
      const actualOriginalSelector = selectorItem.getAttribute('data-original-selector') 
        ? decodeURIComponent(selectorItem.getAttribute('data-original-selector') || '')
        : originalSelector.replace(/^:not\((.+)\)$/, '$1'); // Extract from :not() if needed
      
      // Change visual display back to original
      const selectorText = selectorItem.querySelector('.dsn-selector-text');
      if (selectorText) {
        selectorText.textContent = actualOriginalSelector;
      }
      
      // Update the data-selector attribute back to original
      selectorItem.setAttribute('data-selector', encodeURIComponent(actualOriginalSelector));
      
      // If the selector is currently selected, update it in the selection model
      if (isSelected) {
        // Get the original selector type or fallback to the current type
        const originalType = selectorItem.getAttribute('data-original-type') || selectorType;
        
        // First deselect the current :not version (use originalSelector as it's the current :not() selector)
        deselectSelector(elementIndex, originalSelector, 'not');
        
        // Then select with original
        selectorItem.setAttribute('data-selector-type', originalType);
        selectSelector(elementIndex, actualOriginalSelector, originalType);
      }
      
      console.log('DSN-DEBUG: Removed :not() modifier from', originalSelector, 'back to', actualOriginalSelector);
    }
    
    // Update the combined selector to reflect changes
    updateCombinedSelector();
  }

  /**
   * Restore original selector attributes when deselecting a :not selector
   */
  private static restoreOriginalSelectorAttributes(selectorElement: HTMLElement): void {
    const originalSelectorAttr = selectorElement.getAttribute('data-original-selector');
    const originalType = selectorElement.getAttribute('data-original-type');
    
    if (originalSelectorAttr && originalType) {
      // Restore the original selector text in the UI
      const selectorText = selectorElement.querySelector('.dsn-selector-text');
      if (selectorText) {
        const originalSelector = decodeURIComponent(originalSelectorAttr);
        selectorText.textContent = originalSelector;
      }
      
      // Restore the original data attributes
      selectorElement.setAttribute('data-selector', originalSelectorAttr);
      selectorElement.setAttribute('data-selector-type', originalType);
      
      // Remove :not-specific attributes
      selectorElement.removeAttribute('data-negated');
      selectorElement.removeAttribute('data-original-selector');
      selectorElement.removeAttribute('data-original-type');
      
      console.log('DSN-DEBUG: Restored original selector attributes after :not deselection');
    }
  }

  /**
   * Generate nth selector options HTML if applicable
   */
  private static generateNthOptionsIfApplicable(selector: string): string {
    if (!this.isNthPseudoSelector(selector)) {
      return '';
    }

    // Extract current parameter from selector
    const currentParam = selector.match(/\(([^)]+)\)/)?.[1] || 'odd';
    
    return `
      <div class="dsn-menu-group">
        <label class="dsn-menu-label">Nth Parameter:</label>
        <div class="dsn-select-container">
          <select class="dsn-nth-select">
            ${NTH_SELECTOR_OPTIONS.map(option => `
              <option value="${option.value}" ${option.value === currentParam ? 'selected' : ''} title="${option.description}">
                ${option.display}
              </option>
            `).join('')}
          </select>
        </div>
        <div class="dsn-custom-input-container" style="display: ${currentParam === 'custom' || !NTH_SELECTOR_OPTIONS.find(opt => opt.value === currentParam) ? 'block' : 'none'}">
          <input type="text" class="dsn-nth-custom" placeholder="e.g., 2n+1, 3n-1" value="${currentParam === 'custom' || !NTH_SELECTOR_OPTIONS.find(opt => opt.value === currentParam) ? currentParam : ''}">
        </div>
      </div>
      <div class="dsn-menu-divider"></div>
    `;
  }

  /**
   * Check if a selector is an nth pseudo-selector
   */
  private static isNthPseudoSelector(selector: string): boolean {
    return /^:nth-(child|last-child|of-type|last-of-type)\(/.test(selector);
  }

  /**
   * Handle changes to nth pseudo-selector parameters
   */
  private static handleNthChanges(nthSelect: HTMLSelectElement, customInput: HTMLInputElement | null, selectorItem: HTMLElement, originalSelector: string, elementIndex: string): void {
    const selectedValue = nthSelect.value;
    const isSelected = selectorItem.classList.contains('dsn-selected');
    
    // Get the CURRENT selector from the element (not the original)
    const currentSelector = decodeURIComponent(selectorItem.getAttribute('data-selector') || originalSelector);
    
    // Extract the nth selector type (e.g., ':nth-child' from ':nth-child(odd)')
    const nthTypeMatch = currentSelector.match(/^(:nth-[^(]+)/);
    if (!nthTypeMatch) return;
    
    const nthType = nthTypeMatch[1];
    let newParameter = selectedValue;
    
    // If custom was selected, use the custom input value
    if (selectedValue === 'custom' && customInput && customInput.value.trim()) {
      newParameter = customInput.value.trim();
    }
    
    // Create the new selector
    const newSelector = `${nthType}(${newParameter})`;
    
    // Only proceed if the selector actually changed
    if (newSelector === currentSelector) {
      console.log('DSN-DEBUG: Nth selector unchanged, skipping update');
      return;
    }
    
    // Update the visual display
    const selectorText = selectorItem.querySelector('.dsn-selector-text');
    if (selectorText) {
      selectorText.textContent = newSelector;
    }
    
    // Update the data-selector attribute
    selectorItem.setAttribute('data-selector', encodeURIComponent(newSelector));
    
    // If the selector is currently selected, update it in the selection model
    if (isSelected) {
      const selectorType = selectorItem.getAttribute('data-selector-type') || 'pseudo-class';
      
      // Deselect the current version (not the original)
      deselectSelector(elementIndex, currentSelector, selectorType);
      
      // Select the new version
      selectSelector(elementIndex, newSelector, selectorType);
    }
    
    console.log('DSN-DEBUG: Updated nth selector from', currentSelector, 'to', newSelector);
  }

  /**
   * Handle cancel button
   */
  private static handleMenuCancel(menu: HTMLElement, selectorItem: HTMLElement): void {
    // Check if it's a simple not toggle menu or an attribute menu
    const isAttributeMenu = Boolean(menu.querySelector('.dsn-attribute-operator'));
    
    // Get original and current selectors to compare
    const originalSelectorAttr = selectorItem.getAttribute('data-original-selector') || 
                                selectorItem.getAttribute('data-selector');
    const currentSelectorAttr = selectorItem.getAttribute('data-selector');
    
    if (originalSelectorAttr && currentSelectorAttr) {
      const originalSelector = decodeURIComponent(originalSelectorAttr);
      const currentSelector = decodeURIComponent(currentSelectorAttr);
      
      if (isAttributeMenu) {
        // Always reset form fields to original state
        const operatorSelect = menu.querySelector('.dsn-attribute-operator') as HTMLSelectElement;
        const valueInput = menu.querySelector('.dsn-attribute-value') as HTMLInputElement;
        
        if (operatorSelect && valueInput) {
          // Parse original selector to determine original values
          let originalOperator = '='; // Default
          let originalValue = '';
          
          // Extract operator and value from original selector
          if (originalSelector.includes('*=')) originalOperator = '*=';
          else if (originalSelector.includes('^=')) originalOperator = '^=';
          else if (originalSelector.includes('$=')) originalOperator = '$=';
          else if (originalSelector.includes('~=')) originalOperator = '~=';
          else if (originalSelector.includes('|=')) originalOperator = '|=';
          else if (!originalSelector.includes('=')) originalOperator = '';
          
          // Extract value if present
          const valueMatch = originalSelector.match(/="([^"]*)"/);
          originalValue = valueMatch ? valueMatch[1] : '';
          
          // Reset form fields
          operatorSelect.value = originalOperator;
          valueInput.value = originalValue;
        }
      }
      
      // Reset not toggle for all menu types
      const notToggle = menu.querySelector('.dsn-not-toggle') as HTMLInputElement;
      if (notToggle) {
        notToggle.checked = originalSelector.startsWith(':not(');
      }
      
      // Restore data-selector and visual text if it was modified
      if (originalSelector !== currentSelector) {
        const selectorText = selectorItem.querySelector('.dsn-selector-text');
        if (selectorText) {
          selectorText.textContent = originalSelector;
        }
        selectorItem.setAttribute('data-selector', originalSelectorAttr);
        
        // If it was selected, update the actual selection
        if (selectorItem.classList.contains('dsn-selected')) {
          const elementIndex = selectorItem.getAttribute('data-element-index') || '';
          const selectorType = selectorItem.getAttribute('data-selector-type') || '';
          
          // If currently using :not, deselect that first
          if (selectorType === 'not') {
            deselectSelector(elementIndex, currentSelector, 'not');
            
            // Restore original selector type
            const originalSelectorType = selectorItem.getAttribute('data-original-type') || 'attribute';
            selectorItem.setAttribute('data-selector-type', originalSelectorType);
            selectSelector(elementIndex, originalSelector, originalSelectorType);
          } else {
            // Normal attribute deselection/selection
            deselectSelector(elementIndex, currentSelector, selectorType);
            selectSelector(elementIndex, originalSelector, selectorType);
          }
        }
      }
    }
    
    // Close the menu
    menu.style.display = 'none';
    console.log('DSN-DEBUG: Menu closed after cancel');
  }

  /**
   * Set up hover event handlers for highlighting DOM elements when hovering over hierarchy cards
   */
  private static setupHoverEventHandlers(panel: HTMLElement, selectedElement: Element, ancestors: AncestorElement[]): void {
    console.log('DSN-DEBUG: Setting up hover event handlers');
    
    // Get the highlight checkbox
    const highlightCheckbox = panel.querySelector('#dsn-highlight-elements') as HTMLInputElement;
    if (!highlightCheckbox) {
      console.warn('DSN-DEBUG: Highlight checkbox not found');
      return;
    }
    
    const cardHeaders = panel.querySelectorAll('.dsn-card-header');
    
    cardHeaders.forEach(header => {
      const cardIndex = header.getAttribute('data-index');
      let domElement: Element | null = null;
      
      // Map card to actual DOM element
      if (cardIndex === 'selected') {
        domElement = selectedElement;
      } else {
        const cardDisplayIndex = parseInt(cardIndex || '0');
        // The UI displays ancestors in reverse order (closest first)
        // So card index 0 = ancestors[ancestors.length - 1], card index 1 = ancestors[ancestors.length - 2], etc.
        const actualAncestorIndex = ancestors.length - 1 - cardDisplayIndex;
        if (actualAncestorIndex >= 0 && actualAncestorIndex < ancestors.length) {
          domElement = ancestors[actualAncestorIndex]?.element || null;
          console.log(`DSN-DEBUG: Card ${cardDisplayIndex} maps to ancestor ${actualAncestorIndex}:`, domElement);
        }
      }
      
      if (domElement) {
        // Add hover handlers
        header.addEventListener('mouseenter', () => {
          // Only highlight if the checkbox is checked
          if (highlightCheckbox.checked) {
            domElement?.classList.add('dsn-hover-highlighted');
            console.log('DSN-DEBUG: Highlighting element on hover:', {
              cardIndex,
              tagName: domElement?.tagName,
              id: domElement?.id,
              className: domElement?.className,
              element: domElement
            });
          }
        });
        
        header.addEventListener('mouseleave', () => {
          // Always remove highlight on mouse leave
          domElement?.classList.remove('dsn-hover-highlighted');
          console.log('DSN-DEBUG: Removing highlight from element:', domElement?.tagName);
        });
      }
    });
    
    console.log(`DSN-DEBUG: Set up hover handlers for ${cardHeaders.length} cards`);
  }
}

// Add debug helper on window
(window as any).dsnUIManagerDebug = {
  showPanel: (testElement: Element = document.body) => {
    console.log('DSN-DEBUG: Manual panel test with element:', testElement);
    const testData = {
      tagName: testElement.tagName,
      id: testElement.id || '',
      classNames: testElement.className.split(' ').filter(c => c.trim()),
      attributes: {}
    };
    const testAncestors: AncestorElement[] = [];
    UIManager.showSelectorPanel(testElement, testData, testAncestors);
    return 'Panel test triggered';
  },
  clearPanel: () => {
    const panel = document.getElementById('dsn-panel-container');
    if (panel) {
      panel.remove();
      return 'Panel removed';
    }
    return 'No panel found';
  }
};
