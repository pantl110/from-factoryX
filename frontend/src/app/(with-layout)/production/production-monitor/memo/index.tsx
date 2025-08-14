'use client';

import MiniBtn from '@/ui/mini-btn';
import SaveToast from './save-toast';
import useToast from '@/hooks/use-toast';
import { useState } from 'react';
import useUpdateProjectLog from '@/hooks/project/project-log/use-update-project-log';
import { ProjectStatusType } from '@/types/status-type';

interface MemoSectionProps {
  title: string;
  content: string;
  logId: number;
  onUpdate?: () => void; // 메모 수정 성공 시 콜백
  projectStatus: ProjectStatusType;
}

const MemoSection = ({
  title,
  content,
  logId,
  onUpdate,
  projectStatus,
}: MemoSectionProps) => {
  const { isToastOpen: isSaveToastOpen, isVisible, showToast } = useToast();
  const { updateProjectLog, isLoading } = useUpdateProjectLog();
  const [memoContent, setMemoContent] = useState(content);
  const [memoTitle, setMemoTitle] = useState(title);
  const [isEditMode, setIsEditMode] = useState(false);

  const handleMemoSave = async () => {
    try {
      const result = await updateProjectLog(logId, {
        type: '메모',
        title: memoTitle,
        content: memoContent,
      });

      if (result.success) {
        showToast();
        setIsEditMode(false);
        onUpdate?.(); // 부모 컴포넌트에 업데이트 알림
      } else {
        alert(`메모 수정에 실패했습니다: ${result.error}`);
      }
    } catch {
      alert('메모 수정 중 오류가 발생했습니다.');
    }
  };

  return (
    <>
      <div className="rounded flex flex-col gap-4 h-full">
        <div className="flex flex-col gap-3 flex-1">
          <div className="flex gap-2">
            <div className="h-11 px-3 w-[110px] Me_Body-1 bg-bg flex items-center justify-center rounded">
              메모
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
        {projectStatus !== '프로젝트 완료' && (
          <div className="flex gap-2.5 justify-end">
            {!isEditMode ? (
              <MiniBtn
                text="수정"
                textColor="text-dg"
                borderColor="border-lg"
                hoverColor="hover:bg-bg"
                onClick={() => setIsEditMode(true)}
              />
            ) : (
              <>
                <MiniBtn
                  text="취소"
                  textColor="text-sv"
                  borderColor="border-lg"
                  hoverColor="hover:bg-bg"
                  onClick={() => {
                    setIsEditMode(false);
                    setMemoTitle(title);
                    setMemoContent(content);
                  }}
                />
                <MiniBtn
                  text="저장"
                  textColor="text-wh"
                  bgColor="bg-primary"
                  hoverColor="hover:bg-primary-hover"
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
