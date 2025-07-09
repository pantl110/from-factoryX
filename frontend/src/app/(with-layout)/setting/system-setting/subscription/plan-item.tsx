import MiniBtn from "@/ui/mini-btn";
import { PlanType, PLAN_INFO } from "./types";
import { useState } from "react";
import SubscribeModal from "./modals/subscribe-modal";

interface PlanItemProps {
  type: PlanType;
}

const PlanItem = ({ type }: PlanItemProps) => {
  const info = PLAN_INFO[type];
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-1 py-4 px-6 border border-[#eeeeee] rounded-xl">
        <div className="flex items-center justify-between">
          <h3 className="Heading-3">{info.title}</h3>
          <MiniBtn
            text="구독"
            textColor="text-wh"
            bgColor="bg-primary"
            hoverColor="hover:bg-primary-hover"
            onClick={() => setIsSubscribeModalOpen(true)}
          />
        </div>
        <h4 className="Heading-4 text-primary">월 {info.price}원</h4>
        <p className="text-dg Re_Body-1 whitespace-pre-line">
          {info.description}
        </p>
      </div>
      {isSubscribeModalOpen && (
        <SubscribeModal
          onClose={() => setIsSubscribeModalOpen(false)}
          planTitle={info.title}
        />
      )}
    </>
  );
};

export default PlanItem;
