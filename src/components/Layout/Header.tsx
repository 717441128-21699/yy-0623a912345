import { BookOpen, Bell, Settings, User, BarChart3, ListTodo } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface HeaderProps {
  currentView: 'chapters' | 'review' | 'issues' | 'statistics';
  onViewChange: (view: 'chapters' | 'review' | 'issues' | 'statistics') => void;
}

export default function Header({ currentView, onViewChange }: HeaderProps) {
  const { state } = useApp();

  const navItems = [
    { id: 'chapters', label: '章节列表', icon: ListTodo },
    { id: 'issues', label: '返修管理', icon: BookOpen },
    { id: 'statistics', label: '统计分析', icon: BarChart3 },
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">漫画审稿平台</h1>
            <p className="text-xs text-gray-500">专业汉化质量复核系统</p>
          </div>
        </div>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                currentView === item.id
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <Settings className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{state.currentUser.name}</p>
              <p className="text-xs text-gray-500">
                {state.currentUser.role === 'reviewer' ? '审稿人' :
                 state.currentUser.role === 'project_manager' ? '项目经理' :
                 state.currentUser.role === 'translator' ? '翻译' :
                 state.currentUser.role === 'letterer' ? '嵌字师' : '管理员'}
              </p>
            </div>
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
