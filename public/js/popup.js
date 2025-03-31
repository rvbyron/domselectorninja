document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM Selector Ninja popup initialized');
  
  // Set up event listeners
  document.getElementById('open-options')?.addEventListener('click', () => {
    if (chrome && chrome.runtime) {
      chrome.runtime.openOptionsPage();
    }
  });
});