// Screenplay element types
export type ElementType =
  | 'scene-heading'
  | 'action'
  | 'character'
  | 'dialogue'
  | 'parenthetical'
  | 'transition';

// The order for Tab cycling (parenthetical is accessed via Shift+Tab from dialogue)
export const ELEMENT_CYCLE: ElementType[] = [
  'scene-heading',
  'action',
  'character',
  'dialogue',
  'transition'
];

// Individual script element
export interface ScriptElement {
  id: string;
  type: ElementType;
  content: string;
  // For text formatting within the element
  formatting?: TextFormatting[];
}

// Text formatting (bold, italic, underline) ranges
export interface TextFormatting {
  start: number;
  end: number;
  format: 'bold' | 'italic' | 'underline';
}

// Character tracking for auto-complete
export interface CharacterInfo {
  name: string;
  lineCount: number; // Number of dialogue lines
  firstAppearance: number; // Element index where first appeared
}

// Location tracking for auto-complete
export interface LocationInfo {
  name: string;
  occurrenceCount: number;
  isInterior: boolean; // INT vs EXT
}

// Complete screenplay document
export interface Screenplay {
  id: string;
  title: string;
  author: string;
  titlePage?: TitlePage; // Optional title page
  elements: ScriptElement[];
  characters: CharacterInfo[];
  locations: LocationInfo[];
  createdAt: Date;
  updatedAt: Date;
}

// Scene for Table of Contents
export interface Scene {
  id: string;
  elementId: string; // References the scene-heading element
  sceneNumber: number;
  heading: string; // The full scene heading text
  location: string; // Extracted location
  timeOfDay: string; // DAY, NIGHT, etc.
  isInterior: boolean;
}

// Title Page (industry standard format)
export interface TitlePage {
  title: string;
  titleFontSize?: 'small' | 'medium' | 'large'; // Title font size option
  writtenBy: string; // "Written by" line
  author: string;
  basedOn?: string; // "Based on..." line (optional)
  contactInfo?: string; // Bottom left/right contact info
  draftDate?: string; // Draft date (e.g., "First Draft - January 2026")
  copyright?: string; // Copyright notice
}

// Editor state
export interface EditorState {
  currentElementIndex: number;
  cursorPosition: number;
  selectedRange?: { start: number; end: number };
}

// App settings
export interface AppSettings {
  theme: 'midcentury' | 'classic' | 'noir';
  fontSize: number; // Base font size multiplier
  autoSave: boolean;
  autoSaveInterval: number; // in milliseconds
}

// Formatting constants (in inches, converted to CSS units)
export const FORMATTING = {
  // Page dimensions
  PAGE_WIDTH: 8.5, // inches
  PAGE_HEIGHT: 11, // inches

  // Margins
  MARGIN_LEFT: 1.5, // inches
  MARGIN_RIGHT: 1, // inches
  MARGIN_TOP: 1, // inches
  MARGIN_BOTTOM: 1, // inches

  // Element positioning (from left edge of page)
  SCENE_HEADING_LEFT: 1.5, // inches
  ACTION_LEFT: 1.5, // inches
  CHARACTER_LEFT: 3.7, // inches (approximately centered)
  PARENTHETICAL_LEFT: 3.1, // inches
  DIALOGUE_LEFT: 2.5, // inches
  DIALOGUE_WIDTH: 3.5, // inches
  TRANSITION_RIGHT_ALIGN: true,

  // Font
  FONT_FAMILY: '"Courier Prime", "Courier New", Courier, monospace',
  FONT_SIZE: 12, // points

  // Lines per page (for page break calculation)
  LINES_PER_PAGE: 55,

  // Line height
  LINE_HEIGHT: 1, // single spaced
} as const;

// Helper to generate unique IDs
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Create a new empty element
export function createEmptyElement(type: ElementType): ScriptElement {
  return {
    id: generateId(),
    type,
    content: '',
  };
}

// Create a new empty screenplay
export function createEmptyScreenplay(title: string = 'Untitled', author: string = ''): Screenplay {
  return {
    id: generateId(),
    title,
    author,
    elements: [createEmptyElement('scene-heading')],
    characters: [],
    locations: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// Parse a scene heading to extract location and time of day
export function parseSceneHeading(heading: string): {
  isInterior: boolean;
  location: string;
  timeOfDay: string
} {
  const trimmed = heading.trim().toUpperCase();
  // Check for interior - also handles INT./EXT. as interior-first
  const isInterior = trimmed.startsWith('INT');

  // Remove INT./EXT. prefix - order matters: longer patterns first
  // Matches: INT./EXT., INT/EXT., I./E., I/E., INT., EXT.
  let remaining = trimmed.replace(/^(INT\.?\/EXT\.|I\.?\/E\.|INT\.|EXT\.)\s*/i, '');

  // Split by common time-of-day separators
  const timeMatch = remaining.match(/\s*[-–—]\s*(DAY|NIGHT|MORNING|EVENING|DAWN|DUSK|LATER|CONTINUOUS|SAME|MOMENTS LATER).*$/i);

  let location = remaining;
  let timeOfDay = 'DAY';

  if (timeMatch) {
    location = remaining.substring(0, timeMatch.index || 0).trim();
    timeOfDay = timeMatch[1].toUpperCase();
  }

  return { isInterior, location, timeOfDay };
}
