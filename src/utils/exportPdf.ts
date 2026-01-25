import { jsPDF } from 'jspdf';
import type { Screenplay, TitlePage } from '../types/screenplay';

// Page dimensions in points (72 points = 1 inch)
const PAGE_WIDTH = 8.5 * 72; // 612
const PAGE_HEIGHT = 11 * 72; // 792
const MARGIN_LEFT = 1.5 * 72; // 108
const MARGIN_RIGHT = 1 * 72; // 72
const MARGIN_TOP = 1 * 72; // 72
const MARGIN_BOTTOM = 1 * 72; // 72
const LINE_HEIGHT = 12; // 12pt font = 12pt line height

// Content area
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

// Element indents (from left margin)
const CHARACTER_INDENT = 2.2 * 72; // 158.4
const PARENTHETICAL_INDENT = 1.6 * 72; // 115.2
const DIALOGUE_INDENT = 1 * 72; // 72
const DIALOGUE_WIDTH = 3.5 * 72; // 252

/**
 * Export screenplay to PDF with direct download
 */
export function exportToPdf(screenplay: Screenplay): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter',
  });

  // Set Courier font
  doc.setFont('courier', 'normal');
  doc.setFontSize(12);

  let yPosition = MARGIN_TOP;

  // Add title page if exists
  if (screenplay.titlePage) {
    addTitlePage(doc, screenplay.titlePage);
    doc.addPage();
  }

  // Process each element
  let isFirstElement = true;
  screenplay.elements.forEach((element) => {
    if (!element.content.trim() && element.type !== 'scene-heading') {
      return; // Skip empty non-scene-heading elements
    }

    // Calculate space needed for this element
    const elementHeight = calculateElementHeight(doc, element.type, element.content);
    const spaceBefore = getSpaceBefore(element.type, isFirstElement);

    // Check if we need a new page
    if (yPosition + spaceBefore + elementHeight > PAGE_HEIGHT - MARGIN_BOTTOM) {
      doc.addPage();
      yPosition = MARGIN_TOP;
      isFirstElement = true;
    } else {
      yPosition += spaceBefore;
    }

    // Render the element
    yPosition = renderElement(doc, element.type, element.content, yPosition);
    isFirstElement = false;
  });

  // Download the PDF
  doc.save(`${screenplay.title || 'Screenplay'}.pdf`);
}

/**
 * Add title page to PDF
 */
function addTitlePage(doc: jsPDF, titlePage: TitlePage): void {
  const centerX = PAGE_WIDTH / 2;
  const centerY = PAGE_HEIGHT / 2 - 72; // Slightly above center

  // Title font sizes
  const fontSizeMap = {
    small: 14,
    medium: 18,
    large: 24,
  };
  const titleFontSize = fontSizeMap[titlePage.titleFontSize || 'medium'];

  // Title
  doc.setFontSize(titleFontSize);
  doc.setFont('courier', 'normal');
  const title = titlePage.title.toUpperCase();
  const titleWidth = doc.getTextWidth(title);
  doc.text(title, centerX - titleWidth / 2, centerY);

  // Written by
  doc.setFontSize(12);
  let yPos = centerY + titleFontSize + 24;
  const writtenBy = titlePage.writtenBy;
  const writtenByWidth = doc.getTextWidth(writtenBy);
  doc.text(writtenBy, centerX - writtenByWidth / 2, yPos);

  // Author
  yPos += 18;
  const author = titlePage.author;
  const authorWidth = doc.getTextWidth(author);
  doc.text(author, centerX - authorWidth / 2, yPos);

  // Based on (if provided)
  if (titlePage.basedOn) {
    yPos += 24;
    doc.setFont('courier', 'oblique');
    const basedOn = titlePage.basedOn;
    const basedOnWidth = doc.getTextWidth(basedOn);
    doc.text(basedOn, centerX - basedOnWidth / 2, yPos);
    doc.setFont('courier', 'normal');
  }

  // Draft date (if provided)
  if (titlePage.draftDate) {
    yPos += 36;
    const draftDate = titlePage.draftDate;
    const draftDateWidth = doc.getTextWidth(draftDate);
    doc.text(draftDate, centerX - draftDateWidth / 2, yPos);
  }

  // Contact info (bottom left)
  if (titlePage.contactInfo || titlePage.copyright) {
    const bottomY = PAGE_HEIGHT - MARGIN_BOTTOM;
    doc.setFontSize(10);

    if (titlePage.contactInfo) {
      const lines = titlePage.contactInfo.split('\n');
      lines.forEach((line, i) => {
        doc.text(line, MARGIN_LEFT, bottomY - (lines.length - i - 1) * 14 - (titlePage.copyright ? 20 : 0));
      });
    }

    if (titlePage.copyright) {
      doc.text(titlePage.copyright, MARGIN_LEFT, bottomY);
    }

    doc.setFontSize(12);
  }
}

/**
 * Calculate height needed for an element
 */
function calculateElementHeight(doc: jsPDF, type: string, content: string): number {
  const maxWidth = getMaxWidth(type);
  const lines = doc.splitTextToSize(content, maxWidth);
  return lines.length * LINE_HEIGHT;
}

/**
 * Get max width for element type
 */
function getMaxWidth(type: string): number {
  switch (type) {
    case 'dialogue':
      return DIALOGUE_WIDTH;
    case 'parenthetical':
      return 2 * 72; // 2 inches
    default:
      return CONTENT_WIDTH;
  }
}

/**
 * Get space before element
 */
function getSpaceBefore(type: string, isFirst: boolean): number {
  if (isFirst) return 0;

  switch (type) {
    case 'scene-heading':
    case 'action':
    case 'character':
    case 'transition':
      return LINE_HEIGHT; // One blank line
    default:
      return 0;
  }
}

/**
 * Render an element and return new Y position
 */
function renderElement(doc: jsPDF, type: string, content: string, yPosition: number): number {
  const maxWidth = getMaxWidth(type);
  let xPosition = MARGIN_LEFT;

  // Adjust position based on type
  switch (type) {
    case 'character':
      xPosition = MARGIN_LEFT + CHARACTER_INDENT;
      content = content.toUpperCase();
      break;
    case 'parenthetical':
      xPosition = MARGIN_LEFT + PARENTHETICAL_INDENT;
      content = `(${content})`;
      break;
    case 'dialogue':
      xPosition = MARGIN_LEFT + DIALOGUE_INDENT;
      break;
    case 'scene-heading':
      content = content.toUpperCase();
      break;
    case 'transition':
      content = content.toUpperCase();
      // Right-align transitions
      const textWidth = doc.getTextWidth(content);
      xPosition = PAGE_WIDTH - MARGIN_RIGHT - textWidth;
      break;
  }

  // Split and render text
  const lines = doc.splitTextToSize(content, maxWidth);
  lines.forEach((line: string) => {
    doc.text(line, xPosition, yPosition);
    yPosition += LINE_HEIGHT;
  });

  return yPosition;
}
