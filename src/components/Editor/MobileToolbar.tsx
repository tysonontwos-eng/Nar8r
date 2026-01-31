import React, { useState, useEffect } from 'react';
import { useDocumentStore } from '../../stores/documentStore';

interface MobileToolbarProps {
  currentElementIndex: number;
}

export const MobileToolbar: React.FC<MobileToolbarProps> = ({ currentElementIndex }) => {
  const { cycleElementType } = useDocumentStore();
  const [bottomOffset, setBottomOffset] = useState(0);

  // Track visual viewport to position above keyboard
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const updatePosition = () => {
      // Calculate how much the viewport has shrunk (keyboard height)
      const keyboardHeight = window.innerHeight - viewport.height;
      setBottomOffset(keyboardHeight);
    };

    viewport.addEventListener('resize', updatePosition);
    viewport.addEventListener('scroll', updatePosition);

    // Initial calculation
    updatePosition();

    return () => {
      viewport.removeEventListener('resize', updatePosition);
      viewport.removeEventListener('scroll', updatePosition);
    };
  }, []);

  const handleTab = () => {
    cycleElementType(currentElementIndex, false); // forward
  };

  const handleShiftTab = () => {
    cycleElementType(currentElementIndex, true); // backward
  };

  return (
    <div
      className="mobile-toolbar"
      style={{ bottom: `${bottomOffset}px` }}
    >
      <button
        className="mobile-toolbar-btn"
        onClick={handleShiftTab}
        title="Previous element type"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M12 5L7 10l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <button
        className="mobile-toolbar-btn"
        onClick={handleTab}
        title="Next element type"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M8 5l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
};
