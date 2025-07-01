import Dropdown from "@/ui/dropdown/dropdown";
import { useState } from "react";

import FreePlan from "./free-plan";
import PlanItem from "./plan-item";
import SubscriptionTableHeader from "./subscription-table-header";
import SubscriptionTableItem from "./subscription-table-item";
import CardDeleteModal from "./modals/card-change-modal";
import CardEnrollModal from "./modals/card-enroll-modal";
import { PlanType } from "./types";

import {
  DotsThreeVerticalIcon,
  TrashIcon,
} from "@phosphor-icons/react/dist/ssr";
import MiniBtn from "@/ui/mini-btn";
import CardChangeModal from "./modals/card-change-modal";

const Subscription = () => {
  const planTypes: PlanType[] = ["BASIC", "PARTNERS"];
  const [isCardDropdownOpen2, setIsCardDropdownOpen2] = useState(false);
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);

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
                : () => setIsEnrollModalOpen(true)
            }
          />
        </div>
        {/* <div className="flex items-center justify-between h-18 py-4 px-6 border border-[#eeeeee] rounded-xl">        
        
        </div> */}
        <div className="flex items-center justify-between h-18 py-4 px-6 border border-[#eeeeee] rounded-xl">
          <h4 className="Heading-4">Master 19**</h4>
          <div className="relative">
            <button
              onClick={() => setIsCardDropdownOpen2((v) => !v)}
              className="cursor-pointer"
            >
              <DotsThreeVerticalIcon size={24} className="text-gr" />
            </button>
            {isCardDropdownOpen2 && (
              <div className="absolute right-0 mt-2 z-50">
                <Dropdown onClose={() => setIsCardDropdownOpen2(false)}>
                  <div
                    className="group px-4 py-2  cursor-pointer flex items-center gap-2"
                    onClick={() => {
                      setIsCardDropdownOpen2(false);
                    }}
                  >
                    <TrashIcon
                      size={18}
                      className="text-gr group-hover:text-red-500 transition-colors"
                    />
                    삭제하기
                  </div>
                </Dropdown>
              </div>
            )}
          </div>
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
        </div>
      </div>

      {/* CardChangeModal */}
      {isChangeModalOpen && (
        <CardChangeModal
          onClose={() => setIsChangeModalOpen(false)}
          onConfirm={() => {
            setIsChangeModalOpen(false);
            setIsEnrollModalOpen(true);
          }}
        />
      )}
      {/* CardEnrollModal */}
      {isEnrollModalOpen && (
        <CardEnrollModal onClose={() => setIsEnrollModalOpen(false)} />
      )}
    </div>
  );
};

export default Subscription;
