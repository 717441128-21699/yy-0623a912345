import React, { useState } from 'react';
import { 
  AlertCircle, Clock, RotateCcw, CheckCircle2, Eye, 
  Search, Filter, ChevronRight, MapPin, Upload,
  Download, MessageSquare, User, Calendar, ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { IssueStatus, ISSUE_STATUS_LABELS, ISSUE_TYPE_CONFIGS } from '../../types';
import { getIssueTypeLabel, getIssueTypeColor } from '../../data/mockData';

interface IssueManagementProps {
  onJumpToIssue: (chapterId: string, pageIndex: number, issueId: string) => void;
}

export default function IssueManagement({ onJumpToIssue }: IssueManagementProps) {
  const { state, updateIssueStatus, jumpToIssue } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('open');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);

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
    jumpToIssue(issue);
  };

  const handleStatusChange = (chapterId: string, issueId: string, status: IssueStatus, note?: string) => {
    updateIssueStatus(chapterId, issueId, status, note);
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
                          共 {issues.length} 个问题待处理
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
                const typeColor = getIssueTypeColor(issue.type);
                const StatusIcon = statusConfig[issue.status].icon;

                return (
                  <div className="p-6">
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-4">
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
                          跳转到位置
                        </button>
                      </div>

                      <h3 className="text-lg font-semibold text-gray-900 mb-2">问题详情</h3>
                      <p className="text-gray-700 mb-4">{issue.description}</p>

                      {issue.suggestion && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            修改建议
                          </h4>
                          <div className="p-4 bg-primary-50 rounded-lg border border-primary-100">
                            <p className="text-sm text-gray-700">{issue.suggestion}</p>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 mb-6">
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
                            {state.currentUser.name}
                          </span>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <span className="text-xs text-gray-500 block mb-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> 创建时间
                          </span>
                          <span className="text-sm font-medium text-gray-900">{formatDate(issue.createdAt)}</span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">标注位置</h4>
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <div className="grid grid-cols-4 gap-4 text-sm">
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

                      {issue.resolutionNote && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">修改说明</h4>
                          <div className="p-4 bg-green-50 rounded-lg border border-green-100">
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
                                {React.createElement(statusConfig[status].icon, { className: 'w-4 h-4', style: { color: getIssueTypeColor(issue.type) } })}
                                <span className="text-sm font-medium text-gray-900">
                                  {ISSUE_STATUS_LABELS[status]}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">上传修改版本</h4>
                        <div className="flex gap-2">
                          <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-primary-400 hover:text-primary-600 transition-colors">
                            <Upload className="w-4 h-4" />
                            上传修改后的图片
                          </button>
                          <button className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 rounded-lg text-sm text-gray-600 hover:bg-gray-200 transition-colors">
                            <Download className="w-4 h-4" />
                            下载原图
                          </button>
                        </div>
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
    </div>
  );
}
