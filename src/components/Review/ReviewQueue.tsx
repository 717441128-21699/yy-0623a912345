import { useState } from 'react';
import { 
  Clock, AlertTriangle, CheckCircle2, Eye, Filter, Search,
  User, MapPin, ChevronRight, Calendar, ListChecks,
  FileText, ArrowRight, Users
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ISSUE_STATUS_LABELS, ISSUE_TYPE_CONFIGS } from '../../types';
import { getIssueTypeLabel, getIssueTypeColor, getUserNameById } from '../../data/mockData';

interface ReviewQueueProps {
  onJumpToIssue: (chapterId: string, issueId: string) => void;
}

export default function ReviewQueue({ onJumpToIssue }: ReviewQueueProps) {
  const { state, verifyIssue } = useApp();
  const [chapterFilter, setChapterFilter] = useState<string>('all');
  const [lettererFilter, setLettererFilter] = useState<string>('all');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const pendingIssues = state.chapters.flatMap(chapter =>
    chapter.issues
      .filter(issue => issue.status === 'resolved')
      .map(issue => ({
        ...issue,
        chapterTitle: chapter.title,
        chapterNumber: chapter.chapterNumber,
        chapterId: chapter.id,
        letterer: chapter.letterer,
        deadline: chapter.deadline
      }))
  );

  const filteredIssues = pendingIssues.filter(issue => {
    const matchesChapter = chapterFilter === 'all' || issue.chapterId === chapterFilter;
    const matchesLetterer = lettererFilter === 'all' || issue.letterer === lettererFilter;
    const matchesOverdue = !overdueOnly || (issue.deadline && new Date(issue.deadline) < new Date());
    const matchesSearch = issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         issue.chapterTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         getIssueTypeLabel(issue.type).includes(searchQuery);
    return matchesChapter && matchesLetterer && matchesOverdue && matchesSearch;
  });

  const isOverdue = (deadline?: string) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  const getDaysRemaining = (deadline?: string) => {
    if (!deadline) return null;
    const diff = new Date(deadline).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const toggleSelect = (issueId: string) => {
    const next = new Set(selectedIds);
    if (next.has(issueId)) {
      next.delete(issueId);
    } else {
      next.add(issueId);
    }
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredIssues.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredIssues.map(i => i.id)));
    }
  };

  const handleBatchVerify = () => {
    filteredIssues.forEach(issue => {
      if (selectedIds.has(issue.id)) {
        verifyIssue(issue.chapterId, issue.id);
      }
    });
    setSelectedIds(new Set());
  };

  const handleBatchJumpToReview = () => {
    const firstSelected = filteredIssues.find(i => selectedIds.has(i.id));
    if (firstSelected) {
      onJumpToIssue(firstSelected.chapterId, firstSelected.id);
    }
  };

  const uniqueChapters = [...new Set(pendingIssues.map(i => i.chapterId))];
  const uniqueLetterers = [...new Set(pendingIssues.map(i => i.letterer))];
  const overdueCount = pendingIssues.filter(i => isOverdue(i.deadline)).length;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-3">
              待复核队列
              <span className="text-sm font-normal px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                {pendingIssues.length} 项待复核
              </span>
              {overdueCount > 0 && (
                <span className="text-sm font-normal px-3 py-1 rounded-full bg-red-100 text-red-700">
                  {overdueCount} 项逾期
                </span>
              )}
            </h2>
            <p className="text-gray-600">汇总已上传修改版但尚未验证通过的问题，逐项或批量复核</p>
          </div>
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">已选 {selectedIds.size} 项</span>
              <button
                onClick={handleBatchJumpToReview}
                className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 border border-primary-200 rounded-lg text-sm font-medium hover:bg-primary-100 transition-colors"
              >
                <MapPin className="w-4 h-4" />
                跳转复核
              </button>
              <button
                onClick={handleBatchVerify}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                批量通过 ({selectedIds.size})
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索问题描述或章节..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-72"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={overdueOnly}
                onChange={(e) => setOverdueOnly(e.target.checked)}
                className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
              />
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-red-500" />
                仅显示逾期
              </span>
            </label>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={chapterFilter}
                onChange={(e) => setChapterFilter(e.target.value)}
                className="border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">全部章节</option>
                {uniqueChapters.map(chId => {
                  const ch = state.chapters.find(c => c.id === chId);
                  return (
                    <option key={chId} value={chId}>
                      {ch ? `第${ch.chapterNumber}话 ${ch.title}` : chId}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              <select
                value={lettererFilter}
                onChange={(e) => setLettererFilter(e.target.value)}
                className="border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">全部嵌字师</option>
                {uniqueLetterers.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredIssues.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <CheckCircle2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-1">暂无待复核项</p>
                <p className="text-gray-400 text-sm">所有修改后的问题均已验证通过</p>
              </div>
            </div>
          ) : (
            <div>
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={selectedIds.size === filteredIssues.length && filteredIssues.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-xs text-gray-500 flex-1">全选</span>
                <span className="text-xs text-gray-400">共 {filteredIssues.length} 项</span>
              </div>
              <div className="divide-y divide-gray-100">
                {filteredIssues.map((issue) => {
                  const typeColor = getIssueTypeColor(issue.type);
                  const overdue = isOverdue(issue.deadline);
                  const daysRemaining = getDaysRemaining(issue.deadline);
                  const latestVersion = issue.versions[issue.versions.length - 1];

                  return (
                    <div
                      key={issue.id}
                      className={`p-4 transition-colors border-l-4 ${
                        overdue ? 'border-red-400 bg-red-50/30' : 'border-transparent bg-white hover:bg-gray-50'
                      } ${selectedIds.has(issue.id) ? 'ring-2 ring-primary-200 bg-primary-50/30' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(issue.id)}
                          onChange={() => toggleSelect(issue.id)}
                          className="w-4 h-4 mt-1 text-primary-600 rounded focus:ring-primary-500"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span
                              className="text-xs font-medium px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: typeColor + '20', color: typeColor }}
                            >
                              {getIssueTypeLabel(issue.type)}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200">
                              {ISSUE_STATUS_LABELS[issue.status]}
                            </span>
                            {issue.versions.length > 1 && (
                              <span className="text-xs text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">
                                V{issue.currentVersion}
                              </span>
                            )}
                            <span className="text-xs text-gray-400">
                              第 {issue.pageIndex + 1} 页
                            </span>
                            {overdue && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                逾期 {Math.abs(daysRemaining || 0)} 天
                              </span>
                            )}
                            {!overdue && daysRemaining !== null && daysRemaining <= 3 && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                剩余 {daysRemaining} 天
                              </span>
                            )}
                          </div>

                          <p className="text-sm text-gray-800 mb-1.5 line-clamp-1">{issue.description}</p>

                          <div className="flex items-center gap-4 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              第{issue.chapterNumber}话 {issue.chapterTitle}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              嵌字: {issue.letterer}
                            </span>
                            {latestVersion && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                上传于 {formatDate(latestVersion.uploadedAt)}
                              </span>
                            )}
                            {issue.suggestion && (
                              <span className="text-gray-500 truncate max-w-[200px]">
                                建议: {issue.suggestion}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => onJumpToIssue(issue.chapterId, issue.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                            复核
                          </button>
                          <button
                            onClick={() => verifyIssue(issue.chapterId, issue.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            通过
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
