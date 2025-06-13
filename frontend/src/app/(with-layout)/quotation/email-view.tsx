import React from "react";
import MiniBtn from "@/ui/mini-btn";
import DocumentView from "./document-view";

const EmailView = () => {
  return (
    <div className="width-[1000px] px-8 py-8 flex flex-col gap-6">
      <div className="pb-6 w-full flex justify-between border-b border-lg">
        <div>
          <div className="Heading-2">이메일로 견적서를 보내시겠어요?</div>
          <div className="mt-2.5 Me_Body-3 text-gr">
            받는 사람과 제목을 확인한 후, 이메일을 전송해 주세요
          </div>
        </div>
        <div className="flex gap-2.5 justify-end ">
          <MiniBtn
            text="취소하기"
            textColor="text-sv"
            bgColor="bg-wh"
            // borderColor="border-[#eeeeee]"
          />
          <MiniBtn
            text="견적서 보내기"
            textColor="text-wh"
            bgColor="bg-primary"
            hoverColor="bg-primary-hover"
          />
        </div>
      </div>

      <DocumentView />
    </div>
  );
};

export default EmailView;
