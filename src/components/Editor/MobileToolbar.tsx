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
      // On iOS, we need to account for both the keyboard height AND scroll offset
      const keyboardHeight = window.innerHeight - viewport.height - viewport.offsetTop;
      setBottomOffset(Math.max(0, keyboardHeight));
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

  const handleTab = (e: React.MouseEvent | React.TouchEvent) => {
    // Prevent default to keep keyboard open
    e.preventDefault();
    // Get current element type directly from store for accurate cycling
    cycleElementType(currentElementIndex, false);
  };

  return (
    <div
      className="mobile-toolbar"
      style={{ bottom: `${bottomOffset}px` }}
    >
      <button
        className="mobile-toolbar-btn"
        onTouchStart={handleTab}
        onMouseDown={handleTab}
        title="Next element type (Tab)"
      >
        {/* Tab key icon */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M18 6v12M6 12h10m0 0l-4-4m4 4l-4 4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
};
