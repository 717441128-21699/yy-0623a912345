import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Chapter, Issue, User, IssueType, Annotation, IssueStatus, OperationLog, IssueVersion, PageVersion } from '../types';
import { mockChapters, getCurrentUser, generateMockLogs } from '../data/mockData';
import { STATUS_LABELS } from '../types';

const STORAGE_KEY_CHAPTERS = 'manga_review_chapters';
const STORAGE_KEY_LOGS = 'manga_review_logs';
const STORAGE_KEY_STATE = 'manga_review_state';

interface AppState {
  chapters: Chapter[];
  logs: OperationLog[];
  currentUser: User;
  selectedChapterId: string | null;
  currentPageIndex: number;
  zoomLevel: number;
  isAnnotating: boolean;
  activeIssueId: string | null;
  highlightIssueId: string | null;
  filterStatus: string;
  filterIssueType: string;
  viewMode: 'dual' | 'original' | 'translated' | 'overlay';
  compareVersion: { left: number; right: number } | null;
  overlayBaseVersion: number;
  overlayTopVersion: number;
  overlayOpacity: number;
}

type Action =
  | { type: 'SELECT_CHAPTER'; payload: string | null }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_ZOOM'; payload: number }
  | { type: 'SET_ANNOTATING'; payload: boolean }
  | { type: 'SET_ACTIVE_ISSUE'; payload: string | null }
  | { type: 'SET_HIGHLIGHT_ISSUE'; payload: string | null }
  | { type: 'SET_FILTER_STATUS'; payload: string }
  | { type: 'SET_FILTER_ISSUE_TYPE'; payload: string }
  | { type: 'SET_VIEW_MODE'; payload: AppState['viewMode'] }
  | { type: 'SET_COMPARE_VERSION'; payload: AppState['compareVersion'] }
  | { type: 'SET_OVERLAY_BASE_VERSION'; payload: number }
  | { type: 'SET_OVERLAY_TOP_VERSION'; payload: number }
  | { type: 'SET_OVERLAY_OPACITY'; payload: number }
  | { type: 'ADD_ISSUE'; payload: { chapterId: string; issue: Issue } }
  | { type: 'UPDATE_ISSUE'; payload: { chapterId: string; issueId: string; updates: Partial<Issue> } }
  | { type: 'UPDATE_CHAPTER_STATUS'; payload: { chapterId: string; status: Chapter['status'] } }
  | { type: 'DELETE_ISSUE'; payload: { chapterId: string; issueId: string } }
  | { type: 'ADD_ISSUE_VERSION'; payload: { chapterId: string; issueId: string; version: IssueVersion; pageIndex: number; pageVersion: PageVersion } }
  | { type: 'VERIFY_ISSUE_VERSION'; payload: { chapterId: string; issueId: string; versionIndex: number; verifiedBy: string; verifiedAt: string } }
  | { type: 'REJECT_ISSUE_VERSION'; payload: { chapterId: string; issueId: string; versionIndex: number; rejectedBy: string; rejectedAt: string; rejectReason: string } }
  | { type: 'ADD_LOG'; payload: OperationLog }
  | { type: 'LOAD_FROM_STORAGE'; payload: { chapters: Chapter[]; logs: OperationLog[] } }
  | { type: 'NEXT_PAGE' }
  | { type: 'PREV_PAGE' };

const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load from localStorage:', e);
  }
  return defaultValue;
};

const saveToStorage = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
};

const initialChapters = loadFromStorage<Chapter[]>(STORAGE_KEY_CHAPTERS, mockChapters);
const initialLogs = loadFromStorage<OperationLog[]>(STORAGE_KEY_LOGS, generateMockLogs(mockChapters));

const storedState = loadFromStorage<Partial<AppState>>(STORAGE_KEY_STATE, {});

