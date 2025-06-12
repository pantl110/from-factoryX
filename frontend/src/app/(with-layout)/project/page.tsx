"use client";

import { useRouter } from "next/navigation";
import SearchInput from "@/ui/search-input";
import MiniBtn from "@/ui/mini-btn";
import Chip from "@/ui/chip";

import { TrashIcon } from "@phosphor-icons/react/dist/ssr";

const ProjectPage = () => {
  const router = useRouter();

  const handleNewQuotation = () => {
    router.push("/quotation");
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-8 pt-10 pr-10 pl-10">
        <div className="flex items-center justify-between">
          <div className="Heading-1 text-dg">진행 중인 프로젝트</div>
          <MiniBtn
            bgColor="bg-primary"
            textColor="text-white"
            text="새 견적서 작성하기"
            onClick={handleNewQuotation}
          />
        </div>
        <div className="flex gap-4 items-center Heading-3">
          <h3 className="text-dg">전체</h3>
          <h3 className="text-gr">견적 협의</h3>
          <h3 className="text-gr">생산 대기</h3>
          <h3 className="text-gr">생산 중</h3>
          <h3 className="text-gr">생산 완료</h3>
          <h3 className="text-gr">납품</h3>
        </div>
      </div>
      <div className="px-8">
        <div className="flex items-center justify-between pb-4">
          <SearchInput />
          <MiniBtn
            text="삭제"
            textColor="text-dg"
            borderColor="border-[#eeeeee]"
            icon={TrashIcon}
            iconColor="text-sv"
          />
        </div>
        <div>
          <div className="flex items-center h-12 border-t border-b border-[#eeeeee] Me_Body-1">
            <div className="flex items-center py-3 px-2">
              <input type="checkbox" className="w-4 h-4 border-sv" />
            </div>
            <p className="w-[150px] py-1 px-3 text-sv">진행상태</p>
            <p className="flex-1 py-1 px-3 text-sv">업체명</p>
            <p className="flex-1 py-1 px-3 text-sv">품목</p>
            <p className="w-[200px] py-1 px-3 text-sv">진행일자</p>
            <p className="w-[200px] py-1 px-3 text-sv">납기일자</p>
          </div>
          {[...Array(9)].map((_, index) => (
            <div
              key={index}
              className="flex items-center h-14 border-b border-[#eeeeee] Me_Body-1"
            >
              <div className="flex items-center py-3 px-2">
                <input type="checkbox" className="w-4 h-4 border-sv" />
              </div>
              <div className="py-1 px-3 w-[150px]">
                <Chip
                  text="생산중"
                  bgColor="bg-purple-8"
                  textColor="text-purple"
                />
              </div>
              <p className="flex-1 py-1 px-3 text-dg">플라스틱이 좋아</p>
              <p className="flex-1 py-1 px-3 text-dg">플라스틱 컵 외 3개</p>
              <p className="w-[200px] py-1 px-3 text-dg">2025-06-04</p>
              <p className="w-[200px] py-1 px-3 text-dg">2025-06-04</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProjectPage;
