import { Chapter, User, Issue, Page } from '../types';

const generateComicImage = (type: 'original' | 'translated', chapter: number, page: number, seed: string) => {
  const text = type === 'original' ? 'JP' : 'CN';
  const bgColor = type === 'original' ? 'ffd4e5' : 'e8f5e9';
  const textColor = type === 'original' ? 'c2185b' : '2e7d32';
  return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=manga%20comic%20page%20${text}%20style%20chapter%20${chapter}%20page%20${page}%2C%20${seed}&image_size=portrait_4_3`;
};

const generatePages = (chapterId: string, count: number): Page[] => {
  const chapterNum = parseInt(chapterId.split('-')[1] || '1');
  return Array.from({ length: count }, (_, i) => ({
    index: i,
    originalImage: generateComicImage('original', chapterNum, i, `${chapterId}-orig-${i}`),
    translatedImage: generateComicImage('translated', chapterNum, i, `${chapterId}-trans-${i}`),
    width: 800,
    height: 1132
  }));
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

  for (let i = 0; i < 5; i++) {
    const template = issueTemplates[i % issueTemplates.length];
    const pageIndex = Math.floor(Math.random() * pageCount);
    const x = 100 + Math.floor(Math.random() * 500);
    const y = 100 + Math.floor(Math.random() * 800);
    
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
      status: ['open', 'open', 'revising', 'resolved', 'verified'][i] as any,
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: 'u2',
      assignee: 'u5',
      resolvedAt: i >= 3 ? new Date().toISOString() : undefined,
      resolvedBy: i >= 3 ? 'u5' : undefined,
      resolutionNote: i >= 3 ? '已按照建议修改完成' : undefined,
      version: 1
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
    currentVersion: 3
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
