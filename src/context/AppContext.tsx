import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Chapter, Issue, User, IssueType, Annotation, IssueStatus } from '../types';
import { mockChapters, getCurrentUser } from '../data/mockData';

interface AppState {
  chapters: Chapter[];
  currentUser: User;
  selectedChapterId: string | null;
  currentPageIndex: number;
  zoomLevel: number;
  isAnnotating: boolean;
  activeIssueId: string | null;
  filterStatus: string;
  filterIssueType: string;
}

type Action =
  | { type: 'SELECT_CHAPTER'; payload: string | null }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_ZOOM'; payload: number }
  | { type: 'SET_ANNOTATING'; payload: boolean }
  | { type: 'SET_ACTIVE_ISSUE'; payload: string | null }
  | { type: 'SET_FILTER_STATUS'; payload: string }
  | { type: 'SET_FILTER_ISSUE_TYPE'; payload: string }
  | { type: 'ADD_ISSUE'; payload: { chapterId: string; issue: Issue } }
  | { type: 'UPDATE_ISSUE'; payload: { chapterId: string; issueId: string; updates: Partial<Issue> } }
  | { type: 'UPDATE_CHAPTER_STATUS'; payload: { chapterId: string; status: Chapter['status'] } }
  | { type: 'DELETE_ISSUE'; payload: { chapterId: string; issueId: string } }
  | { type: 'NEXT_PAGE' }
  | { type: 'PREV_PAGE' };

const initialState: AppState = {
  chapters: mockChapters,
  currentUser: getCurrentUser(),
  selectedChapterId: null,
  currentPageIndex: 0,
  zoomLevel: 100,
  isAnnotating: false,
  activeIssueId: null,
  filterStatus: 'all',
  filterIssueType: 'all'
};

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SELECT_CHAPTER':
      return {
        ...state,
        selectedChapterId: action.payload,
        currentPageIndex: 0,
        activeIssueId: null
      };
    case 'SET_PAGE':
      return { ...state, currentPageIndex: action.payload };
    case 'SET_ZOOM':
      return { ...state, zoomLevel: Math.max(50, Math.min(200, action.payload)) };
    case 'SET_ANNOTATING':
      return { ...state, isAnnotating: action.payload };
    case 'SET_ACTIVE_ISSUE':
      return { ...state, activeIssueId: action.payload };
    case 'SET_FILTER_STATUS':
      return { ...state, filterStatus: action.payload };
    case 'SET_FILTER_ISSUE_TYPE':
      return { ...state, filterIssueType: action.payload };
    case 'ADD_ISSUE':
      return {
        ...state,
        chapters: state.chapters.map(ch =>
          ch.id === action.payload.chapterId
            ? { ...ch, issues: [...ch.issues, action.payload.issue], updatedAt: new Date().toISOString() }
            : ch
        )
      };
    case 'UPDATE_ISSUE':
      return {
        ...state,
        chapters: state.chapters.map(ch =>
          ch.id === action.payload.chapterId
            ? {
                ...ch,
                issues: ch.issues.map(issue =>
                  issue.id === action.payload.issueId
                    ? { ...issue, ...action.payload.updates }
                    : issue
                ),
                updatedAt: new Date().toISOString()
              }
            : ch
        )
      };
    case 'UPDATE_CHAPTER_STATUS':
      return {
        ...state,
        chapters: state.chapters.map(ch =>
          ch.id === action.payload.chapterId
            ? { ...ch, status: action.payload.status, updatedAt: new Date().toISOString() }
            : ch
        )
      };
    case 'DELETE_ISSUE':
      return {
        ...state,
        chapters: state.chapters.map(ch =>
          ch.id === action.payload.chapterId
            ? { ...ch, issues: ch.issues.filter(i => i.id !== action.payload.issueId) }
            : ch
        )
      };
    case 'NEXT_PAGE': {
      const chapter = state.chapters.find(ch => ch.id === state.selectedChapterId);
      if (!chapter) return state;
      const nextPage = Math.min(state.currentPageIndex + 1, chapter.totalPages - 1);
      return { ...state, currentPageIndex: nextPage, activeIssueId: null };
    }
    case 'PREV_PAGE': {
      const prevPage = Math.max(state.currentPageIndex - 1, 0);
      return { ...state, currentPageIndex: prevPage, activeIssueId: null };
    }
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
  getSelectedChapter: () => Chapter | undefined;
  getCurrentPage: () => Chapter['pages'][0] | undefined;
  getCurrentPageIssues: () => Issue[];
  createIssue: (
    chapterId: string,
    pageIndex: number,
    type: IssueType,
    annotation: Annotation,
    description: string,
    suggestion: string
  ) => void;
  updateIssueStatus: (chapterId: string, issueId: string, status: IssueStatus, resolutionNote?: string) => void;
  jumpToIssue: (issue: Issue) => void;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const getSelectedChapter = () => {
    return state.chapters.find(ch => ch.id === state.selectedChapterId);
  };

  const getCurrentPage = () => {
    const chapter = getSelectedChapter();
    return chapter?.pages[state.currentPageIndex];
  };

  const getCurrentPageIssues = () => {
    const chapter = getSelectedChapter();
    if (!chapter) return [];
    return chapter.issues.filter(issue => issue.pageIndex === state.currentPageIndex);
  };

  const createIssue = (
    chapterId: string,
    pageIndex: number,
    type: IssueType,
    annotation: Annotation,
    description: string,
    suggestion: string
  ) => {
    const newIssue: Issue = {
      id: `${chapterId}-issue-${Date.now()}`,
      chapterId,
      pageIndex,
      type,
      annotation,
      description,
      suggestion,
      status: 'open',
      createdAt: new Date().toISOString(),
      createdBy: state.currentUser.id,
      version: 1
    };
    dispatch({ type: 'ADD_ISSUE', payload: { chapterId, issue: newIssue } });
  };

  const updateIssueStatus = (
    chapterId: string,
    issueId: string,
    status: IssueStatus,
    resolutionNote?: string
  ) => {
    const updates: Partial<Issue> = { status };
    if (status === 'resolved' || status === 'verified') {
      updates.resolvedAt = new Date().toISOString();
      updates.resolvedBy = state.currentUser.id;
    }
    if (resolutionNote) {
      updates.resolutionNote = resolutionNote;
    }
    dispatch({ type: 'UPDATE_ISSUE', payload: { chapterId, issueId, updates } });
  };

  const jumpToIssue = (issue: Issue) => {
    dispatch({ type: 'SELECT_CHAPTER', payload: issue.chapterId });
    dispatch({ type: 'SET_PAGE', payload: issue.pageIndex });
    dispatch({ type: 'SET_ACTIVE_ISSUE', payload: issue.id });
  };

  return (
    <AppContext.Provider value={{
      state,
      dispatch,
      getSelectedChapter,
      getCurrentPage,
      getCurrentPageIssues,
      createIssue,
      updateIssueStatus,
      jumpToIssue
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
