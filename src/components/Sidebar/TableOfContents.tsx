import React, { useCallback, useMemo } from 'react';
import { useDocumentStore } from '../../stores/documentStore';

interface TableOfContentsProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({
  collapsed,
  onToggle,
}) => {
  const { scenes, screenplay, currentElementIndex, setCurrentElement } = useDocumentStore();

  // Find which scene the current element is in
  const activeSceneId = useMemo(() => {
    // Find the scene that contains the current element
    let lastSceneId = '';

    for (const scene of scenes) {
      const sceneElementIndex = screenplay.elements.findIndex(
        (el) => el.id === scene.elementId
      );
      if (sceneElementIndex <= currentElementIndex) {
        lastSceneId = scene.id;
      } else {
        break;
      }
    }

    return lastSceneId;
  }, [scenes, screenplay.elements, currentElementIndex]);

  const handleSceneClick = useCallback((elementId: string) => {
    const elementIndex = screenplay.elements.findIndex((el) => el.id === elementId);
    if (elementIndex !== -1) {
      setCurrentElement(elementIndex);
      // Scroll the element into view
      setTimeout(() => {
        const element = document.querySelector(`[data-index="${elementIndex}"]`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 0);
    }
  }, [screenplay.elements, setCurrentElement]);

  if (collapsed) {
    return null;
  }

  return (
    <div className="toc">
      <div className="toc-header">
        <span className="toc-title">Scenes</span>
        <button
          className="toc-toggle"
          onClick={onToggle}
          title="Collapse sidebar"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M11.354 4.646a.5.5 0 0 1 0 .708L7.707 9l3.647 3.646a.5.5 0 0 1-.708.708l-4-4a.5.5 0 0 1 0-.708l4-4a.5.5 0 0 1 .708 0z"/>
          </svg>
        </button>
      </div>

      {scenes.length === 0 ? (
        <div style={{
          padding: '1rem',
          color: 'var(--color-text-muted)',
          fontSize: '13px',
          textAlign: 'center'
        }}>
          No scenes yet. Start with a scene heading.
        </div>
      ) : (
        <div className="toc-list">
          {scenes.map((scene) => (
            <div
              key={scene.id}
              className={`toc-item ${scene.id === activeSceneId ? 'active' : ''}`}
              onClick={() => handleSceneClick(scene.elementId)}
            >
              <span className="toc-scene-number">{scene.sceneNumber}.</span>
              <span className="toc-scene-text" title={scene.heading}>
                {scene.heading.trim().toUpperCase().match(/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)/)
                  ? (scene.isInterior ? 'INT' : 'EXT') + '. ' + scene.location
                  : scene.location || scene.heading}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
