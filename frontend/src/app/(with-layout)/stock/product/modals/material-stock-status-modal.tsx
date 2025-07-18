import Modal from '@/ui/modal/modal';
import MaterialStockStatusItem from './material-stock-status-item';

interface MaterialStockStatusModalProps {
  onClose: () => void;
}
const MaterialStockStatusModal = ({
  onClose,
}: MaterialStockStatusModalProps) => {
  return (
    <Modal
      width="w-[947px]"
      title="원자재 재고 상태"
      onClose={onClose}
      sm={true}
    >
      <div className="flex flex-col mt-4">
        <div className="flex items-center h-12 border-t border-b border-[#eeeeee] Me_Body-1">
          <p className="flex-2 px-3 text-sv">자재명</p>
          <p className="flex-1 px-3 text-sv">자재 코드</p>
          <p className="w-[80px] px-3 text-sv">단위</p>
          <p className="flex-1 px-3 text-sv">단위당 투입 수량</p>
          <p className="flex-1 px-3 text-sv">자재 재고 수량</p>
          <p className="flex-1 px-3 text-sv">재고 상태</p>
        </div>

        <MaterialStockStatusItem
          materialName="알루미늄 시트"
          materialCode="PRM-001"
          unit="m"
          unitQuantity={2.0}
          stockQuantity={500}
          inventoryStatus="충분"
        />
        <MaterialStockStatusItem
          materialName="알루미늄 고리"
          materialCode="PRM-014"
          unit="m"
          unitQuantity={2.0}
          stockQuantity={2000}
          inventoryStatus="충분"
        />
        <MaterialStockStatusItem
          materialName="알루미늄 링"
          materialCode="PRM-014"
          unit="m"
          unitQuantity={2.0}
          stockQuantity={1000}
          inventoryStatus="부족"
        />
      </div>
    </Modal>
  );
};

export default MaterialStockStatusModal;
