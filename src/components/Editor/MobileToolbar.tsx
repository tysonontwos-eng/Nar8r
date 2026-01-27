import React from 'react';
import { useDocumentStore } from '../../stores/documentStore';

interface MobileToolbarProps {
  currentElementIndex: number;
}

export const MobileToolbar: React.FC<MobileToolbarProps> = ({ currentElementIndex }) => {
  const { cycleElementType } = useDocumentStore();

  const handleTab = () => {
    cycleElementType(currentElementIndex, false); // forward
  };

  const handleShiftTab = () => {
    cycleElementType(currentElementIndex, true); // backward
  };

  return (
    <div className="mobile-toolbar">
      <button
        className="mobile-toolbar-btn"
        onClick={handleShiftTab}
        title="Previous element type (Shift+Tab)"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M11 4L7 8l4 4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <span className="mobile-toolbar-label">Tab</span>
      <button
        className="mobile-toolbar-btn"
        onClick={handleTab}
        title="Next element type (Tab)"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M5 4l4 4-4 4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
};
