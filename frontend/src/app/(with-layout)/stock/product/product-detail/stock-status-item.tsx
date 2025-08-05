import Chip from '@/ui/chip';
import {
  InventoryStatusType,
  InventoryStatusColorMap,
} from '@/types/status-type';
import {
  MaterialProductConnectionModel,
  MaterialResponseModel,
} from '@/types/data-model';
import { ArrowLineUpRight, X } from '@phosphor-icons/react';
import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import useMaterialProduct from '@/hooks/stock/use-material-product';
import { handleNumberKeyDown } from '@/hooks/format-number';

interface StockStatusItemProps {
  connection: MaterialProductConnectionModel;
  materialDetail?: MaterialResponseModel;
  setIsMaterialDetailPanelOpen: (isOpen: boolean) => void;
  setMaterialId: (id: number) => void;
  setIsQuantityDirty: (isDirty: boolean) => void;
  handleQuantityChange: (connectionId: number, newQuantity: number) => void;
  onDeleteConnection: (connectionId: number) => void;
  onInvalidQuantity: (message: string) => void;
}

const StockStatusItem = ({
  connection,
  materialDetail,
  setIsMaterialDetailPanelOpen,
  setMaterialId,
  setIsQuantityDirty,
  handleQuantityChange,
  onDeleteConnection,
  onInvalidQuantity,
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
  const [displayValue, setDisplayValue] = useState('');

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

  // 천 단위 구분자 포맷팅 함수
  const formatNumberWithCommas = (value: number | null | undefined): string => {
    if (value === null || value === undefined || value === 0) return '';
    return value.toLocaleString();
  };

  // displayValue 업데이트
  useEffect(() => {
    const formValue = materialQuantityForm.watch('quantity');
    const valueToFormat =
      formValue !== undefined ? formValue : connection.quantity;
    setDisplayValue(formatNumberWithCommas(valueToFormat));
  }, [
    materialQuantityForm.watch('quantity'),
    connection.quantity,
    formatNumberWithCommas,
  ]);

  // 초기값 설정
  useEffect(() => {
    setDisplayValue(formatNumberWithCommas(connection.quantity));
  }, [connection.quantity]);

  // 수량 변경 처리
  const handleQuantityChangeLocal = (inputValue: string) => {
    // 음수 부호와 숫자가 아닌 문자 제거 (쉼표 포함)
    const cleanValue = inputValue.replace(/[^0-9]/g, '');
    const newValue = cleanValue === '' ? 0 : parseInt(cleanValue) || 0;

    materialQuantityForm.setValue('quantity', newValue, {
      shouldDirty: true,
    });

    // 상위 컴포넌트에 변경사항 전달
    handleQuantityChange(connection.connection_id, newValue);

    // 원래 값과 다르면 dirty 상태로 설정
    if (newValue !== connection.quantity) {
      setIsQuantityDirty(true);
    } else {
      setIsQuantityDirty(false);
    }
  };

  // 한글 조합 입력 완료 시 처리
  const handleCompositionEnd = (
    e: React.CompositionEvent<HTMLInputElement>
  ) => {
    // 한글 입력이 완료되면 숫자만 남기고 제거
    const target = e.target as HTMLInputElement;
    const cleanValue = target.value.replace(/[^0-9]/g, '');
    target.value = cleanValue;
    handleQuantityChangeLocal(cleanValue);
  };

  // 수량 수정 저장
  const handleSaveQuantity = async (newQuantity: number) => {
    if (isNaN(newQuantity) || newQuantity <= 0) {
      onInvalidQuantity('유효한 수량을 입력해주세요.');
      // 유효하지 않은 값이면 원래 값으로 되돌리기
      materialQuantityForm.setValue('quantity', connection.quantity || 0);
      setIsQuantityDirty(false);
      return;
    }

    setIsSaving(true);
    try {
      const result = await updateMaterialProductConnection(
        connection.connection_id,
        newQuantity
      );
      if (result.success) {
        materialQuantityForm.setValue('quantity', newQuantity);
        setIsQuantityDirty(false); // 저장 성공 시 dirty 상태 해제
      } else {
        onInvalidQuantity('수량 수정에 실패했습니다: ' + result.error);
        // 저장 실패 시 원래 값으로 되돌리기
        materialQuantityForm.setValue('quantity', connection.quantity || 0);
        setIsQuantityDirty(false);
      }
    } catch {
      onInvalidQuantity('수량 수정 중 오류가 발생했습니다.');
      // 오류 시 원래 값으로 되돌리기
      materialQuantityForm.setValue('quantity', connection.quantity || 0);
      setIsQuantityDirty(false);
    } finally {
      setIsSaving(false);
    }
  };

  // 연결 삭제 핸들러
  const handleDeleteConnection = () => {
    onDeleteConnection(connection.connection_id);
  };

  return (
    <div className="flex items-center h-14 border-b border-lg Me_Body-1 group hover:border hover:border-primary">
      <div
        className="h-full flex-1 px-3 text-dg truncate flex items-center gap-1"
        title={connection.material_name}
      >
        <p className="truncate">{connection.material_name}</p>
        <button
          className="w-9 h-9 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 ease-in-out rounded-[8px] hover:bg-bg"
          onClick={() => {
            setMaterialId(connection.material_id);
            setIsMaterialDetailPanelOpen(true);
          }}
        >
          <ArrowLineUpRight size={16} className="text-dg" />
        </button>
      </div>
      <p
        className="flex-1 px-3 text-dg truncate"
        title={connection.material_code || '-'}
      >
        {connection.material_code || '-'}
      </p>
      <p
        className="flex-1 px-3 text-dg truncate"
        title={connection.material_unit || '-'}
      >
        {connection.material_unit || '-'}
      </p>
      <p
        className="flex-[0.5] px-3 text-dg truncate"
        title={connection.material_spec || '-'}
      >
        {connection.material_spec || '-'}
      </p>
      <input
        type="text"
        className="flex-[0.5] px-3 text-dg focus:outline-none w-full min-w-0"
        value={displayValue}
        placeholder="(필수)"
        onChange={(e) => handleQuantityChangeLocal(e.target.value)}
        onBlur={(e) => {
          const cleanValue = e.target.value.replace(/[^0-9]/g, '');
          handleSaveQuantity(parseInt(cleanValue) || 0);
        }}
        onKeyDown={handleNumberKeyDown}
        onCompositionEnd={handleCompositionEnd}
        disabled={isSaving}
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
      <button
        className="w-9 h-9 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 ease-in-out rounded-[8px] hover:bg-bg"
        onClick={handleDeleteConnection}
      >
        <X size={16} className="text-dg" />
      </button>
    </div>
  );
};

export default StockStatusItem;
