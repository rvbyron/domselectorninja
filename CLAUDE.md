# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Build and Development:**
- `npm run build` - Build extension for production
- `npm run dev` - Build in watch mode for development  
- `npm run clean` - Clean dist directory

**Code Quality:**
- `npm run lint` - Run ESLint on TypeScript files
- `npm test` - Run Jest tests

## Project Architecture

**DOM Selector Ninja** is a browser extension that helps users build and test CSS selectors for DOM elements. The extension uses Manifest V3 and is built with TypeScript, Webpack, and Lit components.

### Core Architecture Components

**Background Script** (`src/background/`):
- Service worker that manages extension lifecycle
- Creates context menu items and handles browser action clicks
- Acts as message broker between popup and content scripts

**Content Script** (`src/content/`):
- Runs in webpage context to provide selector building UI
- Main entry point initializes UIManager and DomAnalyzer services
- Handles element selection and highlighting on target pages

**Popup** (`src/popup/`):
- Extension popup interface (currently minimal)
- Provides options page access

**Services Architecture** (`src/services/`):
- `selector-generator/` - Core CSS selector generation logic
- `dom-analyzer/` - DOM element analysis and traversal
- Content script services in `src/content/services/` handle UI management

### Key Data Flow

1. User right-clicks element → Background script receives context menu event
2. Background sends `initializeSelector` message → Content script
3. Content script activates element selection → UIManager creates selector panel
4. User interacts with selector options → SelectorGenerator provides selector variants
5. Final selector copied to clipboard or used for testing

### UI Architecture

**Hybrid UI Approach:**
- **Vanilla DOM** (`src/content/services/ui-manager.ts`) - Main draggable selector panel
- **Lit Components** (`src/ui/components/`) - Reusable web components using Lit framework
- **Shoelace Components** - UI library for consistent styling (per requirements)

### TypeScript Path Aliases

The project uses path aliases configured in both `tsconfig.json` and `webpack.config.js`:
- `@background/*` → `src/background/*`
- `@content/*` → `src/content/*`
- `@ui/*` → `src/ui/*`
- `@services/*` → `src/services/*`
- `@utils/*` → `src/utils/*`

### Extension Structure

**Manifest V3 Extension** with:
- Context menu integration for element selection
- Content scripts injected on all URLs
- Storage permissions for user preferences and history
- Active tab and scripting permissions for DOM access

### Testing and Development

**Jest Configuration:**
- Uses `jsdom` test environment for DOM testing
- Configured with same path aliases as main project
- Test files in `tests/` directory

**Development Notes:**
- Uses Webpack for bundling with source maps enabled
- CSS loaded via style-loader for runtime injection
- Extension files copied from `public/` to `dist/` during build
- Built with TypeScript strict mode enabled