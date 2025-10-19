import MiniBtn from '@/ui/mini-btn';
import StockStatus from './stock-status';
import {
  MaterialProductConnectionModel,
  ProductMaterialConnectionModel,
  MaterialProductConnectionResponseModel,
} from '@/types/data-model';
import useMemberStore from '@/store/member-store';
import { useState } from 'react';
import { useMaterialProduct } from '@/hooks';
import DeleteModal from '@/ui/modal/delete-modal';

type ConnectionModelType =
  | MaterialProductConnectionModel
  | ProductMaterialConnectionModel;

interface BOMProps {
  productId?: number | null;
  connections?:
    | ConnectionModelType[]
    | MaterialProductConnectionResponseModel
    | null;
  stagedMaterials: Array<{
    id: number;
    name: string;
    code: string;
    spec: string;
    unit: string;
    quantity: number;
  }>;
  quantityChanges: Record<number, number>;
  hasSubscription: () => boolean;
  onMaterialModalOpen: () => void;
  onMaterialIdChange: (id: number | null) => void;
  onQuantityDirtyChange: (isDirty: boolean) => void;
  onQuantityChange: (materialId: number, quantity: number) => void;
  onInvalidQuantity: (message: string) => void;
  onStagedQuantityChange: (materialId: number, quantity: number) => void;
  onPersistStagedConnections?: (newProductId: number) => Promise<void>;
}

const BOM = ({
  productId,
  connections,
  stagedMaterials,
  quantityChanges,
  hasSubscription,
  onMaterialModalOpen,
  onMaterialIdChange,
  onQuantityDirtyChange,
  onQuantityChange,
  onInvalidQuantity,
  onStagedQuantityChange,
  onPersistStagedConnections,
}: BOMProps) => {
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';

  const {
    deleteMaterialProductConnection,
    resetData,
    getMaterialProductConnections,
  } = useMaterialProduct();

  // 연결된 자재 정보 삭제 확인 모달
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConnectionId, setDeleteConnectionId] = useState<number | null>(
    null
  );

  // 수량 변경 추적 함수
  const handleQuantityChange = (connectionId: number, newQuantity: number) => {
    onQuantityChange(connectionId, newQuantity);
  };

  // 연결 삭제 핸들러
  const handleDeleteConnection = (connectionId: number) => {
    setDeleteConnectionId(connectionId);
    setIsDeleteModalOpen(true);
  };

  // 연결 삭제 실행
  const handleConfirmDelete = async (connectionId: number) => {
    if (!connectionId) return;

    setIsDeleting(true);
    try {
      const result = await deleteMaterialProductConnection(connectionId);
      if (result.success) {
        // 삭제 성공 시 연결된 자재 정보 새로고침
        if (productId) {
          // 연결된 자재 목록 초기화
          resetData();
          // 연결된 자재 목록 다시 로드
          await getMaterialProductConnections(productId, 'product');
        }
      } else {
        alert('연결 삭제에 실패했습니다: ' + result.error);
      }
    } catch {
      alert('연결 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setDeleteConnectionId(null);
    }
  };

  // 모달에서 삭제 확인 시 호출되는 함수
  const handleModalConfirmDelete = () => {
    if (deleteConnectionId) {
      handleConfirmDelete(deleteConnectionId);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="h-10 flex items-center justify-between">
        <h3 className="Heading-3 h-10 flex items-center text-dg">
          BOM/패키징 레시피
        </h3>
        <MiniBtn
          text="연결"
          textColor="text-dg"
          borderColor="border-lg"
          hoverColor="hover:bg-bg"
          onClick={onMaterialModalOpen}
          disabled={isViewer || !hasSubscription()}
        />
      </div>
      <StockStatus
        connections={
          productId
            ? connections && Array.isArray(connections)
              ? (connections as ConnectionModelType[])
              : []
            : (stagedMaterials.map((m, idx) => ({
                connection_id: -(idx + 1),
                material_id: m.id,
                material_name: m.name,
                material_code: m.code,
                material_spec: m.spec,
                material_unit: m.unit,
                quantity: m.quantity,
              })) as unknown as ConnectionModelType[])
        }
        quantityOverrides={quantityChanges}
        setMaterialId={onMaterialIdChange}
        setIsQuantityDirty={onQuantityDirtyChange}
        handleQuantityChange={handleQuantityChange}
        onDeleteConnection={handleDeleteConnection}
        onInvalidQuantity={onInvalidQuantity}
        isStagedMode={!productId}
        onStagedQuantityChange={onStagedQuantityChange}
      />

      {/* 연결된 자재 정보 삭제 확인 모달 */}
      {isDeleteModalOpen && deleteConnectionId && (
        <DeleteModal
          onClose={() => setIsDeleteModalOpen(false)}
          onDelete={handleModalConfirmDelete}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};

export default BOM;
