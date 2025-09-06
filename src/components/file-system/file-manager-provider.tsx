import type React from 'react';
import { createContext, useContext, useReducer, useCallback, type ReactNode, useEffect } from 'react'
import type { FileItem, FileListResponse } from '@/db/schema';

interface FileManagerState {
  currentPath: string;
  selectedFiles: string[];
  viewMode: 'grid' | 'list';
  searchQuery: string;
  files: FileItem[];
  isLoading: boolean;
  error: string | null;
  breadcrumbs: string[];
}

type FileManagerAction =
  | { type: 'SET_CURRENT_PATH'; payload: string }
  | { type: 'SET_SELECTED_FILES'; payload: string[] }
  | { type: 'TOGGLE_FILE_SELECTION'; payload: string }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SET_VIEW_MODE'; payload: 'grid' | 'list' }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_FILES'; payload: FileItem[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_FILE'; payload: FileItem }
  | { type: 'REMOVE_FILE'; payload: string }
  | { type: 'ADD_FILE'; payload: FileItem };

const initialState: FileManagerState = {
  currentPath: '/uploads',
  selectedFiles: [],
  viewMode: 'grid',
  searchQuery: '',
  files: [],
  isLoading: false,
  error: null,
  breadcrumbs: [],
};

function fileManagerReducer(state: FileManagerState, action: FileManagerAction): FileManagerState {
  switch (action.type) {
    case 'SET_CURRENT_PATH':
      return {
        ...state,
        currentPath: action.payload,
        breadcrumbs: action.payload === '/' ? [] : action.payload.split('/').filter(Boolean),
        selectedFiles: [], // Clear selection when navigating
      };
    case 'SET_SELECTED_FILES':
      return { ...state, selectedFiles: action.payload };
    case 'TOGGLE_FILE_SELECTION': {
      const isSelected = state.selectedFiles.includes(action.payload);
      return {
        ...state,
        selectedFiles: isSelected
          ? state.selectedFiles.filter(id => id !== action.payload)
          : [...state.selectedFiles, action.payload],
      };
    }
    case 'CLEAR_SELECTION':
      return { ...state, selectedFiles: [] };
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    case 'SET_FILES':
      return { ...state, files: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'UPDATE_FILE':
      return {
        ...state,
        files: state.files.map(file =>
          file.id === action.payload.id ? action.payload : file
        ),
      };
    case 'REMOVE_FILE':
      return {
        ...state,
        files: state.files.filter(file => file.id !== action.payload),
        selectedFiles: state.selectedFiles.filter(id => id !== action.payload),
      };
    case 'ADD_FILE':
      return {
        ...state,
        files: [...state.files, action.payload],
      };
    default:
      return state;
  }
}

interface FileManagerContextValue {
  state: FileManagerState;
  dispatch: React.Dispatch<FileManagerAction>;
  // Helper functions
  navigateToPath: (path: string) => void;
  toggleFileSelection: (fileId: string) => void;
  selectAllFiles: () => void;
  clearSelection: () => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  setSearchQuery: (query: string) => void;
  updateFile: (file: FileItem) => void;
  removeFile: (fileId: string) => void;
  addFile: (file: FileItem) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  loadFiles: (path: string) => Promise<void>;
}

const FileManagerContext = createContext<FileManagerContextValue | null>(null);

interface FileManagerProviderProps {
  children: ReactNode;
}

export function FileManagerProvider({ children }: FileManagerProviderProps) {
  const [state, dispatch] = useReducer(fileManagerReducer, initialState);

  const loadFiles = useCallback(async (path: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const response = await fetch(`/api/files?path=${encodeURIComponent(path)}`);
      const result = await response.json();

      if (result.success) {
        dispatch({ type: 'SET_FILES', payload: result.data.files });
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to load files' });
      }
    } catch (error) {
      console.error('Error loading files:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load files' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Load files when path changes
  useEffect(() => {
    loadFiles(state.currentPath);
  }, [state.currentPath, loadFiles]);

  const navigateToPath = useCallback((path: string) => {
    dispatch({ type: 'SET_CURRENT_PATH', payload: path });
  }, []);

  const toggleFileSelection = useCallback((fileId: string) => {
    dispatch({ type: 'TOGGLE_FILE_SELECTION', payload: fileId });
  }, []);

  const selectAllFiles = useCallback(() => {
    dispatch({ type: 'SET_SELECTED_FILES', payload: state.files.map(f => f.id) });
  }, [state.files]);

  const clearSelection = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTION' });
  }, []);

  const setViewMode = useCallback((mode: 'grid' | 'list') => {
    dispatch({ type: 'SET_VIEW_MODE', payload: mode });
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
  }, []);

  const updateFile = useCallback((file: FileItem) => {
    dispatch({ type: 'UPDATE_FILE', payload: file });
  }, []);

  const removeFile = useCallback((fileId: string) => {
    dispatch({ type: 'REMOVE_FILE', payload: fileId });
  }, []);

  const addFile = useCallback((file: FileItem) => {
    dispatch({ type: 'ADD_FILE', payload: file });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const value: FileManagerContextValue = {
    state,
    dispatch,
    navigateToPath,
    toggleFileSelection,
    selectAllFiles,
    clearSelection,
    setViewMode,
    setSearchQuery,
    updateFile,
    removeFile,
    addFile,
    setLoading,
    setError,
    loadFiles,
  };

  return (
    <FileManagerContext.Provider value={value}>
      {children}
    </FileManagerContext.Provider>
  );
}

export function useFileManager() {
  const context = useContext(FileManagerContext);
  if (!context) {
    throw new Error('useFileManager must be used within a FileManagerProvider');
  }
  return context;
}

export default FileManagerProvider;