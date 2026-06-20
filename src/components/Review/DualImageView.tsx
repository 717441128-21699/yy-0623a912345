import { useRef, useEffect, useState, useCallback } from 'react';
import { Page, Issue } from '../../types';
import { getIssueTypeColor } from '../../data/mockData';
import AnnotationOverlay from './AnnotationOverlay';

interface DualImageViewProps {
  viewMode: 'dual' | 'original' | 'translated' | 'overlay';
  syncScroll: boolean;
  currentPage?: Page;
  zoomLevel: number;
  isAnnotating: boolean;
  issues: Issue[];
  activeIssueId: string | null;
  highlightIssueId: string | null;
  compareVersion: { left: number; right: number } | null;
  overlayOpacity: number;
  getVersionImage: (version: number) => string;
}

export default function DualImageView({
  viewMode,
  syncScroll,
  currentPage,
  zoomLevel,
  isAnnotating,
  issues,
  activeIssueId,
  highlightIssueId,
  compareVersion,
  overlayOpacity,
  getVersionImage
}: DualImageViewProps) {
  const originalRef = useRef<HTMLDivElement>(null);
  const translatedRef = useRef<HTMLDivElement>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState({ original: false, translated: false });
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    startX: number;
    startY: number;
    scrollLeft: number;
    scrollTop: number;
    target: 'original' | 'translated' | null;
  }>({
    isDragging: false,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0,
    target: null
  });

  const handleScroll = useCallback((source: 'original' | 'translated') => {
    if (!syncScroll || isAnnotating || isSyncing) return;

    setIsSyncing(true);
    const sourceEl = source === 'original' ? originalRef.current : translatedRef.current;
    const targetEl = source === 'original' ? translatedRef.current : originalRef.current;

    if (sourceEl && targetEl) {
      targetEl.scrollLeft = sourceEl.scrollLeft;
      targetEl.scrollTop = sourceEl.scrollTop;
    }

    requestAnimationFrame(() => setIsSyncing(false));
  }, [syncScroll, isAnnotating, isSyncing]);

  const handleMouseDown = useCallback((e: React.MouseEvent, target: 'original' | 'translated') => {
    if (isAnnotating) return;
    const el = target === 'original' ? originalRef.current : translatedRef.current;
    if (!el) return;

    e.preventDefault();
    setDragState({
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      scrollLeft: el.scrollLeft,
      scrollTop: el.scrollTop,
      target
    });
  }, [isAnnotating]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState.isDragging || isAnnotating) return;

    const el = dragState.target === 'original' ? originalRef.current : translatedRef.current;
    if (!el) return;

    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;

    el.scrollLeft = dragState.scrollLeft - dx;
    el.scrollTop = dragState.scrollTop - dy;

    if (syncScroll) {
      const otherEl = dragState.target === 'original' ? translatedRef.current : originalRef.current;
      if (otherEl) {
        otherEl.scrollLeft = dragState.scrollLeft - dx;
        otherEl.scrollTop = dragState.scrollTop - dy;
      }
    }
  }, [dragState, isAnnotating, syncScroll]);

  const handleMouseUp = useCallback(() => {
    setDragState(prev => ({ ...prev, isDragging: false, target: null }));
  }, []);

  const handleMouseLeave = useCallback(() => {
    setDragState(prev => ({ ...prev, isDragging: false, target: null }));
  }, []);

  useEffect(() => {
    setImageLoaded({ original: false, translated: false });
  }, [currentPage, compareVersion, viewMode]);

  if (!currentPage) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-200 rounded-xl">
        <p className="text-gray-500">页面加载中...</p>
      </div>
    );
  }

  const getLeftImage = () => {
    if (compareVersion) {
      return getVersionImage(compareVersion.left);
    }
    return currentPage.originalImage;
  };

  const getRightImage = () => {
    if (compareVersion) {
      return getVersionImage(compareVersion.right);
    }
    return currentPage.translatedImage;
  };

  const getLeftLabel = () => {
    if (compareVersion) {
      return `版本 V${compareVersion.left}`;
    }
    return '日文原图 JP';
  };

  const getRightLabel = () => {
    if (compareVersion) {
      return `版本 V${compareVersion.right}`;
    }
    return '中文嵌字 CN';
  };

  const ImageContainer = ({ 
    type, 
    imageSrc, 
    label, 
    showAnnotations = false,
    labelColor = 'gray'
  }: { 
    type: 'original' | 'translated'; 
    imageSrc: string; 
    label: string;
    showAnnotations?: boolean;
    labelColor?: 'red' | 'green' | 'gray' | 'primary' | 'amber';
  }) => {
    const ref = type === 'original' ? originalRef : translatedRef;
    const colorMap = {
      red: { border: 'border-red-200', bg: 'bg-red-50', label: 'text-red-700 bg-red-100' },
      green: { border: 'border-green-200', bg: 'bg-green-50', label: 'text-green-700 bg-green-100' },
      gray: { border: 'border-gray-200', bg: 'bg-gray-50', label: 'text-gray-700 bg-gray-100' },
      primary: { border: 'border-primary-200', bg: 'bg-primary-50', label: 'text-primary-700 bg-primary-100' },
      amber: { border: 'border-amber-200', bg: 'bg-amber-50', label: 'text-amber-700 bg-amber-100' }
    };
    const colors = colorMap[labelColor];

    return (
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${colors.label}`}>
            {label}
          </span>
          {!imageLoaded[type] && (
            <span className="text-xs text-gray-400">加载中...</span>
          )}
        </div>
        <div
          ref={ref}
          className={`flex-1 overflow-auto ${colors.bg} ${colors.border} border relative ${
            isAnnotating ? 'canvas-annotate' : dragState.isDragging ? 'canvas-view' : ''
          }`}
          onScroll={() => handleScroll(type)}
          onMouseDown={(e) => handleMouseDown(e, type)}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          style={{ cursor: isAnnotating ? 'crosshair' : dragState.isDragging ? 'grabbing' : 'grab' }}
        >
          <div className="relative" style={{ minWidth: '100%', minHeight: '100%' }}>
            <img
              src={imageSrc}
              alt={label}
              className={`block select-none ${!imageLoaded[type] ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}`}
              style={{
                width: currentPage.width * (zoomLevel / 100),
                height: currentPage.height * (zoomLevel / 100),
                maxWidth: 'none'
              }}
              draggable={false}
              onLoad={() => setImageLoaded(prev => ({ ...prev, [type]: true }))}
            />
            
            {showAnnotations && (
              <AnnotationOverlay
                issues={issues}
                activeIssueId={activeIssueId}
                highlightIssueId={highlightIssueId}
                zoomLevel={zoomLevel}
                isAnnotating={isAnnotating}
                pageWidth={currentPage.width}
                pageHeight={currentPage.height}
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  const OverlayView = () => {
    const bottomImage = getVersionImage(1);
    const topImage = getVersionImage(currentPage.versions.length);
    
    return (
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
          <span className="text-xs font-semibold px-2 py-1 rounded-full text-primary-700 bg-primary-100">
            叠加对比 - V1 (底层) / V{currentPage.versions.length} (顶层)
          </span>
          <span className="text-xs text-gray-500">
            不透明度: {overlayOpacity}%
          </span>
        </div>
        <div
          ref={translatedRef}
          className={`flex-1 overflow-auto bg-gray-50 border border-primary-200 relative ${
            isAnnotating ? 'canvas-annotate' : dragState.isDragging ? 'canvas-view' : ''
          }`}
          onMouseDown={(e) => handleMouseDown(e, 'translated')}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          style={{ cursor: isAnnotating ? 'crosshair' : dragState.isDragging ? 'grabbing' : 'grab' }}
        >
          <div className="relative" style={{ minWidth: '100%', minHeight: '100%' }}>
            <img
              src={bottomImage}
              alt="底层版本"
              className="block select-none absolute top-0 left-0"
              style={{
                width: currentPage.width * (zoomLevel / 100),
                height: currentPage.height * (zoomLevel / 100),
                maxWidth: 'none'
              }}
              draggable={false}
            />
            <img
              src={topImage}
              alt="顶层版本"
              className="block select-none absolute top-0 left-0 transition-opacity"
              style={{
                width: currentPage.width * (zoomLevel / 100),
                height: currentPage.height * (zoomLevel / 100),
                maxWidth: 'none',
                opacity: overlayOpacity / 100
              }}
              draggable={false}
              onLoad={() => setImageLoaded(prev => ({ ...prev, translated: true }))}
            />
            
            <AnnotationOverlay
              issues={issues}
              activeIssueId={activeIssueId}
              highlightIssueId={highlightIssueId}
              zoomLevel={zoomLevel}
              isAnnotating={isAnnotating}
              pageWidth={currentPage.width}
              pageHeight={currentPage.height}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className={`flex-1 flex gap-4 p-4 ${viewMode === 'dual' ? '' : 'hidden'}`}>
        <ImageContainer 
          type="original" 
          imageSrc={getLeftImage()} 
          label={getLeftLabel()}
          labelColor={compareVersion ? 'gray' : 'red'}
        />
        <div className="w-px bg-gray-200"></div>
        <ImageContainer 
          type="translated" 
          imageSrc={getRightImage()} 
          label={getRightLabel()}
          showAnnotations={true}
          labelColor={compareVersion ? 'primary' : 'green'}
        />
      </div>

      <div className={`flex-1 flex ${viewMode === 'original' ? '' : 'hidden'}`}>
        <ImageContainer 
          type="original" 
          imageSrc={currentPage.originalImage} 
          label="日文原图 JP"
          labelColor="red"
        />
      </div>

      <div className={`flex-1 flex ${viewMode === 'translated' ? '' : 'hidden'}`}>
        <ImageContainer 
          type="translated" 
          imageSrc={currentPage.translatedImage} 
          label="中文嵌字 CN"
          showAnnotations={true}
          labelColor="green"
        />
      </div>

      <div className={`flex-1 flex ${viewMode === 'overlay' ? '' : 'hidden'}`}>
        <OverlayView />
      </div>

      {issues.length > 0 && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            本页问题：
            {issues.map((issue, idx) => (
              <span
                key={issue.id}
                className={`inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                  highlightIssueId === issue.id ? 'ring-2 ring-primary-500 ring-offset-1' : ''
                }`}
                style={{
                  backgroundColor: getIssueTypeColor(issue.type) + '20',
                  color: getIssueTypeColor(issue.type)
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: getIssueTypeColor(issue.type) }}
                ></span>
                {idx + 1}. {issue.type === 'missing_translation' ? '漏翻' :
                 issue.type === 'character_obscured' ? '遮挡人物' :
                 issue.type === 'bubble_overflow' ? '气泡外溢' :
                 issue.type === 'font_inconsistency' ? '字体不统一' :
                 issue.type === 'translation_issue' ? '翻译问题' :
                 issue.type === 'typesetting_issue' ? '排版问题' :
                 issue.type === 'specification_issue' ? '规范问题' : '其他'}
              </span>
            ))}
          </p>
        </div>
      )}
    </div>
  );
}
