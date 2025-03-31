# DOM Selector Wizard - Requirements Document

## Project Overview
DOM Selector Wizard is a browser extension for Microsoft Edge that helps users build and test CSS selectors for use with `querySelector` and `querySelectorAll` DOM methods.

## Purpose
This extension will provide a user-friendly interface to:
1. Generate precise CSS selectors for web elements
2. Test selectors against live DOM elements
3. Copy selectors for use in web development projects

## Technical Requirements

### Platform
- Microsoft Edge Extension, Google Chrome, or any Chromium based browser.
- Compatible with Edge version 88 and above

### Core Features
- Visual element selection on any webpage via right-click menu
- Automatic generation of optimal CSS selectors
- Manual refinement of generated selectors
- Live testing of selectors against DOM
- Copy functionality for generated selectors
- History of recently created selectors
- Selector validation

### User Interface
- Clean, intuitive interface using Shoelace.js component library
- Responsive design suitable for various screen sizes
- Accessible according to WCAG 2.1 AA standards
- Dark/light mode support
- Right-click menu integration for element selection
- Hierarchical element explorer with collapsible rows
- Ancestors element explorer with collapsible rows
- Categorized selector options with visual indicators

### User Interaction Flow
- Extension activates via browser's right-click context menu
- Selected element (under cursor when right-clicked) becomes the target
- Element hierarchy displayed from topmost ancestor to target element, with each node on a separate collapsible row/card
- Each element card shows a concise single-line representation of the node, using "..." to indicate collapsed content when necessary
- When expanding an element card, users will see:
  - A condensed preview of the element's HTML structure on a single line
  - Scrollable sections below containing selector categories:
  1. Core selectors (tag name, ID, universal, pseudo)
  2. Class selectors
  3. Attribute selectors
  4. Combinator selectors (child and sibling selectors)
- Visual indicators show selector status:
  - Checkboxes to select/deselect each selector
  - Selected selectors appear bold and bright
  - Unselected selectors appear dimmed but remain readable
  - Gray text for selectors that wouldn't uniquely select the element
  - White text for valid selectors
- Editable selector string at bottom of panel
- Selected selectors automatically added to the selector string

### Build Requirements
- TypeScript for development
- Build process to:
  - Transpile TypeScript to JavaScript
  - Bundle code into optimized distribution files
  - Process and include Shoelace.js components
  - Generate source maps for debugging

### Browser Permissions
- Access to active tab DOM
- Storage for user preferences and history
- Context menu modification permissions

## Development Guidelines
- Follow Microsoft Edge extension best practices
- Implement proper error handling
- Include comprehensive documentation
- Follow semantic versioning

## Performance Goals
- Right-click to selector panel should appear within 300ms
- Extension should add minimal overhead to browser
- UI interactions should feel instantaneous

## Future Considerations
- Potential expansion to other browsers (Chrome, Firefox)
- Custom selector templates and presets
- Advanced selector options for power users
- Export functionality to various formats

## Project Timeline
(To be determined)

## Success Criteria
- High accuracy rate in selector generation
- Minimal reported bugs in production use
- Positive user feedback on usability
- Extension successfully published to Microsoft Edge Add-ons store