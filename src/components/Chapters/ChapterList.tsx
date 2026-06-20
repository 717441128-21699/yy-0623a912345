import { useState } from 'react';
import { 
  BookOpen, Clock, CheckCircle, AlertCircle, Play, 
  Search, Filter, ChevronRight, User, Calendar, FileText,
  XCircle, Eye
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ChapterStatus, STATUS_LABELS } from '../../types';

const statusIcons: Record<ChapterStatus, any> = {
  pending: Clock,
  reviewing: Play,
  revising: AlertCircle,
  approved: CheckCircle
};

const statusColors: Record<ChapterStatus, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  reviewing: 'bg-blue-100 text-blue-700 border-blue-200',
  revising: 'bg-red-100 text-red-700 border-red-200',
  approved: 'bg-green-100 text-green-700 border-green-200'
};

interface ChapterListProps {
  onSelectChapter: (chapterId: string) => void;
}

export default function ChapterList({ onSelectChapter }: ChapterListProps) {
  const { state, dispatch } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredChapters = state.chapters.filter(chapter => {
    const matchesSearch = chapter.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         chapter.chapterNumber.toString().includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || chapter.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: state.chapters.length,
    pending: state.chapters.filter(c => c.status === 'pending').length,
    reviewing: state.chapters.filter(c => c.status === 'reviewing').length,
    revising: state.chapters.filter(c => c.status === 'revising').length,
    approved: state.chapters.filter(c => c.status === 'approved').length,
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysRemaining = (deadline?: string) => {
    if (!deadline) return null;
    const now = new Date();
    const dead = new Date(deadline);
    const diff = Math.ceil((dead.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getIssueSummary = (chapter: typeof state.chapters[0]) => {
    const open = chapter.issues.filter(i => i.status === 'open').length;
    const revising = chapter.issues.filter(i => i.status === 'revising').length;
    const resolved = chapter.issues.filter(i => i.status === 'resolved' || i.status === 'verified').length;
    return { open, revising, resolved, total: chapter.issues.length };
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">章节列表</h2>
        <p className="text-gray-600">管理和审核汉化后的漫画章节</p>
      </div>

      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">总章节</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              <p className="text-xs text-gray-500">待审稿</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.reviewing}</p>
              <p className="text-xs text-gray-500">审稿中</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.revising}</p>
              <p className="text-xs text-gray-500">返修中</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
              <p className="text-xs text-gray-500">已通过</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索章节..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-64"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">全部状态</option>
                <option value="pending">待审稿</option>
                <option value="reviewing">审稿中</option>
                <option value="revising">返修中</option>
                <option value="approved">已通过</option>
              </select>
            </div>
          </div>
          <span className="text-sm text-gray-500">共 {filteredChapters.length} 个章节</span>
        </div>

        <div className="divide-y divide-gray-100">
          {filteredChapters.map((chapter) => {
            const StatusIcon = statusIcons[chapter.status];
            const issueSummary = getIssueSummary(chapter);
            const daysRemaining = getDaysRemaining(chapter.deadline);
            const isOverdue = daysRemaining !== null && daysRemaining < 0;
            const isUrgent = daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 2;
            
            return (
              <div
                key={chapter.id}
                className="p-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                onClick={() => {
                  dispatch({ type: 'SELECT_CHAPTER', payload: chapter.id });
                  onSelectChapter(chapter.id);
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={chapter.pages[0]?.translatedImage}
                      alt={chapter.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        第{chapter.chapterNumber}话 {chapter.title}
                      </h3>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full border flex items-center gap-1 ${statusColors[chapter.status]}`}>
                        <StatusIcon className="w-3 h-3" />
                        {STATUS_LABELS[chapter.status]}
                      </span>
                      <span className="text-xs text-gray-400">第{chapter.volume}卷</span>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-gray-500 mb-2">
                      <span className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        {chapter.totalPages} 页
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        翻译: {chapter.translator} / 嵌字: {chapter.letterer}
                      </span>
                      {chapter.reviewer && (
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          审稿: {chapter.reviewer}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        更新于 {formatDate(chapter.updatedAt)}
                      </span>
                      {chapter.deadline && (
                        <span className={`flex items-center gap-1 ${
                          isOverdue ? 'text-red-600 font-medium' : 
                          isUrgent ? 'text-amber-600 font-medium' : ''
                        }`}>
                          <Clock className="w-4 h-4" />
                          {isOverdue 
                            ? `已逾期 ${Math.abs(daysRemaining)} 天` 
                            : `剩余 ${daysRemaining} 天`}
                        </span>
                      )}
                    </div>

                    {issueSummary.total > 0 && (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-xs">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          <span className="text-red-600">{issueSummary.open} 待处理</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                          <span className="text-amber-600">{issueSummary.revising} 修改中</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          <span className="text-green-600">{issueSummary.resolved} 已解决</span>
                        </div>
                        <div className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all"
                            style={{ width: `${issueSummary.total > 0 ? (issueSummary.resolved / issueSummary.total) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors flex items-center gap-2">
                      {chapter.status === 'pending' ? '开始审稿' : 
                       chapter.status === 'revising' ? '查看修改' :
                       '继续审稿'}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
