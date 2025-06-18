import MiniBtn from "@/ui/mini-btn";
import DeliveryTableHeader from "./delivery-table-header";
import DeliveryTableItem from "./delivery-table-item";
import TaxInvoice from "./tax-invoice";

const Delivery = () => {
  return (
    <div className="flex flex-col px-10 pb-9">
      <div className="flex justify-between py-4">
        <div className="flex gap-2">
          <MiniBtn text="납품표 일괄 출력" borderColor="border-[#eeeeee]" />
          <MiniBtn text="납품표 출력" borderColor="border-[#eeeeee]" />
        </div>
        <div className="flex gap-2">
          <MiniBtn text="거래명세서 생성" borderColor="border-[#eeeeee]" />
          <MiniBtn text="세금계산서 생성" borderColor="border-[#eeeeee]" />
        </div>
      </div>
      <div className="flex flex-col w-full overflow-x-auto">
        <DeliveryTableHeader />
        <DeliveryTableItem />
        <DeliveryTableItem />
        <DeliveryTableItem />
        <DeliveryTableItem />
        <DeliveryTableItem />
        <DeliveryTableItem />
        <DeliveryTableItem />
        <DeliveryTableItem />
        <DeliveryTableItem />
        <DeliveryTableItem />
      </div>
      <TaxInvoice />
    </div>
  );
};

export default Delivery;
