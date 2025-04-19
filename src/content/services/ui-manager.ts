/**
 * Manages UI interactions and panel display
 */

import { ElementData, AncestorElement } from '@utils/types';
import { asHTMLElement } from '@utils/dom-types';
import { PSEUDO_ELEMENTS, PSEUDO_CLASSES, COMBINATOR_SELECTORS } from '../constants/selector-constants';
import { selectSelector, deselectSelector, updateCombinedSelector } from './selector-builder';

console.log('DSN-DEBUG: ui-manager.ts loaded');

/**
 * Manages UI components for the DOM Selector Ninja
 */
export class UIManager {
  private static panelContainer: HTMLElement | null = null;
  
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
      
      const hierarchyTitle = document.createElement('h3');
      hierarchyTitle.className = 'dsn-section-title';
      hierarchyTitle.textContent = 'Element Hierarchy';
      
      hierarchySection.appendChild(hierarchyTitle);
      
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
      
      // Match count display
      const matchCount = document.createElement('div');
      const matchCountSpan = document.createElement('span');
      matchCountSpan.id = 'dsn-match-count';
      matchCountSpan.className = 'dsn-match-count';
      matchCountSpan.textContent = 'No matches found on page';
      matchCount.appendChild(matchCountSpan);
      
      resultSection.appendChild(codeContainer);
      resultSection.appendChild(matchCount);
      
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
            ${coreSelectors.map(item => `
              <li class="dsn-selector-item${item.type === 'pseudo' ? ' dsn-pseudo-item' : ''}" 
                  data-selector="${encodeURIComponent(item.selector)}" 
                  data-element-index="${index}"
                  data-selector-type="${item.type}">
                ${item.displaySelector || item.selector}
              </li>
            `).join('')}
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
                  ${selector}
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
                ${selector}
                <div class="dsn-ellipsis-icon" data-for-selector="${encodeURIComponent(selector)}"><span></span></div>
                <div class="dsn-item-context-menu">
                  <div class="dsn-menu-heading">Attribute Options</div>
                  
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
                      <div class="dsn-select-arrow"></div>
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
      const selector = decodeURIComponent(selectorElement.getAttribute('data-selector') || '');
      const elementIndex = selectorElement.getAttribute('data-element-index') || '';
      const selectorType = selectorElement.getAttribute('data-selector-type') || '';
      
      // Initially none should be selected since we clear on panel open
      selectorElement.classList.remove('dsn-selected');
      
      item.addEventListener('click', () => {
        // Skip if disabled
        if (selectorElement.hasAttribute('data-disabled') && 
            selectorElement.getAttribute('data-disabled') === 'true') {
          return;
        }
        
        // Toggle selection state
        if (selectorElement.classList.contains('dsn-selected')) {
          // Deselect
          selectorElement.classList.remove('dsn-selected');
          deselectSelector(elementIndex, selector, selectorType);
        } else {
          // Select
          selectorElement.classList.add('dsn-selected');
          selectSelector(elementIndex, selector, selectorType);
          
          // If this is a pseudo-element, deselect any other selected pseudo-elements
          if (selectorType === 'pseudo') {
            const otherPseudoElements = panel.querySelectorAll(`.dsn-pseudo-item.dsn-selected[data-element-index="${elementIndex}"]`);
            otherPseudoElements.forEach(el => {
              if (el !== selectorElement) {
                el.classList.remove('dsn-selected');
                const otherSelector = decodeURIComponent(el.getAttribute('data-selector') || '');
                deselectSelector(elementIndex, otherSelector, 'pseudo');
              }
            });
          }
          
          // Handle tag/ID mutual exclusivity
          if (selectorType === 'id') {
            // Deselect any tag selectors when ID is selected
            const tagSelectors = panel.querySelectorAll(`.dsn-selector-item[data-selector-type="tag"][data-element-index="${elementIndex}"].dsn-selected`);
            tagSelectors.forEach(el => {
              el.classList.remove('dsn-selected');
              const tagSelector = decodeURIComponent(el.getAttribute('data-selector') || '');
              deselectSelector(elementIndex, tagSelector, 'tag');
            });
          } else if (selectorType === 'tag') {
            // Deselect any ID selectors when tag is selected
            const idSelectors = panel.querySelectorAll(`.dsn-selector-item[data-selector-type="id"][data-element-index="${elementIndex}"].dsn-selected`);
            idSelectors.forEach(el => {
              el.classList.remove('dsn-selected');
              const idSelector = decodeURIComponent(el.getAttribute('data-selector') || '');
              deselectSelector(elementIndex, idSelector, 'id');
            });
          }
        }
        
        // Update hierarchy element styling based on selection state
        this.updateHierarchyElementStyling(panel);
      });
    });
    
    // Set up listener for selector changes to update hierarchy styling
    document.addEventListener('dsn-selector-changed', () => {
      this.updateHierarchyElementStyling(panel);
    });
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
