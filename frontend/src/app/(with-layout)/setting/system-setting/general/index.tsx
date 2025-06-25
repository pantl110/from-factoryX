"use client";

import { useState } from "react";
import { CameraIcon } from "@phosphor-icons/react/dist/ssr";

import Input from "@/ui/input";
import MiniBtn from "@/ui/mini-btn";
import DeleteAccountModal from "./modals/delete-account-modal";

const General = () => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleDeleteConfirm = () => {
    // 실제 계정 삭제 로직 추후 추가
    setIsDeleteModalOpen(false);
  };

  return (
    <>
      <div className="px-10">
        <div className="flex flex-col gap-3.5 border-b pb-8 border-b-[#eeeeee]">
          <h3 className="Heading-3">프로필 설정</h3>
          <div className="flex flex-col gap-8">
            <div className="relative">
              <div className="flex items-center justify-center rounded-full w-[72px] h-[72px] bg-primary-8 border border-primary Me_Body-3 text-primary">
                JG
              </div>
              <div className="absolute top-11 left-11 flex items-center justify-center w-[33px] h-[33px] rounded-full border border-lg text-sv bg-white z-20">
                <CameraIcon size={16} weight="fill" />
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <Input placeholder="" label="이름" required />
                <Input placeholder="" label="시스템 관리자" />
              </div>
              <div className="flex gap-2">
                <Input placeholder="" label="이메일" required />
                <Input placeholder="" label="연락처" />
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <MiniBtn
              text="저장하기"
              textColor="text-primary"
              bgColor="bg-primary-8"
              hoverColor="hover:bg-secondary-hover"
            />
          </div>
        </div>
        <div className="flex flex-col py-8 gap-4 border-b border-b-[#eeeeee]">
          <h3 className="Heading-3">회사정보</h3>
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <Input placeholder="" label="회사명" required />
              <Input placeholder="" label="사업자등록번호" required />
            </div>
            <div className="flex gap-2">
              <Input placeholder="" label="대표자명" required />
              <Input placeholder="" label="담당자 이메일" required />
            </div>
            <div className="flex gap-2">
              <Input placeholder="" label="담당자 연락처" />
              <Input placeholder="" label="담당자 팩스" />
            </div>
            <div className="flex gap-2">
              <Input placeholder="" label="담당자 연락처" />
              <Input placeholder="" label="담당자 팩스" />
            </div>
            <div className="flex gap-2">
              <Input placeholder="" label="업태" required />
              <Input placeholder="" label="종목" required />
            </div>
            <Input placeholder="" label="사업장 주소" required />
          </div>
          <div className="flex justify-end">
            <MiniBtn
              text="저장하기"
              textColor="text-primary"
              bgColor="bg-primary-8"
              hoverColor="hover:bg-secondary-hover"
            />
          </div>
        </div>
        <div className="flex flex-col gap-7 py-8">
          <div className="flex flex-col gap-4">
            <h3 className="Heading-3">계정 삭제</h3>
            <p className="Me_Body-2 text-sv">
              계정 삭제는 되돌릴 수 없습니다. 삭제 후에는 모든 개인 정보 및 사용
              기록이 즉시 제거되며, 다시 복구할 수 없습니다. <br />
              계속하시겠습니까?
            </p>
          </div>
          <div className="flex justify-end">
            <MiniBtn
              text="계정 삭제"
              bgColor="bg-red-8"
              textColor="text-red"
              onClick={() => setIsDeleteModalOpen(true)}
              hoverColor="hover:bg-red-hover"
            />
          </div>
        </div>
      </div>

      {isDeleteModalOpen && (
        <DeleteAccountModal
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </>
  );
};

export default General;
