import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { ScriptElement, ElementType } from '../../types/screenplay';
import { useDocumentStore } from '../../stores/documentStore';

interface EditorElementProps {
  element: ScriptElement;
  index: number;
  isActive: boolean;
  onFocus: () => void;
  onShowContextMenu: (e: React.MouseEvent) => void;
  characterSuggestions: string[];
  locationSuggestions: string[];
}

const ELEMENT_PLACEHOLDERS: Record<ElementType, string> = {
  'scene-heading': 'INT./EXT. LOCATION - DAY/NIGHT',
  'action': 'Action description...',
  'character': 'CHARACTER NAME',
  'dialogue': 'Dialogue...',
  'parenthetical': 'wryly',
  'transition': 'CUT TO:',
};

export const EditorElement: React.FC<EditorElementProps> = ({
  element,
  index,
  isActive,
  onFocus,
  onShowContextMenu,
  characterSuggestions,
  locationSuggestions,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteItems, setAutocompleteItems] = useState<string[]>([]);
  const [selectedAutocompleteIndex, setSelectedAutocompleteIndex] = useState(0);
  const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0 });
  // Track what type of autocomplete we're showing for scene headings
  const [autocompleteMode, setAutocompleteMode] = useState<'prefix' | 'location' | 'time' | 'character'>('character');

  // Scene heading autocomplete options
  const SCENE_PREFIXES = ['INT.', 'EXT.', 'INT./EXT.', 'I./E.'];
  const TIME_OPTIONS = ['DAY', 'NIGHT', 'CONTINUOUS', 'MORNING', 'EVENING', 'DAWN', 'DUSK', 'LATER', 'SAME'];

  const {
    updateElement,
    cycleElementType,
    insertElementAfter,
    deleteElement,
    setCurrentElement,
  } = useDocumentStore();

  // Set initial content on mount and when content changes externally (e.g., autocomplete)
  useEffect(() => {
    if (ref.current && ref.current.textContent !== element.content) {
      ref.current.textContent = element.content;
    }
  }, [element.content]);

  // Focus the element when it becomes active
  useEffect(() => {
    if (isActive && ref.current) {
      ref.current.focus();
      // Place cursor at end if element has content
      if (ref.current.textContent) {
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(ref.current);
        range.collapse(false);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  }, [isActive]);

  // Update autocomplete suggestions based on element type and content
  useEffect(() => {
    if (!isActive) {
      setShowAutocomplete(false);
      return;
    }

    const content = element.content.trim().toUpperCase();

    if (element.type === 'character' && content.length > 0) {
      const filtered = characterSuggestions.filter((name) =>
        name.startsWith(content) && name !== content
      );
      setAutocompleteItems(filtered);
      setShowAutocomplete(filtered.length > 0);
      setSelectedAutocompleteIndex(0);
      setAutocompleteMode('character');
    } else if (element.type === 'scene-heading') {
      // Check what part of the scene heading we're in
      // Pattern matches: INT. EXT. INT./EXT. INT/EXT. I./E. I/E.
      const prefixPattern = /^(INT\.|EXT\.|INT\.?\/EXT\.|I\.?\/E\.)/i;
      const hasPrefix = content.match(prefixPattern);
      const hasDash = content.includes('-') || content.includes('–') || content.includes('—');

      if (!hasPrefix && content.length > 0) {
        // User is typing the prefix (INT/EXT)
        const filtered = SCENE_PREFIXES.filter((prefix) =>
          prefix.toUpperCase().startsWith(content) && prefix.toUpperCase() !== content
        );
        setAutocompleteItems(filtered);
        setShowAutocomplete(filtered.length > 0);
        setSelectedAutocompleteIndex(0);
        setAutocompleteMode('prefix');
      } else if (hasDash) {
        // User has typed a dash anywhere - suggest time of day
        // Get text after the LAST dash (in case location has dashes)
        const parts = content.split(/[-–—]/);
        const afterDash = parts[parts.length - 1]?.trim() || '';
        const filtered = TIME_OPTIONS.filter((time) =>
          time.startsWith(afterDash) && time !== afterDash
        );
        setAutocompleteItems(filtered);
        setShowAutocomplete(filtered.length > 0);
        setSelectedAutocompleteIndex(0);
        setAutocompleteMode('time');
      } else if (hasPrefix) {
        // User is typing the location (after INT./EXT., before dash)
        const afterPrefix = content.replace(prefixPattern, '').trim();
        if (afterPrefix.length > 0) {
          const filtered = locationSuggestions.filter((loc) =>
            loc.startsWith(afterPrefix) && loc !== afterPrefix
          );
          setAutocompleteItems(filtered);
          setShowAutocomplete(filtered.length > 0);
          setSelectedAutocompleteIndex(0);
          setAutocompleteMode('location');
        } else {
          setShowAutocomplete(false);
        }
      } else {
        setShowAutocomplete(false);
      }
    } else {
      setShowAutocomplete(false);
    }
  }, [element.content, element.type, isActive, characterSuggestions, locationSuggestions]);

  // Calculate autocomplete position
  useEffect(() => {
    if (showAutocomplete && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setAutocompletePosition({
        top: rect.bottom + 4,
        left: rect.left,
      });
    }
  }, [showAutocomplete]);

  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    const content = e.currentTarget.textContent || '';
    updateElement(index, content);
  }, [index, updateElement]);

  // Helper to move cursor to end of contentEditable
  const moveCursorToEnd = useCallback(() => {
    if (ref.current) {
      ref.current.focus();
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(ref.current);
      range.collapse(false); // false = collapse to end
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, []);

  const applyAutocomplete = useCallback((suggestion: string, useTab = false) => {
    const prefixPattern = /^(INT\.|EXT\.|INT\.?\/EXT\.|I\.?\/E\.)\s*/i;

    if (autocompleteMode === 'character') {
      updateElement(index, suggestion);
    } else if (autocompleteMode === 'prefix') {
      // Apply INT./EXT. prefix - if Tab was used, add " - " for quick completion
      const newContent = useTab ? suggestion + ' - ' : suggestion + ' ';
      updateElement(index, newContent);
    } else if (autocompleteMode === 'location') {
      // Apply location, keeping the prefix
      const content = element.content.toUpperCase();
      const prefixMatch = content.match(prefixPattern);
      if (prefixMatch) {
        const prefix = prefixMatch[0];
        // If Tab was used, add " - " for quick time entry
        const newContent = useTab ? prefix + suggestion + ' - ' : prefix + suggestion;
        updateElement(index, newContent);
      }
    } else if (autocompleteMode === 'time') {
      // Apply time of day, keeping prefix and location
      // Find everything before the last dash
      const lastDashIndex = Math.max(
        element.content.lastIndexOf('-'),
        element.content.lastIndexOf('–'),
        element.content.lastIndexOf('—')
      );
      if (lastDashIndex !== -1) {
        const beforeDash = element.content.substring(0, lastDashIndex).trim();
        updateElement(index, beforeDash + ' - ' + suggestion);
      }
    }
    setShowAutocomplete(false);
    // Move cursor to end after DOM updates
    setTimeout(moveCursorToEnd, 0);
  }, [autocompleteMode, element.content, index, updateElement, moveCursorToEnd]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    // Handle autocomplete navigation
    if (showAutocomplete) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedAutocompleteIndex((prev) =>
          prev < autocompleteItems.length - 1 ? prev + 1 : prev
        );
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedAutocompleteIndex((prev) => (prev > 0 ? prev - 1 : prev));
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        if (autocompleteItems[selectedAutocompleteIndex]) {
          e.preventDefault();
          applyAutocomplete(autocompleteItems[selectedAutocompleteIndex], e.key === 'Tab');
          return;
        }
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowAutocomplete(false);
        return;
      }
    }

    // Tab cycles through element types
    if (e.key === 'Tab') {
      e.preventDefault();
      cycleElementType(index, e.shiftKey);
      return;
    }

    // Enter creates a new element
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();

      // Determine what type the next element should be
      let nextType: ElementType = 'action';

      if (element.type === 'scene-heading') {
        nextType = 'action';
      } else if (element.type === 'character') {
        nextType = 'dialogue';
      } else if (element.type === 'dialogue') {
        nextType = 'action';
      } else if (element.type === 'parenthetical') {
        nextType = 'dialogue';
      }

      insertElementAfter(index, nextType);
      return;
    }

    // Backspace at start of empty element deletes it
    if (e.key === 'Backspace') {
      const selection = window.getSelection();
      if (
        element.content === '' ||
        (selection?.anchorOffset === 0 && selection?.focusOffset === 0)
      ) {
        if (index > 0) {
          e.preventDefault();
          setCurrentElement(index - 1);
          deleteElement(index);
        }
        return;
      }
    }

    // Arrow up at start of element moves to previous element
    if (e.key === 'ArrowUp') {
      const selection = window.getSelection();
      if (selection?.anchorOffset === 0 && index > 0) {
        e.preventDefault();
        setCurrentElement(index - 1);
      }
    }

    // Arrow down at end of element moves to next element
    if (e.key === 'ArrowDown') {
      const selection = window.getSelection();
      const contentLength = element.content.length;
      if (selection?.anchorOffset === contentLength) {
        e.preventDefault();
        // Will be handled by parent if there's a next element
        const nextIndex = index + 1;
        setCurrentElement(nextIndex);
      }
    }
  }, [
    showAutocomplete,
    autocompleteItems,
    selectedAutocompleteIndex,
    applyAutocomplete,
    cycleElementType,
    index,
    element.type,
    element.content,
    insertElementAfter,
    setCurrentElement,
    deleteElement,
  ]);

  const handleFocus = useCallback(() => {
    onFocus();
    setCurrentElement(index);
  }, [onFocus, setCurrentElement, index]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    onShowContextMenu(e);
  }, [onShowContextMenu]);

  // Handle click on non-active elements to focus them
  const handleClick = useCallback(() => {
    if (!isActive) {
      onFocus();
      setCurrentElement(index);
    }
  }, [isActive, onFocus, setCurrentElement, index]);

  return (
    <div className="editor-element-wrapper" style={{ position: 'relative' }}>
      <div
        ref={ref}
        className={`script-element screenplay-font ${element.type} ${isActive ? 'active' : ''}`}
        contentEditable={isActive}
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        data-placeholder={ELEMENT_PLACEHOLDERS[element.type]}
        data-element-type={element.type}
        data-index={index}
        tabIndex={0}
      />

      {showAutocomplete && autocompleteItems.length > 0 && (
        <div
          className="autocomplete"
          style={{
            position: 'fixed',
            top: autocompletePosition.top,
            left: autocompletePosition.left,
          }}
        >
          {autocompleteItems.map((item, i) => (
            <div
              key={item}
              className={`autocomplete-item ${i === selectedAutocompleteIndex ? 'selected' : ''}`}
              onClick={() => applyAutocomplete(item)}
              onMouseEnter={() => setSelectedAutocompleteIndex(i)}
            >
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
