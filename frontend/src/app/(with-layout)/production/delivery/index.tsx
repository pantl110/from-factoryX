import MiniBtn from '@/ui/mini-btn';
import DeliveryTableHeader from './delivery-table-header';
import DeliveryTableItem from './delivery-table-item';
import { useState } from 'react';
import PrintDeliveryModal from './modals/print-delivery-modal';
import PrintAllDeliveryModal from './modals/print-all-delivery-modal';
import CreateTransactionOverlayview from './modals/create-transaction-overlayview';
import CreateTaxOverlayview from './modals/create-tax-overlayview';
import usePageStatusStore from '@/store/page-status-store';
import MoveToStorageModal from './modals/move-to-storage-modal';
import { deliveryData } from '@/mocks/delivery-data';
import AddReturnModal from './modals/add-return-modal/add-return-modal';

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
  const isMoveToStorageModalOpen = usePageStatusStore(
    (state) => state.isMoveToStorageModalOpen
  );
  const setMoveToStorageModalOpen = usePageStatusStore(
    (state) => state.setMoveToStorageModalOpen
  );
  const isAddReturnModalOpen = usePageStatusStore(
    (state) => state.isAddReturnModalOpen
  );
  const setAddReturnModalOpen = usePageStatusStore(
    (state) => state.setAddReturnModalOpen
  );

  return (
    <>
      <div className="flex flex-col px-10 pt-5 pb-10">
        <div className="flex justify-between pb-4">
          <div className="flex gap-2">
            <MiniBtn
              text="납품표 일괄 출력"
              textColor="text-dg"
              borderColor="border-lg"
              onClick={() => setIsPrintAllDeliveryModalOpen(true)}
              hoverColor="hover:bg-bg"
            />
            <MiniBtn
              text="납품표 출력"
              textColor="text-dg"
              borderColor="border-lg"
              onClick={() => setIsPrintDeliveryModalOpen(true)}
              hoverColor="hover:bg-bg"
            />
          </div>
          <div className="flex gap-2">
            <MiniBtn
              text="거래명세서 생성"
              textColor="text-dg"
              borderColor="border-lg"
              onClick={() => setIsCreateTransactionOverlayviewOpen(true)}
              hoverColor="hover:bg-bg"
            />
            <MiniBtn
              text="세금계산서 생성"
              textColor="text-dg"
              borderColor="border-lg"
              onClick={() => setIsCreateTaxOverlayviewOpen(true)}
              hoverColor="hover:bg-bg"
            />
          </div>
        </div>
        <div className="flex flex-col w-full overflow-x-auto">
          <DeliveryTableHeader />
          {deliveryData.map((data) => (
            <DeliveryTableItem key={data.id} data={data} />
          ))}
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
      {isMoveToStorageModalOpen && (
        <MoveToStorageModal onClose={() => setMoveToStorageModalOpen(false)} />
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
