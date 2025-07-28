import Chip from '@/ui/chip';
import {
  InventoryStatusType,
  InventoryStatusColorMap,
} from '@/types/status-type';
import {
  MaterialProductConnectionModel,
  MaterialResponseModel,
} from '@/types/data-model';
import { ArrowLineUpRight } from '@phosphor-icons/react';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import useMaterialProduct from '@/hooks/stock/use-material-product';

interface StockStatusItemProps {
  connection: MaterialProductConnectionModel;
  materialDetail?: MaterialResponseModel;
  setIsMaterialDetailPanelOpen: (isOpen: boolean) => void;
  setMaterialId: (id: number) => void;
  setIsQuantityDirty: (isDirty: boolean) => void;
  handleQuantityChange: (connectionId: number, newQuantity: number) => void;
}

const StockStatusItem = ({
  connection,
  materialDetail,
  setIsMaterialDetailPanelOpen,
  setMaterialId,
  setIsQuantityDirty,
  handleQuantityChange,
}: StockStatusItemProps) => {
  // 각 아이템별로 독립적인 form 생성
  const materialQuantityForm = useForm<{
    quantity: number;
  }>({
    defaultValues: {
      quantity: connection.quantity || 0,
    },
  });

  const { updateMaterialProductConnection } = useMaterialProduct();
  const [isSaving, setIsSaving] = useState(false);

  // 재고 상태를 판단
  const getStockStatus = (currentStock?: number, standardStock?: number) => {
    if (!currentStock || !standardStock) return '-';
    if (currentStock >= standardStock) return '충분';
    return '부족';
  };
  const status = getStockStatus(
    materialDetail?.current_stock,
    materialDetail?.standard_stock
  );

  // 수량 변경 처리
  const handleQuantityChangeLocal = (inputValue: string) => {
    const newValue = inputValue === '' ? 0 : parseInt(inputValue) || 0;
    materialQuantityForm.setValue('quantity', newValue, {
      shouldDirty: true,
    });

    // 상위 컴포넌트에 변경사항 전달
    handleQuantityChange(connection.id, newValue);

    // 원래 값과 다르면 dirty 상태로 설정
    if (newValue !== connection.quantity) {
      setIsQuantityDirty(true);
    } else {
      setIsQuantityDirty(false);
    }
  };

  // 수량 수정 저장
  const handleSaveQuantity = async (newQuantity: number) => {
    if (isNaN(newQuantity) || newQuantity <= 0) {
      alert('유효한 수량을 입력해주세요.');
      return;
    }

    setIsSaving(true);
    try {
      const result = await updateMaterialProductConnection(
        connection.id,
        newQuantity
      );
      if (result.success) {
        materialQuantityForm.setValue('quantity', newQuantity);
        setIsQuantityDirty(false); // 저장 성공 시 dirty 상태 해제
      } else {
        alert('수량 수정에 실패했습니다: ' + result.error);
      }
    } catch {
      alert('수량 수정 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex items-center h-14 border-b border-lg Me_Body-1 group">
      <div
        className="h-full flex-1 px-3 text-dg truncate flex items-center gap-1  hover:bg-bg transition-colors duration-200 ease-in-out cursor-pointer"
        title={materialDetail?.name}
        onClick={() => {
          setMaterialId(connection.material_id);
          setIsMaterialDetailPanelOpen(true);
        }}
      >
        <p className="truncate">{materialDetail?.name}</p>
        <div className="w-9 h-9 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out">
          <ArrowLineUpRight size={16} className="text-dg" />
        </div>
      </div>
      <p className="flex-1 px-3 text-dg">{materialDetail?.code || '-'}</p>
      <p className="flex-1 px-3 text-dg">{materialDetail?.unit || '-'}</p>
      <p className="flex-[0.5] px-3 text-dg">{materialDetail?.spec || '-'}</p>
      <input
        type="number"
        className="flex-[0.5] px-3 text-dg focus:outline-none w-full min-w-0"
        value={
          materialQuantityForm.watch('quantity') !== undefined
            ? materialQuantityForm.watch('quantity') || ''
            : connection.quantity || ''
        }
        placeholder="(필수)"
        onChange={(e) => handleQuantityChangeLocal(e.target.value)}
        onBlur={(e) => handleSaveQuantity(parseInt(e.target.value) || 0)}
        disabled={isSaving}
        min="1"
      />
      <div className="flex-[0.8] px-3 text-dg flex justify-between">
        {status === '부족' || status === '충분' ? (
          <Chip
            text={status}
            textColor={
              InventoryStatusColorMap[status as InventoryStatusType].textColor
            }
            bgColor={
              InventoryStatusColorMap[status as InventoryStatusType].bgColor
            }
          />
        ) : (
          <p className="text-dg">-</p>
        )}
      </div>
    </div>
  );
};

export default StockStatusItem;
