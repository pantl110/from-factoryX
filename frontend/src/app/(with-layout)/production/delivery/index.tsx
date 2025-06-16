import ProductFlowTitle from "./product-flow-title";
import MiniBtn from "@/ui/mini-btn";
import DeliveryTableHeader from "./delivery-table-header";
import DeliveryTableItem from "./delivery-table-item";

const DeliveryPage = () => {
  return (
    <>
      <ProductFlowTitle />
      <div className="flex justify-between px-10 py-4">
        <div className="flex gap-2">
          <MiniBtn text="납품표 일괄 출력" borderColor="border-lg" />
          <MiniBtn text="납품표 출력" borderColor="border-lg" />
        </div>
        <div className="flex gap-2">
          <MiniBtn text="거래명세서 작성" borderColor="border-lg" />
          <MiniBtn text="세금계산서 생성" borderColor="border-lg" />
        </div>
      </div>
      <div className="px-10">
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
    </>
  );
};

export default DeliveryPage;
