import { Chapter, User, Issue, Page, OperationLog, IssueVersion, PageVersion } from '../types';

const generateComicImage = (type: 'original' | 'translated', chapter: number, page: number, seed: string) => {
  const text = type === 'original' ? 'JP' : 'CN';
  return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=manga%20comic%20page%20${text}%20style%20chapter%20${chapter}%20page%20${page}%2C%20${seed}&image_size=portrait_4_3`;
};

const generatePages = (chapterId: string, count: number): Page[] => {
  const chapterNum = parseInt(chapterId.split('-')[1] || '1');
  return Array.from({ length: count }, (_, i) => {
    const baseImage = generateComicImage('translated', chapterNum, i, `${chapterId}-trans-${i}`);
    const v2Image = generateComicImage('translated', chapterNum, i, `${chapterId}-trans-${i}-v2`);
    
    const versions: PageVersion[] = [
      {
        version: 1,
        pageIndex: i,
        imageUrl: baseImage,
        uploadedBy: 'u5',
        uploadedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        note: '初版嵌字'
      }
    ];

    if (chapterNum <= 4) {
      versions.push({
        version: 2,
        pageIndex: i,
        imageUrl: v2Image,
        uploadedBy: 'u5',
        uploadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        note: '第一次返修修改'
      });
    }

    return {
      index: i,
      originalImage: generateComicImage('original', chapterNum, i, `${chapterId}-orig-${i}`),
      translatedImage: versions[versions.length - 1].imageUrl,
      width: 800,
      height: 1132,
      versions
    };
  });
};

export const mockUsers: User[] = [
  { id: 'u1', name: '张明', role: 'project_manager' },
  { id: 'u2', name: '李华', role: 'reviewer' },
  { id: 'u3', name: '王芳', role: 'reviewer' },
  { id: 'u4', name: '陈静', role: 'translator' },
  { id: 'u5', name: '刘伟', role: 'letterer' },
  { id: 'u6', name: '赵强', role: 'letterer' },
];

const createMockIssues = (chapterId: string, pageCount: number): Issue[] => {
  const issues: Issue[] = [];
  const issueTemplates = [
    { type: 'missing_translation' as const, desc: '右上角存在未翻译的日文旁白', suggestion: '翻译为"那是一个风雨交加的夜晚..."' },
    { type: 'character_obscured' as const, desc: '对话气泡遮挡了主角的左眼', suggestion: '将气泡向左上方移动约20像素' },
    { type: 'bubble_overflow' as const, desc: '文字超出气泡右侧边框', suggestion: '调整字号或缩小字间距' },
    { type: 'font_inconsistency' as const, desc: '该页使用了与其他页面不同的字体', suggestion: '统一使用"华文楷体"，字号14号' },
    { type: 'translation_issue' as const, desc: '"可恶"翻译为"可恶"不够口语化', suggestion: '建议改为"该死"' },
    { type: 'typesetting_issue' as const, desc: '文字没有居中对齐', suggestion: '调整文字位置至气泡中心' },
    { type: 'specification_issue' as const, desc: '拟声词没有使用指定的特效字体', suggestion: '使用"华文琥珀"并添加描边效果' },
  ];

  const statuses: Array<'open' | 'revising' | 'resolved' | 'verified'> = ['open', 'open', 'revising', 'resolved', 'verified'];

  for (let i = 0; i < 5; i++) {
    const template = issueTemplates[i % issueTemplates.length];
    const pageIndex = Math.floor(Math.random() * pageCount);
    const x = 100 + Math.floor(Math.random() * 500);
    const y = 100 + Math.floor(Math.random() * 800);
    const status = statuses[i];
    
    const versions: IssueVersion[] = [
      {
        version: 1,
        issueId: `${chapterId}-issue-${i}`,
        uploadedBy: 'u2',
        uploadedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'open',
        note: '问题创建'
      }
    ];

    if (status !== 'open') {
      versions.push({
        version: 2,
        issueId: `${chapterId}-issue-${i}`,
        imageUrl: generateComicImage('translated', parseInt(chapterId.split('-')[1] || '1'), pageIndex, `${chapterId}-issue-${i}-v2`),
        uploadedBy: 'u5',
        uploadedAt: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: status === 'verified' ? 'resolved' : status,
        note: '已按照建议修改完成'
      });
    }

    issues.push({
      id: `${chapterId}-issue-${i}`,
      chapterId,
      pageIndex,
      type: template.type,
      annotation: {
        id: `${chapterId}-anno-${i}`,
        x,
        y,
        width: 100 + Math.floor(Math.random() * 150),
        height: 60 + Math.floor(Math.random() * 80),
        pageIndex
      },
      description: template.desc,
      suggestion: template.suggestion,
      status,
      createdAt: versions[0].uploadedAt,
      createdBy: 'u2',
      assignee: 'u5',
      resolvedAt: status === 'resolved' || status === 'verified' ? versions[versions.length - 1].uploadedAt : undefined,
      resolvedBy: status === 'resolved' || status === 'verified' ? 'u5' : undefined,
      resolutionNote: status === 'resolved' || status === 'verified' ? '已按照建议修改完成' : undefined,
      currentVersion: versions.length,
      versions
    });
  }
  return issues;
};

export const mockChapters: Chapter[] = [
  {
    id: 'ch-1',
    title: '命运的相遇',
    chapterNumber: 1,
    volume: 1,
    totalPages: 32,
    status: 'reviewing',
    pages: generatePages('ch-1', 32),
    translator: '陈静',
    letterer: '刘伟',
    reviewer: '李华',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    issues: createMockIssues('ch-1', 32),
    currentVersion: 2
  },
  {
    id: 'ch-2',
    title: '初次交锋',
    chapterNumber: 2,
    volume: 1,
    totalPages: 28,
    status: 'pending',
    pages: generatePages('ch-2', 28),
    translator: '陈静',
    letterer: '赵强',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    issues: [],
    currentVersion: 1
  },
  {
    id: 'ch-3',
    title: '神秘的邀请函',
    chapterNumber: 3,
    volume: 1,
    totalPages: 36,
    status: 'revising',
    pages: generatePages('ch-3', 36),
    translator: '陈静',
    letterer: '刘伟',
    reviewer: '王芳',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    issues: createMockIssues('ch-3', 36),
    currentVersion: 1
  },
  {
    id: 'ch-4',
    title: '决战前夕',
    chapterNumber: 4,
    volume: 1,
    totalPages: 30,
    status: 'approved',
    pages: generatePages('ch-4', 30),
    translator: '陈静',
    letterer: '赵强',
    reviewer: '李华',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    issues: createMockIssues('ch-4', 30).map(i => ({ ...i, status: 'verified' as const })),
    currentVersion: 2
  },
  {
    id: 'ch-5',
    title: '觉醒的力量',
    chapterNumber: 5,
    volume: 1,
    totalPages: 34,
    status: 'pending',
    pages: generatePages('ch-5', 34),
    translator: '陈静',
    letterer: '刘伟',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    issues: [],
    currentVersion: 1
  },
  {
    id: 'ch-6',
    title: '各自的决心',
    chapterNumber: 6,
    volume: 2,
    totalPages: 29,
    status: 'reviewing',
    pages: generatePages('ch-6', 29),
    translator: '陈静',
    letterer: '赵强',
    reviewer: '王芳',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    deadline: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
    issues: createMockIssues('ch-6', 29).slice(0, 3),
    currentVersion: 1
  }
];

export const generateMockLogs = (chapters: Chapter[]): OperationLog[] => {
  const logs: OperationLog[] = [];
  
  chapters.forEach(chapter => {
    logs.push({
      id: `log-${chapter.id}-create`,
      timestamp: chapter.createdAt,
      action: 'chapter_status_changed',
      userId: 'u1',
      userName: '张明',
      userRole: 'project_manager',
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      details: {
        oldStatus: '创建',
        newStatus: 'pending',
        description: `创建了第${chapter.chapterNumber}话「${chapter.title}」`
      }
    });

    chapter.issues.forEach(issue => {
      logs.push({
        id: `log-${issue.id}-create`,
        timestamp: issue.createdAt,
        action: 'issue_created',
        userId: issue.createdBy,
        userName: issue.createdBy === 'u2' ? '李华' : '王芳',
        userRole: 'reviewer',
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        issueId: issue.id,
        pageIndex: issue.pageIndex,
        details: {
          description: issue.description,
          issueType: issue.type,
          note: issue.suggestion
        }
      });

      issue.versions.slice(1).forEach((version, idx) => {
        logs.push({
          id: `log-${issue.id}-v${version.version}`,
          timestamp: version.uploadedAt,
          action: 'version_uploaded',
          userId: version.uploadedBy,
          userName: version.uploadedBy === 'u5' ? '刘伟' : '赵强',
          userRole: 'letterer',
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          issueId: issue.id,
          pageIndex: issue.pageIndex,
          details: {
            version: version.version,
            description: version.note,
            oldStatus: idx === 0 ? 'open' : issue.versions[idx].status,
            newStatus: version.status
          }
        });
      });

      if (issue.status === 'verified') {
        logs.push({
          id: `log-${issue.id}-verify`,
          timestamp: new Date(Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000).toISOString(),
          action: 'issue_verified',
          userId: 'u2',
          userName: '李华',
          userRole: 'reviewer',
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          issueId: issue.id,
          pageIndex: issue.pageIndex,
          details: {
            description: '验证通过，修改效果良好',
            oldStatus: 'resolved',
            newStatus: 'verified'
          }
        });
      }
    });

    if (chapter.status === 'approved') {
      logs.push({
        id: `log-${chapter.id}-approve`,
        timestamp: chapter.updatedAt,
        action: 'chapter_status_changed',
        userId: chapter.reviewer === '李华' ? 'u2' : 'u3',
        userName: chapter.reviewer || '审稿人',
        userRole: 'reviewer',
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        details: {
          oldStatus: 'reviewing',
          newStatus: 'approved',
          description: '章节审核通过，所有问题已验证'
        }
      });
    }

    if (chapter.status === 'revising') {
      logs.push({
        id: `log-${chapter.id}-revising`,
        timestamp: chapter.updatedAt,
        action: 'chapter_status_changed',
        userId: chapter.reviewer === '李华' ? 'u2' : 'u3',
        userName: chapter.reviewer || '审稿人',
        userRole: 'reviewer',
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        details: {
          oldStatus: 'reviewing',
          newStatus: 'revising',
          description: '发现问题，发送返修'
        }
      });
    }
  });

  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const getCurrentUser = (): User => mockUsers[1];

export const getIssueTypeLabel = (type: string): string => {
  const config: Record<string, string> = {
    missing_translation: '漏翻',
    character_obscured: '遮挡人物',
    bubble_overflow: '气泡外溢',
    font_inconsistency: '字体风格不统一',
    translation_issue: '翻译表达问题',
    typesetting_issue: '嵌字排版问题',
    specification_issue: '规范理解问题',
    other: '其他问题'
  };
  return config[type] || type;
};

export const getIssueTypeColor = (type: string): string => {
  const config: Record<string, string> = {
    missing_translation: '#ef4444',
    character_obscured: '#f97316',
    bubble_overflow: '#eab308',
    font_inconsistency: '#8b5cf6',
    translation_issue: '#3b82f6',
    typesetting_issue: '#14b8a6',
    specification_issue: '#ec4899',
    other: '#64748b'
  };
  return config[type] || '#64748b';
};

export const getLogActionLabel = (action: string): string => {
  const config: Record<string, string> = {
    issue_created: '创建问题',
    issue_status_changed: '状态变更',
    version_uploaded: '上传修改版',
    issue_verified: '验证通过',
    issue_rejected: '打回修改',
    chapter_status_changed: '章节状态变更',
    issue_deleted: '删除问题',
    issue_updated: '更新问题'
  };
  return config[action] || action;
};

export const getLogActionColor = (action: string): string => {
  const config: Record<string, string> = {
    issue_created: '#ef4444',
    issue_status_changed: '#f59e0b',
    version_uploaded: '#3b82f6',
    issue_verified: '#10b981',
    issue_rejected: '#f97316',
    chapter_status_changed: '#8b5cf6',
    issue_deleted: '#dc2626',
    issue_updated: '#64748b'
  };
  return config[action] || '#64748b';
};

export const getUserNameById = (userId: string): string => {
  const user = mockUsers.find(u => u.id === userId);
  return user?.name || userId;
};

export const getUserRoleLabel = (role: string): string => {
  const config: Record<string, string> = {
    admin: '管理员',
    reviewer: '审稿人',
    translator: '翻译',
    letterer: '嵌字师',
    project_manager: '项目经理'
  };
  return config[role] || role;
};
