import React, { useRef, useEffect } from 'react';
import { useDocumentStore } from '../../stores/documentStore';

interface MobileToolbarProps {
  currentElementIndex: number;
}

export const MobileToolbar: React.FC<MobileToolbarProps> = ({ currentElementIndex }) => {
  const { cycleElementType } = useDocumentStore();
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Track visual viewport to position above keyboard - use ref for smooth updates
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport || !toolbarRef.current) return;

    const updatePosition = () => {
      if (!toolbarRef.current) return;
      // On iOS, we need to account for both the keyboard height AND scroll offset
      const keyboardHeight = window.innerHeight - viewport.height - viewport.offsetTop;
      const offset = Math.max(0, keyboardHeight);
      // Directly set style for smooth performance (no React re-render)
      toolbarRef.current.style.transform = `translateY(-${offset}px)`;
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
    cycleElementType(currentElementIndex, false);
  };

  return (
    <div
      ref={toolbarRef}
      className="mobile-toolbar"
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
