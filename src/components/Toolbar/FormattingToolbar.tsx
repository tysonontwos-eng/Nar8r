import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import { useDocumentStore } from '../../stores/documentStore';
import { loadFdxFile } from '../../utils/importFdx';
import { exportToPdf } from '../../utils/exportPdf';

interface FormattingToolbarProps {
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
  onOpenTitlePage: () => void;
}

export const FormattingToolbar: React.FC<FormattingToolbarProps> = ({
  onToggleSidebar,
  sidebarCollapsed,
  onOpenTitlePage,
}) => {
  const { theme, toggleTheme, autoSave: autoSaveEnabled } = useSettingsStore();
  const {
    screenplay,
    isDirty,
    newScreenplay,
    saveToFile,
    loadFromFile,
    autoSave,
  } = useDocumentStore();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-save effect
  useEffect(() => {
    if (!autoSaveEnabled || !isDirty) return;

    const timer = setTimeout(() => {
      autoSave();
    }, 5000); // Auto-save after 5 seconds of inactivity

    return () => clearTimeout(timer);
  }, [autoSaveEnabled, isDirty, screenplay, autoSave]);

  const handleBold = useCallback(() => {
    document.execCommand('bold', false);
  }, []);

  const handleItalic = useCallback(() => {
    document.execCommand('italic', false);
  }, []);

  const handleUnderline = useCallback(() => {
    document.execCommand('underline', false);
  }, []);

  const handleNew = useCallback(() => {
    setMenuOpen(false);
    // Always confirm to prevent accidental loss, especially on mobile
    const message = isDirty
      ? 'Start a new screenplay? Any unsaved changes will be lost.'
      : 'Start a new screenplay?';
    if (confirm(message)) {
      newScreenplay();
    }
  }, [isDirty, newScreenplay]);

  const handleSave = useCallback(async () => {
    setMenuOpen(false);
    const success = await saveToFile();
    // Provide feedback on mobile where the save dialog may not be obvious
    if (success) {
      // Auto-save to localStorage as backup
      autoSave();
    }
  }, [saveToFile, autoSave]);

  const handleOpen = useCallback(async () => {
    setMenuOpen(false);
    if (isDirty) {
      if (!confirm('Open a new file? Any unsaved changes will be lost.')) {
        return;
      }
    }
    await loadFromFile();
  }, [isDirty, loadFromFile]);

  const handleImportFdx = useCallback(async () => {
    setMenuOpen(false);
    if (isDirty) {
      if (!confirm('Import a file? Any unsaved changes will be lost.')) {
        return;
      }
    }
    const imported = await loadFdxFile();
    if (imported) {
      useDocumentStore.getState().setScreenplay(imported);
      useDocumentStore.getState().recalculateScenes();
      useDocumentStore.getState().recalculateCharacters();
      useDocumentStore.getState().recalculateLocations();
    }
  }, [isDirty]);

  const handleExportPdf = useCallback(async () => {
    setMenuOpen(false);
    await exportToPdf(screenplay);
  }, [screenplay]);

  return (
    <div className="toolbar">
      {/* Left: Sidebar toggle + File menu */}
      <div className="toolbar-group">
        {sidebarCollapsed && (
          <button
            className="toolbar-button"
            onClick={onToggleSidebar}
            title="Show sidebar"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L9 8.293l-3.646 3.647a.5.5 0 0 1-.708-.708L8.293 8 4.646 4.354a.5.5 0 0 1 0-.708z"/>
            </svg>
          </button>
        )}

        {/* Hamburger menu */}
        <div className="dropdown-container" ref={menuRef}>
          <button
            className="toolbar-button hamburger-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            title="File menu"
            style={isDirty ? { color: 'var(--color-accent)' } : undefined}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
              <rect x="2" y="3" width="14" height="2" rx="1"/>
              <rect x="2" y="8" width="14" height="2" rx="1"/>
              <rect x="2" y="13" width="14" height="2" rx="1"/>
            </svg>
            {isDirty && <span className="unsaved-dot" />}
          </button>

          {menuOpen && (
            <div className="dropdown-menu">
              <button className="dropdown-item" onClick={handleNew}>
                New Screenplay
              </button>
              <button className="dropdown-item" onClick={handleOpen}>
                Open...
              </button>
              <button className="dropdown-item" onClick={handleSave}>
                Save{isDirty ? '*' : ''}
                <span className="shortcut">Cmd+S</span>
              </button>
              <div className="dropdown-divider" />
              <button className="dropdown-item" onClick={handleImportFdx}>
                Import FDX...
              </button>
              <button className="dropdown-item" onClick={handleExportPdf}>
                Export PDF
              </button>
            </div>
          )}
        </div>

        {/* App Logo */}
        <span className="app-logo">Nar8r</span>
      </div>

      {/* Center: Formatting buttons */}
      <div className="toolbar-center">
        <div className="toolbar-group formatting-group">
          <button
            className="toolbar-button"
            onClick={handleBold}
            title="Bold (Cmd+B)"
            style={{ fontWeight: 'bold' }}
          >
            B
          </button>
          <button
            className="toolbar-button"
            onClick={handleItalic}
            title="Italic (Cmd+I)"
            style={{ fontStyle: 'italic' }}
          >
            I
          </button>
          <button
            className="toolbar-button"
            onClick={handleUnderline}
            title="Underline (Cmd+U)"
            style={{ textDecoration: 'underline' }}
          >
            U
          </button>
        </div>
      </div>

      {/* Right: Title Page + Theme toggle + Support */}
      <div className="toolbar-group" style={{ borderRight: 'none' }}>
        <button
          className="toolbar-button"
          onClick={onOpenTitlePage}
          title="Edit title page"
        >
          Title Page
        </button>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          title="Toggle theme"
        >
          {theme === 'midcentury' ? 'Classic' : 'Warm'} Theme
        </button>
        <a
          href="https://buymeacoffee.com/nar8r"
          target="_blank"
          rel="noopener noreferrer"
          className="coffee-button"
          title="Support Nar8r"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2 21V19H20V21H2ZM20 8V5H22V8C22 9.1 21.1 10 20 10H18V8H20ZM18 3H4V13C4 14.1 4.9 15 6 15H16C17.1 15 18 14.1 18 13V3ZM2 3V1H20V3H2Z"/>
          </svg>
          <span>Support</span>
        </a>
      </div>
    </div>
  );
};
