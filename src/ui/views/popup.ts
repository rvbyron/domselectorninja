import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js';

// Set Shoelace assets path
setBasePath(chrome.runtime.getURL('assets/shoelace'));

@customElement('popup-app')
export class PopupApp extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 300px;
      font-family: var(--sl-font-sans);
    }
    
    .header {
      background: var(--sl-color-primary-600);
      color: white;
      padding: 12px;
      margin: -16px -16px 16px -16px;
      border-top-left-radius: var(--sl-border-radius-medium);
      border-top-right-radius: var(--sl-border-radius-medium);
    }
    
    .instructions {
      color: var(--sl-color-neutral-700);
      font-size: 0.9rem;
      margin-bottom: 16px;
    }
    
    .actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
  `;

  render() {
    return html`
      <sl-card>
        <div class="header">
          <h2>DOM Selector Ninja</h2>
        </div>
        
        <div class="instructions">
          <p>Right-click on any element in the page and select "Analyze Element with DOM Selector Ninja" from the context menu.</p>
        </div>
        
        <div class="actions">
          <sl-button variant="primary" @click=${this.openDocs}>Documentation</sl-button>
          <sl-button @click=${this.showHistory}>Selector History</sl-button>
        </div>
      </sl-card>
    `;
  }
  
  openDocs() {
    window.open('https://github.com/yourusername/dom-selector-ninja/blob/main/README.md', '_blank');
  }
  
  showHistory() {
    // Implement history functionality in the future
    console.log('History functionality not yet implemented');
  }
}

// Initialize the component
document.addEventListener('DOMContentLoaded', () => {
  const app = document.createElement('popup-app');
  document.body.appendChild(app);
});