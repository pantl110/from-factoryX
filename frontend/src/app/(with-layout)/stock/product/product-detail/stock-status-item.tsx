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
import { useState, useEffect, useCallback } from 'react';
import useMaterialProduct from '@/hooks/stock/use-material-product';
import {
  handleNumberKeyDown,
  handleQuantityInput,
} from '@/hooks/format-number';

interface StockStatusItemProps {
  connection: MaterialProductConnectionModel;
  materialDetail?: MaterialResponseModel;
  setIsMaterialDetailPanelOpen: (isOpen: boolean) => void;
  setMaterialId: (id: number) => void;
  setIsQuantityDirty: (isDirty: boolean) => void;
  handleQuantityChange: (connectionId: number, newQuantity: number) => void;
  onDeleteConnection: (connectionId: number) => void;
  onInvalidQuantity: (message: string, subtext?: string) => void;
  isStagedMode?: boolean;
  onStagedQuantityChange?: (materialId: number, qty: number) => void;
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
  isStagedMode,
  onStagedQuantityChange,
}: StockStatusItemProps) => {
  // 각 아이템별로 독립적인 form 생성
  const materialQuantityForm = useForm<{
    quantity: number;
  }>({
    defaultValues: {
      quantity: connection.quantity || 0,
    },
  });
  const [displayValue, setDisplayValue] = useState('');

  // 재고 상태를 판단
  const getStockStatus = (currentStock?: number, standardStock?: number) => {
    if (
      currentStock === undefined ||
      currentStock === null ||
      standardStock === undefined ||
      standardStock === null
    )
      return '-';
    if (currentStock >= standardStock) return '충분';
    return '부족';
  };
  const status = getStockStatus(
    materialDetail?.current_stock,
    materialDetail?.standard_stock
  );

  // 천 단위 구분자 포맷팅 함수
  const formatNumberWithCommas = useCallback(
    (value: number | null | undefined): string => {
      if (value === null || value === undefined || value === 0) return '';
      return value.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      });
    },
    []
  );

  // displayValue 업데이트
  useEffect(() => {
    const formValue = materialQuantityForm.watch('quantity');
    const valueToFormat =
      formValue !== undefined ? formValue : connection.quantity;
    setDisplayValue(formatNumberWithCommas(valueToFormat));
  }, [materialQuantityForm, connection.quantity, formatNumberWithCommas]);

  // 초기값 설정
  useEffect(() => {
    setDisplayValue(formatNumberWithCommas(connection.quantity));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection.quantity]);

  // 수량 변경 처리
  const handleQuantityChangeLocal = (inputValue: string) => {
    const { displayValue, numericValue, isValid } =
      handleQuantityInput(inputValue);

    // displayValue를 실시간으로 업데이트 (콤마 포함된 포맷팅 적용)
    setDisplayValue(displayValue);

    if (isValid) {
      materialQuantityForm.setValue('quantity', numericValue, {
        shouldDirty: true,
      });

      // 상위 컴포넌트에 변경사항 전달
      handleQuantityChange(connection.connection_id, numericValue);

      // 원래 값과 다르면 dirty 상태로 설정
      if (numericValue !== connection.quantity) {
        setIsQuantityDirty(true);
      } else {
        setIsQuantityDirty(false);
      }
    }
  };

  // 수량 수정 저장
  const handleSaveQuantity = async (newQuantity: number) => {
    if (isNaN(newQuantity) || newQuantity <= 0) {
      onInvalidQuantity(
        '사용수량이 입력되지 않았어요.',
        '사용수량을 입력해주세요.'
      );
      // 유효하지 않은 값이면 원래 값으로 되돌리기
      materialQuantityForm.setValue('quantity', connection.quantity || 0);
      setIsQuantityDirty(false);
      return;
    }

    // 생성 모드: 로컬 상태만 업데이트 (API 호출 없음)
    if (isStagedMode && onStagedQuantityChange) {
      onStagedQuantityChange(connection.material_id, newQuantity);
      materialQuantityForm.setValue('quantity', newQuantity);
      return;
    }

    // 수정 모드: 즉시 저장하지 않음. 값만 반영하고 dirty 유지
    materialQuantityForm.setValue('quantity', newQuantity);
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
          const cleanValue = e.target.value.replace(/[^0-9.]/g, '');
          // 소수점이 여러 개 입력되는 것을 방지
          const parts = cleanValue.split('.');
          const finalValue =
            parts.length > 2
              ? parts[0] + '.' + parts.slice(1).join('')
              : cleanValue;
          const numberValue = finalValue ? parseFloat(finalValue) : 0;

          // 저장 후 포맷팅된 값으로 displayValue 업데이트
          handleSaveQuantity(numberValue);
          setDisplayValue(formatNumberWithCommas(numberValue));
        }}
        onKeyDown={handleNumberKeyDown}
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
