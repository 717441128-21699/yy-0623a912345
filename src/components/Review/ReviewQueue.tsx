import { useState, useMemo } from 'react';
import { 
  Clock, AlertTriangle, CheckCircle2, Eye, Filter, Search,
  User, MapPin, ChevronRight, Calendar, ListChecks,
  FileText, ArrowRight, Users, SortAsc, SortDesc,
  Layers, GitCompare, X, ChevronDown, RotateCcw
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ISSUE_STATUS_LABELS, ISSUE_TYPE_CONFIGS } from '../../types';
import { getIssueTypeLabel, getIssueTypeColor, getUserNameById } from '../../data/mockData';

interface ReviewQueueProps {
  onJumpToIssue: (chapterId: string, issueId: string) => void;
}

type SortType = 'upload_desc' | 'upload_asc' | 'version_desc' | 'chapter';

export default function ReviewQueue({ onJumpToIssue }: ReviewQueueProps) {
  const { state, verifyIssue, rejectIssue } = useApp();
  const [chapterFilter, setChapterFilter] = useState<string>('all');
  const [lettererFilter, setLettererFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [multipleReviseOnly, setMultipleReviseOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortType>('upload_desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [reviewChecklistOpen, setReviewChecklistOpen] = useState(false);

  const pendingIssues = useMemo(() => state.chapters.flatMap(chapter =>
    chapter.issues
      .filter(issue => issue.status === 'resolved')
      .map(issue => ({
        ...issue,
        chapterTitle: chapter.title,
        chapterNumber: chapter.chapterNumber,
        chapterId: chapter.id,
        letterer: chapter.letterer,
        deadline: chapter.deadline,
        latestVersion: issue.versions[issue.versions.length - 1],
        reviseCount: Math.max(0, issue.versions.length - 1)
      }))
  ), [state.chapters]);

  const filteredIssues = useMemo(() => {
    let result = [...pendingIssues];

    if (chapterFilter !== 'all') {
      result = result.filter(i => i.chapterId === chapterFilter);
    }
    if (lettererFilter !== 'all') {
      result = result.filter(i => i.letterer === lettererFilter);
    }
    if (typeFilter !== 'all') {
      result = result.filter(i => i.type === typeFilter);
    }
    if (overdueOnly) {
      result = result.filter(i => i.deadline && new Date(i.deadline) < new Date());
    }
    if (multipleReviseOnly) {
      result = result.filter(i => i.reviseCount >= 2);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i => 
        i.description.toLowerCase().includes(q) ||
        i.chapterTitle.toLowerCase().includes(q) ||
        getIssueTypeLabel(i.type).includes(q) ||
        i.letterer.includes(q)
      );
    }

    switch (sortBy) {
      case 'upload_desc':
        result.sort((a, b) => new Date(b.latestVersion?.uploadedAt || 0).getTime() - new Date(a.latestVersion?.uploadedAt || 0).getTime());
        break;
      case 'upload_asc':
        result.sort((a, b) => new Date(a.latestVersion?.uploadedAt || 0).getTime() - new Date(b.latestVersion?.uploadedAt || 0).getTime());
        break;
      case 'version_desc':
        result.sort((a, b) => b.reviseCount - a.reviseCount);
        break;
      case 'chapter':
        result.sort((a, b) => a.chapterNumber - b.chapterNumber || a.pageIndex - b.pageIndex);
        break;
    }

    return result;
  }, [pendingIssues, chapterFilter, lettererFilter, typeFilter, overdueOnly, multipleReviseOnly, searchQuery, sortBy]);

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

  const uniqueChapters = useMemo(() => [...new Set(pendingIssues.map(i => i.chapterId))], [pendingIssues]);
  const uniqueLetterers = useMemo(() => [...new Set(pendingIssues.map(i => i.letterer))], [pendingIssues]);
  const overdueCount = pendingIssues.filter(i => isOverdue(i.deadline)).length;
  const multipleReviseCount = pendingIssues.filter(i => i.reviseCount >= 2).length;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const selectedIssues = filteredIssues.filter(i => selectedIds.has(i.id));

  return (
    <div className="h-full flex flex-col bg-gray-100">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-3">
              待复核队列
              <span className="text-sm font-normal px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                {pendingIssues.length} 项待复核
              </span>
              {overdueCount > 0 && (
                <span className="text-sm font-normal px-3 py-1 rounded-full bg-red-100 text-red-700">
                  {overdueCount} 项逾期
                </span>
              )}
              {multipleReviseCount > 0 && (
                <span className="text-sm font-normal px-3 py-1 rounded-full bg-amber-100 text-amber-700">
                  {multipleReviseCount} 项多次返修
                </span>
              )}
            </h2>
            <p className="text-gray-600 text-sm">汇总已上传修改版但尚未验证的问题，支持组合筛选和批量复核</p>
          </div>
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <>
                <span className="text-sm text-gray-600 mr-2">已选 {selectedIds.size} 项</span>
                <button
                  onClick={() => setReviewChecklistOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 border border-primary-200 rounded-lg text-sm font-medium hover:bg-primary-100 transition-colors"
                >
                  <ListChecks className="w-4 h-4" />
                  复核清单
                </button>
                <button
                  onClick={handleBatchJumpToReview}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors"
                >
                  <MapPin className="w-4 h-4" />
                  跳转首项
                </button>
                <button
                  onClick={handleBatchVerify}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  批量通过
                </button>
              </>
            )}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索问题描述、章节、嵌字师..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

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

            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">全部类型</option>
                {ISSUE_TYPE_CONFIGS.map(config => (
                  <option key={config.value} value={config.value}>{config.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <SortDesc className="w-4 h-4 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortType)}
                className="border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="upload_desc">最新上传</option>
                <option value="upload_asc">最早上传</option>
                <option value="version_desc">返修次数多</option>
                <option value="chapter">按章节页码</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={overdueOnly}
                onChange={(e) => setOverdueOnly(e.target.checked)}
                className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
              />
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                仅显示逾期
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={multipleReviseOnly}
                onChange={(e) => setMultipleReviseOnly(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
              />
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                仅显示多次返修 (≥2次)
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {filteredIssues.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <CheckCircle2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-1">暂无待复核项</p>
              <p className="text-gray-400 text-sm">所有修改后的问题均已验证通过</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-4">
              <input
                type="checkbox"
                checked={selectedIds.size === filteredIssues.length && filteredIssues.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-500 flex-1">
                全选 <span className="text-gray-400">({filteredIssues.length} 项)</span>
              </span>
            </div>
            <div className="divide-y divide-gray-100">
              {filteredIssues.map((issue) => {
                const typeColor = getIssueTypeColor(issue.type);
                const overdue = isOverdue(issue.deadline);
                const daysRemaining = getDaysRemaining(issue.deadline);

                return (
                  <div
                    key={issue.id}
                    className={`p-4 transition-colors border-l-4 ${
                      selectedIds.has(issue.id) ? 'ring-2 ring-primary-200 bg-primary-50/30 border-primary-500' :
                      overdue ? 'border-red-400 bg-red-50/30 hover:bg-red-50/50' :
                      issue.reviseCount >= 2 ? 'border-amber-400 bg-amber-50/20 hover:bg-amber-50/40' :
                      'border-transparent bg-white hover:bg-gray-50'
                    }`}
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
                          <span className="text-xs text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded font-medium">
                            V{issue.currentVersion}
                          </span>
                          {issue.reviseCount >= 2 && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
                              <RotateCcw className="w-3 h-3" />
                              {issue.reviseCount}次返修
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

                        <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            第{issue.chapterNumber}话 {issue.chapterTitle}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            嵌字: {issue.letterer}
                          </span>
                          {issue.latestVersion && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              上传于 {formatDate(issue.latestVersion.uploadedAt)}
                            </span>
                          )}
                          {issue.latestVersion?.note && (
                            <span className="text-gray-500 truncate max-w-[180px]">
                              备注: {issue.latestVersion.note}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => onJumpToIssue(issue.chapterId, issue.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
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

      {reviewChecklistOpen && selectedIssues.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">复核清单</h3>
                <p className="text-sm text-gray-500">共 {selectedIssues.length} 项待复核，可跳转逐项查看</p>
              </div>
              <button
                onClick={() => setReviewChecklistOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {selectedIssues.map((issue, index) => {
                  const typeColor = getIssueTypeColor(issue.type);
                  return (
                    <div
                      key={issue.id}
                      className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                      <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span
                            className="text-xs font-medium px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: typeColor + '20', color: typeColor }}
                          >
                            {getIssueTypeLabel(issue.type)}
                          </span>
                          <span className="text-xs text-gray-500">
                            第{issue.chapterNumber}话 · 第{issue.pageIndex + 1}页 · V{issue.currentVersion}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800 mb-2">{issue.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span>嵌字: {issue.letterer}</span>
                          {issue.latestVersion && (
                            <span>上传于 {formatDate(issue.latestVersion.uploadedAt)}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => {
                            setReviewChecklistOpen(false);
                            onJumpToIssue(issue.chapterId, issue.id);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          查看
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                共 {selectedIssues.length} 项选中
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setReviewChecklistOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  关闭
                </button>
                <button
                  onClick={handleBatchVerify}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  全部验证通过
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
