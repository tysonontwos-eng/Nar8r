import type { Screenplay } from '../types/screenplay';

// File format version for future compatibility
const FILE_VERSION = 1;

interface SluglineFile {
  version: number;
  screenplay: Screenplay;
  exportedAt: string;
}

/**
 * Serialize screenplay to JSON string
 */
export function serializeScreenplay(screenplay: Screenplay): string {
  const file: SluglineFile = {
    version: FILE_VERSION,
    screenplay,
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(file, null, 2);
}

/**
 * Deserialize JSON string to screenplay
 */
export function deserializeScreenplay(json: string): Screenplay {
  const file: SluglineFile = JSON.parse(json);

  // Handle version migrations if needed in the future
  if (file.version !== FILE_VERSION) {
    console.warn(`File version ${file.version} differs from current ${FILE_VERSION}`);
  }

  // Restore Date objects (JSON serializes them as strings)
  const screenplay = file.screenplay;
  screenplay.createdAt = new Date(screenplay.createdAt);
  screenplay.updatedAt = new Date(screenplay.updatedAt);

  return screenplay;
}

/**
 * Check if File System Access API is supported
 */
export function supportsFileSystemAccess(): boolean {
  return 'showSaveFilePicker' in window && 'showOpenFilePicker' in window;
}

/**
 * Save screenplay using File System Access API (modern browsers)
 */
export async function saveWithFileSystemAccess(screenplay: Screenplay): Promise<boolean> {
  try {
    const handle = await (window as any).showSaveFilePicker({
      suggestedName: `${screenplay.title || 'Untitled'}.slg`,
      types: [
        {
          description: 'Slugline Screenplay',
          accept: { 'application/json': ['.slg'] },
        },
      ],
    });

    const writable = await handle.createWritable();
    await writable.write(serializeScreenplay(screenplay));
    await writable.close();

    return true;
  } catch (err: any) {
    // User cancelled the save dialog
    if (err.name === 'AbortError') {
      return false;
    }
    throw err;
  }
}

/**
 * Load screenplay using File System Access API (modern browsers)
 */
export async function loadWithFileSystemAccess(): Promise<Screenplay | null> {
  try {
    const [handle] = await (window as any).showOpenFilePicker({
      types: [
        {
          description: 'Slugline Screenplay',
          accept: { 'application/json': ['.slg'] },
        },
      ],
    });

    const file = await handle.getFile();
    const content = await file.text();

    return deserializeScreenplay(content);
  } catch (err: any) {
    // User cancelled the open dialog
    if (err.name === 'AbortError') {
      return null;
    }
    throw err;
  }
}

/**
 * Fallback: Save by downloading a file
 */
export function saveWithDownload(screenplay: Screenplay): void {
  const json = serializeScreenplay(screenplay);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${screenplay.title || 'Untitled'}.slg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Fallback: Load from file input
 */
export function loadWithFileInput(): Promise<Screenplay | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.slg,.json';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        resolve(null);
        return;
      }

      try {
        const content = await file.text();
        resolve(deserializeScreenplay(content));
      } catch (err) {
        console.error('Failed to load file:', err);
        resolve(null);
      }
    };

    input.oncancel = () => resolve(null);
    input.click();
  });
}

/**
 * Save screenplay (uses best available method)
 */
export async function saveScreenplay(screenplay: Screenplay): Promise<boolean> {
  if (supportsFileSystemAccess()) {
    return saveWithFileSystemAccess(screenplay);
  } else {
    saveWithDownload(screenplay);
    return true;
  }
}

/**
 * Load screenplay (uses best available method)
 */
export async function loadScreenplay(): Promise<Screenplay | null> {
  if (supportsFileSystemAccess()) {
    return loadWithFileSystemAccess();
  } else {
    return loadWithFileInput();
  }
}

// Auto-save to localStorage
const AUTOSAVE_KEY = 'slugline-autosave';

export function autoSaveToLocalStorage(screenplay: Screenplay): void {
  try {
    localStorage.setItem(AUTOSAVE_KEY, serializeScreenplay(screenplay));
  } catch (err) {
    console.warn('Auto-save to localStorage failed:', err);
  }
}

export function loadFromLocalStorage(): Screenplay | null {
  try {
    const saved = localStorage.getItem(AUTOSAVE_KEY);
    if (saved) {
      return deserializeScreenplay(saved);
    }
  } catch (err) {
    console.warn('Failed to load from localStorage:', err);
  }
  return null;
}

export function clearLocalStorageAutosave(): void {
  localStorage.removeItem(AUTOSAVE_KEY);
}
