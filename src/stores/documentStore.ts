import { create } from 'zustand';
import type {
  Screenplay,
  ElementType,
  CharacterInfo,
  LocationInfo,
  Scene,
  TitlePage,
} from '../types/screenplay';
import {
  createEmptyScreenplay,
  createEmptyElement,
  generateId,
  parseSceneHeading,
  ELEMENT_CYCLE,
} from '../types/screenplay';
import {
  saveScreenplay as saveFile,
  loadScreenplay as loadFile,
  autoSaveToLocalStorage,
  loadFromLocalStorage,
} from '../utils/fileIO';

interface DocumentState {
  // Current document
  screenplay: Screenplay;

  // Editor state
  currentElementIndex: number;
  cursorPosition: number;

  // File state
  isDirty: boolean;
  lastSavedAt: Date | null;

  // Derived data
  scenes: Scene[];

  // Document actions
  setScreenplay: (screenplay: Screenplay) => void;
  newScreenplay: (title?: string, author?: string) => void;

  // File operations
  saveToFile: () => Promise<boolean>;
  loadFromFile: () => Promise<boolean>;
  autoSave: () => void;
  loadAutoSave: () => boolean;
  markClean: () => void;

  // Element actions
  updateElement: (index: number, content: string) => void;
  updateElementType: (index: number, type: ElementType) => void;
  insertElementAfter: (index: number, type: ElementType) => void;
  deleteElement: (index: number) => void;

  // Navigation
  setCurrentElement: (index: number) => void;
  setCursorPosition: (position: number) => void;

  // Cycle element type with Tab
  cycleElementType: (index: number, reverse?: boolean) => void;

  // Character management
  addCharacter: (name: string) => void;
  incrementCharacterLineCount: (name: string) => void;
  getCharactersSortedByLineCount: () => CharacterInfo[];

  // Location management
  addLocation: (name: string, isInterior: boolean) => void;
  getLocationsSortedByOccurrence: () => LocationInfo[];

  // Title page
  updateTitlePage: (titlePage: TitlePage | undefined) => void;

  // Recalculate derived data
  recalculateScenes: () => void;
  recalculateCharacters: () => void;
  recalculateLocations: () => void;
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  screenplay: createEmptyScreenplay(),
  currentElementIndex: 0,
  cursorPosition: 0,
  isDirty: false,
  lastSavedAt: null,
  scenes: [],

  setScreenplay: (screenplay) => {
    set({ screenplay, isDirty: true });
    get().recalculateScenes();
    get().recalculateCharacters();
    get().recalculateLocations();
  },

  newScreenplay: (title = 'Untitled', author = '') => {
    const screenplay = createEmptyScreenplay(title, author);
    set({
      screenplay,
      currentElementIndex: 0,
      cursorPosition: 0,
      scenes: [],
      isDirty: false,
      lastSavedAt: null,
    });
  },

  // File operations
  saveToFile: async () => {
    const { screenplay } = get();
    const success = await saveFile(screenplay);
    if (success) {
      set({ isDirty: false, lastSavedAt: new Date() });
    }
    return success;
  },

  loadFromFile: async () => {
    const screenplay = await loadFile();
    if (screenplay) {
      set({
        screenplay,
        currentElementIndex: 0,
        cursorPosition: 0,
        isDirty: false,
        lastSavedAt: new Date(),
      });
      get().recalculateScenes();
      get().recalculateCharacters();
      get().recalculateLocations();
      return true;
    }
    return false;
  },

  autoSave: () => {
    const { screenplay } = get();
    autoSaveToLocalStorage(screenplay);
  },

  loadAutoSave: () => {
    const screenplay = loadFromLocalStorage();
    if (screenplay) {
      set({
        screenplay,
        currentElementIndex: 0,
        cursorPosition: 0,
        isDirty: true, // Mark dirty since it's recovered, not saved to file
      });
      get().recalculateScenes();
      get().recalculateCharacters();
      get().recalculateLocations();
      return true;
    }
    return false;
  },

  markClean: () => {
    set({ isDirty: false, lastSavedAt: new Date() });
  },

