import { useMemo } from 'react';
import {
  Upload, CheckCircle2, XCircle, AlertCircle,
  ChevronRight, Clock, User, FileText
} from 'lucide-react';
import { Chapter, IssueVersion } from '../../types';
import { getUserNameById, getIssueTypeLabel, getIssueTypeColor } from '../../data/mockData';

interface ReviewTimelineProps {
  chapter: Chapter;
  currentPageIndex: number;
  onJumpTo: (pageIndex: number, leftVersion: number, rightVersion: number, issueId?: string) => void;
}

type TimelineNode = {
  id: string;
  timestamp: string;
  type: 'upload' | 'verify' | 'reject' | 'create';
  version: number;
  pageIndex: number;
  issueId?: string;
  issueType?: string;
  description: string;
  userName: string;
  note?: string;
  rejectReason?: string;
};

export default function ReviewTimeline({ chapter, currentPageIndex, onJumpTo }: ReviewTimelineProps) {
  const timelineNodes = useMemo(() => {
    const nodes: TimelineNode[] = [];

    chapter.issues.forEach(issue => {
      const sortedVersions = [...issue.versions].sort((a, b) => a.version - b.version);
      sortedVersions.forEach((ver: IssueVersion, idx) => {
        if (idx === 0) {
          nodes.push({
            id: `${issue.id}-v${ver.version}-create`,
            timestamp: ver.uploadedAt,
            type: 'create',
            version: ver.version,
            pageIndex: issue.pageIndex,
            issueId: issue.id,
            issueType: issue.type,
            description: `创建问题：${issue.description}`,
            userName: getUserNameById(ver.uploadedBy),
            note: issue.suggestion
          });
        } else {
          nodes.push({
            id: `${issue.id}-v${ver.version}-upload`,
            timestamp: ver.uploadedAt,
            type: 'upload',
            version: ver.version,
            pageIndex: issue.pageIndex,
            issueId: issue.id,
            issueType: issue.type,
            description: `上传 V${ver.version} 修改版`,
            userName: getUserNameById(ver.uploadedBy),
            note: ver.note
          });
        }

        if (ver.status === 'verified' && ver.verifiedAt && ver.verifiedBy) {
          nodes.push({
            id: `${issue.id}-v${ver.version}-verify`,
            timestamp: ver.verifiedAt,
            type: 'verify',
            version: ver.version,
            pageIndex: issue.pageIndex,
            issueId: issue.id,
            issueType: issue.type,
            description: `V${ver.version} 验证通过`,
            userName: getUserNameById(ver.verifiedBy)
          });
        }

        if (ver.status === 'revising' && ver.rejectedAt && ver.rejectedBy) {
          nodes.push({
            id: `${issue.id}-v${ver.version}-reject`,
            timestamp: ver.rejectedAt,
            type: 'reject',
            version: ver.version,
            pageIndex: issue.pageIndex,
            issueId: issue.id,
            issueType: issue.type,
            description: `V${ver.version} 打回修改`,
            userName: getUserNameById(ver.rejectedBy),
            rejectReason: ver.rejectReason
          });
        }
      });
    });

    return nodes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [chapter]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes} 分钟前`;
    if (hours < 24) return `${hours} 小时前`;
    if (days < 7) return `${days} 天前`;
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getNodeIcon = (type: TimelineNode['type']) => {
    switch (type) {
      case 'create': return AlertCircle;
      case 'upload': return Upload;
      case 'verify': return CheckCircle2;
      case 'reject': return XCircle;
    }
  };

  const getNodeColor = (type: TimelineNode['type']) => {
    switch (type) {
      case 'create': return { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-300' };
      case 'upload': return { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-300' };
      case 'verify': return { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-300' };
      case 'reject': return { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-300' };
    }
  };

  const getNodeLabel = (type: TimelineNode['type']) => {
    switch (type) {
      case 'create': return '创建问题';
      case 'upload': return '上传修改';
      case 'verify': return '验证通过';
      case 'reject': return '打回修改';
    }
  };

  const handleNodeClick = (node: TimelineNode) => {
    const leftVer = Math.max(1, node.version - 1);
    onJumpTo(node.pageIndex, leftVer, node.version, node.issueId);
  };

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary-600" />
          复核时间线
          <span className="text-xs font-normal text-gray-500">({timelineNodes.length})</span>
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {timelineNodes.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            暂无操作记录
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gray-200"></div>
            <div className="space-y-3">
              {timelineNodes.map((node) => {
                const Icon = getNodeIcon(node.type);
                const color = getNodeColor(node.type);
                const isCurrentPage = node.pageIndex === currentPageIndex;

                return (
                  <button
                    key={node.id}
                    onClick={() => handleNodeClick(node)}
                    className={`w-full text-left relative pl-10 pr-2 py-2 rounded-lg transition-all ${
                      isCurrentPage
                        ? 'bg-primary-50 ring-1 ring-primary-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className={`absolute left-0 top-2.5 w-8 h-8 rounded-full ${color.bg} ${color.border} border-2 flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${color.text}`} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color.bg} ${color.text}`}>
                          {getNodeLabel(node.type)}
                        </span>
                        <span className="text-xs text-primary-600 font-semibold">
                          V{node.version}
                        </span>
                        {node.issueType && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor: getIssueTypeColor(node.issueType) + '20',
                              color: getIssueTypeColor(node.issueType)
                            }}
                          >
                            {getIssueTypeLabel(node.issueType)}
                          </span>
                        )}
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          第 {node.pageIndex + 1} 页
                        </span>
                      </div>

                      <p className="text-sm text-gray-800 line-clamp-2 mb-1">
                        {node.description}
                      </p>

                      {node.note && node.type !== 'reject' && (
                        <p className="text-xs text-gray-500 line-clamp-1 mb-1">
                          备注: {node.note}
                        </p>
                      )}

                      {node.rejectReason && (
                        <p className="text-xs text-orange-700 bg-orange-50 px-2 py-1 rounded line-clamp-2 mb-1">
                          原因: {node.rejectReason}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {node.userName}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          {formatDate(node.timestamp)}
                          <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
