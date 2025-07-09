import PriceInfo from "@/ui/price-info";
import OrderTableItem from "./order-table-item";

const OrderItemInfo = () => {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="Heading-3 h-10 items-center flex">주문 품목 정보</h3>

      <div className="w-full">
        <div className="flex items-center h-12 w-full border-t border-b border-lg Me_Body-1 text-sv rounded-sm">
          <p className="px-3 flex-2">품목명</p>
          <p className="px-3 flex-2">규격</p>
          <p className="px-3 w-[80px]">단위</p>
          <p className="px-3 flex-1">수량</p>
          <p className="px-3 flex-1">단가</p>
          <p className="px-3 flex-1">공급가액</p>
          <p className="px-3 flex-1">세액</p>
        </div>

        <OrderTableItem />
        <OrderTableItem />
        <OrderTableItem />
        <OrderTableItem />
      </div>

      <PriceInfo />
    </div>
  );
};

export default OrderItemInfo;
