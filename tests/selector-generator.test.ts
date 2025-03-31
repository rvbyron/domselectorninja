import { SelectorGenerator } from '../src/services/selector-generator';

describe('SelectorGenerator', () => {
  let document: Document;
  let element: Element;

  beforeEach(() => {
    // Set up a simple DOM for testing
    document = new DOMParser().parseFromString(`
      <html>
        <body>
          <div id="container">
            <p class="text primary">Sample text</p>
            <p class="text secondary">Another text</p>
            <div class="box" data-test="value">
              <span class="target" title="test">Target Element</span>
            </div>
          </div>
        </body>
      </html>
    `, 'text/html');

    element = document.querySelector('.target') as Element;
  });

  test('generateCoreSelectors should return tag and universal selectors', () => {
    const selectors = SelectorGenerator.generateCoreSelectors(element, document);
    
    expect(selectors.length).toBeGreaterThan(0);
    expect(selectors.some(s => s.selector === 'span')).toBe(true);
    expect(selectors.some(s => s.selector === '*')).toBe(true);
  });

  test('generateClassSelectors should return class-based selectors', () => {
    const selectors = SelectorGenerator.generateClassSelectors(element, document);
    
    expect(selectors.length).toBeGreaterThan(0);
    expect(selectors.some(s => s.selector === '.target')).toBe(true);
  });

  test('generateAttributeSelectors should return attribute selectors', () => {
    const selectors = SelectorGenerator.generateAttributeSelectors(element, document);
    
    expect(selectors.length).toBeGreaterThan(0);
    expect(selectors.some(s => s.selector === '[title]')).toBe(true);
    expect(selectors.some(s => s.selector === '[title="test"]')).toBe(true);
  });

  test('generateCombinatorSelectors should return combinator selectors', () => {
    const selectors = SelectorGenerator.generateCombinatorSelectors(element, document);
    
    expect(selectors.length).toBeGreaterThan(0);
    expect(selectors.some(s => s.selector.includes('>'))).toBe(true);
  });
});