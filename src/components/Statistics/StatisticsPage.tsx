import { useState } from 'react';
import { 
  BarChart3, PieChart, TrendingUp, AlertTriangle, 
  CheckCircle2, Clock, XCircle, Filter, Download,
  BookOpen, Users, FileText, Target, ChevronDown
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ISSUE_TYPE_CONFIGS } from '../../types';
import { getIssueTypeLabel, getIssueTypeColor } from '../../data/mockData';

export default function StatisticsPage() {
  const { state } = useApp();
  const [selectedChapter, setSelectedChapter] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const allIssues = state.chapters.flatMap(ch => ch.issues);
  
  const filteredIssues = allIssues.filter(issue => {
    const matchesChapter = selectedChapter === 'all' || issue.chapterId === selectedChapter;
    const config = ISSUE_TYPE_CONFIGS.find(c => c.value === issue.type);
    const matchesCategory = selectedCategory === 'all' || config?.category === selectedCategory;
    return matchesChapter && matchesCategory;
  });

  const issueTypeStats = ISSUE_TYPE_CONFIGS.map(config => {
    const count = filteredIssues.filter(i => i.type === config.value).length;
    return {
      ...config,
      count,
      percentage: filteredIssues.length > 0 ? (count / filteredIssues.length) * 100 : 0
    };
  }).sort((a, b) => b.count - a.count);

  const categoryStats = [
    { id: 'translation', label: '翻译类', description: '漏翻、翻译表达问题', color: '#3b82f6' },
    { id: 'typesetting', label: '排版类', description: '遮挡人物、气泡外溢、排版问题', color: '#f97316' },
    { id: 'specification', label: '规范类', description: '字体不统一、规范理解问题', color: '#8b5cf6' },
    { id: 'other', label: '其他', description: '其他问题', color: '#64748b' },
  ].map(cat => {
    const count = filteredIssues.filter(i => {
      const config = ISSUE_TYPE_CONFIGS.find(c => c.value === i.type);
      return config?.category === cat.id;
    }).length;
    return {
      ...cat,
      count,
      percentage: filteredIssues.length > 0 ? (count / filteredIssues.length) * 100 : 0
    };
  });

  const statusStats = [
    { status: 'open', label: '待处理', count: filteredIssues.filter(i => i.status === 'open').length, color: '#ef4444' },
    { status: 'revising', label: '修改中', count: filteredIssues.filter(i => i.status === 'revising').length, color: '#f59e0b' },
    { status: 'resolved', label: '已修改', count: filteredIssues.filter(i => i.status === 'resolved').length, color: '#3b82f6' },
    { status: 'verified', label: '已验证', count: filteredIssues.filter(i => i.status === 'verified').length, color: '#10b981' },
  ];

  const chapterStats = state.chapters.map(chapter => {
    const issues = chapter.issues;
    const byCategory = {
      translation: issues.filter(i => ['missing_translation', 'translation_issue'].includes(i.type)).length,
      typesetting: issues.filter(i => ['character_obscured', 'bubble_overflow', 'typesetting_issue'].includes(i.type)).length,
      specification: issues.filter(i => ['font_inconsistency', 'specification_issue'].includes(i.type)).length,
      other: issues.filter(i => i.type === 'other').length,
    };
    return {
      ...chapter,
      issueCount: issues.length,
      byCategory,
      resolvedRate: issues.length > 0 
        ? (issues.filter(i => i.status === 'verified' || i.status === 'resolved').length / issues.length) * 100 
        : 0
    };
  }).sort((a, b) => a.chapterNumber - b.chapterNumber);

  const overallStats = {
    totalChapters: state.chapters.length,
    totalIssues: allIssues.length,
    averageIssuesPerChapter: state.chapters.length > 0 ? (allIssues.length / state.chapters.length).toFixed(1) : '0',
    resolutionRate: allIssues.length > 0 
      ? ((allIssues.filter(i => i.status === 'verified' || i.status === 'resolved').length / allIssues.length) * 100).toFixed(1)
      : '0',
    pendingCount: allIssues.filter(i => i.status === 'open' || i.status === 'revising').length,
  };

  const getTopIssueType = () => {
    const sorted = [...issueTypeStats].sort((a, b) => b.count - a.count);
    return sorted[0] || null;
  };

  const getCategoryInsight = (categoryId: string) => {
    const category = categoryStats.find(c => c.id === categoryId);
    if (!category || category.percentage < 30) return null;
    
    const insights: Record<string, string> = {
      translation: '翻译类问题占比较高，建议加强翻译质量把控或提供更详细的术语表。',
      typesetting: '排版类问题较多，可能需要重新审视嵌字规范或增加排版培训。',
      specification: '规范类问题突出，建议组织规范培训并制作明确的样式指南。',
      other: '其他问题较多，建议收集具体案例进行分类整理。'
    };
    return insights[categoryId];
  };

  const topIssue = getTopIssueType();
  const highRiskCategories = categoryStats.filter(c => c.percentage >= 30);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">统计分析</h2>
        <p className="text-gray-600">按问题类型统计一话中常见错误，分析问题根源</p>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={selectedChapter}
            onChange={(e) => setSelectedChapter(e.target.value)}
            className="border border-gray-300 rounded-lg text-sm px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">全部章节</option>
            {state.chapters.map(ch => (
              <option key={ch.id} value={ch.id}>
                第{ch.chapterNumber}话 {ch.title}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-gray-300 rounded-lg text-sm px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">全部分类</option>
            {categoryStats.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors ml-auto">
          <Download className="w-4 h-4" />
          导出报告
        </button>
      </div>

      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">总章节数</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{overallStats.totalChapters}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-sm text-gray-500">总问题数</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{overallStats.totalIssues}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-sm text-gray-500">平均每话问题</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{overallStats.averageIssuesPerChapter}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm text-gray-500">解决率</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{overallStats.resolutionRate}%</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-sm text-gray-500">待处理</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{overallStats.pendingCount}</p>
        </div>
      </div>

      {highRiskCategories.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-800 mb-2">风险提示</h4>
              {highRiskCategories.map(cat => {
                const insight = getCategoryInsight(cat.id);
                return insight ? (
                  <p key={cat.id} className="text-sm text-amber-700 mb-1">
                    <span className="font-medium">{cat.label}（{cat.percentage.toFixed(0)}%）：</span>
                    {insight}
                  </p>
                ) : null;
              })}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary-600" />
              问题分类占比
            </h3>
          </div>
          <div className="space-y-4">
            {categoryStats.map((cat) => (
              <div key={cat.id}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    ></span>
                    <span className="text-sm font-medium text-gray-700">{cat.label}</span>
                    <span className="text-xs text-gray-400">({cat.description})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">{cat.count}</span>
                    <span className="text-xs text-gray-500">({cat.percentage.toFixed(1)}%)</span>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${cat.percentage}%`,
                      backgroundColor: cat.color
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-600" />
              问题类型分布
            </h3>
          </div>
          <div className="space-y-3">
            {issueTypeStats.filter(s => s.count > 0).map((stat) => (
              <div key={stat.value} className="flex items-center gap-3">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: stat.color }}
                ></span>
                <span className="text-sm text-gray-700 w-24 flex-shrink-0">{stat.label}</span>
                <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden relative">
                  <div
                    className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                    style={{
                      width: `${Math.max(stat.percentage, 5)}%`,
                      backgroundColor: stat.color + '30',
                      border: `2px solid ${stat.color}`
                    }}
                  >
                    <span className="text-xs font-bold" style={{ color: stat.color }}>
                      {stat.count}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-gray-500 w-14 text-right">
                  {stat.percentage.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
          {topIssue && (
            <div className="mt-4 p-3 bg-primary-50 rounded-lg border border-primary-100">
              <p className="text-sm text-primary-700">
                <span className="font-semibold">最常见问题：</span>
                {topIssue.label}（{topIssue.count}次，{topIssue.percentage.toFixed(1)}%）
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-600" />
            各章节问题统计
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">章节</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">总问题</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    翻译类
                  </span>
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                    排版类
                  </span>
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    规范类
                  </span>
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">解决率</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">状态</th>
              </tr>
            </thead>
            <tbody>
              {chapterStats.map((ch) => (
                <tr key={ch.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">第{ch.chapterNumber}话 {ch.title}</p>
                      <p className="text-xs text-gray-500">
                        翻译: {ch.translator} / 嵌字: {ch.letterer}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-bold text-gray-900">{ch.issueCount}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-blue-600 font-medium">{ch.byCategory.translation}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-orange-600 font-medium">{ch.byCategory.typesetting}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-purple-600 font-medium">{ch.byCategory.specification}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${ch.resolvedRate}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-700">{ch.resolvedRate.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      ch.status === 'approved' ? 'bg-green-100 text-green-700' :
                      ch.status === 'revising' ? 'bg-red-100 text-red-700' :
                      ch.status === 'reviewing' ? 'bg-blue-100 text-blue-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {ch.status === 'approved' ? '已通过' :
                       ch.status === 'revising' ? '返修中' :
                       ch.status === 'reviewing' ? '审稿中' : '待审稿'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-600" />
            人员问题分布
          </h3>
          <div className="space-y-4">
            {['陈静', '刘伟', '赵强'].map((name, idx) => {
              const personIssues = allIssues.filter(i => {
                const chapter = state.chapters.find(c => c.id === i.chapterId);
                return chapter && (chapter.translator === name || chapter.letterer === name);
              });
              const role = idx === 0 ? '翻译' : '嵌字师';
              const issueCount = personIssues.length;
              const avgPerChapter = issueCount / state.chapters.filter(c => 
                c.translator === name || c.letterer === name
              ).length || 0;

              return (
                <div key={name} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-bold">{name[0]}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{name}</span>
                      <span className="text-xs text-gray-500">({role})</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      负责章节: {state.chapters.filter(c => c.translator === name || c.letterer === name).length} 话
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">{issueCount}</p>
                    <p className="text-xs text-gray-500">总问题 / 平均 {avgPerChapter.toFixed(1)}/话</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary-600" />
            问题状态分布
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {statusStats.map((stat) => (
              <div
                key={stat.status}
                className="p-4 rounded-xl border-2 transition-all hover:shadow-md"
                style={{
                  backgroundColor: stat.color + '10',
                  borderColor: stat.color + '40'
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  {stat.status === 'open' && <XCircle className="w-5 h-5" style={{ color: stat.color }} />}
                  {stat.status === 'revising' && <Clock className="w-5 h-5" style={{ color: stat.color }} />}
                  {stat.status === 'resolved' && <CheckCircle2 className="w-5 h-5" style={{ color: stat.color }} />}
                  {stat.status === 'verified' && <CheckCircle2 className="w-5 h-5" style={{ color: stat.color }} />}
                  <span className="font-medium" style={{ color: stat.color }}>{stat.label}</span>
                </div>
                <p className="text-3xl font-bold" style={{ color: stat.color }}>{stat.count}</p>
                <p className="text-xs mt-1" style={{ color: stat.color + '80' }}>
                  {filteredIssues.length > 0 ? ((stat.count / filteredIssues.length) * 100).toFixed(1) : 0}%
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
