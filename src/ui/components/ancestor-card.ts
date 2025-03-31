/**
 * Component for displaying an ancestor element in the hierarchy
 */
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

// Define interface locally instead of importing
interface AncestorElement {
  tagName: string;
  id: string;
  className: string;
  htmlPreview: string;
  // Add any other properties your AncestorElement might have
}

@customElement('ancestor-card')
export class AncestorCard extends LitElement {
  @property({ type: Object }) element!: AncestorElement;
  @property({ type: Boolean }) isTarget = false;
  @property({ type: Number }) index = 0;

  static styles = css`
    :host {
      display: block;
      margin-bottom: var(--dsn-spacing);
    }
    
    sl-card {
      --padding: var(--dsn-card-padding);
    }
    
    .target-card {
      border: 2px solid var(--dsn-primary-color);
    }
    
    .element-tag {
      font-family: monospace;
      background: var(--sl-color-neutral-100);
      padding: 2px 4px;
      border-radius: 4px;
    }
    
    .element-preview {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-family: monospace;
      font-size: 0.9em;
      color: var(--sl-color-neutral-700);
    }
    
    .element-index {
      display: inline-block;
      background: var(--sl-color-neutral-200);
      color: var(--sl-color-neutral-700);
      width: 20px;
      height: 20px;
      border-radius: 50%;
      text-align: center;
      line-height: 20px;
      font-size: 12px;
      margin-right: 8px;
    }
    
    .target-indicator {
      background: var(--dsn-primary-color);
      color: white;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.8em;
      margin-left: 8px;
    }
  `;

  render() {
    return html`
      <sl-details>
        <div slot="summary" class="element-summary">
          <span class="element-index">${this.index + 1}</span>
          <span class="element-tag">${this.element.tagName.toLowerCase()}</span>
          ${this.element.id ? html`<span class="element-id">#${this.element.id}</span>` : ''}
          ${this.element.className ? html`<span class="element-classes">.${this.element.className.replace(/\s+/g, '.')}</span>` : ''}
          ${this.isTarget ? html`<span class="target-indicator">Target</span>` : ''}
        </div>
        
        <div class="element-content">
          <div class="element-preview">
            ${this.element.htmlPreview}
          </div>
          
          <slot></slot>
        </div>
      </sl-details>
    `;
  }
}