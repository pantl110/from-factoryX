import { useState } from "react";
import FreePlan from "./free-plan";
import PlanItem from "./plan-item";
import SubscriptionTableHeader from "./subscription-table-header";
import SubscriptionTableItem from "./subscription-table-item";
import { PlanType } from "./types";
import MiniBtn from "@/ui/mini-btn";
import CardChangeModal from "./modals/card-change-modal";
import CardDeleteModal from "./modals/card-delete-modal";

const Subscription = () => {
  const planTypes: PlanType[] = ["BASIC", "PARTNERS"];
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
  // const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [isCardDeleteModalOpen, setIsCardDeleteModalOpen] = useState(false);

  const btnText = "카드 변경"; // 카드 변경, 카드 추가 // 사용자 상황에 따라 변경 필요

  return (
    <div className="px-10 pb-8 flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <FreePlan />
        {planTypes.map((type) => (
          <PlanItem key={type} type={type} />
        ))}
      </div>

      {/* 결제 카드 설정 */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between">
          <h3 className="Heading-3">결제 카드 설정</h3>
          <MiniBtn
            text={btnText}
            textColor="text-dg"
            borderColor="border-lg"
            hoverColor="hover:bg-bg"
            onClick={
              btnText === "카드 변경"
                ? () => setIsChangeModalOpen(true)
                : // : () => setIsEnrollModalOpen(true) 카드 등록으로 넘어가도록
                  () => {}
            }
          />
        </div>

        <div className="flex items-center justify-between h-18 py-4 px-6 border border-[#eeeeee] rounded-xl">
          <h4 className="Heading-4">Master 19**</h4>
          <MiniBtn
            text="삭제"
            textColor="text-red"
            bgColor="bg-red-8"
            hoverColor="hover:bg-red-hover"
            onClick={() => setIsCardDeleteModalOpen(true)}
          />
        </div>
      </div>

      {/* 결제 내역 */}
      <div className="flex flex-col gap-4">
        <h3 className="Heading-3">결제 내역</h3>
        <div>
          <SubscriptionTableHeader />
          <SubscriptionTableItem
            date="2025-06-14"
            card="현대카드(**** 4821)"
            amount="19,900원"
            plan="Basic"
          />
          <SubscriptionTableItem
            date="2025-06-14"
            card="현대카드(**** 4821)"
            amount="19,900원"
            plan="Basic"
          />
          <SubscriptionTableItem
            date="2025-06-14"
            card="현대카드(**** 4821)"
            amount="19,900원"
            plan="Basic"
          />
          <SubscriptionTableItem
            date="2025-06-14"
            card="현대카드(**** 4821)"
            amount="19,900원"
            plan="Basic"
          />
          <SubscriptionTableItem
            date="2025-06-14"
            card="현대카드(**** 4821)"
            amount="19,900원"
            plan="Basic"
          />
          <SubscriptionTableItem
            date="2025-06-14"
            card="현대카드(**** 4821)"
            amount="19,900원"
            plan="Basic"
          />
          <SubscriptionTableItem
            date="2025-06-14"
            card="현대카드(**** 4821)"
            amount="19,900원"
            plan="Basic"
          />
          <SubscriptionTableItem
            date="2025-06-14"
            card="현대카드(**** 4821)"
            amount="19,900원"
            plan="Basic"
          />
        </div>
      </div>

      {/* CardChangeModal */}
      {isChangeModalOpen && (
        <CardChangeModal
          onClose={() => setIsChangeModalOpen(false)}
          onConfirm={() => {
            setIsChangeModalOpen(false);
          }}
        />
      )}
      {/* CardEnrollModal */}
      {/* {isEnrollModalOpen && (
        <CardEnrollModal onClose={() => setIsEnrollModalOpen(false)} />
      )} */}
      {/* CardDeleteModal */}
      {isCardDeleteModalOpen && (
        <CardDeleteModal
          onClose={() => setIsCardDeleteModalOpen(false)}
          onConfirm={() => {
            setIsCardDeleteModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default Subscription;
