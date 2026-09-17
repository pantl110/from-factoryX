import {
  InventoryStatusType,
  InventoryStatusColorMap,
} from '@/types/status-type';
import { MaterialProductConnectionModel } from '@/types/data-model';
import { ArrowLineUpRight, Trash } from '@phosphor-icons/react';
import { useForm } from 'react-hook-form';
import { useState, useEffect, useCallback } from 'react';
import {
  handleNumberKeyDown,
  handleQuantityInput,
} from '@/utils/format-number';
import IconBtn from '@/ui/icon-btn';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';
import { RoundChip } from '@/ui';
import { useTranslations } from 'next-intl';

interface StockStatusItemProps {
  connection: MaterialProductConnectionModel;
  // 상위에서 전달되는 수량 override (사용자가 입력한 최신값)
  overrideQuantity?: number;
  setMaterialId: (id: number | null) => void;
  setIsQuantityDirty: (isDirty: boolean) => void;
  handleQuantityChange: (connectionId: number, newQuantity: number) => void;
  onDeleteConnection?: (connectionId: number) => void;
  onInvalidQuantity: (message: string, subtext?: string) => void;
  isStagedMode?: boolean;
  onStagedQuantityChange?: (materialId: number, qty: number) => void;
  onOpenSubstituteMaterialsModal: (materialId: number) => void;
}

const StockStatusItem = ({
  connection,
  overrideQuantity,
  setMaterialId,
  setIsQuantityDirty,
  handleQuantityChange,
  onDeleteConnection,
  onInvalidQuantity,
  isStagedMode,
  onStagedQuantityChange,
  onOpenSubstituteMaterialsModal,
}: StockStatusItemProps) => {
  const t = useTranslations('stock.product.bom.stockStatusItem');
  const tCommon = useTranslations('common');
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );

  // 각 아이템별로 독립적인 form 생성
  const materialQuantityForm = useForm<{
    quantity: number;
  }>({
    defaultValues: {
      quantity: (overrideQuantity ?? connection.quantity) || 0,
    },
  });
  const [displayValue, setDisplayValue] = useState('');

  // 백엔드에서 받은 재고 상태 사용
  const status = connection.material_status;

  // 천 단위 구분자 포맷팅 함수
  const formatNumberWithCommas = useCallback(
    (value: number | null | undefined): string => {
      if (value === null || value === undefined || value === 0) return '';
      return value.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 4,
      });
    },
    []
  );

  // displayValue 업데이트
  useEffect(() => {
    const formValue = materialQuantityForm.watch('quantity');
    const valueToFormat =
      formValue !== undefined
        ? formValue
        : (overrideQuantity ?? connection.quantity);
    setDisplayValue(formatNumberWithCommas(valueToFormat));
  }, [
    materialQuantityForm,
    connection.quantity,
    overrideQuantity,
    formatNumberWithCommas,
  ]);

  // 초기값 설정
  useEffect(() => {
    const effective = overrideQuantity ?? connection.quantity;
    setDisplayValue(formatNumberWithCommas(effective));
    materialQuantityForm.setValue('quantity', effective || 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection.quantity, overrideQuantity]);

  // 수량 변경 처리
  const handleQuantityChangeLocal = (inputValue: string) => {
    const { displayValue, numericValue, isValid } = handleQuantityInput(
      inputValue,
      4
    );

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
        t('errors.quantityNotEntered.text'),
        t('errors.quantityNotEntered.subtext')
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
    onDeleteConnection?.(connection.connection_id);
  };

  return (
    <div className="flex items-center h-14 border-b border-lg Me_Body-3">
      <div
        className="h-full flex-1 px-3 text-dg truncate flex items-center justify-between gap-1"
        title={connection.material_name}
      >
        <p className="truncate cursor-default">{connection.material_name}</p>
        <IconBtn
          icon={ArrowLineUpRight}
          size="w-9 h-9"
          iconSize={16}
          onClick={() => {
            setMaterialId(connection.material_id);
          }}
        />
      </div>
      {/* <p
        className="flex-1 px-3 text-dg truncate cursor-default"
        title={connection.material_code || '-'}
      >
        {connection.material_code || '-'}
      </p> */}
      <p
        className="flex-[0.8] px-3 text-dg truncate cursor-default"
        title={connection.material_spec || '-'}
      >
        {connection.material_spec || '-'}
      </p>

      <div className="flex-[0.8] px-3 text-dg flex items-center overflow-hidden ">
        <input
          type="text"
          className="focus:outline-none "
          style={{
            width: `${Math.max(displayValue.length + 1, 3)}ch`,
            minWidth: '4ch',
            maxWidth: '10ch',
          }}
          value={displayValue}
          placeholder={tCommon('required')}
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
          disabled={isViewer}
        />
        {/* <span
          className="max-w-[6ch] text-dg shrink-0 cursor-default truncate"
          title={connection.material_unit || '-'}
        >
          {connection.material_unit || '-'}
        </span> */}
      </div>
      <p
        className="flex-[0.8] px-3 text-dg truncate cursor-default"
        title={connection.material_unit || '-'}
      >
        {connection.material_unit || '-'}
      </p>
      <div
        className={`flex-1 px-3 text-dg h-full flex items-center min-w-0 ${
          connection.substitutes?.length > 0
            ? 'hover:bg-bg cursor-pointer transition-colors duration-200'
            : 'cursor-default'
        }`}
        role="button"
        tabIndex={0}
        title={
          connection.substitutes?.length > 0
            ? tCommon('listFormat', {
                first: connection.substitutes?.[0],
                count: connection.substitutes?.length - 1,
              })
            : '-'
        }
        onClick={
          connection.substitutes?.length > 0
            ? () => onOpenSubstituteMaterialsModal(connection.material_id)
            : undefined
        }
      >
        <p className="truncate">
          {connection.substitutes?.length > 0
            ? tCommon('listFormat', {
                first: connection.substitutes?.[0],
                count: connection.substitutes?.length - 1,
              })
            : '-'}
        </p>
      </div>
      <div className="flex-[0.5] px-3 text-dg flex justify-between">
        {status ? (
          <RoundChip
            text={status}
            variant="sm"
            color={
              InventoryStatusColorMap[status as InventoryStatusType]?.color ??
              'gray'
            }
          />
        ) : (
          <p className="text-dg">-</p>
        )}
      </div>
      {!isViewer && hasSubscription() && (
        <div className="w-20 px-3">
          <IconBtn
            icon={Trash}
            size="w-9 h-9"
            iconSize={16}
            onClick={handleDeleteConnection}
            hoverBg={false}
            hoverText={true}
          />
        </div>
      )}
    </div>
  );
};

export default StockStatusItem;
