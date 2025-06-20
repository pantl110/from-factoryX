import MainTitleSec from "./main-title-sec";
import DailyProductionQuantity from "./summary-KPI/daily-production-quantity";
import ShortageCount from "./summary-KPI/shortage-count";
import ProductionYield from "./summary-KPI/production-yield";
import PendingQuoteItem from "./pending-quote/pending-quote-item";
import ProcessProjectItem from "./process-project/process-project-item";
import ProductionTable from "./today-production-schedule/production-table";
import TaxItem from "./tax/tax-item";
import MiniBtn from "@/ui/mini-btn";
import DeliveryTable from "./delivery-schedule/delivery-table";

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
        <div>
          <div className="flex justify-between items-center">
            <h3 className="Heading-3">협의 중인 견적</h3>
            <MiniBtn
              text="더보기"
              textColor="text-dg"
              borderColor="border-lg"
            />
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto">
            <PendingQuoteItem />
            <PendingQuoteItem />
          </div>
        </div>

        {/* 생산 프로젝트 */}
        <div>
          <div className="flex justify-between items-center">
            <h3 className="Heading-3">생산 프로젝트</h3>
            <MiniBtn
              text="더보기"
              textColor="text-dg"
              borderColor="border-lg"
            />
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto">
            <ProcessProjectItem />
            <ProcessProjectItem />
          </div>
        </div>

        {/* 오늘의 생산 일정 */}
        <div>
          <div className="flex justify-between items-center">
            <h3 className="Heading-3">오늘의 생산 일정</h3>
            <MiniBtn
              text="출력하기"
              textColor="text-dg"
              borderColor="border-lg"
            />
          </div>
          <div className="mt-3 overflow-x-auto">
            <ProductionTable />
          </div>
        </div>

        {/* 납품 예정 현황 */}
        <div className="flex gap-5">
          <div className="flex flex-col flex-1 gap-3">
            <div className="h-10">
              <h3 className="Heading-3">납품 예정 현황</h3>
            </div>
            <DeliveryTable />
          </div>

          {/* 세무/회계 */}
          <div className="flex flex-col flex-1 gap-3">
            <div className="flex items-center justify-between">
              <h3 className="Heading-3">세무/회계</h3>
              <MiniBtn
                text="더보기"
                textColor="text-dg"
                borderColor="border-lg"
              />
            </div>
            <div className="flex flex-col gap-3">
              <TaxItem
                type="매출"
                text="나무는 딱딱해 세금계산서 발행"
                date="2025-06-06"
              />
              <TaxItem
                type="매입"
                text="나무는 딱딱해 세금계산서 발행"
                date="2025-06-06"
              />
              <TaxItem
                type="매출"
                text="나무는 딱딱해 세금계산서 발행"
                date="2025-06-06"
              />
              <TaxItem
                type="매입"
                text="나무는 딱딱해 세금계산서 발행"
                date="2025-06-06"
              />
              <TaxItem
                type="매입"
                text="나무는 딱딱해 세금계산서 발행"
                date="2025-06-06"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardPage;
