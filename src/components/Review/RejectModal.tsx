import { useState } from 'react';
import { X, XCircle, AlertCircle } from 'lucide-react';

interface RejectModalProps {
  onClose: () => void;
  onConfirm: (reason: string) => void;
  issueTitle: string;
  isBatch?: boolean;
}

const REJECT_REASONS = [
  '修改不到位，仍存在问题',
  '字体风格不统一',
  '气泡外溢',
  '翻译不准确',
  '排版有问题',
  '遮挡人物',
  '其他'
];

export default function RejectModal({ onClose, onConfirm, issueTitle, isBatch = false }: RejectModalProps) {
  const [reason, setReason] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const handlePresetClick = (preset: string) => {
    setSelectedPreset(preset);
    setReason(preset);
  };

  const handleConfirm = () => {
    if (!reason.trim()) return;
    onConfirm(reason.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {isBatch ? '批量打回修改' : '打回修改'}
              </h3>
              <p className="text-sm text-gray-500">
                {isBatch ? '请填写统一打回原因，所有选中问题将回到修改中' : '请填写打回原因，让嵌字师知道问题所在'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">
              <span className="text-gray-400 mr-2">问题:</span>
              {issueTitle}
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <AlertCircle className="w-3.5 h-3.5 inline mr-1 text-amber-500" />
              常用原因
            </label>
            <div className="flex flex-wrap gap-2">
              {REJECT_REASONS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => handlePresetClick(preset)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    selectedPreset === preset
                      ? 'bg-red-100 text-red-700 border border-red-300'
                      : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              详细说明
              <span className="text-red-500 ml-1">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="请详细描述修改不到位的地方..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              rows={4}
            />
            <p className="mt-1 text-xs text-gray-400">
              清晰的修改建议能帮助嵌字师更快修正，减少返工次数
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={!reason.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <XCircle className="w-4 h-4" />
            {isBatch ? '确认批量打回' : '确认打回'}
          </button>
        </div>
      </div>
    </div>
  );
}
