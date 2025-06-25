"use client";

import MiniBtn from "@/ui/mini-btn";
import { useEffect, useState } from "react";
import SaveToast from "./save-toast";

interface MemoSectionProps {
  title: string;
  content: string;
  setIsDeleteModalOpen: (isOpen: boolean) => void;
}

const MemoSection = ({
  title,
  content,
  setIsDeleteModalOpen,
}: MemoSectionProps) => {
  const [isSaveToastOpen, setIsSaveToastOpen] = useState(false);

  useEffect(() => {
    if (isSaveToastOpen) {
      const timer = setTimeout(() => {
        setIsSaveToastOpen(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSaveToastOpen]);

  const handleMemoSave = () => {
    // 메모 저장 로직
    setIsSaveToastOpen(true);
  };
  return (
    <div className="pt-5 pb-10 h-full">
      <div className="rounded flex flex-col gap-4 h-full">
        <div className="flex flex-col gap-3 flex-1">
          <div className="flex gap-2">
            <div className="h-11 px-3 w-[110px] Me_Body-1 bg-bg flex items-center justify-center rounded">
              메모
            </div>
            <div className="h-11 border px-3 Re_Body-1 text-dg border-[#E4E4E7] flex items-center rounded-lg flex-1">
              {title}
            </div>
          </div>
          <div className="border px-3 Re_Body-1 text-dg border-[#E4E4E7] min-h-8 rounded-lg py-5 flex-1">
            {content}
          </div>
        </div>
        <div className="flex gap-2.5 justify-end">
          <MiniBtn
            text="삭제하기"
            textColor="text-dg"
            borderColor="border-lg"
            hoverColor="hover:bg-bg"
            onClick={() => setIsDeleteModalOpen(true)}
          />
          <MiniBtn
            text="저장하기"
            textColor="text-wh"
            bgColor="bg-primary"
            hoverColor="hover:bg-primary-hover"
            onClick={handleMemoSave}
          />
        </div>
      </div>
      {isSaveToastOpen && <SaveToast />}
    </div>
  );
};

export default MemoSection;
