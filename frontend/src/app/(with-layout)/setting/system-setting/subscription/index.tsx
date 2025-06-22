import MiniBtn from "@/ui/mini-btn";

import FreePlan from "./free-plan";
import PlanItem from "./plan-item";
import SubscriptionTableHeader from "./subscription-table-header";
import SubscriptionTableItem from "./subscription-table-item";
import { PlanType } from "./types";

const Subscription = () => {
  const planTypes: PlanType[] = ["BASIC", "PARTNERS"];

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
        <div className="flex items-center justify-between py-4 px-6 border border-[#eeeeee] rounded-xl">
          <h4>Master 19**</h4>
          <MiniBtn
            text="결제 카드 변경"
            textColor="text-dg"
            borderColor="border-[#eeeeee]"
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
        </div>
      </div>
    </div>
  );
};

export default Subscription;