const initialState: AppState = {
  chapters: initialChapters,
  logs: initialLogs,
  currentUser: getCurrentUser(),
  selectedChapterId: null,
  currentPageIndex: 0,
  zoomLevel: 100,
  isAnnotating: false,
  activeIssueId: null,
  highlightIssueId: null,
  filterStatus: 'all',
  filterIssueType: 'all',
  viewMode: 'dual',
  compareVersion: null,
  overlayBaseVersion: 1,
  overlayTopVersion: 2,
  overlayOpacity: 50,
  ...storedState
};

function appReducer(state: AppState, action: Action): AppState {
  let newState: AppState;

  switch (action.type) {
    case 'SELECT_CHAPTER':
      newState = {
        ...state,
        selectedChapterId: action.payload,
        currentPageIndex: 0,
        activeIssueId: null,
        highlightIssueId: null,
        compareVersion: null,
        viewMode: 'dual'
      };
      break;
    case 'SET_PAGE':
      newState = { ...state, currentPageIndex: action.payload };
      break;
    case 'SET_ZOOM':
      newState = { ...state, zoomLevel: Math.max(50, Math.min(200, action.payload)) };
      break;
    case 'SET_ANNOTATING':
      newState = { ...state, isAnnotating: action.payload };
      break;
    case 'SET_ACTIVE_ISSUE':
      newState = { ...state, activeIssueId: action.payload };
      break;
    case 'SET_HIGHLIGHT_ISSUE':
      newState = { ...state, highlightIssueId: action.payload };
      break;
    case 'SET_FILTER_STATUS':
      newState = { ...state, filterStatus: action.payload };
      break;
    case 'SET_FILTER_ISSUE_TYPE':
      newState = { ...state, filterIssueType: action.payload };
      break;
    case 'SET_VIEW_MODE':
      newState = { ...state, viewMode: action.payload };
      break;
    case 'SET_COMPARE_VERSION':
      newState = { ...state, compareVersion: action.payload };
      break;
    case 'SET_OVERLAY_BASE_VERSION':
      newState = { ...state, overlayBaseVersion: action.payload };
      break;
    case 'SET_OVERLAY_TOP_VERSION':
      newState = { ...state, overlayTopVersion: action.payload };
      break;
    case 'SET_OVERLAY_OPACITY':
      newState = { ...state, overlayOpacity: Math.max(0, Math.min(100, action.payload)) };
      break;
    case 'ADD_ISSUE':
      newState = {
        ...state,
        chapters: state.chapters.map(ch =>
          ch.id === action.payload.chapterId
            ? { ...ch, issues: [...ch.issues, action.payload.issue], updatedAt: new Date().toISOString() }
            : ch
        )
      };
      break;
    case 'UPDATE_ISSUE':
      newState = {
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
      break;
    case 'UPDATE_CHAPTER_STATUS':
      newState = {
        ...state,
        chapters: state.chapters.map(ch =>
          ch.id === action.payload.chapterId
            ? { ...ch, status: action.payload.status, updatedAt: new Date().toISOString() }
            : ch
        )
      };
      break;
    case 'DELETE_ISSUE':
      newState = {
        ...state,
        chapters: state.chapters.map(ch =>
          ch.id === action.payload.chapterId
            ? { ...ch, issues: ch.issues.filter(i => i.id !== action.payload.issueId) }
            : ch
        )
      };
      break;
    case 'ADD_ISSUE_VERSION': {
      const { chapterId, issueId, version, pageIndex, pageVersion } = action.payload;
      newState = {
        ...state,
        chapters: state.chapters.map(ch =>
          ch.id === chapterId
            ? {
                ...ch,
                issues: ch.issues.map(issue =>
                  issue.id === issueId
                    ? {
                        ...issue,
                        versions: [...issue.versions, version].sort((a, b) => a.version - b.version),
                        currentVersion: version.version,
                        status: version.status,
                      }
                    : issue
                ),
                pages: ch.pages.map(page => {
                  if (page.index !== pageIndex) return page;
                  const existingVersions = page.versions.filter(v => v.version !== pageVersion.version);
                  return {
                    ...page,
                    versions: [...existingVersions, pageVersion].sort((a, b) => a.version - b.version),
                    translatedImage: pageVersion.imageUrl
                  };
                }),
                updatedAt: new Date().toISOString()
              }
            : ch
        )
      };
      break;
    }
    case 'VERIFY_ISSUE_VERSION': {
      const { chapterId: vChId, issueId: vIssueId, versionIndex, verifiedBy, verifiedAt } = action.payload;
      newState = {
        ...state,
        chapters: state.chapters.map(ch =>
          ch.id === vChId
            ? {
                ...ch,
                issues: ch.issues.map(issue => {
                  if (issue.id !== vIssueId) return issue;
                  const newVersions = [...issue.versions].sort((a, b) => a.version - b.version);
                  if (newVersions[versionIndex]) {
                    newVersions[versionIndex] = {
                      ...newVersions[versionIndex],
                      status: 'verified',
                      verifiedBy,
                      verifiedAt
                    };
                  }
                  return {
                    ...issue,
                    versions: newVersions,
                    status: 'verified' as IssueStatus,
                    resolvedAt: verifiedAt,
                    resolvedBy: verifiedBy
                  };
                }),
                updatedAt: new Date().toISOString()
              }
            : ch
        )
      };
      break;
    }
    case 'REJECT_ISSUE_VERSION': {
      const { chapterId: rChId, issueId: rIssueId, versionIndex, rejectedBy, rejectedAt, rejectReason } = action.payload;
      newState = {
        ...state,
        chapters: state.chapters.map(ch =>
          ch.id === rChId
            ? {
                ...ch,
                issues: ch.issues.map(issue => {
                  if (issue.id !== rIssueId) return issue;
                  const newVersions = [...issue.versions].sort((a, b) => a.version - b.version);
                  if (newVersions[versionIndex]) {
                    newVersions[versionIndex] = {
                      ...newVersions[versionIndex],
                      status: 'revising' as IssueStatus,
                      rejectedBy,
                      rejectedAt,
                      rejectReason
                    };
                  }
                  return {
                    ...issue,
                    versions: newVersions,
                    status: 'revising' as IssueStatus
                  };
                }),
                updatedAt: new Date().toISOString()
              }
            : ch
        )
      };
      break;
    }
    case 'ADD_LOG':
      newState = {
        ...state,
        logs: [action.payload, ...state.logs]
      };
      break;
    case 'LOAD_FROM_STORAGE':
      newState = {
        ...state,
        chapters: action.payload.chapters,
        logs: action.payload.logs
      };
      break;
    case 'NEXT_PAGE': {
      const chapter = state.chapters.find(ch => ch.id === state.selectedChapterId);
      if (!chapter) return state;
      const nextPage = Math.min(state.currentPageIndex + 1, chapter.totalPages - 1);
      newState = { ...state, currentPageIndex: nextPage, activeIssueId: null, highlightIssueId: null };
      break;
    }
    case 'PREV_PAGE': {
      const prevPage = Math.max(state.currentPageIndex - 1, 0);
      newState = { ...state, currentPageIndex: prevPage, activeIssueId: null, highlightIssueId: null };
      break;
    }
    default:
      return state;
  }

  return newState;
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
  updateChapterStatus: (chapterId: string, newStatus: Chapter['status']) => void;
  jumpToIssue: (issueId: string, chapterId?: string) => void;
  uploadIssueVersion: (
    chapterId: string,
    issueId: string,
    imageUrl: string,
    note?: string
  ) => void;
  verifyIssue: (chapterId: string, issueId: string) => void;
  rejectIssue: (chapterId: string, issueId: string, rejectReason: string) => void;
  batchVerifyIssues: (items: { chapterId: string; issueId: string }[]) => void;
  batchRejectIssues: (items: { chapterId: string; issueId: string }[], rejectReason: string) => void;
  addLog: (log: Omit<OperationLog, 'id' | 'timestamp'>) => void;
  getIssueById: (chapterId: string, issueId: string) => Issue | undefined;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    saveToStorage(STORAGE_KEY_CHAPTERS, state.chapters);
  }, [state.chapters]);

  useEffect(() => {
    saveToStorage(STORAGE_KEY_LOGS, state.logs);
  }, [state.logs]);

  useEffect(() => {
    const stateToPersist = {
      selectedChapterId: state.selectedChapterId,
      currentPageIndex: state.currentPageIndex,
      zoomLevel: state.zoomLevel,
      filterStatus: state.filterStatus,
      filterIssueType: state.filterIssueType,
      viewMode: state.viewMode,
      overlayOpacity: state.overlayOpacity,
      overlayBaseVersion: state.overlayBaseVersion,
      overlayTopVersion: state.overlayTopVersion,
      compareVersion: state.compareVersion
    };
    saveToStorage(STORAGE_KEY_STATE, stateToPersist);
  }, [
    state.selectedChapterId,
    state.currentPageIndex,
    state.zoomLevel,
    state.filterStatus,
    state.filterIssueType,
    state.viewMode,
    state.overlayOpacity,
    state.overlayBaseVersion,
    state.overlayTopVersion,
    state.compareVersion
  ]);

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

  const getIssueById = (chapterId: string, issueId: string) => {
    const chapter = state.chapters.find(ch => ch.id === chapterId);
    return chapter?.issues.find(issue => issue.id === issueId);
  };

  const addLog = (log: Omit<OperationLog, 'id' | 'timestamp'>) => {
    const newLog: OperationLog = {
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };
    dispatch({ type: 'ADD_LOG', payload: newLog });
  };

  const createIssue = (
    chapterId: string,
    pageIndex: number,
    type: IssueType,
    annotation: Annotation,
    description: string,
    suggestion: string
  ) => {
    const issueId = `${chapterId}-issue-${Date.now()}`;
    const now = new Date().toISOString();
    
    const newIssue: Issue = {
      id: issueId,
      chapterId,
      pageIndex,
      type,
      annotation,
      description,
      suggestion,
      status: 'open',
      createdAt: now,
      createdBy: state.currentUser.id,
      currentVersion: 1,
      versions: [
        {
          version: 1,
          issueId,
          uploadedBy: state.currentUser.id,
          uploadedAt: now,
          status: 'open',
          note: '问题创建'
        }
      ]
    };
    
    dispatch({ type: 'ADD_ISSUE', payload: { chapterId, issue: newIssue } });
    
    const chapter = state.chapters.find(ch => ch.id === chapterId);
    addLog({
      action: 'issue_created',
      userId: state.currentUser.id,
      userName: state.currentUser.name,
      userRole: state.currentUser.role,
      chapterId,
      chapterTitle: chapter?.title || '',
      issueId,
      pageIndex,
      details: {
        description,
        issueType: type,
        note: suggestion
      }
    });
  };

  const updateIssueStatus = (
    chapterId: string,
    issueId: string,
    status: IssueStatus,
    resolutionNote?: string
  ) => {
    const issue = getIssueById(chapterId, issueId);
    const oldStatus = issue?.status;

    const updates: Partial<Issue> = { status };
    if (status === 'resolved' || status === 'verified') {
      updates.resolvedAt = new Date().toISOString();
      updates.resolvedBy = state.currentUser.id;
    }
    if (resolutionNote) {
      updates.resolutionNote = resolutionNote;
    }
    dispatch({ type: 'UPDATE_ISSUE', payload: { chapterId, issueId, updates } });

    const chapter = state.chapters.find(ch => ch.id === chapterId);
    addLog({
      action: 'issue_status_changed',
      userId: state.currentUser.id,
      userName: state.currentUser.name,
      userRole: state.currentUser.role,
      chapterId,
      chapterTitle: chapter?.title || '',
      issueId,
      pageIndex: issue?.pageIndex,
      details: {
        oldStatus,
        newStatus: status,
        description: resolutionNote
      }
    });
  };

  const updateChapterStatus = (chapterId: string, newStatus: Chapter['status']) => {
    const chapter = state.chapters.find(ch => ch.id === chapterId);
    if (!chapter) return;

    const oldStatus = chapter.status;
    dispatch({ type: 'UPDATE_CHAPTER_STATUS', payload: { chapterId, status: newStatus } });

    addLog({
      action: 'chapter_status_changed',
      userId: state.currentUser.id,
      userName: state.currentUser.name,
      userRole: state.currentUser.role,
      chapterId,
      chapterTitle: chapter.title,
      details: {
        oldStatus: STATUS_LABELS[oldStatus],
        newStatus: STATUS_LABELS[newStatus],
        description: `将第${chapter.chapterNumber}话「${chapter.title}」从${STATUS_LABELS[oldStatus]}变更为${STATUS_LABELS[newStatus]}`
      }
    });
  };

  const jumpToIssue = (issueId: string, chapterId?: string) => {
    const targetChapterId = chapterId || state.selectedChapterId;
    if (!targetChapterId) return;
    
    const issue = getIssueById(targetChapterId, issueId);
    if (!issue) return;

    const chapter = state.chapters.find(ch => ch.id === targetChapterId);
    const page = chapter?.pages.find(p => p.index === issue.pageIndex);
    const latestVersion = page?.versions.length ? Math.max(...page.versions.map(v => v.version)) : 1;

    dispatch({ type: 'SELECT_CHAPTER', payload: targetChapterId });
    setTimeout(() => {
      dispatch({ type: 'SET_PAGE', payload: issue.pageIndex });
      dispatch({ type: 'SET_ACTIVE_ISSUE', payload: issueId });
      dispatch({ type: 'SET_HIGHLIGHT_ISSUE', payload: issueId });
      if (issue.versions.length > 1) {
        dispatch({ type: 'SET_COMPARE_VERSION', payload: { left: 1, right: latestVersion } });
      }
    }, 50);
  };

  const uploadIssueVersion = (
    chapterId: string,
    issueId: string,
    imageUrl: string,
    note?: string
  ) => {
    const issue = getIssueById(chapterId, issueId);
    if (!issue) return;

    const chapter = state.chapters.find(ch => ch.id === chapterId);
    const page = chapter?.pages.find(p => p.index === issue.pageIndex);

    const now = new Date().toISOString();

    const sortedIssueVersions = [...issue.versions].sort((a, b) => a.version - b.version);
    const maxIssueVersion = sortedIssueVersions.length > 0 ? sortedIssueVersions[sortedIssueVersions.length - 1].version : 0;

    const sortedPageVersions = [...(page?.versions || [])].sort((a, b) => a.version - b.version);
    const maxPageVersion = sortedPageVersions.length > 0 ? sortedPageVersions[sortedPageVersions.length - 1].version : 0;

    const newVersionNum = Math.max(maxIssueVersion, maxPageVersion) + 1;

    const newVersion: IssueVersion = {
      version: newVersionNum,
      issueId,
      imageUrl,
      uploadedBy: state.currentUser.id,
      uploadedAt: now,
      status: 'resolved',
      note
    };

    const existingPageVersion = sortedPageVersions.find(v => v.version === newVersionNum);
    const existingIssueIds = existingPageVersion?.issueIds || [];
    const mergedIssueIds = [...new Set([...existingIssueIds, issueId])];

    const pageVersion: PageVersion = {
      version: newVersionNum,
      pageIndex: issue.pageIndex,
      imageUrl,
      uploadedBy: state.currentUser.id,
      uploadedAt: now,
      note: note || `问题 #${issueId} 修改版`,
      issueIds: mergedIssueIds
    };

    dispatch({
      type: 'ADD_ISSUE_VERSION',
      payload: { chapterId, issueId, version: newVersion, pageIndex: issue.pageIndex, pageVersion }
    });

    addLog({
      action: 'version_uploaded',
      userId: state.currentUser.id,
      userName: state.currentUser.name,
      userRole: state.currentUser.role,
      chapterId,
      chapterTitle: chapter?.title || '',
      issueId,
      pageIndex: issue.pageIndex,
      details: {
        version: newVersionNum,
        description: note,
        oldStatus: issue.status,
        newStatus: 'resolved'
      }
    });
  };

  const verifyIssue = (chapterId: string, issueId: string) => {
    const issue = getIssueById(chapterId, issueId);
    if (!issue) return;

    const oldStatus = issue.status;
    const now = new Date().toISOString();
    const sortedVersions = [...issue.versions].sort((a, b) => a.version - b.version);
    const lastVersionIndex = sortedVersions.length - 1;

    dispatch({
      type: 'VERIFY_ISSUE_VERSION',
      payload: {
        chapterId,
        issueId,
        versionIndex: lastVersionIndex,
        verifiedBy: state.currentUser.id,
        verifiedAt: now
      }
    });

    const chapter = state.chapters.find(ch => ch.id === chapterId);
    addLog({
      action: 'issue_verified',
      userId: state.currentUser.id,
      userName: state.currentUser.name,
      userRole: state.currentUser.role,
      chapterId,
      chapterTitle: chapter?.title || '',
      issueId,
      pageIndex: issue.pageIndex,
      details: {
        oldStatus,
        newStatus: 'verified',
        version: sortedVersions[sortedVersions.length - 1]?.version,
        description: '验证通过'
      }
    });
  };

  const rejectIssue = (chapterId: string, issueId: string, rejectReason: string) => {
    const issue = getIssueById(chapterId, issueId);
    if (!issue) return;

    const oldStatus = issue.status;
    const now = new Date().toISOString();
    const sortedVersions = [...issue.versions].sort((a, b) => a.version - b.version);
    const lastVersionIndex = sortedVersions.length - 1;

    dispatch({
      type: 'REJECT_ISSUE_VERSION',
      payload: {
        chapterId,
        issueId,
        versionIndex: lastVersionIndex,
        rejectedBy: state.currentUser.id,
        rejectedAt: now,
        rejectReason
      }
    });

    const chapter = state.chapters.find(ch => ch.id === chapterId);
    addLog({
      action: 'issue_rejected',
      userId: state.currentUser.id,
      userName: state.currentUser.name,
      userRole: state.currentUser.role,
      chapterId,
      chapterTitle: chapter?.title || '',
      issueId,
      pageIndex: issue.pageIndex,
      details: {
        oldStatus,
        newStatus: 'revising',
        version: sortedVersions[sortedVersions.length - 1]?.version,
        description: rejectReason,
        note: '打回修改'
      }
    });
  };

  const batchVerifyIssues = (items: { chapterId: string; issueId: string }[]) => {
    if (items.length === 0) return;

    items.forEach(item => {
      verifyIssue(item.chapterId, item.issueId);
    });

    const firstChapter = state.chapters.find(ch => ch.id === items[0].chapterId);
    addLog({
      action: 'issue_verified',
      userId: state.currentUser.id,
      userName: state.currentUser.name,
      userRole: state.currentUser.role,
      chapterId: items[0].chapterId,
      chapterTitle: firstChapter?.title || '',
      details: {
        description: `批量验证通过 ${items.length} 项问题`,
        newStatus: 'verified',
        note: '批量操作',
        isBatch: true,
        batchCount: items.length,
        batchIds: items.map(i => i.issueId)
      }
    });
  };

  const batchRejectIssues = (items: { chapterId: string; issueId: string }[], rejectReason: string) => {
    if (items.length === 0) return;

    items.forEach(item => {
      rejectIssue(item.chapterId, item.issueId, rejectReason);
    });

    const firstChapter = state.chapters.find(ch => ch.id === items[0].chapterId);
    addLog({
      action: 'issue_rejected',
      userId: state.currentUser.id,
      userName: state.currentUser.name,
      userRole: state.currentUser.role,
      chapterId: items[0].chapterId,
      chapterTitle: firstChapter?.title || '',
      details: {
        description: `批量打回 ${items.length} 项问题：${rejectReason}`,
        newStatus: 'revising',
        note: '批量打回',
        isBatch: true,
        batchCount: items.length,
        batchIds: items.map(i => i.issueId)
      }
    });
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
      updateChapterStatus,
      jumpToIssue,
      uploadIssueVersion,
      verifyIssue,
      rejectIssue,
      batchVerifyIssues,
      batchRejectIssues,
      addLog,
      getIssueById
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
