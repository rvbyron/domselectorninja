/**
 * Selector Panel Component
 * Displays and manages CSS selectors for an element
 */

import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ElementData, SelectorInfo } from '@utils/types';

@customElement('selector-panel')
export class SelectorPanel extends LitElement {
  @property({ type: Object }) element?: ElementData;
  @state() private selectedSelectors: Set<string> = new Set();
  @state() private finalSelector: string = '';
  
  static styles = css`
    :host {
      display: block;
    }
    
    .panel-section {
      margin-bottom: 16px;
    }
    
    .section-title {
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 8px;
      color: var(--sl-color-neutral-700);
    }
    
    .selector-list {
      background: var(--sl-color-neutral-50);
      border-radius: 4px;
      padding: 8px;
      max-height: 150px;
      overflow-y: auto;
    }
    
    .selector-item {
      display: flex;
      align-items: center;
      margin-bottom: 4px;
      font-family: monospace;
    }
    
    .selector-code {
      margin-left: 8px;
      overflow-x: auto;
    }
    
    .unique-badge {
      font-size: 10px;
      padding: 2px 4px;
      background: var(--sl-color-success-100);
      color: var(--sl-color-success-700);
      border-radius: 4px;
      margin-left: 8px;
    }
    
    .specificity-badge {
      font-size: 10px;
      padding: 2px 4px;
      background: var(--sl-color-neutral-100);
      color: var(--sl-color-neutral-700);
      border-radius: 4px;
      margin-left: 8px;
    }
    
    .final-selector {
      background: var(--sl-color-primary-50);
      padding: 8px;
      border-radius: 4px;
      margin-top: 16px;
      font-family: monospace;
      overflow-x: auto;
    }
    
    .empty-state {
      padding: 16px;
      text-align: center;
      background: var(--sl-color-neutral-50);
      border-radius: 4px;
      color: var(--sl-color-neutral-600);
    }
    
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 16px;
    }
  `;
  
  connectedCallback() {
    super.connectedCallback();
    // Optional initial selector loading if needed
  }
  
  toggleSelector(selector: string) {
    if (this.selectedSelectors.has(selector)) {
      this.selectedSelectors.delete(selector);
    } else {
      this.selectedSelectors.add(selector);
    }
    
    this.updateFinalSelector();
    this.requestUpdate();
  }
  
  updateFinalSelector() {
    this.finalSelector = Array.from(this.selectedSelectors).join(', ');
  }
  
  copySelector() {
    if (this.finalSelector) {
      navigator.clipboard.writeText(this.finalSelector)
        .then(() => {
          // Show success message
          console.log('Selector copied to clipboard');
        })
        .catch(err => {
          console.error('Failed to copy selector', err);
        });
    }
  }
  
  renderSelectorItem(item: SelectorInfo) {
    return html`
      <div class="selector-item">
        <sl-checkbox 
          @sl-change=${() => this.toggleSelector(item.selector)}
          ?checked=${this.selectedSelectors.has(item.selector)}
        ></sl-checkbox>
        <span class="selector-code">${item.selector}</span>
        ${item.isUnique ? html`<span class="unique-badge">Unique</span>` : ''}
        <span class="specificity-badge">${item.specificity}</span>
      </div>
    `;
  }
  
  render() {
    if (!this.element?.selectors) {
      return html`<div class="empty-state">No selectors available for this element</div>`;
    }
    
    return html`
      <div class="selector-panel">
        <!-- Core Selectors -->
        ${this.element.selectors.core.length > 0 ? html`
          <div class="panel-section">
            <div class="section-title">Core Selectors</div>
            <div class="selector-list">
              ${this.element.selectors.core.map(item => this.renderSelectorItem(item))}
            </div>
          </div>
        ` : ''}
        
        <!-- Class Selectors -->
        ${this.element.selectors.class.length > 0 ? html`
          <div class="panel-section">
            <div class="section-title">Class Selectors</div>
            <div class="selector-list">
              ${this.element.selectors.class.map(item => this.renderSelectorItem(item))}
            </div>
          </div>
        ` : ''}
        
        <!-- Attribute Selectors -->
        ${this.element.selectors.attribute.length > 0 ? html`
          <div class="panel-section">
            <div class="section-title">Attribute Selectors</div>
            <div class="selector-list">
              ${this.element.selectors.attribute.map(item => this.renderSelectorItem(item))}
            </div>
          </div>
        ` : ''}
        
        <!-- Combinator Selectors -->
        ${this.element.selectors.combinator.length > 0 ? html`
          <div class="panel-section">
            <div class="section-title">Combinator Selectors</div>
            <div class="selector-list">
              ${this.element.selectors.combinator.map(item => this.renderSelectorItem(item))}
            </div>
          </div>
        ` : ''}
        
        <!-- Final Selector Display -->
        ${this.finalSelector ? html`
          <div class="final-selector">
            <code>${this.finalSelector}</code>
          </div>
        ` : ''}
        
        <!-- Action Buttons -->
        <div class="actions">
          <sl-button 
            variant="primary" 
            @click=${this.copySelector} 
            ?disabled=${!this.finalSelector}
          >
            Copy
          </sl-button>
          <sl-button 
            variant="neutral" 
            @click=${() => this.dispatchEvent(new CustomEvent('close'))}
          >
            Close
          </sl-button>
        </div>
      </div>
    `;
  }
}