import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Header from './components/Layout/Header';
import ChapterList from './components/Chapters/ChapterList';
import ReviewPage from './components/Review/ReviewPage';
import IssueManagement from './components/Issues/IssueManagement';
import StatisticsPage from './components/Statistics/StatisticsPage';
import OperationLog from './components/Logs/OperationLog';

function AppContent() {
  const { state, dispatch, jumpToIssue } = useApp();
  const [currentView, setCurrentView] = useState<'chapters' | 'review' | 'issues' | 'statistics' | 'logs'>('chapters');
  const [highlightIssueId, setHighlightIssueId] = useState<string | null>(null);

  useEffect(() => {
    if (state.selectedChapterId && currentView !== 'review') {
      setCurrentView('review');
    }
  }, []);

  const handleSelectChapter = (chapterId: string) => {
    dispatch({ type: 'SELECT_CHAPTER', payload: chapterId });
    setHighlightIssueId(null);
    setCurrentView('review');
  };

  const handleBackToList = () => {
    dispatch({ type: 'SELECT_CHAPTER', payload: null });
    setHighlightIssueId(null);
    setCurrentView('chapters');
  };

  const handleJumpToIssue = (chapterId: string, issueId: string) => {
    dispatch({ type: 'SELECT_CHAPTER', payload: chapterId });
    setHighlightIssueId(issueId);
    setCurrentView('review');
  };

  const handleViewChange = (view: 'chapters' | 'review' | 'issues' | 'statistics' | 'logs') => {
    if (view === 'review') {
      if (!state.selectedChapterId) {
        setCurrentView('chapters');
        return;
      }
      setCurrentView('review');
      return;
    }
    dispatch({ type: 'SET_HIGHLIGHT_ISSUE', payload: null });
    setCurrentView(view);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <Header currentView={currentView} onViewChange={handleViewChange} />
      <main className="flex-1 overflow-hidden">
        {currentView === 'chapters' && (
          <ChapterList onSelectChapter={handleSelectChapter} />
        )}
        {currentView === 'review' && (
          <ReviewPage 
            onBack={handleBackToList} 
            highlightIssueId={highlightIssueId || undefined}
          />
        )}
        {currentView === 'issues' && (
          <IssueManagement onJumpToIssue={handleJumpToIssue} />
        )}
        {currentView === 'statistics' && (
          <StatisticsPage />
        )}
        {currentView === 'logs' && (
          <OperationLog />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
