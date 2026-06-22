'use client';

import { useTranslations } from 'next-intl';
import MiniBtn from '@/ui/mini-btn';
import SaveToast from './save-toast';
import useToast from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import useUpdateProjectLog from '@/hooks/project/project-log/use-update-project-log';
import { ProjectStatusType } from '@/types/status-type';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';

interface MemoSectionProps {
  title: string;
  content: string;
  logId: number;
  onUpdate?: (title: string, content: string) => void; // 메모 수정 성공 시 콜백 (업데이트된 title, content 전달)
  projectStatus: ProjectStatusType;
}

const MemoSection = ({
  title,
  content,
  logId,
  onUpdate,
  projectStatus,
}: MemoSectionProps) => {
  const t = useTranslations('production.productionLog.memo');
  const tCommon = useTranslations('common');
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );

  const { isToastOpen: isSaveToastOpen, isVisible, showToast } = useToast();
  const { updateProjectLog, isLoading } = useUpdateProjectLog();
  const [memoContent, setMemoContent] = useState(content);
  const [memoTitle, setMemoTitle] = useState(title);
  const [isEditMode, setIsEditMode] = useState(false);

  // props가 변경될 때 내부 state 업데이트 (수정 모드가 아닐 때만)
  useEffect(() => {
    if (!isEditMode) {
      setMemoTitle(title);
      setMemoContent(content);
    }
  }, [title, content, isEditMode]);

  const handleMemoSave = async () => {
    try {
      const result = await updateProjectLog(logId, {
        type: 'memo',
        title: memoTitle,
        content: memoContent,
      });

      if (result.success) {
        showToast();
        setIsEditMode(false);
        onUpdate?.(memoTitle, memoContent); // 왼쪽 LogItem만 로컬 업데이트
      } else {
        alert(t('updateFailed', { error: result.error }));
      }
    } catch {
      alert(t('updateError'));
    }
  };

  return (
    <>
      <div className="rounded flex flex-col gap-4 h-full">
        <div className="flex flex-col gap-3 flex-1">
          <div className="flex gap-2">
            <div className="h-11 px-3 w-[110px] Me_Body-3 bg-bg flex items-center justify-center rounded">
              {t('title')}
            </div>
            <input
              className="focus:outline-none h-11 border px-3 Re_Body-1 text-dg border-lg flex items-center rounded-lg flex-1"
              value={memoTitle}
              onChange={(e) => setMemoTitle(e.target.value)}
              disabled={!isEditMode}
              readOnly={!isEditMode}
            />
          </div>
          <textarea
            className="border px-3 Re_Body-1 text-dg border-lg min-h-8 rounded-lg py-5 flex-1 overflow-y-auto scrollbar-hide"
            value={memoContent}
            onChange={(e) => setMemoContent(e.target.value)}
            disabled={!isEditMode}
            readOnly={!isEditMode}
          />
        </div>
        {projectStatus !== 'completed' && (
          <div className="flex gap-2.5 justify-end">
            {!isEditMode ? (
              <MiniBtn variant="outline"
                text={tCommon('edit')}
                onClick={() => setIsEditMode(true)}
                disabled={isViewer || !hasSubscription()}
              />
            ) : (
              <>
                <MiniBtn
                  variant="white"
                  text={tCommon('cancel')}
                  onClick={() => {
                    setIsEditMode(false);
                    setMemoTitle(title);
                    setMemoContent(content);
                  }}
                />
                <MiniBtn variant="secondary"
                  text={tCommon('save')}
                  onClick={handleMemoSave}
                  disabled={isLoading}
                />
              </>
            )}
          </div>
        )}
      </div>

      {/* 저장하기 토스트 */}
      {isSaveToastOpen && <SaveToast isVisible={isVisible} />}
    </>
  );
};

export default MemoSection;
