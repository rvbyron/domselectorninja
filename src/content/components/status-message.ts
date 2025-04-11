/**
 * Class for managing status messages in the UI
 */
export class StatusMessage {
  private static messageElement: HTMLElement | null = null;
  
  /**
   * Show a status message to the user
   */
  static show(message: string): void {
    // Create message element if it doesn't exist
    if (!this.messageElement) {
      this.messageElement = document.createElement('div');
      this.messageElement.id = 'dsn-status-message';
      this.messageElement.classList.add('dsn-status-message');
      document.body.appendChild(this.messageElement);
    }
    
    this.messageElement.textContent = message;
    this.messageElement.style.display = 'block';
  }
  
  /**
   * Hide the status message
   */
  static hide(): void {
    if (this.messageElement) {
      this.messageElement.style.display = 'none';
    }
  }
  
  /**
   * Remove the status message element from the DOM
   */
  static remove(): void {
    if (this.messageElement) {
      this.messageElement.remove();
      this.messageElement = null;
    }
  }
}

// Add individual function exports to match the imports in element-selection.ts
export const showStatusMessage = StatusMessage.show.bind(StatusMessage);
export const hideStatusMessage = StatusMessage.hide.bind(StatusMessage);
