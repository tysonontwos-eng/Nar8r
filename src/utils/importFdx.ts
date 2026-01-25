import type { Screenplay, ScriptElement, ElementType } from '../types/screenplay';
import { generateId, createEmptyScreenplay } from '../types/screenplay';

/**
 * Map FDX paragraph types to our element types
 */
const FDX_TYPE_MAP: Record<string, ElementType> = {
  'Scene Heading': 'scene-heading',
  'Action': 'action',
  'Character': 'character',
  'Dialogue': 'dialogue',
  'Parenthetical': 'parenthetical',
  'Transition': 'transition',
  // Common variations
  'General': 'action',
  'Shot': 'scene-heading',
};

interface FdxTitlePage {
  title?: string;
  author?: string;
  contact?: string;
  copyright?: string;
}

/**
 * Parse FDX XML content to a Screenplay
 */
export function parseFdx(xmlContent: string): Screenplay {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlContent, 'application/xml');

  // Check for parse errors
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Invalid FDX file: ' + parseError.textContent);
  }

  // Extract title page info
  const titlePage = extractTitlePage(doc);

  // Extract content paragraphs
  const elements = extractElements(doc);

  // Create screenplay with extracted data
  const screenplay = createEmptyScreenplay(
    titlePage.title || 'Imported Screenplay',
    titlePage.author || ''
  );

  // Replace default element with imported elements
  if (elements.length > 0) {
    screenplay.elements = elements;
  }

  return screenplay;
}

/**
 * Extract title page information from FDX
 */
function extractTitlePage(doc: Document): FdxTitlePage {
  const result: FdxTitlePage = {};

  // Try to find TitlePage element
  const titlePage = doc.querySelector('TitlePage');
  if (titlePage) {
    // Title page content is in Content > Paragraph elements
    const paragraphs = titlePage.querySelectorAll('Content Paragraph');
    paragraphs.forEach((p) => {
      const text = getTextContent(p);
      if (text) {
        // Try to identify what this paragraph is
        const lowerText = text.toLowerCase();
        if (!result.title && !lowerText.includes('written by') && !lowerText.includes('by')) {
          // First non-"written by" text is likely the title
          if (text.length < 100) {
            result.title = text;
          }
        } else if (lowerText.includes('written by') || lowerText.includes('by')) {
          // Next line after "written by" is likely the author
          // This is a simplified approach
        }
      }
    });
  }

  // Also try HeaderAndFooter for title
  const header = doc.querySelector('HeaderAndFooter Header');
  if (header && !result.title) {
    const text = getTextContent(header);
    if (text && text.length < 100) {
      result.title = text;
    }
  }

  return result;
}

/**
 * Extract script elements from FDX content
 */
function extractElements(doc: Document): ScriptElement[] {
  const elements: ScriptElement[] = [];

  // Find Content > Paragraph elements
  const content = doc.querySelector('Content');
  if (!content) {
    // Try alternate structure
    const paragraphs = doc.querySelectorAll('Paragraph');
    paragraphs.forEach((p) => {
      const element = parseParagraph(p);
      if (element) {
        elements.push(element);
      }
    });
    return elements;
  }

  const paragraphs = content.querySelectorAll(':scope > Paragraph');
  paragraphs.forEach((p) => {
    const element = parseParagraph(p);
    if (element) {
      elements.push(element);
    }
  });

  return elements;
}

/**
 * Parse a single FDX Paragraph element
 */
function parseParagraph(paragraph: Element): ScriptElement | null {
  const typeAttr = paragraph.getAttribute('Type') || '';
  const elementType = FDX_TYPE_MAP[typeAttr];

  // Skip unknown types or empty paragraphs
  if (!elementType) {
    // Default to action for unknown types
    const text = getTextContent(paragraph);
    if (text.trim()) {
      return {
        id: generateId(),
        type: 'action',
        content: text,
      };
    }
    return null;
  }

  const text = getTextContent(paragraph);

  // Skip empty elements (except scene headings which might be placeholders)
  if (!text.trim() && elementType !== 'scene-heading') {
    return null;
  }

  return {
    id: generateId(),
    type: elementType,
    content: text,
  };
}

/**
 * Get text content from a paragraph, handling Text elements and formatting
 */
function getTextContent(element: Element): string {
  const textElements = element.querySelectorAll('Text');
  if (textElements.length > 0) {
    return Array.from(textElements)
      .map((t) => t.textContent || '')
      .join('');
  }

  // Fallback to direct text content
  return element.textContent || '';
}

/**
 * Load an FDX file and parse it
 */
export async function loadFdxFile(): Promise<Screenplay | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.fdx';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        resolve(null);
        return;
      }

      try {
        const content = await file.text();
        const screenplay = parseFdx(content);
        resolve(screenplay);
      } catch (err) {
        console.error('Failed to parse FDX file:', err);
        alert('Failed to import FDX file. The file may be corrupted or in an unsupported format.');
        resolve(null);
      }
    };

    input.oncancel = () => resolve(null);
    input.click();
  });
}
