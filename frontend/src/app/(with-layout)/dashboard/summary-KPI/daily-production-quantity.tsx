import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr";

const DailyProductionQuantity = () => {
  return (
    <div className="pt-5 pb-4 px-5 rounded-lg border border-[#eeeeee] h-[141px] shadow-[2px_2px_22px_rgba(0,0,0,0.1)]">
      <div className="flex flex-col gap-1">
        <p className="Heading-4 text-sv">오늘 생산량</p>
        <p className="flex gap-1 Heading-1">
          50 <span>건</span>
        </p>
        <div className="flex flex-row justify-between">
          <div className="flex">
            <p className="Re_Body-1 text-sv mr-2">전월 대비</p>
            <div className="flex text-primary items-center">
              <p>
                - 0.8<span>%</span>
              </p>
              <div className="flex items-center justify-center w-4 h-4 ml-1">
                <CaretDownIcon size={16} weight="fill" />
              </div>
            </div>
          </div>
          {/* <ChartChip up={false} /> */}
        </div>
      </div>
    </div>
  );
};

export default DailyProductionQuantity;
