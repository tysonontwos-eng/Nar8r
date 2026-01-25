import React, { useState, useCallback, useMemo } from 'react';
import { useDocumentStore } from '../../stores/documentStore';
import { EditorElement } from './EditorElement';
import { ElementMenu } from './ElementMenu';
import { PageBreak } from './PageBreak';
import { FORMATTING } from '../../types/screenplay';

export const Editor: React.FC = () => {
  const {
    screenplay,
    currentElementIndex,
    setCurrentElement,
    getCharactersSortedByLineCount,
    getLocationsSortedByOccurrence,
  } = useDocumentStore();

  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    elementIndex: number;
  }>({ visible: false, x: 0, y: 0, elementIndex: 0 });

  // Get sorted suggestions
  const characterSuggestions = useMemo(() => {
    return getCharactersSortedByLineCount().map((c) => c.name);
  }, [getCharactersSortedByLineCount, screenplay.characters]);

  const locationSuggestions = useMemo(() => {
    return getLocationsSortedByOccurrence().map((l) => l.name);
  }, [getLocationsSortedByOccurrence, screenplay.locations]);

  // Calculate page breaks
  const pageBreaks = useMemo(() => {
    const breaks: number[] = [];
    let lineCount = 0;

    screenplay.elements.forEach((element, index) => {
      // Estimate lines for this element
      const contentLines = Math.max(1, Math.ceil(element.content.length / 60)); // ~60 chars per line

      // Add extra line for element spacing
      let elementLines = contentLines;
      if (element.type === 'scene-heading' || element.type === 'action') {
        elementLines += 1; // One blank line before
      }
      if (element.type === 'character') {
        elementLines += 1;
      }

      lineCount += elementLines;

      // Check for page break
      if (lineCount >= FORMATTING.LINES_PER_PAGE) {
        breaks.push(index);
        lineCount = elementLines; // Start counting for new page
      }
    });

    return breaks;
  }, [screenplay.elements]);

  const handleShowContextMenu = useCallback((e: React.MouseEvent, elementIndex: number) => {
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      elementIndex,
    });
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, visible: false }));
  }, []);

  const handleElementFocus = useCallback((index: number) => {
    setCurrentElement(index);
  }, [setCurrentElement]);

  // Close context menu when clicking outside
  const handleEditorClick = useCallback(() => {
    if (contextMenu.visible) {
      handleCloseContextMenu();
    }
  }, [contextMenu.visible, handleCloseContextMenu]);

  return (
    <div className="editor-page screenplay-font" onClick={handleEditorClick}>
      {screenplay.elements.map((element, index) => (
        <React.Fragment key={element.id}>
          {pageBreaks.includes(index) && (
            <PageBreak pageNumber={pageBreaks.indexOf(index) + 2} />
          )}
          <EditorElement
            element={element}
            index={index}
            isActive={index === currentElementIndex}
            onFocus={() => handleElementFocus(index)}
            onShowContextMenu={(e) => handleShowContextMenu(e, index)}
            characterSuggestions={characterSuggestions}
            locationSuggestions={locationSuggestions}
          />
        </React.Fragment>
      ))}

      {contextMenu.visible && (
        <ElementMenu
          x={contextMenu.x}
          y={contextMenu.y}
          elementIndex={contextMenu.elementIndex}
          onClose={handleCloseContextMenu}
          characters={getCharactersSortedByLineCount()}
          locations={getLocationsSortedByOccurrence()}
        />
      )}
    </div>
  );
};
