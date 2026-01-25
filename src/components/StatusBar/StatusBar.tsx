import React, { useMemo } from 'react';
import { useDocumentStore } from '../../stores/documentStore';
import { FORMATTING } from '../../types/screenplay';

export const StatusBar: React.FC = () => {
  const { screenplay, currentElementIndex } = useDocumentStore();

  // Calculate total word count
  const wordCount = useMemo(() => {
    return screenplay.elements.reduce((count, element) => {
      const words = element.content.trim().split(/\s+/).filter(Boolean);
      return count + words.length;
    }, 0);
  }, [screenplay.elements]);

  // Calculate total page count (approximate)
  const pageCount = useMemo(() => {
    let totalLines = 0;

    screenplay.elements.forEach((element) => {
      // Estimate lines per element
      const contentLines = Math.max(1, Math.ceil(element.content.length / 60));
      let elementLines = contentLines;

      // Add spacing for different element types
      if (element.type === 'scene-heading') {
        elementLines += 2; // Extra space before scene headings
      } else if (element.type === 'character') {
        elementLines += 1; // Space before character name
      } else if (element.type === 'action') {
        elementLines += 1;
      }

      totalLines += elementLines;
    });

    return Math.max(1, Math.ceil(totalLines / FORMATTING.LINES_PER_PAGE));
  }, [screenplay.elements]);

  // Calculate current page based on element position
  const currentPage = useMemo(() => {
    let linesSoFar = 0;

    for (let i = 0; i <= currentElementIndex && i < screenplay.elements.length; i++) {
      const element = screenplay.elements[i];
      const contentLines = Math.max(1, Math.ceil(element.content.length / 60));
      let elementLines = contentLines;

      if (element.type === 'scene-heading') {
        elementLines += 2;
      } else if (element.type === 'character' || element.type === 'action') {
        elementLines += 1;
      }

      linesSoFar += elementLines;
    }

    return Math.max(1, Math.ceil(linesSoFar / FORMATTING.LINES_PER_PAGE));
  }, [screenplay.elements, currentElementIndex]);

  // Get current element type
  const currentElementType = screenplay.elements[currentElementIndex]?.type || 'action';
  const elementTypeLabels: Record<string, string> = {
    'scene-heading': 'Scene Heading',
    'action': 'Action',
    'character': 'Character',
    'dialogue': 'Dialogue',
    'parenthetical': 'Parenthetical',
    'transition': 'Transition',
  };

  return (
    <div className="status-bar">
      <div className="status-item">
        <span style={{ color: 'var(--color-text-muted)' }}>Element:</span>
        <span>{elementTypeLabels[currentElementType]}</span>
      </div>
      <div className="status-item">
        <span style={{ color: 'var(--color-text-muted)' }}>Page</span>
        <span>{currentPage} of {pageCount}</span>
      </div>
      <div className="status-item">
        <span style={{ color: 'var(--color-text-muted)' }}>Words:</span>
        <span>{wordCount.toLocaleString()}</span>
      </div>
    </div>
  );
};