  updateElement: (index, content) => {
    const { screenplay } = get();
    const elements = [...screenplay.elements];

    if (index >= 0 && index < elements.length) {
      elements[index] = { ...elements[index], content };

      set({
        screenplay: {
          ...screenplay,
          elements,
          updatedAt: new Date(),
        },
        isDirty: true,
      });

      // Recalculate if it's a scene heading or character
      const element = elements[index];
      if (element.type === 'scene-heading') {
        get().recalculateScenes();
        get().recalculateLocations();
      } else if (element.type === 'character') {
        get().recalculateCharacters();
      }
    }
  },

  updateElementType: (index, type) => {
    const { screenplay } = get();
    const elements = [...screenplay.elements];

    if (index >= 0 && index < elements.length) {
      const oldType = elements[index].type;
      elements[index] = { ...elements[index], type };

      set({
        screenplay: {
          ...screenplay,
          elements,
          updatedAt: new Date(),
        },
        isDirty: true,
      });

      // Recalculate derived data if needed
      if (oldType === 'scene-heading' || type === 'scene-heading') {
        get().recalculateScenes();
        get().recalculateLocations();
      }
      if (oldType === 'character' || type === 'character') {
        get().recalculateCharacters();
      }
    }
  },

  insertElementAfter: (index, type) => {
    const { screenplay } = get();
    const elements = [...screenplay.elements];
    const newElement = createEmptyElement(type);

    elements.splice(index + 1, 0, newElement);

    set({
      screenplay: {
        ...screenplay,
        elements,
        updatedAt: new Date(),
      },
      currentElementIndex: index + 1,
      cursorPosition: 0,
      isDirty: true,
    });

    if (type === 'scene-heading') {
      get().recalculateScenes();
    }
  },

  deleteElement: (index) => {
    const { screenplay, currentElementIndex } = get();
    const elements = [...screenplay.elements];

    // Don't delete if it's the only element
    if (elements.length <= 1) return;

    if (index >= 0 && index < elements.length) {
      const deletedType = elements[index].type;
      elements.splice(index, 1);

      // Adjust current element index if needed
      let newIndex = currentElementIndex;
      if (currentElementIndex >= elements.length) {
        newIndex = elements.length - 1;
      } else if (currentElementIndex > index) {
        newIndex = currentElementIndex - 1;
      }

      set({
        screenplay: {
          ...screenplay,
          elements,
          updatedAt: new Date(),
        },
        currentElementIndex: newIndex,
        isDirty: true,
      });

      if (deletedType === 'scene-heading') {
        get().recalculateScenes();
        get().recalculateLocations();
      } else if (deletedType === 'character') {
        get().recalculateCharacters();
      }
    }
  },

  setCurrentElement: (index) => {
    const { screenplay } = get();
    if (index >= 0 && index < screenplay.elements.length) {
      set({ currentElementIndex: index });
    }
  },

  setCursorPosition: (position) => {
    set({ cursorPosition: position });
  },

  cycleElementType: (index, reverse = false) => {
    const { screenplay } = get();
    const element = screenplay.elements[index];
    if (!element) return;

    const currentTypeIndex = ELEMENT_CYCLE.indexOf(element.type);
    if (currentTypeIndex === -1) {
      // If current type is parenthetical (not in cycle), go to dialogue
      get().updateElementType(index, 'dialogue');
      return;
    }

    let newIndex: number;
    if (reverse) {
      // Shift+Tab goes backwards, or to parenthetical from dialogue
      if (element.type === 'dialogue') {
        get().updateElementType(index, 'parenthetical');
        return;
      }
      newIndex = (currentTypeIndex - 1 + ELEMENT_CYCLE.length) % ELEMENT_CYCLE.length;
    } else {
      newIndex = (currentTypeIndex + 1) % ELEMENT_CYCLE.length;
    }

    get().updateElementType(index, ELEMENT_CYCLE[newIndex]);
  },

  addCharacter: (name) => {
    const { screenplay } = get();
    const normalizedName = name.trim().toUpperCase();

    if (!normalizedName) return;

    const exists = screenplay.characters.some(
      (c) => c.name.toUpperCase() === normalizedName
    );

    if (!exists) {
      set({
        screenplay: {
          ...screenplay,
          characters: [
            ...screenplay.characters,
            {
              name: normalizedName,
              lineCount: 0,
              firstAppearance: get().currentElementIndex,
            },
          ],
          updatedAt: new Date(),
        },
      });
    }
  },

