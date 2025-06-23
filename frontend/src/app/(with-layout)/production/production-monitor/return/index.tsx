import InfoLabelValue from "@/ui/info-label-value";
import PriceInfo from "@/ui/price-info";
import ReturnTableHeader from "./return-table-header";
import ReturnTableItem from "./return-table-item";

const ReturnSection = () => {
  return (
    <div className="flex-1 h-full">
      <div className="flex flex-col gap-3 pt-5 pb-10">
        <h3 className="Heading-3 text-dg">반품 정보</h3>
        <div>
          <div className="border-t border-b border-[#eeeeee]">
            <InfoLabelValue label="반품 일자" value="2025-06-06" />
          </div>
          <div className="border-b border-[#eeeeee]">
            <InfoLabelValue label="반품 수량" value="300" />
          </div>
          <div className="border-b border-[#eeeeee]">
            <InfoLabelValue
              label="생산해야되는 수량 -> 생산계획에 들어가야함"
              value="200"
            />
          </div>
          <div className="border-b border-[#eeeeee]">
            <InfoLabelValue
              label="재고에서 뺄 수량 -> 재고랑 연결"
              value="100/100"
            />
          </div>
        </div>
        <PriceInfo />
        <div>
          <ReturnTableHeader />
          <ReturnTableItem />
          <ReturnTableItem />
          <ReturnTableItem />
        </div>
      </div>
    </div>
  );
};

export default ReturnSection;
