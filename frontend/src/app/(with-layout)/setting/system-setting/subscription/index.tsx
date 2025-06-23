import Chip from "@/ui/chip";
import Dropdown from "@/ui/dropdown/dropdown";
import { useState } from "react";

import FreePlan from "./free-plan";
import PlanItem from "./plan-item";
import SubscriptionTableHeader from "./subscription-table-header";
import SubscriptionTableItem from "./subscription-table-item";
import CardDeleteModal from "./modals/card-delete-modal";
import CardEnrollModal from "./modals/card-enroll-modal";
import { PlanType } from "./types";

import {
  DotsThreeVerticalIcon,
  TrashIcon,
  CrownSimpleIcon,
} from "@phosphor-icons/react/dist/ssr";

const Subscription = () => {
  const planTypes: PlanType[] = ["BASIC", "PARTNERS"];
  const [cardDropdownOpen, setCardDropdownOpen] = useState(false);
  const [cardDropdownOpen2, setCardDropdownOpen2] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);

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
        <h3 className="Heading-3">결제 카드 설정</h3>
        <div className="flex items-center justify-between h-18 py-4 px-6 border border-[#eeeeee] rounded-xl">
          <div className="flex items-center gap-3">
            <Chip
              text="대표 카드"
              bgColor="bg-primary-8"
              textColor="text-primary"
            />
            <h4 className="Heading-4">Master 19**</h4>
          </div>
          <div className="relative">
            <button onClick={() => setCardDropdownOpen((v) => !v)}>
              <DotsThreeVerticalIcon size={24} className="text-gr" />
            </button>
            {cardDropdownOpen && (
              <div className="absolute right-0 mt-2 z-50">
                <Dropdown onClose={() => setCardDropdownOpen(false)}>
                  <div
                    className="group px-4 py-2 cursor-pointer flex items-center gap-2"
                    onClick={() => {
                      setDeleteModalOpen(true);
                      setCardDropdownOpen(false);
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
        <div className="flex items-center justify-between h-18 py-4 px-6 border border-[#eeeeee] rounded-xl">
          <h4 className="Heading-4">Master 19**</h4>
          <div className="relative">
            <button onClick={() => setCardDropdownOpen2((v) => !v)}>
              <DotsThreeVerticalIcon size={24} className="text-gr" />
            </button>
            {cardDropdownOpen2 && (
              <div className="absolute right-0 mt-2 z-50">
                <Dropdown onClose={() => setCardDropdownOpen2(false)}>
                  <div
                    className="group px-4 py-2  cursor-pointer flex items-center gap-2"
                    onClick={() => {
                      setEnrollModalOpen(true);
                      setCardDropdownOpen2(false);
                    }}
                  >
                    <CrownSimpleIcon
                      size={18}
                      className="text-gr group-hover:text-yellow-400 transition-colors"
                    />
                    대표카드 등록
                  </div>
                  <div
                    className="group px-4 py-2  cursor-pointer flex items-center gap-2"
                    onClick={() => {
                      setDeleteModalOpen(true);
                      setCardDropdownOpen2(false);
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

      {/* CardDeleteModal */}
      {deleteModalOpen && (
        <CardDeleteModal
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={() => setDeleteModalOpen(false)}
        />
      )}
      {/* CardEnrollModal */}
      {enrollModalOpen && (
        <CardEnrollModal onClose={() => setEnrollModalOpen(false)} />
      )}
    </div>
  );
};

export default Subscription;
