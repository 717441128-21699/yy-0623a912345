import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Header from './components/Layout/Header';
import ChapterList from './components/Chapters/ChapterList';
import ReviewPage from './components/Review/ReviewPage';
import IssueManagement from './components/Issues/IssueManagement';
import StatisticsPage from './components/Statistics/StatisticsPage';

function AppContent() {
  const { state, dispatch } = useApp();
  const [currentView, setCurrentView] = useState<'chapters' | 'review' | 'issues' | 'statistics'>('chapters');

  const handleSelectChapter = (chapterId: string) => {
    dispatch({ type: 'SELECT_CHAPTER', payload: chapterId });
    setCurrentView('review');
  };

  const handleBackToList = () => {
    dispatch({ type: 'SELECT_CHAPTER', payload: null });
    setCurrentView('chapters');
  };

  const handleJumpToIssue = (chapterId: string, pageIndex: number, issueId: string) => {
    dispatch({ type: 'SELECT_CHAPTER', payload: chapterId });
    dispatch({ type: 'SET_PAGE', payload: pageIndex });
    dispatch({ type: 'SET_ACTIVE_ISSUE', payload: issueId });
    setCurrentView('review');
  };

  const handleViewChange = (view: 'chapters' | 'review' | 'issues' | 'statistics') => {
    if (view === 'review' && !state.selectedChapterId) {
      setCurrentView('chapters');
      return;
    }
    if (view === 'review' && state.selectedChapterId) {
      setCurrentView('review');
      return;
    }
    dispatch({ type: 'SELECT_CHAPTER', payload: null });
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
          <ReviewPage onBack={handleBackToList} />
        )}
        {currentView === 'issues' && (
          <IssueManagement onJumpToIssue={handleJumpToIssue} />
        )}
        {currentView === 'statistics' && (
          <StatisticsPage />
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
