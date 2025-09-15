import { CaretDownIcon, CaretUpDownIcon } from "@phosphor-icons/react/dist/ssr";

const ProductionTableHeader = () => {
  return (
    <div className="flex w-full h-12 items-center Me_Body-1 text-sv border-t border-b border-[#eeeeee]">
      <div className="flex items-center py-1 px-3 w-[150px]">
        <p>진행상태</p>
        <div className="ml-1">
          <CaretDownIcon size={14} weight="fill" />
        </div>
      </div>
      <div className="py-1 px-3 flex-1">
        <p>생산 설비</p>
      </div>
      <div className="py-1 px-3 flex-1">
        <p>생산 품목명</p>
      </div>
      <div className="py-1 px-3 flex-1">
        <p>생산 수량</p>
      </div>
      <div className="py-1 px-3 w-[80px]">
        <p>단위</p>
      </div>
      <div className="flex items-center py-1 px-3 w-[200px]">
        <p>생산시간</p>
        <div className="ml-1">
          <CaretUpDownIcon size={18} />
        </div>
      </div>
      <div className="py-1 px-3 w-[200px]">
        <p>생산지시서</p>
      </div>
    </div>
  );
};

export default ProductionTableHeader;
