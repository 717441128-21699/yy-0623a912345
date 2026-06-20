import { useState } from 'react';
import { 
  ArrowLeft, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, 
  Edit3, Eye, CheckCircle, AlertTriangle, FileText,
  Download, Upload, RotateCcw, List, Grid, X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ISSUE_TYPE_CONFIGS, STATUS_LABELS, ISSUE_STATUS_LABELS } from '../../types';
import { getIssueTypeLabel, getIssueTypeColor } from '../../data/mockData';
import DualImageView from './DualImageView';
import IssuePanel from './IssuePanel';
import AnnotationOverlay from './AnnotationOverlay';
import IssueFormModal from './IssueFormModal';

interface ReviewPageProps {
  onBack: () => void;
}

export default function ReviewPage({ onBack }: ReviewPageProps) {
  const { state, dispatch, getSelectedChapter, getCurrentPage, getCurrentPageIssues, updateIssueStatus } = useApp();
  const [showIssuePanel, setShowIssuePanel] = useState(true);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [viewMode, setViewMode] = useState<'dual' | 'original' | 'translated'>('dual');
  const [syncScroll, setSyncScroll] = useState(true);

  const chapter = getSelectedChapter();
  const currentPage = getCurrentPage();
  const pageIssues = getCurrentPageIssues();

  if (!chapter) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">未选择章节</h3>
          <p className="text-gray-600 mb-4">请先从章节列表中选择一个章节</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            返回章节列表
          </button>
        </div>
      </div>
    );
  }

  const currentPageIssues = chapter.issues.filter(
    issue => issue.pageIndex === state.currentPageIndex
  );

  const handlePrevPage = () => {
    dispatch({ type: 'PREV_PAGE' });
  };

  const handleNextPage = () => {
    dispatch({ type: 'NEXT_PAGE' });
  };

  const handleZoomIn = () => {
    dispatch({ type: 'SET_ZOOM', payload: state.zoomLevel + 10 });
  };

  const handleZoomOut = () => {
    dispatch({ type: 'SET_ZOOM', payload: state.zoomLevel - 10 });
  };

  const handleResetZoom = () => {
    dispatch({ type: 'SET_ZOOM', payload: 100 });
  };

  const handleToggleAnnotate = () => {
    dispatch({ type: 'SET_ANNOTATING', payload: !state.isAnnotating });
    if (!state.isAnnotating) {
      setShowIssueForm(true);
    }
  };

  const handlePageSelect = (index: number) => {
    dispatch({ type: 'SET_PAGE', payload: index });
  };

  const handleApproveChapter = () => {
    dispatch({ type: 'UPDATE_CHAPTER_STATUS', payload: { chapterId: chapter.id, status: 'approved' } });
  };

  const handleSendToRevise = () => {
    dispatch({ type: 'UPDATE_CHAPTER_STATUS', payload: { chapterId: chapter.id, status: 'revising' } });
  };

  const issueStats = {
    total: chapter.issues.length,
    open: chapter.issues.filter(i => i.status === 'open').length,
    revising: chapter.issues.filter(i => i.status === 'revising').length,
    resolved: chapter.issues.filter(i => i.status === 'resolved').length,
    verified: chapter.issues.filter(i => i.status === 'verified').length,
  };

  return (
    <div className="h-full flex flex-col bg-gray-100">
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                第{chapter.chapterNumber}话 {chapter.title}
              </h2>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span>第{chapter.volume}卷</span>
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <span>共 {chapter.totalPages} 页</span>
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full border bg-blue-50 text-blue-700 border-blue-200">
                  {STATUS_LABELS[chapter.status]}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 mr-4">
              <button
                onClick={() => setViewMode('dual')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  viewMode === 'dual' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('original')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  viewMode === 'original' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="text-xs font-bold">JP</span>
              </button>
              <button
                onClick={() => setViewMode('translated')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  viewMode === 'translated' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="text-xs font-bold">CN</span>
              </button>
            </div>

            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 mr-4">
              <button
                onClick={handleZoomOut}
                className="p-2 hover:bg-white rounded-md transition-colors"
                title="缩小"
              >
                <ZoomOut className="w-4 h-4 text-gray-600" />
              </button>
              <span className="px-2 text-sm font-medium text-gray-700 min-w-[50px] text-center">
                {state.zoomLevel}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-2 hover:bg-white rounded-md transition-colors"
                title="放大"
              >
                <ZoomIn className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={handleResetZoom}
                className="p-2 hover:bg-white rounded-md transition-colors"
                title="重置缩放"
              >
                <RotateCcw className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            <button
              onClick={handleToggleAnnotate}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                state.isAnnotating
                  ? 'bg-red-100 text-red-700 border border-red-200'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              {state.isAnnotating ? '取消标注' : '添加问题'}
            </button>

            <button
              onClick={() => setShowIssuePanel(!showIssuePanel)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showIssuePanel
                  ? 'bg-primary-50 text-primary-700 border border-primary-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <List className="w-4 h-4" />
              问题列表
              {issueStats.total > 0 && (
                <span className="px-1.5 py-0.5 text-xs bg-primary-600 text-white rounded-full">
                  {issueStats.total}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-4">
            <button
              onClick={handlePrevPage}
              disabled={state.currentPageIndex === 0}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              上一页
            </button>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                第 <span className="font-semibold text-gray-900">{state.currentPageIndex + 1}</span> / {chapter.totalPages} 页
              </span>
            </div>

            <button
              onClick={handleNextPage}
              disabled={state.currentPageIndex === chapter.totalPages - 1}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              下一页
              <ChevronRight className="w-4 h-4" />
            </button>

            <label className="flex items-center gap-2 ml-4 cursor-pointer">
              <input
                type="checkbox"
                checked={syncScroll}
                onChange={(e) => setSyncScroll(e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-600">同步滚动</span>
            </label>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                {issueStats.open} 待处理
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                {issueStats.revising} 修改中
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                {issueStats.resolved} 已修改
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                {issueStats.verified} 已验证
              </span>
            </div>

            <button
              onClick={handleSendToRevise}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
            >
              <Upload className="w-4 h-4" />
              发送返修
            </button>
            <button
              onClick={handleApproveChapter}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              通过审核
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className={`flex-1 overflow-auto p-6 ${showIssuePanel ? 'mr-80' : ''}`}>
          <DualImageView
            viewMode={viewMode}
            syncScroll={syncScroll}
            currentPage={currentPage}
            zoomLevel={state.zoomLevel}
            isAnnotating={state.isAnnotating}
            issues={currentPageIssues}
            activeIssueId={state.activeIssueId}
          />
        </div>

        {showIssuePanel && (
          <IssuePanel
            chapter={chapter}
            currentPageIndex={state.currentPageIndex}
            onJumpToPage={handlePageSelect}
            onClose={() => setShowIssuePanel(false)}
          />
        )}
      </div>

      <div className="bg-white border-t border-gray-200 px-6 py-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {chapter.pages.map((page, index) => (
            <button
              key={index}
              onClick={() => handlePageSelect(index)}
              className={`relative flex-shrink-0 w-16 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                index === state.currentPageIndex
                  ? 'border-primary-500 ring-2 ring-primary-200'
                  : 'border-transparent hover:border-gray-300'
              }`}
            >
              <img
                src={page.translatedImage}
                alt={`第${index + 1}页`}
                className="w-full h-full object-cover"
              />
              {chapter.issues.filter(i => i.pageIndex === index).length > 0 && (
                <div className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white">
                    {chapter.issues.filter(i => i.pageIndex === index).length}
                  </span>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-0.5">
                {index + 1}
              </div>
            </button>
          ))}
        </div>
      </div>

      {showIssueForm && (
        <IssueFormModal
          onClose={() => {
            setShowIssueForm(false);
            dispatch({ type: 'SET_ANNOTATING', payload: false });
          }}
          pageIndex={state.currentPageIndex}
          chapterId={chapter.id}
        />
      )}
    </div>
  );
}
