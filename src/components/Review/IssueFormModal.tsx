import { useState, useRef, useEffect } from 'react';
import { X, Send, MousePointer2, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ISSUE_TYPE_CONFIGS, IssueType, Annotation } from '../../types';

interface IssueFormModalProps {
  onClose: () => void;
  pageIndex: number;
  chapterId: string;
}

export default function IssueFormModal({ onClose, pageIndex, chapterId }: IssueFormModalProps) {
  const { createIssue, state } = useApp();
  const [issueType, setIssueType] = useState<IssueType | ''>('');
  const [description, setDescription] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [annotation, setAnnotation] = useState<Annotation | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLImageElement>(null);

  const chapter = state.chapters.find(ch => ch.id === chapterId);
  const currentPage = chapter?.pages[pageIndex];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!previewRef.current) return;
    
    const rect = previewRef.current.getBoundingClientRect();
    const scale = currentPage ? (currentPage.width * (state.zoomLevel / 100)) / rect.width : 1;
    
    const x = (e.clientX - rect.left) * scale;
    const y = (e.clientY - rect.top) * scale;
    
    setIsDrawing(true);
    setDrawStart({ x, y });
    setCurrentRect({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !drawStart || !previewRef.current) return;

    const rect = previewRef.current.getBoundingClientRect();
    const scale = currentPage ? (currentPage.width * (state.zoomLevel / 100)) / rect.width : 1;
    
    const currentX = (e.clientX - rect.left) * scale;
    const currentY = (e.clientY - rect.top) * scale;

    const x = Math.min(drawStart.x, currentX);
    const y = Math.min(drawStart.y, currentY);
    const width = Math.abs(currentX - drawStart.x);
    const height = Math.abs(currentY - drawStart.y);

    setCurrentRect({ x, y, width, height });
  };

  const handleMouseUp = () => {
    if (isDrawing && currentRect && currentRect.width > 10 && currentRect.height > 10) {
      setAnnotation({
        id: `anno-${Date.now()}`,
        x: currentRect.x,
        y: currentRect.y,
        width: currentRect.width,
        height: currentRect.height,
        pageIndex
      });
    }
    setIsDrawing(false);
    setDrawStart(null);
    setCurrentRect(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueType || !annotation || !description.trim()) return;

    createIssue(
      chapterId,
      pageIndex,
      issueType,
      annotation,
      description.trim(),
      suggestion.trim()
    );
    onClose();
  };

  const selectedIssueConfig = ISSUE_TYPE_CONFIGS.find(c => c.value === issueType);

  if (!currentPage) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">添加问题记录</h3>
              <p className="text-sm text-gray-500">第 {pageIndex + 1} 页</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MousePointer2 className="w-4 h-4 inline mr-1" />
                区域选择
              </label>
              <div
                className="relative bg-gray-100 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 hover:border-primary-400 transition-colors"
                style={{ height: '400px' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <img
                  ref={previewRef}
                  src={currentPage.translatedImage}
                  alt="预览"
                  className="w-full h-full object-contain"
                  style={{ cursor: 'crosshair' }}
                />
                
                {currentRect && (
                  <div
                    className="absolute border-2 border-dashed border-red-500 bg-red-500/20 pointer-events-none"
                    style={{
                      left: `${(currentRect.x / (currentPage.width * (state.zoomLevel / 100))) * 100}%`,
                      top: `${(currentRect.y / (currentPage.height * (state.zoomLevel / 100))) * 100}%`,
                      width: `${(currentRect.width / (currentPage.width * (state.zoomLevel / 100))) * 100}%`,
                      height: `${(currentRect.height / (currentPage.height * (state.zoomLevel / 100))) * 100}%`
                    }}
                  />
                )}

                {annotation && (
                  <div
                    className="absolute border-3 border-primary-500 bg-primary-500/20 pointer-events-none"
                    style={{
                      left: `${(annotation.x / (currentPage.width * (state.zoomLevel / 100))) * 100}%`,
                      top: `${(annotation.y / (currentPage.height * (state.zoomLevel / 100))) * 100}%`,
                      width: `${(annotation.width / (currentPage.width * (state.zoomLevel / 100))) * 100}%`,
                      height: `${(annotation.height / (currentPage.height * (state.zoomLevel / 100))) * 100}%`,
                      borderWidth: '3px'
                    }}
                  >
                    <div className="absolute -top-6 left-0 bg-primary-500 text-white text-xs px-2 py-0.5 rounded">
                      已选择区域
                    </div>
                  </div>
                )}

                {!annotation && !isDrawing && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-white/90 rounded-lg px-4 py-2 text-sm text-gray-600 shadow-lg">
                      点击并拖动鼠标框选问题区域
                    </div>
                  </div>
                )}
              </div>
              
              {annotation && (
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    位置: ({Math.round(annotation.x)}, {Math.round(annotation.y)}) 
                    大小: {Math.round(annotation.width)} × {Math.round(annotation.height)}
                  </span>
                  <button
                    onClick={() => setAnnotation(null)}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    重新选择
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  问题类型 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ISSUE_TYPE_CONFIGS.map((config) => (
                    <button
                      key={config.value}
                      type="button"
                      onClick={() => setIssueType(config.value)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        issueType === config.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: config.color }}
                        ></span>
                        <span className="text-sm font-medium text-gray-900">{config.label}</span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2">{config.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {selectedIssueConfig && (
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-700">问题分类:</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
                      {selectedIssueConfig.category === 'translation' ? '翻译类' :
                       selectedIssueConfig.category === 'typesetting' ? '排版类' :
                       selectedIssueConfig.category === 'specification' ? '规范类' : '其他'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{selectedIssueConfig.description}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  问题描述 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="请详细描述发现的问题..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  修改建议
                </label>
                <textarea
                  value={suggestion}
                  onChange={(e) => setSuggestion(e.target.value)}
                  placeholder="请提供具体的修改建议（可选）..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!issueType || !annotation || !description.trim()}
            className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
            提交问题
          </button>
        </div>
      </div>
    </div>
  );
}
