// Pseudo-element regex to match ::before and ::after without requiring a tagname
const pseudoElementRegex = /^(::)(before|after)$/i;

/**
 * Processes pseudo-elements in a selector string.
 * Ensures ::before and ::after are mutually exclusive.
 * @param {string} selector - The selector string to process.
 * @throws {Error} If both ::before and ::after are used together.
 */
function processPseudoElements(selector) {
    let hasBefore = false;
    let hasAfter = false;

    // Check if selector has ::before
    if (selector.includes('::before')) {
        hasBefore = true;
    }

    // Check if selector has ::after
    if (selector.includes('::after')) {
        hasAfter = true;
    }

    // Ensure they are mutually exclusive
    if (hasBefore && hasAfter) {
        throw new Error('Pseudo-elements ::before and ::after cannot be used together');
    }
}

export { pseudoElementRegex, processPseudoElements };