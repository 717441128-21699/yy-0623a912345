export type ChapterStatus = 'pending' | 'reviewing' | 'revising' | 'approved';

export type IssueType = 
  | 'missing_translation'
  | 'character_obscured'
  | 'bubble_overflow'
  | 'font_inconsistency'
  | 'translation_issue'
  | 'typesetting_issue'
  | 'specification_issue'
  | 'other';

export type IssueStatus = 'open' | 'revising' | 'resolved' | 'verified';

export type LogActionType = 
  | 'issue_created'
  | 'issue_status_changed'
  | 'version_uploaded'
  | 'issue_verified'
  | 'chapter_status_changed'
  | 'issue_deleted'
  | 'issue_updated';

export interface Annotation {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pageIndex: number;
}

export interface PageVersion {
  version: number;
  pageIndex: number;
  imageUrl: string;
  uploadedBy: string;
  uploadedAt: string;
  note?: string;
  issueIds?: string[];
}

export interface IssueVersion {
  version: number;
  issueId: string;
  imageUrl?: string;
  uploadedBy: string;
  uploadedAt: string;
  note?: string;
  status: IssueStatus;
}

export interface Issue {
  id: string;
  chapterId: string;
  pageIndex: number;
  type: IssueType;
  annotation: Annotation;
  description: string;
  suggestion: string;
  status: IssueStatus;
  createdAt: string;
  createdBy: string;
  assignee?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNote?: string;
  currentVersion: number;
  versions: IssueVersion[];
}

export interface Page {
  index: number;
  originalImage: string;
  translatedImage: string;
  width: number;
  height: number;
  versions: PageVersion[];
}

export interface Chapter {
  id: string;
  title: string;
  chapterNumber: number;
  volume: number;
  totalPages: number;
  status: ChapterStatus;
  pages: Page[];
  translator: string;
  letterer: string;
  reviewer?: string;
  createdAt: string;
  updatedAt: string;
  deadline?: string;
  issues: Issue[];
  currentVersion: number;
}

export interface OperationLog {
  id: string;
  timestamp: string;
  action: LogActionType;
  userId: string;
  userName: string;
  userRole: string;
  chapterId: string;
  chapterTitle: string;
  issueId?: string;
  pageIndex?: number;
  details: {
    description?: string;
    oldStatus?: string;
    newStatus?: string;
    version?: number;
    issueType?: string;
    note?: string;
  };
}

export interface User {
  id: string;
  name: string;
  role: 'admin' | 'reviewer' | 'translator' | 'letterer' | 'project_manager';
  avatar?: string;
}

export interface IssueTypeConfig {
  value: IssueType;
  label: string;
  color: string;
  category: 'translation' | 'typesetting' | 'specification' | 'other';
  description: string;
}

export const ISSUE_TYPE_CONFIGS: IssueTypeConfig[] = [
  {
    value: 'missing_translation',
    label: '漏翻',
    color: '#ef4444',
    category: 'translation',
    description: '存在未翻译的日文文字'
  },
  {
    value: 'character_obscured',
    label: '遮挡人物',
    color: '#f97316',
    category: 'typesetting',
    description: '文字遮挡了人物面部或重要画面元素'
  },
  {
    value: 'bubble_overflow',
    label: '气泡外溢',
    color: '#eab308',
    category: 'typesetting',
    description: '文字超出了气泡边框'
  },
  {
    value: 'font_inconsistency',
    label: '字体风格不统一',
    color: '#8b5cf6',
    category: 'specification',
    description: '字体选择、大小或样式不符合规范'
  },
  {
    value: 'translation_issue',
    label: '翻译表达问题',
    color: '#3b82f6',
    category: 'translation',
    description: '翻译表达不准确或不通顺'
  },
  {
    value: 'typesetting_issue',
    label: '嵌字排版问题',
    color: '#14b8a6',
    category: 'typesetting',
    description: '排版位置、对齐或间距不合理'
  },
  {
    value: 'specification_issue',
    label: '规范理解问题',
    color: '#ec4899',
    category: 'specification',
    description: '未遵循项目规范要求'
  },
  {
    value: 'other',
    label: '其他问题',
    color: '#64748b',
    category: 'other',
    description: '其他需要说明的问题'
  }
];

export const STATUS_LABELS: Record<ChapterStatus, string> = {
  pending: '待审稿',
  reviewing: '审稿中',
  revising: '返修中',
  approved: '已通过'
};

export const ISSUE_STATUS_LABELS: Record<IssueStatus, string> = {
  open: '待处理',
  revising: '修改中',
  resolved: '已修改',
  verified: '已验证'
};
