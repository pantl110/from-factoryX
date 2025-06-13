import MainTitleSec from "./main-title-sec";
import DailyProductionQuantity from "./daily-production-quantity";
import ShortageCount from "./shortage-count";
import ProductionYield from "./production-yield";
import PendingQuoteItem from "./pending-quote-item";
import ProcessProjectItem from "./process-project-item";

import MiniBtn from "@/ui/mini-btn";

const DashboardPage = () => {
  return (
    <>
      <MainTitleSec />
      <div className="flex flex-col gap-11 p-10">
        <div className="flex gap-5">
          <div className="flex flex-col gap-3 w-[280px]">
            <h3 className="Heading-3">Summary KPI</h3>
            <DailyProductionQuantity />
            <ShortageCount />
            <ProductionYield />
          </div>
          <div className="flex flex-col flex-1 gap-3">
            <h3 className="Heading-3">생산 이익 그래프</h3>
            <div className="border border-[#eeeeee] rounded-lg h-full">
              그래프가 들어갈거심..
            </div>
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center">
            <h3 className="Heading-3">협의 중인 견적</h3>
            <MiniBtn
              text="더보기"
              textColor="text-dg"
              borderColor="border-lg"
            />
          </div>
          <div className="mt-3">
            <div className="flex gap-2">
              <PendingQuoteItem />
              <PendingQuoteItem />
            </div>
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center">
            <h3 className="Heading-3">생산 프로젝트</h3>
            <MiniBtn
              text="더보기"
              textColor="text-dg"
              borderColor="border-lg"
            />
          </div>
          <div className="mt-3">
            <div className="flex gap-2">
              <ProcessProjectItem />
            </div>
          </div>
        </div>
        <div>
          <h3 className="Heading-3">오늘 생산 항목 리스트</h3>
        </div>
        <div className="flex gap-5">
          <div className="flex-1">
            <h3 className="Heading-3">이슈사항</h3>
          </div>
          <div className="flex-1">
            <h3 className="Heading-3">세무/회계</h3>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardPage;
