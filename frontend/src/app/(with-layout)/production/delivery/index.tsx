import MiniBtn from "@/ui/mini-btn";
import DeliveryTableHeader from "./delivery-table-header";
import DeliveryTableItem from "./delivery-table-item";
import { useState } from "react";
import PrintDeliveryModal from "./modals/print-delivery-modal";
import PrintAllDeliveryModal from "./modals/print-all-delivery-modal";
import CreateTransactionOverlayview from "./modals/create-transaction-overlayview";
import CreateTaxOverlayview from "./modals/create-tax-overlayview";
import usePageStatusStore from "@/store/page-status-store";
import AddReturnModal from "./modals/add-return-modal";

const Delivery = () => {
  const [isPrintAllDeliveryModalOpen, setIsPrintAllDeliveryModalOpen] =
    useState(false);
  const [isPrintDeliveryModalOpen, setIsPrintDeliveryModalOpen] =
    useState(false);
  const [
    isCreateTransactionOverlayviewOpen,
    setIsCreateTransactionOverlayviewOpen,
  ] = useState(false);
  const [isCreateTaxOverlayviewOpen, setIsCreateTaxOverlayviewOpen] =
    useState(false);
  const isAddReturnModalOpen = usePageStatusStore(
    (state) => state.isAddReturnModalOpen,
  );
  const setAddReturnModalOpen = usePageStatusStore(
    (state) => state.setAddReturnModalOpen,
  );

  return (
    <>
      <div className="flex flex-col px-10 pb-9">
        <div className="flex justify-between py-4">
          <div className="flex gap-2">
            <MiniBtn
              text="납품표 일괄 출력"
              borderColor="border-[#eeeeee]"
              onClick={() => setIsPrintAllDeliveryModalOpen(true)}
            />
            <MiniBtn
              text="납품표 출력"
              borderColor="border-[#eeeeee]"
              onClick={() => setIsPrintDeliveryModalOpen(true)}
            />
          </div>
          <div className="flex gap-2">
            <MiniBtn
              text="거래명세서 생성"
              borderColor="border-[#eeeeee]"
              onClick={() => setIsCreateTransactionOverlayviewOpen(true)}
            />
            <MiniBtn
              text="세금계산서 생성"
              borderColor="border-[#eeeeee]"
              onClick={() => setIsCreateTaxOverlayviewOpen(true)}
            />
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
        {/* <TaxInvoice /> */}
      </div>

      {/* 모달 */}
      {isPrintAllDeliveryModalOpen && (
        <PrintAllDeliveryModal
          onClose={() => setIsPrintAllDeliveryModalOpen(false)}
        />
      )}
      {isPrintDeliveryModalOpen && (
        <PrintDeliveryModal
          onClose={() => setIsPrintDeliveryModalOpen(false)}
        />
      )}
      {isAddReturnModalOpen && (
        <AddReturnModal onClose={() => setAddReturnModalOpen(false)} />
      )}

      {/* overlayview */}
      {isCreateTransactionOverlayviewOpen && (
        <CreateTransactionOverlayview
          onClose={() => setIsCreateTransactionOverlayviewOpen(false)}
        />
      )}
      {isCreateTaxOverlayviewOpen && (
        <CreateTaxOverlayview
          onClose={() => setIsCreateTaxOverlayviewOpen(false)}
        />
      )}
    </>
  );
};

export default Delivery;
