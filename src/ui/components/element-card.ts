/**
 * Element Card Component
 * Displays a collapsible card for a DOM element
 */

import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

// Define ElementData interface locally to match the properties you're using
interface ElementData {
  tagName: string;
  id?: string;
  classNames?: string[]; // Changed from classList to classNames based on error
  html?: string;
  // Add other properties as needed
}

@customElement('element-card')
export class ElementCard extends LitElement {
  @property({ type: Object }) element!: ElementData;
  @property({ type: Boolean }) isExpanded = false;
  @state() private previewHtml = '';

  static styles = css`
    :host {
      display: block;
      margin-bottom: 8px;
    }
    
    .card-header {
      display: flex;
      align-items: center;
      cursor: pointer;
      padding: 8px 12px;
      background: var(--sl-color-neutral-50);
      border-radius: 4px;
      transition: background-color 0.2s;
    }
    
    .card-header:hover {
      background: var(--sl-color-neutral-100);
    }
    
    .tag-name {
      color: var(--sl-color-primary-600);
      font-weight: bold;
    }
    
    .id {
      color: var(--sl-color-success-600);
    }
    
    .classes {
      color: var(--sl-color-warning-700);
    }
    
    .content {
      padding: 12px;
      border: 1px solid var(--sl-color-neutral-200);
      border-top: none;
      border-radius: 0 0 4px 4px;
    }
    
    .content-hidden {
      display: none;
    }
    
    .element-preview {
      font-family: monospace;
      padding: 8px;
      background: var(--sl-color-neutral-50);
      border-radius: 4px;
      overflow-x: auto;
      margin-bottom: 12px;
      font-size: 14px;
    }
    
    .selector-section {
      margin-bottom: 16px;
    }
    
    .selector-section-title {
      font-weight: bold;
      margin-bottom: 8px;
      color: var(--sl-color-neutral-700);
    }
    
    .selector-list {
      max-height: 150px;
      overflow-y: auto;
      padding: 8px;
      background: var(--sl-color-neutral-50);
      border-radius: 4px;
    }
    
    .selector-item {
      display: flex;
      align-items: center;
      margin-bottom: 4px;
    }
    
    .selector-item sl-checkbox {
      margin-right: 8px;
    }
    
    .toggle-icon {
      margin-right: 8px;
      transition: transform 0.2s;
    }
    
    .icon-expanded {
      transform: rotate(90deg);
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.previewHtml = this.formatElementPreview();
  }

  formatElementPreview(): string {
    const { tagName, id, classNames, html } = this.element;
    
    // Create truncated HTML preview
    if (html) {
      let preview = html;
      if (preview.length > 80) {
        preview = preview.substring(0, 80) + '...';
      }
      return preview.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    
    // Create basic preview from parts
    let preview = `<${tagName || 'div'}`;
    if (id) {
      preview += ` id="${id}"`;
    }
    if (classNames && classNames.length > 0) {
      preview += ` class="${classNames.join(' ')}"`;
    }
    preview += '>...</' + (tagName || 'div') + '>';
    
    return preview;
  }

  formatCardTitle(): string {
    const { tagName, id, classNames } = this.element;
    let title = `<${tagName || 'div'}`;
    
    if (id) {
      title += `#${id}`;
    }
    
    if (classNames && classNames.length > 0) {
      title += `.${classNames.join('.')}`;
    }
    
    title += '>';
    
    if (title.length > 50) {
      title = title.substring(0, 47) + '...>';
    }
    
    return title;
  }

  toggleExpanded() {
    this.isExpanded = !this.isExpanded;
    this.dispatchEvent(new CustomEvent('element-expanded', {
      detail: { isExpanded: this.isExpanded, element: this.element }
    }));
  }

  render() {
    return html`
      <div class="card">
        <div class="card-header" @click=${this.toggleExpanded}>
          <span class="toggle-icon ${this.isExpanded ? 'icon-expanded' : ''}">▶</span>
          <span>${this.formatCardTitle()}</span>
        </div>
        
        <div class="content ${this.isExpanded ? '' : 'content-hidden'}">
          <div class="element-preview">${this.previewHtml}</div>
          
          ${this.isExpanded ? html`<selector-panel .element=${this.element}></selector-panel>` : ''}
        </div>
      </div>
    `;
  }
}

import { AncestorElement } from '@utils/types';

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