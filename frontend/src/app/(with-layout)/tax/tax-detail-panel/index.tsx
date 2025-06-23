import ClientInfoTable from "./client-info-table";
import PriceInfo from "@/ui/price-info";
import DetailSalesHeader from "@/app/(with-layout)/tax/tax-detail-panel/detail-sales-header";
import DetailSalesItem from "@/app/(with-layout)/tax/tax-detail-panel/detail-sales-item";

import { CaretLineRightIcon } from "@phosphor-icons/react/dist/ssr";

interface TaxDetailPanelProps {
  onClose: () => void;
}

const TaxDetailPanel = ({ onClose }: TaxDetailPanelProps) => {
  return (
    <div className="w-[1000px] bg-white h-full py-5 mt-[0px]">
      <div className="flex flex-col gap-5 mx-10 h-full overflow-y-auto">
        <div className="flex gap-2 items-center border-b border-[#eeeeee] pb-2 sticky top-0 bg-white z-10">
          <button
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10"
          >
            <CaretLineRightIcon size={20} />
          </button>
          <h3 className="Heading-3 text-dg">세무/회계</h3>
        </div>
        <div>
          <ClientInfoTable />
          <div>
            <h3 className="Heading-3 text-dg mb-3">주문 품목 정보</h3>
            <PriceInfo />{" "}
          </div>
        </div>
        <div>
          <DetailSalesHeader />
          <DetailSalesItem />
          <DetailSalesItem />
          <DetailSalesItem />
          <DetailSalesItem />
        </div>
      </div>
    </div>
  );
};

export default TaxDetailPanel;
