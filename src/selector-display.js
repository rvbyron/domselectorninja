// Core Selector Display File

// Function to format selectors for display
function formatSelector(selector) {
    // Check for pseudo-elements and remove any tagname prefix
    // Convert patterns like "div::before" or "span::after" to just "::before" or "::after"
    const pseudoElementRegex = /([a-z0-9]*)(::(?:before|after))/i;
    if (pseudoElementRegex.test(selector)) {
        selector = selector.replace(pseudoElementRegex, '$2');
    }
    
    return selector;
}

// Function to display the list of selectors
function displaySelectors(selectors) {
    const formattedSelectors = selectors.map(formatSelector);
    formattedSelectors.forEach(selector => {
        console.log(selector);
    });
}

// Example usage
const selectors = ['div::before', 'span::after', 'p::before'];
displaySelectors(selectors);