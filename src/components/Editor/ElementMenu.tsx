import React, { useEffect, useRef, useCallback } from 'react';
import type { ElementType, CharacterInfo, LocationInfo } from '../../types/screenplay';
import { ELEMENT_CYCLE } from '../../types/screenplay';
import { useDocumentStore } from '../../stores/documentStore';

interface ElementMenuProps {
  x: number;
  y: number;
  elementIndex: number;
  onClose: () => void;
  characters: CharacterInfo[];
  locations: LocationInfo[];
}

const ELEMENT_LABELS: Record<ElementType, string> = {
  'scene-heading': 'Scene Heading',
  'action': 'Action',
  'character': 'Character',
  'dialogue': 'Dialogue',
  'parenthetical': 'Parenthetical',
  'transition': 'Transition',
};

export const ElementMenu: React.FC<ElementMenuProps> = ({
  x,
  y,
  elementIndex,
  onClose,
  characters,
  locations,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const { screenplay, updateElementType, updateElement } = useDocumentStore();
  const currentElement = screenplay.elements[elementIndex];

  // Position the menu within viewport bounds
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = x;
      let adjustedY = y;

      if (x + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10;
      }
      if (y + rect.height > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10;
      }

      menuRef.current.style.left = `${adjustedX}px`;
      menuRef.current.style.top = `${adjustedY}px`;
    }
  }, [x, y]);

  // Close menu on escape or click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleSelectType = useCallback((type: ElementType) => {
    updateElementType(elementIndex, type);
    onClose();
  }, [elementIndex, updateElementType, onClose]);

  const handleSelectCharacter = useCallback((name: string) => {
    updateElementType(elementIndex, 'character');
    updateElement(elementIndex, name);
    onClose();
  }, [elementIndex, updateElementType, updateElement, onClose]);

  const handleSelectLocation = useCallback((name: string, isInterior: boolean) => {
    const prefix = isInterior ? 'INT. ' : 'EXT. ';
    updateElementType(elementIndex, 'scene-heading');
    updateElement(elementIndex, prefix + name + ' - DAY');
    onClose();
  }, [elementIndex, updateElementType, updateElement, onClose]);

  // Show characters if the current element is a character type
  const showCharacters = currentElement?.type === 'character' && characters.length > 0;
  // Show locations if the current element is a scene-heading type
  const showLocations = currentElement?.type === 'scene-heading' && locations.length > 0;

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{ position: 'fixed', left: x, top: y }}
    >
      <div className="context-menu-label">Element Type</div>
      {ELEMENT_CYCLE.map((type) => (
        <div
          key={type}
          className={`context-menu-item ${currentElement?.type === type ? 'active' : ''}`}
          onClick={() => handleSelectType(type)}
        >
          {ELEMENT_LABELS[type]}
        </div>
      ))}
      <div
        className={`context-menu-item ${currentElement?.type === 'parenthetical' ? 'active' : ''}`}
        onClick={() => handleSelectType('parenthetical')}
      >
        {ELEMENT_LABELS['parenthetical']}
      </div>

      {showCharacters && (
        <>
          <div className="context-menu-divider" />
          <div className="context-menu-label">Characters</div>
          {characters.slice(0, 10).map((char) => (
            <div
              key={char.name}
              className="context-menu-item"
              onClick={() => handleSelectCharacter(char.name)}
            >
              {char.name}
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: '11px',
                  color: 'var(--color-text-muted)',
                }}
              >
                {char.lineCount} lines
              </span>
            </div>
          ))}
        </>
      )}

      {showLocations && (
        <>
          <div className="context-menu-divider" />
          <div className="context-menu-label">Locations</div>
          {locations.slice(0, 10).map((loc) => (
            <div
              key={loc.name}
              className="context-menu-item"
              onClick={() => handleSelectLocation(loc.name, loc.isInterior)}
            >
              {loc.isInterior ? 'INT' : 'EXT'}. {loc.name}
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: '11px',
                  color: 'var(--color-text-muted)',
                }}
              >
                {loc.occurrenceCount}x
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  );
};
