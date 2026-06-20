import React, { useState, useRef } from 'react';
import { 
  AlertCircle, Clock, RotateCcw, CheckCircle2, Eye, 
  Search, Filter, ChevronRight, MapPin, Upload,
  Download, MessageSquare, User, Calendar, ArrowRight,
  Layers, GitCompare, FileImage, History, X, ChevronDown,
  XCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { IssueStatus, ISSUE_STATUS_LABELS, ISSUE_TYPE_CONFIGS } from '../../types';
import { getIssueTypeLabel, getIssueTypeColor, getUserNameById, getUserRoleLabel } from '../../data/mockData';
import RejectModal from '../Review/RejectModal';

interface IssueManagementProps {
  onJumpToIssue: (chapterId: string, issueId: string) => void;
}

export default function IssueManagement({ onJumpToIssue }: IssueManagementProps) {
  const { state, updateIssueStatus, jumpToIssue, uploadIssueVersion, verifyIssue, rejectIssue } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('open');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState<'none' | 'side' | 'overlay'>('none');
  const [overlayOpacity, setOverlayOpacity] = useState(50);
  const [uploadNote, setUploadNote] = useState('');
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectIssueId, setRejectIssueId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allIssues = state.chapters.flatMap(chapter => 
    chapter.issues.map(issue => ({ ...issue, chapterTitle: chapter.title, chapterId: chapter.id }))
  );

  const filteredIssues = allIssues.filter(issue => {
    const matchesSearch = issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         getIssueTypeLabel(issue.type).includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || issue.status === statusFilter;
    const matchesType = typeFilter === 'all' || issue.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const issuesByChapter = filteredIssues.reduce((acc, issue) => {
    if (!acc[issue.chapterId]) {
      acc[issue.chapterId] = [];
    }
    acc[issue.chapterId].push(issue);
    return acc;
  }, {} as Record<string, typeof filteredIssues>);

  const handleJumpToIssue = (issue: typeof filteredIssues[0]) => {
    onJumpToIssue(issue.chapterId, issue.id);
  };

  const handleStatusChange = (chapterId: string, issueId: string, status: IssueStatus, note?: string) => {
    updateIssueStatus(chapterId, issueId, status, note);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, chapterId: string, issueId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      uploadIssueVersion(chapterId, issueId, imageUrl, uploadNote || undefined);
      setUploadNote('');
    };
    reader.readAsDataURL(file);
  };

  const handleVerifyIssue = (chapterId: string, issueId: string) => {
    verifyIssue(chapterId, issueId);
  };

  const handleRejectIssue = (issueId: string) => {
    setRejectIssueId(issueId);
    setShowRejectModal(true);
  };

  const handleConfirmReject = (reason: string) => {
    if (rejectIssueId) {
      const issue = allIssues.find(i => i.id === rejectIssueId);
      if (issue) {
        rejectIssue(issue.chapterId, issue.id, reason);
      }
    }
    setShowRejectModal(false);
    setRejectIssueId(null);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getChapterById = (id: string) => state.chapters.find(ch => ch.id === id);
  const getPageById = (chapterId: string, pageIndex: number) => {
    const chapter = getChapterById(chapterId);
    return chapter?.pages[pageIndex];
  };

  const statusTabs = [
    { value: 'all', label: '全部', count: allIssues.length },
    { value: 'open', label: '待处理', count: allIssues.filter(i => i.status === 'open').length, color: 'text-red-500' },
    { value: 'revising', label: '修改中', count: allIssues.filter(i => i.status === 'revising').length, color: 'text-amber-500' },
    { value: 'resolved', label: '已修改', count: allIssues.filter(i => i.status === 'resolved').length, color: 'text-blue-500' },
    { value: 'verified', label: '已验证', count: allIssues.filter(i => i.status === 'verified').length, color: 'text-green-500' },
  ];

  const statusConfig = {
    open: { color: 'bg-red-100 text-red-700 border-red-200', icon: AlertCircle },
    revising: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: RotateCcw },
    resolved: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: CheckCircle2 },
    verified: { color: 'bg-green-100 text-green-700 border-green-200', icon: Eye },
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">返修管理</h2>
        <p className="text-gray-600">追踪和管理所有问题的返修进度</p>
      </div>

      <div className="flex gap-2 mb-6">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              statusFilter === tab.value
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.label}
            <span className={`px-1.5 py-0.5 rounded-full text-xs ${
              statusFilter === tab.value
                ? 'bg-white/20 text-white'
                : 'bg-gray-100 text-gray-500'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索问题..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-64"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
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
          </div>
          <span className="text-sm text-gray-500">共 {filteredIssues.length} 个问题</span>
        </div>

        <div className="flex-1 overflow-hidden flex">
          <div className="w-1/2 border-r border-gray-200 overflow-y-auto">
            {Object.entries(issuesByChapter).length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <CheckCircle2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">暂无符合条件的问题</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {Object.entries(issuesByChapter).map(([chapterId, issues]) => {
                  const chapter = getChapterById(chapterId);
                  if (!chapter) return null;
                  
                  return (
                    <div key={chapterId} className="bg-gray-50/50">
                      <div className="px-4 py-3 bg-white sticky top-0 z-10 border-b border-gray-100">
                        <h4 className="font-medium text-gray-900">
                          第{chapter.chapterNumber}话 {chapter.title}
                        </h4>
                        <p className="text-xs text-gray-500">
                          共 {issues.length} 个问题
                        </p>
                      </div>
                      {issues.map((issue) => {
                        const typeColor = getIssueTypeColor(issue.type);
                        const StatusIcon = statusConfig[issue.status].icon;
                        const isSelected = selectedIssue === issue.id;

                        return (
                          <div
                            key={issue.id}
                            onClick={() => setSelectedIssue(isSelected ? null : issue.id)}
                            className={`p-4 cursor-pointer transition-colors border-l-4 ${
                              isSelected
                                ? 'bg-primary-50 border-primary-500'
                                : 'bg-white border-transparent hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                                style={{ backgroundColor: typeColor }}
                              ></div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span
                                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                                    style={{
                                      backgroundColor: typeColor + '20',
                                      color: typeColor
                                    }}
                                  >
                                    {getIssueTypeLabel(issue.type)}
                                  </span>
                                  <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${statusConfig[issue.status].color}`}>
                                    <StatusIcon className="w-3 h-3" />
                                    {ISSUE_STATUS_LABELS[issue.status]}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    第 {issue.pageIndex + 1} 页
                                  </span>
                                  {issue.versions.length > 1 && (
                                    <span className="text-xs text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">
                                      V{issue.currentVersion}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-800 line-clamp-2 mb-2">{issue.description}</p>
                                <div className="flex items-center justify-between text-xs text-gray-400">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatDate(issue.createdAt)}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleJumpToIssue(issue);
                                    }}
                                    className="flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium"
                                  >
                                    跳转定位
                                    <ArrowRight className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="w-1/2 overflow-y-auto bg-gray-50">
            {selectedIssue ? (
              (() => {
                const issue = filteredIssues.find(i => i.id === selectedIssue);
                if (!issue) return null;
                const chapter = getChapterById(issue.chapterId);
                const page = getPageById(issue.chapterId, issue.pageIndex);
                const typeColor = getIssueTypeColor(issue.type);
                const StatusIcon = statusConfig[issue.status].icon;
                const latestVersion = issue.versions[issue.versions.length - 1];
                const firstVersion = issue.versions[0];
                const hasVersions = issue.versions.length > 1;

                return (
                  <div className="p-4 space-y-4">
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="text-sm font-medium px-3 py-1 rounded-full"
                              style={{
                                backgroundColor: typeColor + '20',
                                color: typeColor
                              }}
                            >
                              {getIssueTypeLabel(issue.type)}
                            </span>
                            <span className={`flex items-center gap-1 text-sm px-3 py-1 rounded-full border ${statusConfig[issue.status].color}`}>
                              <StatusIcon className="w-4 h-4" />
                              {ISSUE_STATUS_LABELS[issue.status]}
                            </span>
                          </div>
                          <button
                            onClick={() => handleJumpToIssue(issue)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                          >
                            <MapPin className="w-4 h-4" />
                            跳转到审稿页
                          </button>
                        </div>

                        <h3 className="text-lg font-semibold text-gray-900 mb-2">问题详情</h3>
                        <p className="text-gray-700 mb-3">{issue.description}</p>

                        {issue.suggestion && (
                          <div className="p-3 bg-primary-50 rounded-lg border border-primary-100">
                            <p className="text-sm font-medium text-primary-700 mb-1">修改建议</p>
                            <p className="text-sm text-gray-700">{issue.suggestion}</p>
                          </div>
                        )}
                      </div>

                      {page && (
                        <div className="p-4 border-b border-gray-200 bg-gray-50">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              <FileImage className="w-4 h-4" />
                              版本对比
                            </h4>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setCompareMode('none')}
                                className={`px-2 py-1 text-xs rounded ${compareMode === 'none' ? 'bg-gray-200 text-gray-700' : 'text-gray-500 hover:bg-gray-100'}`}
                              >
                                关闭
                              </button>
                              <button
                                onClick={() => setCompareMode('side')}
                                className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${compareMode === 'side' ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:bg-gray-100'}`}
                              >
                                <GitCompare className="w-3 h-3" />
                                左右
                              </button>
                              <button
                                onClick={() => setCompareMode('overlay')}
                                className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${compareMode === 'overlay' ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:bg-gray-100'}`}
                              >
                                <Layers className="w-3 h-3" />
                                叠加
                              </button>
                            </div>
                          </div>

                          {compareMode === 'side' && hasVersions && (
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-xs text-gray-500 mb-1 text-center">V1 - 原始版本</p>
                                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                  <img
                                    src={page.versions[0]?.imageUrl || page.translatedImage}
                                    alt="原始版本"
                                    className="w-full object-cover"
                                    style={{ aspectRatio: '4/3' }}
                                  />
                                </div>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-1 text-center">
                                  V{issue.currentVersion} - 当前版本
                                </p>
                                <div className="bg-white rounded-lg border border-primary-300 overflow-hidden ring-2 ring-primary-200">
                                  <img
                                    src={latestVersion?.imageUrl || page.translatedImage}
                                    alt="当前版本"
                                    className="w-full object-cover"
                                    style={{ aspectRatio: '4/3' }}
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {compareMode === 'overlay' && hasVersions && (
                            <div>
                              <div className="flex items-center justify-center gap-2 mb-2">
                                <span className="text-xs text-gray-500">不透明度:</span>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={overlayOpacity}
                                  onChange={(e) => setOverlayOpacity(parseInt(e.target.value))}
                                  className="w-32"
                                />
                                <span className="text-xs text-gray-600 w-10">{overlayOpacity}%</span>
                              </div>
                              <div className="relative bg-white rounded-lg border border-gray-200 overflow-hidden">
                                <img
                                  src={page.versions[0]?.imageUrl || page.translatedImage}
                                  alt="底层"
                                  className="w-full object-cover"
                                  style={{ aspectRatio: '4/3' }}
                                />
                                <img
                                  src={latestVersion?.imageUrl || page.translatedImage}
                                  alt="顶层"
                                  className="absolute top-0 left-0 w-full h-full object-cover transition-opacity"
                                  style={{ opacity: overlayOpacity / 100 }}
                                />
                                <div
                                  className="absolute inset-0 border-4 rounded-lg pointer-events-none"
                                  style={{
                                    borderColor: typeColor,
                                    left: `${issue.annotation.x / 8}%`,
                                    top: `${issue.annotation.y / 11.32}%`,
                                    width: `${issue.annotation.width / 8}%`,
                                    height: `${issue.annotation.height / 11.32}%`,
                                    boxShadow: `0 0 0 9999px rgba(0,0,0,0.1)`
                                  }}
                                ></div>
                              </div>
                            </div>
                          )}

                          {compareMode === 'none' && (
                            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                              <img
                                src={latestVersion?.imageUrl || page.translatedImage}
                                alt="当前页面"
                                className="w-full object-cover"
                                style={{ aspectRatio: '4/3' }}
                              />
                              <div className="p-2 bg-gray-50 border-t border-gray-100">
                                <p className="text-xs text-gray-500">
                                  当前版本: V{issue.currentVersion} {latestVersion?.note && `- ${latestVersion.note}`}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <span className="text-xs text-gray-500 block mb-1">所属章节</span>
                            <span className="text-sm font-medium text-gray-900">{chapter?.title}</span>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <span className="text-xs text-gray-500 block mb-1">页码</span>
                            <span className="text-sm font-medium text-gray-900">第 {issue.pageIndex + 1} 页</span>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <span className="text-xs text-gray-500 block mb-1 flex items-center gap-1">
                              <User className="w-3 h-3" /> 创建人
                            </span>
                            <span className="text-sm font-medium text-gray-900">
                              {getUserNameById(issue.createdBy)}
                            </span>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <span className="text-xs text-gray-500 block mb-1 flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> 创建时间
                            </span>
                            <span className="text-sm font-medium text-gray-900">{formatDate(issue.createdAt)}</span>
                          </div>
                          <div className="p-3 bg-primary-50 rounded-lg border border-primary-100">
                            <span className="text-xs text-primary-600 block mb-1">当前版本</span>
                            <span className="text-sm font-medium text-gray-900">
                              V{issue.currentVersion}
                              {latestVersion?.note && ` - ${latestVersion.note}`}
                            </span>
                          </div>
                          {issue.status === 'verified' && issue.resolvedBy && (
                            <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                              <span className="text-xs text-green-600 block mb-1">验证信息</span>
                              <span className="text-sm font-medium text-gray-900">
                                {getUserNameById(issue.resolvedBy)} 验证通过
                              </span>
                              {issue.resolvedAt && (
                                <p className="text-xs text-green-600 mt-0.5">{formatDate(issue.resolvedAt)}</p>
                              )}
                            </div>
                          )}
                          {issue.status === 'resolved' && latestVersion && (
                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                              <span className="text-xs text-blue-600 block mb-1">修改信息</span>
                              <span className="text-sm font-medium text-gray-900">
                                {getUserNameById(latestVersion.uploadedBy)} 上传修改
                              </span>
                              <p className="text-xs text-blue-600 mt-0.5">{formatDate(latestVersion.uploadedAt)}</p>
                            </div>
                          )}
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">标注位置</h4>
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="grid grid-cols-4 gap-2 text-sm">
                              <div>
                                <span className="text-xs text-gray-500">X坐标</span>
                                <p className="font-mono font-medium">{Math.round(issue.annotation.x)}</p>
                              </div>
                              <div>
                                <span className="text-xs text-gray-500">Y坐标</span>
                                <p className="font-mono font-medium">{Math.round(issue.annotation.y)}</p>
                              </div>
                              <div>
                                <span className="text-xs text-gray-500">宽度</span>
                                <p className="font-mono font-medium">{Math.round(issue.annotation.width)}</p>
                              </div>
                              <div>
                                <span className="text-xs text-gray-500">高度</span>
                                <p className="font-mono font-medium">{Math.round(issue.annotation.height)}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {hasVersions && (
                          <div>
                            <button
                              onClick={() => setShowVersionHistory(!showVersionHistory)}
                              className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <History className="w-4 h-4" />
                                版本历史 ({issue.versions.length})
                              </span>
                              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showVersionHistory ? 'rotate-180' : ''}`} />
                            </button>
                            {showVersionHistory && (
                              <div className="mt-2 space-y-2">
                                {issue.versions.slice().reverse().map((version, idx) => (
                                  <div key={version.version} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-100">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                      version.status === 'verified' ? 'bg-green-100' : 'bg-primary-100'
                                    }`}>
                                      <span className={`text-xs font-bold ${
                                        version.status === 'verified' ? 'text-green-700' : 'text-primary-700'
                                      }`}>V{version.version}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-medium text-gray-900">
                                          版本 {version.version}
                                        </span>
                                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                                          version.status === 'verified' ? 'bg-green-100 text-green-700' :
                                          version.status === 'resolved' ? 'bg-blue-100 text-blue-700' :
                                          version.status === 'revising' ? 'bg-amber-100 text-amber-700' :
                                          'bg-gray-100 text-gray-700'
                                        }`}>
                                          {ISSUE_STATUS_LABELS[version.status]}
                                        </span>
                                        {version === issue.versions[issue.versions.length - 1] && (
                                          <span className="text-xs px-1.5 py-0.5 rounded bg-primary-50 text-primary-600">当前版本</span>
                                        )}
                                      </div>
                                      <p className="text-xs text-gray-500">
                                        {getUserNameById(version.uploadedBy)} 上传 · {formatDate(version.uploadedAt)}
                                      </p>
                                      {version.note && (
                                        <p className="text-sm text-gray-600 mt-1">{version.note}</p>
                                      )}
                                      {version.status === 'verified' && version.verifiedBy && (
                                        <div className="mt-1.5 flex items-center gap-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                                          <CheckCircle2 className="w-3 h-3" />
                                          <span>由 {getUserNameById(version.verifiedBy)} 验证通过</span>
                                          {version.verifiedAt && (
                                            <span className="text-green-500">· {formatDate(version.verifiedAt)}</span>
                                          )}
                                        </div>
                                      )}
                                      {version.status === 'revising' && version.rejectedBy && (
                                        <div className="mt-1.5 flex items-start gap-2 text-xs text-red-600 bg-red-50 px-2 py-1.5 rounded">
                                          <XCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                          <div>
                                            <p className="font-medium">打回修改 - {getUserNameById(version.rejectedBy)}</p>
                                            {version.rejectedAt && (
                                              <p className="text-red-500 text-[10px]">{formatDate(version.rejectedAt)}</p>
                                            )}
                                            {version.rejectReason && (
                                              <p className="mt-1 text-red-700">{version.rejectReason}</p>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {issue.resolutionNote && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">修改说明</h4>
                            <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                              <p className="text-sm text-gray-700">{issue.resolutionNote}</p>
                            </div>
                          </div>
                        )}

                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-3">更新状态</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {(['open', 'revising', 'resolved', 'verified'] as IssueStatus[]).map((status) => (
                              <button
                                key={status}
                                onClick={() => handleStatusChange(issue.chapterId, issue.id, status)}
                                className={`p-3 rounded-lg border-2 text-left transition-all ${
                                  issue.status === status
                                    ? 'border-primary-500 bg-primary-50'
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {React.createElement(statusConfig[status].icon, { className: 'w-4 h-4', style: { color: typeColor } })}
                                  <span className="text-sm font-medium text-gray-900">
                                    {ISSUE_STATUS_LABELS[status]}
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="pt-4 border-t border-gray-200 space-y-3">
                          <h4 className="text-sm font-medium text-gray-700">上传修改版本</h4>
                          
                          <textarea
                            value={uploadNote}
                            onChange={(e) => setUploadNote(e.target.value)}
                            placeholder="修改说明（可选）"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                            rows={2}
                          />

                          <div className="flex gap-2">
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFileUpload(e, issue.chapterId, issue.id)}
                            />
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-primary-400 hover:text-primary-600 transition-colors"
                            >
                              <Upload className="w-4 h-4" />
                              上传修改后的图片
                            </button>
                            <button className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 rounded-lg text-sm text-gray-600 hover:bg-gray-200 transition-colors">
                              <Download className="w-4 h-4" />
                              下载原图
                            </button>
                          </div>
                        </div>

                        {issue.status === 'resolved' && (
                          <div className="space-y-2">
                            <button
                              onClick={() => handleVerifyIssue(issue.chapterId, issue.id)}
                              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              验证通过
                            </button>
                            <button
                              onClick={() => handleRejectIssue(issue.id)}
                              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
                              打回修改
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>选择一个问题查看详情</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showRejectModal && rejectIssueId && (
        (() => {
          const issue = allIssues.find(i => i.id === rejectIssueId);
          return (
            <RejectModal
              onClose={() => {
                setShowRejectModal(false);
                setRejectIssueId(null);
              }}
              onConfirm={handleConfirmReject}
              issueTitle={issue?.description || ''}
            />
          );
        })()
      )}
    </div>
  );
}
