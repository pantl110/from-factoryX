import MainTitleSec from "./main-title-sec";
import DailyProductionQuantity from "./summary-KPI/daily-production-quantity";
import ShortageCount from "./summary-KPI/shortage-count";
import ProductionYield from "./summary-KPI/production-yield";
import ProductionTable from "./today-production-schedule/production-table";
import MiniBtn from "@/ui/mini-btn";
import DeliveryTable from "./delivery-schedule/delivery-table";

import PendingQuote from "./pending-quote";
import ProcessProject from "./process-project";
import Tax from "./tax";
import TodayProductionSchedule from "./today-production-schedule";

const DashboardPage = () => {
  return (
    <>
      <MainTitleSec />

      <div className="flex flex-col gap-11 p-10">
        <div className="flex gap-5">
          {/* Summary KPI */}
          <div className="flex flex-col gap-3 w-[280px]">
            <h3 className="Heading-3">Summary KPI</h3>
            <DailyProductionQuantity />
            <ShortageCount />
            <ProductionYield />
          </div>

          {/* 생산 이익 그래프 */}
          <div className="flex flex-col flex-1 gap-3">
            <h3 className="Heading-3">생산 이익 그래프</h3>
            <div
              className="border border-[#eeeeee] rounded-lg h-full
             flex justify-center items-center bg-bg"
            >
              <p className="Re_Body-1 text-sv">그래프</p>
            </div>
          </div>
        </div>

        {/* 협의 중인 견적 */}
        <PendingQuote />

        {/* 생산 프로젝트 */}
        <ProcessProject />

        {/* 오늘의 생산 일정 */}
        <TodayProductionSchedule />

        {/* 납품 예정 현황 */}
        <div className="flex gap-5">
          <div className="flex flex-col flex-1 gap-3">
            <div className="h-10">
              <h3 className="Heading-3">납품 예정 현황</h3>
            </div>
            <DeliveryTable />
          </div>

          {/* 세무/회계 */}
          <Tax />
        </div>
      </div>
    </>
  );
};

export default DashboardPage;
