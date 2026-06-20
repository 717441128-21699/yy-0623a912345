import { useState } from 'react';
import { X, Filter, ChevronDown, ChevronRight, CheckCircle2, Clock, AlertCircle, RotateCcw, Eye, MessageSquare } from 'lucide-react';
import { Chapter, IssueStatus, ISSUE_STATUS_LABELS } from '../../types';
import { getIssueTypeLabel, getIssueTypeColor } from '../../data/mockData';
import { useApp } from '../../context/AppContext';

interface IssuePanelProps {
  chapter: Chapter;
  currentPageIndex: number;
  onJumpToPage: (pageIndex: number) => void;
  onClose: () => void;
}

export default function IssuePanel({ chapter, currentPageIndex, onJumpToPage, onClose }: IssuePanelProps) {
  const { dispatch, updateIssueStatus, state } = useApp();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [groupByPage, setGroupByPage] = useState(true);
  const [expandedPages, setExpandedPages] = useState<Set<number>>(new Set([currentPageIndex]));

  const filteredIssues = chapter.issues.filter(issue => {
    const matchesStatus = filterStatus === 'all' || issue.status === filterStatus;
    const matchesType = filterType === 'all' || issue.type === filterType;
    return matchesStatus && matchesType;
  });

  const issuesByPage = filteredIssues.reduce((acc, issue) => {
    if (!acc[issue.pageIndex]) {
      acc[issue.pageIndex] = [];
    }
    acc[issue.pageIndex].push(issue);
    return acc;
  }, {} as Record<number, typeof filteredIssues>);

  const togglePage = (pageIndex: number) => {
    const newExpanded = new Set(expandedPages);
    if (newExpanded.has(pageIndex)) {
      newExpanded.delete(pageIndex);
    } else {
      newExpanded.add(pageIndex);
    }
    setExpandedPages(newExpanded);
  };

  const handleIssueClick = (issueId: string, pageIndex: number) => {
    if (pageIndex !== currentPageIndex) {
      onJumpToPage(pageIndex);
    }
    dispatch({ type: 'SET_ACTIVE_ISSUE', payload: issueId === state.activeIssueId ? null : issueId });
  };

  const handleStatusChange = (issueId: string, newStatus: IssueStatus) => {
    updateIssueStatus(chapter.id, issueId, newStatus);
  };

  const statusFilters = [
    { value: 'all', label: '全部', icon: Filter },
    { value: 'open', label: '待处理', icon: AlertCircle, color: 'text-red-500' },
    { value: 'revising', label: '修改中', icon: RotateCcw, color: 'text-amber-500' },
    { value: 'resolved', label: '已修改', icon: CheckCircle2, color: 'text-blue-500' },
    { value: 'verified', label: '已验证', icon: Eye, color: 'text-green-500' },
  ];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const IssueCard = ({ issue }: { issue: typeof chapter.issues[0] }) => {
    const isActive = issue.id === state.activeIssueId;
    const isCurrentPage = issue.pageIndex === currentPageIndex;
    const typeColor = getIssueTypeColor(issue.type);

    const statusConfig = {
      open: { color: 'bg-red-100 text-red-700 border-red-200', icon: AlertCircle },
      revising: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: RotateCcw },
      resolved: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: CheckCircle2 },
      verified: { color: 'bg-green-100 text-green-700 border-green-200', icon: Eye },
    };

    const StatusIcon = statusConfig[issue.status].icon;

    return (
      <div
        className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
          isActive
            ? 'border-primary-500 bg-primary-50 shadow-md'
            : isCurrentPage
            ? 'border-gray-200 bg-white hover:border-gray-300'
            : 'border-transparent bg-gray-50 hover:bg-gray-100'
        }`}
        onClick={() => handleIssueClick(issue.id, issue.pageIndex)}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: typeColor }}
            ></span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{
              backgroundColor: typeColor + '20',
              color: typeColor
            }}>
              {getIssueTypeLabel(issue.type)}
            </span>
          </div>
          <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${statusConfig[issue.status].color}`}>
            <StatusIcon className="w-3 h-3" />
            {ISSUE_STATUS_LABELS[issue.status]}
          </span>
        </div>

        <p className="text-sm text-gray-800 mb-2 line-clamp-2">{issue.description}</p>

        {issue.suggestion && (
          <div className="flex items-start gap-1.5 mb-2 p-2 bg-gray-50 rounded text-xs">
            <MessageSquare className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-gray-600 line-clamp-2">{issue.suggestion}</p>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(issue.createdAt)}
          </span>
          {!isCurrentPage && (
            <span className="text-primary-600 font-medium">
              第 {issue.pageIndex + 1} 页
            </span>
          )}
        </div>

        {isActive && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-2">更新状态:</p>
            <div className="flex gap-1">
              {(['open', 'revising', 'resolved', 'verified'] as IssueStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusChange(issue.id, status);
                  }}
                  className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${
                    issue.status === status
                      ? statusConfig[status].color
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {ISSUE_STATUS_LABELS[status]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full absolute right-0 top-0 bottom-0 z-10">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">问题列表</h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 flex-1">
            {statusFilters.slice(0, 3).map((filter) => (
              <button
                key={filter.value}
                onClick={() => setFilterStatus(filter.value)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  filterStatus === filter.value
                    ? 'bg-white shadow text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 text-xs">
          <button
            onClick={() => setGroupByPage(!groupByPage)}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              groupByPage
                ? 'bg-primary-100 text-primary-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            按页分组
          </button>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="flex-1 px-2 py-1.5 border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="all">全部类型</option>
            <option value="missing_translation">漏翻</option>
            <option value="character_obscured">遮挡人物</option>
            <option value="bubble_overflow">气泡外溢</option>
            <option value="font_inconsistency">字体风格不统一</option>
            <option value="translation_issue">翻译表达问题</option>
            <option value="typesetting_issue">嵌字排版问题</option>
            <option value="specification_issue">规范理解问题</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredIssues.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">暂无问题记录</p>
          </div>
        ) : groupByPage ? (
          Object.entries(issuesByPage).sort(([a], [b]) => Number(a) - Number(b)).map(([pageIndex, issues]) => {
            const pageNum = Number(pageIndex);
            const isExpanded = expandedPages.has(pageNum);
            const isCurrent = pageNum === currentPageIndex;

            return (
              <div key={pageIndex}>
                <button
                  onClick={() => togglePage(pageNum)}
                  className={`w-full flex items-center justify-between p-2 rounded-lg mb-2 transition-colors ${
                    isCurrent ? 'bg-primary-50 border border-primary-200' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    )}
                    <span className={`text-sm font-medium ${isCurrent ? 'text-primary-700' : 'text-gray-700'}`}>
                      第 {pageNum + 1} 页
                    </span>
                    {isCurrent && (
                      <span className="text-xs px-1.5 py-0.5 bg-primary-200 text-primary-700 rounded">
                        当前页
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {issues.length} 个问题
                  </span>
                </button>

                {isExpanded && (
                  <div className="space-y-2 pl-2">
                    {issues.map((issue) => (
                      <IssueCard key={issue.id} issue={issue} />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          filteredIssues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))
        )}
      </div>

      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2 bg-white rounded-lg">
            <p className="text-lg font-bold text-red-500">
              {chapter.issues.filter(i => i.status === 'open').length}
            </p>
            <p className="text-xs text-gray-500">待处理</p>
          </div>
          <div className="p-2 bg-white rounded-lg">
            <p className="text-lg font-bold text-amber-500">
              {chapter.issues.filter(i => i.status === 'revising').length}
            </p>
            <p className="text-xs text-gray-500">修改中</p>
          </div>
          <div className="p-2 bg-white rounded-lg">
            <p className="text-lg font-bold text-blue-500">
              {chapter.issues.filter(i => i.status === 'resolved').length}
            </p>
            <p className="text-xs text-gray-500">已修改</p>
          </div>
          <div className="p-2 bg-white rounded-lg">
            <p className="text-lg font-bold text-green-500">
              {chapter.issues.filter(i => i.status === 'verified').length}
            </p>
            <p className="text-xs text-gray-500">已验证</p>
          </div>
        </div>
      </div>
    </div>
  );
}
