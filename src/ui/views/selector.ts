/**
 * Selector View Component
 * Main view for the selector UI
 */
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ElementData, AncestorElement, SelectorInfo } from '@utils/types';

// Import custom elements - fix the import paths
import '../components/element-card';  // Remove .js extension
import '../components/ancestor-card'; // Remove .js extension
import '../components/selector-panel'; // Remove .js extension

@customElement('selector-app')
export class SelectorApp extends LitElement {
  @property({ type: Object }) targetElement?: ElementData;
  @state() private ancestorElements: AncestorElement[] = [];
  @state() private selectedSelectors: Set<string> = new Set();
  @state() private finalSelector: string = '';
  
  static styles = css`
    :host {
      display: block;
      padding: 16px;
      max-width: 800px;
      margin: 0 auto;
    }
    
    .app-header {
      margin-bottom: 24px;
    }
    
    .app-title {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 8px;
    }
    
    .app-subtitle {
      color: var(--sl-color-neutral-600);
    }
    
    .section {
      margin-bottom: 24px;
    }
    
    .section-title {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 12px;
      padding-bottom: 4px;
      border-bottom: 1px solid var(--sl-color-neutral-200);
    }
    
    .empty-state {
      padding: 16px;
      text-align: center;
      background: var(--sl-color-neutral-50);
      border-radius: 4px;
      color: var(--sl-color-neutral-600);
    }
  `;
  
  connectedCallback() {
    super.connectedCallback();
    this.loadElementData();
  }
  
  loadElementData() {
    // In a real implementation, this would load data from the extension
    console.log('Loading element data...');
  }
  
  toggleSelector(selector: SelectorInfo) {
    if (this.selectedSelectors.has(selector.selector)) {
      this.selectedSelectors.delete(selector.selector);
    } else {
      this.selectedSelectors.add(selector.selector);
    }
    
    this.updateFinalSelector();
  }
  
  updateFinalSelector() {
    this.finalSelector = Array.from(this.selectedSelectors).join(', ');
  }
  
  copySelector() {
    if (this.finalSelector) {
      navigator.clipboard.writeText(this.finalSelector)
        .then(() => {
          console.log('Selector copied to clipboard');
        })
        .catch(err => {
          console.error('Failed to copy selector', err);
        });
    }
  }
  
  render() {
    return html`
      <div class="app-container">
        <div class="app-header">
          <div class="app-title">DOM Selector Ninja</div>
          <div class="app-subtitle">Build and test CSS selectors for web elements</div>
        </div>
        
        <div class="section">
          <div class="section-title">Element Hierarchy</div>
          ${this.ancestorElements.length ? 
            this.ancestorElements.map((element: AncestorElement, index: number) => html`
              <ancestor-card 
                .element=${element}
                .index=${index}
                .isTarget=${index === this.ancestorElements.length - 1}
              ></ancestor-card>
            `) : 
            html`<div class="empty-state">No ancestor elements available</div>`
          }
        </div>
        
        <div class="section">
          <div class="section-title">Target Element</div>
          ${this.targetElement ? 
            html`
              <element-card 
                .element=${this.targetElement}
                isExpanded
              ></element-card>
            ` : 
            html`<div class="empty-state">No target element selected</div>`
          }
        </div>
        
        <div class="section">
          <div class="section-title">Selectors</div>
          ${this.targetElement?.selectors ? 
            html`
              <div class="panel-section">
                <div class="section-title">Core Selectors</div>
                <div class="selector-list">
                  ${this.targetElement.selectors.core.map(item => html`
                    <div class="selector-item">
                      <sl-checkbox 
                        @sl-change=${() => this.toggleSelector(item)}
                        ?checked=${this.selectedSelectors.has(item.selector)}
                      ></sl-checkbox>
                      <code>${item.selector}</code>
                    </div>
                  `)}
                </div>
              </div>
              
              <div class="panel-section">
                <div class="section-title">Class Selectors</div>
                <div class="selector-list">
                  ${this.targetElement.selectors.class.map(item => html`
                    <div class="selector-item">
                      <sl-checkbox 
                        @sl-change=${() => this.toggleSelector(item)}
                        ?checked=${this.selectedSelectors.has(item.selector)}
                      ></sl-checkbox>
                      <code>${item.selector}</code>
                    </div>
                  `)}
                </div>
              </div>
              
              <div class="panel-section">
                <div class="section-title">Attribute Selectors</div>
                <div class="selector-list">
                  ${this.targetElement.selectors.attribute.map(item => html`
                    <div class="selector-item">
                      <sl-checkbox 
                        @sl-change=${() => this.toggleSelector(item)}
                        ?checked=${this.selectedSelectors.has(item.selector)}
                      ></sl-checkbox>
                      <code>${item.selector}</code>
                    </div>
                  `)}
                </div>
              </div>
              
              <div class="panel-section">
                <div class="section-title">Combinator Selectors</div>
                <div class="selector-list">
                  ${this.targetElement.selectors.combinator.map(item => html`
                    <div class="selector-item">
                      <sl-checkbox 
                        @sl-change=${() => this.toggleSelector(item)}
                        ?checked=${this.selectedSelectors.has(item.selector)}
                      ></sl-checkbox>
                      <code>${item.selector}</code>
                    </div>
                  `)}
                </div>
              </div>
            ` : 
            html`<div class="empty-state">No selectors available</div>`
          }
          
          ${this.finalSelector ? html`
            <div class="selected-selector">
              <code>${this.finalSelector}</code>
            </div>
          ` : ''}
          
          <div class="actions">
            <sl-button @click=${this.copySelector} ?disabled=${!this.finalSelector}>
              Copy
            </sl-button>
          </div>
        </div>
      </div>
    `;
  }
}