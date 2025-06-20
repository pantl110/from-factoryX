import DeliveryTableItem from "./delivery-table-item";

const DeliveryTable = () => {
  return (
    <>
      <div className="flex w-full h-12 items-center Me_Body-1 text-sv border-t border-b border-[#eeeeee]">
        <p className="px-3 w-[150px]">진행상태</p>
        <p className="px-3 flex-1">품목명</p>
        <p className="px-3 flex-1">납품일자</p>
      </div>
      <DeliveryTableItem
        status="납품예정"
        productName="A품목"
        date="2025-06-12"
      />
      <DeliveryTableItem
        status="납품예정"
        productName="A품목"
        date="2025-06-12"
      />
      <DeliveryTableItem
        status="납품예정"
        productName="A품목"
        date="2025-06-12"
      />
      <DeliveryTableItem
        status="납품예정"
        productName="A품목"
        date="2025-06-12"
      />
      <DeliveryTableItem
        status="납품예정"
        productName="A품목"
        date="2025-06-12"
      />
    </>
  );
};

export default DeliveryTable;
