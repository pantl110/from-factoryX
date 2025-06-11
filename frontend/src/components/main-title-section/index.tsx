"use client";

import { useRouter } from "next/navigation";
import MiniBtn from "@/ui/mini-btn";
import TabSet from "@/components/main-title-section/tab-set";

const MainTitleSection = () => {
  const router = useRouter();

  const handleNewQuotation = () => {
    router.push("/quotation");
  };

  return (
    <div className="flex flex-col gap-8 pt-10 pr-10 pl-10">
      <div className="flex items-center justify-between">
        <div className="B_Heading-2 text-dg">진행 중인 프로젝트</div>
        <MiniBtn
          bgColor="bg-primary"
          textColor="text-white"
          text="새 견적서 작성하기"
          onClick={handleNewQuotation}
        />
      </div>
      <TabSet />
    </div>
  );
};

export default MainTitleSection;