  incrementCharacterLineCount: (name) => {
    const { screenplay } = get();
    const normalizedName = name.trim().toUpperCase();

    const characters = screenplay.characters.map((c) =>
      c.name.toUpperCase() === normalizedName
        ? { ...c, lineCount: c.lineCount + 1 }
        : c
    );

    set({
      screenplay: {
        ...screenplay,
        characters,
        updatedAt: new Date(),
      },
    });
  },

  getCharactersSortedByLineCount: () => {
    return [...get().screenplay.characters].sort((a, b) => b.lineCount - a.lineCount);
  },

  addLocation: (name, isInterior) => {
    const { screenplay } = get();
    const normalizedName = name.trim().toUpperCase();

    if (!normalizedName) return;

    const existingIndex = screenplay.locations.findIndex(
      (l) => l.name.toUpperCase() === normalizedName
    );

    if (existingIndex === -1) {
      set({
        screenplay: {
          ...screenplay,
          locations: [
            ...screenplay.locations,
            {
              name: normalizedName,
              occurrenceCount: 1,
              isInterior,
            },
          ],
          updatedAt: new Date(),
        },
      });
    } else {
      const locations = [...screenplay.locations];
      locations[existingIndex] = {
        ...locations[existingIndex],
        occurrenceCount: locations[existingIndex].occurrenceCount + 1,
      };
      set({
        screenplay: {
          ...screenplay,
          locations,
          updatedAt: new Date(),
        },
      });
    }
  },

  getLocationsSortedByOccurrence: () => {
    return [...get().screenplay.locations].sort(
      (a, b) => b.occurrenceCount - a.occurrenceCount
    );
  },

  updateTitlePage: (titlePage) => {
    const { screenplay } = get();
    set({
      screenplay: {
        ...screenplay,
        titlePage,
        // Also update main title/author if provided
        title: titlePage?.title || screenplay.title,
        author: titlePage?.author || screenplay.author,
        updatedAt: new Date(),
      },
      isDirty: true,
    });
  },

  recalculateScenes: () => {
    const { screenplay } = get();
    const scenes: Scene[] = [];
    let sceneNumber = 1;

    screenplay.elements.forEach((element) => {
      if (element.type === 'scene-heading' && element.content.trim()) {
        const { isInterior, location, timeOfDay } = parseSceneHeading(element.content);
        scenes.push({
          id: generateId(),
          elementId: element.id,
          sceneNumber: sceneNumber++,
          heading: element.content,
          location,
          timeOfDay,
          isInterior,
        });
      }
    });

    set({ scenes });
  },

  recalculateCharacters: () => {
    const { screenplay } = get();
    const characterMap = new Map<string, CharacterInfo>();

    screenplay.elements.forEach((element, index) => {
      if (element.type === 'character' && element.content.trim()) {
        const name = element.content.trim().toUpperCase();
        // Remove any parenthetical extensions like (V.O.) or (O.S.)
        const cleanName = name.replace(/\s*\(.*?\)\s*$/, '').trim();

        if (!characterMap.has(cleanName)) {
          characterMap.set(cleanName, {
            name: cleanName,
            lineCount: 0,
            firstAppearance: index,
          });
        }
      }

      // Count dialogue lines for each character
      if (element.type === 'dialogue') {
        // Find the preceding character element
        for (let i = index - 1; i >= 0; i--) {
          const prev = screenplay.elements[i];
          if (prev.type === 'character') {
            const charName = prev.content.trim().toUpperCase().replace(/\s*\(.*?\)\s*$/, '').trim();
            const char = characterMap.get(charName);
            if (char) {
              char.lineCount++;
            }
            break;
          }
          // Stop if we hit another dialogue or a scene heading
          if (prev.type === 'dialogue' || prev.type === 'scene-heading') break;
        }
      }
    });

    set({
      screenplay: {
        ...screenplay,
        characters: Array.from(characterMap.values()),
      },
    });
  },

  recalculateLocations: () => {
    const { screenplay } = get();
    const locationMap = new Map<string, LocationInfo>();

    screenplay.elements.forEach((element) => {
      if (element.type === 'scene-heading' && element.content.trim()) {
        const { isInterior, location } = parseSceneHeading(element.content);

        if (location) {
          const existing = locationMap.get(location);
          if (existing) {
            existing.occurrenceCount++;
          } else {
            locationMap.set(location, {
              name: location,
              occurrenceCount: 1,
              isInterior,
            });
          }
        }
      }
    });

    set({
      screenplay: {
        ...screenplay,
        locations: Array.from(locationMap.values()),
      },
    });
  },
}));
