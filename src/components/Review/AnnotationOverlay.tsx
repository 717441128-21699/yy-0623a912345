import { Issue } from '../../types';
import { getIssueTypeColor } from '../../data/mockData';
import { useApp } from '../../context/AppContext';

interface AnnotationOverlayProps {
  issues: Issue[];
  activeIssueId: string | null;
  highlightIssueId: string | null;
  zoomLevel: number;
  isAnnotating: boolean;
  pageWidth: number;
  pageHeight: number;
}

export default function AnnotationOverlay({
  issues,
  activeIssueId,
  highlightIssueId,
  zoomLevel,
  isAnnotating,
  pageWidth,
  pageHeight
}: AnnotationOverlayProps) {
  const { dispatch } = useApp();
  const scale = zoomLevel / 100;

  const handleIssueClick = (issueId: string) => {
    dispatch({ type: 'SET_ACTIVE_ISSUE', payload: issueId === activeIssueId ? null : issueId });
    dispatch({ type: 'SET_HIGHLIGHT_ISSUE', payload: issueId === highlightIssueId ? null : issueId });
  };

  return (
    <div
      className="absolute top-0 left-0 pointer-events-none"
      style={{
        width: pageWidth * scale,
        height: pageHeight * scale,
        pointerEvents: isAnnotating ? 'auto' : 'auto'
      }}
    >
      {issues.map((issue, index) => {
        const isActive = issue.id === activeIssueId;
        const isHighlighted = issue.id === highlightIssueId;
        const color = getIssueTypeColor(issue.type);
        const { x, y, width, height } = issue.annotation;

        return (
          <div
            key={issue.id}
            className={`absolute rounded-lg cursor-pointer transition-all duration-200 pointer-events-auto ${
              isActive || isHighlighted ? 'z-20' : 'z-10'
            } ${isHighlighted ? 'animate-pulse' : ''}`}
            style={{
              left: x * scale,
              top: y * scale,
              width: width * scale,
              height: height * scale,
              border: `3px solid ${color}`,
              backgroundColor: isActive || isHighlighted ? `${color}40` : `${color}15`,
              boxShadow: isActive || isHighlighted 
                ? `0 0 0 4px ${color}50, 0 0 20px ${color}60, 0 8px 25px rgba(0,0,0,0.3)` 
                : 'none',
              transform: isActive || isHighlighted ? 'scale(1.05)' : 'scale(1)',
              animation: isHighlighted ? 'pulse 1.5s ease-in-out infinite' : 'none'
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleIssueClick(issue.id);
            }}
          >
            <div
              className="absolute -top-7 left-0 flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold text-white whitespace-nowrap"
              style={{ backgroundColor: color }}
            >
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                {index + 1}
              </span>
              {issue.type === 'missing_translation' ? '漏翻' :
               issue.type === 'character_obscured' ? '遮挡' :
               issue.type === 'bubble_overflow' ? '外溢' :
               issue.type === 'font_inconsistency' ? '字体' :
               issue.type === 'translation_issue' ? '翻译' :
               issue.type === 'typesetting_issue' ? '排版' :
               issue.type === 'specification_issue' ? '规范' : '其他'}
            </div>

            <div
              className="absolute top-1 right-1 w-3 h-3 rounded-full border-2 border-white"
              style={{ backgroundColor: color }}
            ></div>

            {isActive && (
              <>
                <div className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-white border-2" style={{ borderColor: color }}></div>
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white border-2" style={{ borderColor: color }}></div>
                <div className="absolute -bottom-1 -left-1 w-4 h-4 rounded-full bg-white border-2" style={{ borderColor: color }}></div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white border-2" style={{ borderColor: color }}></div>
              </>
            )}

            {!isActive && (
              <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity">
                <div className="absolute bottom-1 left-1 right-1 bg-black/70 text-white text-[10px] p-1 rounded truncate">
                  {issue.description}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {isAnnotating && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg animate-pulse">
            点击并拖动鼠标在画面上圈选问题区域
          </div>
        </div>
      )}
    </div>
  );
}
