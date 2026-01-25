import { useState, useEffect, useCallback } from 'react';
import { Editor } from './components/Editor';
import { TableOfContents } from './components/Sidebar';
import { FormattingToolbar } from './components/Toolbar';
import { StatusBar } from './components/StatusBar';
import { TitlePageEditor } from './components/TitlePage';
import { useSettingsStore } from './stores/settingsStore';
import { useDocumentStore } from './stores/documentStore';
import './styles/global.css';

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showTitlePage, setShowTitlePage] = useState(false);
  const { theme } = useSettingsStore();
  const {
    recalculateScenes,
    recalculateCharacters,
    recalculateLocations,
    saveToFile,
    loadFromFile,
    loadAutoSave,
    isDirty,
  } = useDocumentStore();

  // Set theme on document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Initialize derived data and check for auto-saved content on mount
  useEffect(() => {
    // Try to recover auto-saved content
    const hasAutoSave = loadAutoSave();
    if (hasAutoSave) {
      console.log('Recovered auto-saved content');
    }

    recalculateScenes();
    recalculateCharacters();
    recalculateLocations();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveToFile();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'o') {
        e.preventDefault();
        if (isDirty) {
          if (confirm('Open a new file? Any unsaved changes will be lost.')) {
            loadFromFile();
          }
        } else {
          loadFromFile();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveToFile, loadFromFile, isDirty]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleOpenTitlePage = useCallback(() => {
    setShowTitlePage(true);
  }, []);

  const handleCloseTitlePage = useCallback(() => {
    setShowTitlePage(false);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <FormattingToolbar
          onToggleSidebar={handleToggleSidebar}
          sidebarCollapsed={sidebarCollapsed}
          onOpenTitlePage={handleOpenTitlePage}
        />
      </header>

      <main className="app-main">
        <aside className={`app-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <TableOfContents
            collapsed={sidebarCollapsed}
            onToggle={handleToggleSidebar}
          />
        </aside>

        <div className="app-content">
          <Editor />
        </div>
      </main>

      <footer className="app-footer">
        <StatusBar />
      </footer>

      {showTitlePage && (
        <TitlePageEditor onClose={handleCloseTitlePage} />
      )}
    </div>
  );
}

export default App;
