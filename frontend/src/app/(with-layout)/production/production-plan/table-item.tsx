import Chip from '@/ui/chip';
import {
  OperationStatusColorMap,
  InventoryStatusColorMap,
  ProjectStatusType,
  OperationStatusType,
} from '@/types/status-type';
import { ProjectPlanModel, EquipmentResponseModel } from '@/types/data-model';
import { tableHeader } from './types';
import { ArrowLineUpRight, CaretDown } from '@phosphor-icons/react/dist/ssr';
import { useState, useEffect, useMemo } from 'react';
import ProductDetail from '../../stock/product/product-detail';
import { formatDateTime } from '@/hooks/format-number';
import { useMaterialStatus } from '@/hooks';
import { useForm, Controller } from 'react-hook-form';

// Form 데이터 타입 정의
interface ProductionPlanFormDataModel {
  quantity: number;
  equipment_id: number;
  start_date: string;
  end_date: string;
}

interface TableItemProps {
  item: ProjectPlanModel;
  onOperationStatusClick?: (e: React.MouseEvent) => void;
  onFacilityClick: (e: React.MouseEvent) => void;
  onFormChange?: (
    planId: number,
    formData: ProductionPlanFormDataModel
  ) => void;
  formData?: ProductionPlanFormDataModel; // 현재 form 데이터
  equipments?: EquipmentResponseModel[]; // 설비 목록 (선택된 설비명 표시용)
  projectStatus?: ProjectStatusType;
}

const TableItem = ({
  item,
  onOperationStatusClick,
  onFacilityClick,
  onFormChange,
  formData: currentFormData,
  equipments,
  projectStatus,
}: TableItemProps) => {
  // Form 데이터를 메모이제이션하여 불필요한 re-render 방지
  const stableFormData = useMemo(() => {
    return (
      currentFormData || {
        quantity: item.quantity,
        equipment_id: item.equipment.id,
        start_date: item.start_date,
        end_date: item.end_date,
      }
    );
  }, [
    currentFormData,
    item.quantity,
    item.equipment.id,
    item.start_date,
    item.end_date,
  ]);

  // 백엔드에서 이미 한글 상태값을 반환하므로 그대로 사용
  const operationStatus = item.status as OperationStatusType;
  const { materialStatus } = useMaterialStatus(
    item.quotation_product.product.id
  ); // 품목과 연결된 자재들의 재고 상태 확인 훅 사용
  const operationColor = OperationStatusColorMap[operationStatus];
  const materialColor = InventoryStatusColorMap[materialStatus];
  const [isProductDetailOpen, setIsProductDetailOpen] = useState(false);

  // React Hook Form 설정
  const { control, watch, reset } = useForm<ProductionPlanFormDataModel>({
    defaultValues: stableFormData,
  });

  // currentFormData가 변경되면 form을 리셋 // 변경된 데이터를 React Hook Form과 동기화
  useEffect(() => {
    reset(stableFormData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stableFormData]);

  // Form 데이터 변경 시 부모 컴포넌트에 알림 (필요한 필드만 감시)
  const watchedQuantity = watch('quantity');
  const watchedEquipmentId = watch('equipment_id');
  const watchedStartDate = watch('start_date');
  const watchedEndDate = watch('end_date');

  useEffect(() => {
    onFormChange?.(item.id, {
      quantity: watchedQuantity,
      equipment_id: watchedEquipmentId,
      start_date: watchedStartDate,
      end_date: watchedEndDate,
    });
  }, [
    watchedQuantity,
    watchedEquipmentId,
    watchedStartDate,
    watchedEndDate,
    item.id,
    onFormChange,
  ]);

  // 현재 선택된 설비 정보 (formData의 equipment_id 우선, 없으면 원본 데이터)
  const selectedEquipment =
    currentFormData?.equipment_id && equipments
      ? equipments.find((eq) => eq.id === currentFormData.equipment_id) ||
        item.equipment
      : item.equipment;

  const itemData = {
    '가동 상태': (
      <Chip
        text={operationStatus}
        textColor={operationColor.textColor}
        bgColor={operationColor.bgColor}
        cursor={
          projectStatus === 'pending' || projectStatus === '생산 대기'
            ? 'cursor-default'
            : 'cursor-pointer'
        }
        onClick={(e) => {
          if (e && onOperationStatusClick) {
            e.stopPropagation();
            onOperationStatusClick(e);
          }
        }}
        state={
          projectStatus === 'pending' || projectStatus === '생산 대기'
            ? false
            : true
        }
      />
    ),
    품목명: item.quotation_product.product.name,
    품목코드: item.quotation_product.product.code,
    규격: item.quotation_product.product.spec,
    단위: item.quotation_product.product.unit,
    '주문 수량': item.quotation_product.quantity?.toLocaleString() || '0',
    '생산 수량': (
      <Controller
        name="quantity"
        control={control}
        render={({ field }) => (
          <input
            type="text"
            value={field.value?.toLocaleString() || '0'}
            onChange={(e) => {
              const value = e.target.value.replace(/,/g, '');
              const numValue = parseInt(value) || 0;
              field.onChange(numValue);
            }}
            className="w-full h-8 text-left border-none bg-transparent p-0"
            style={{ outline: 'none' }}
            disabled={operationStatus !== 'pending'}
          />
        )}
      />
    ),
    '생산 자재 상태': (
      <div className="flex gap-[27px]">
        <Chip
          text={materialStatus}
          textColor={
            operationStatus === 'completed'
              ? 'text-sv'
              : materialColor.textColor
          }
          bgColor={
            operationStatus === 'completed' ? 'bg-bg' : materialColor.bgColor
          }
        />
        {materialStatus === '부족' && operationStatus !== 'completed' && (
          <div
            className="cursor-pointer hover:bg-bg rounded-[8px] w-9 h-9 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out"
            onClick={() => setIsProductDetailOpen(true)}
          >
            <ArrowLineUpRight size={16} className="text-dg" />
          </div>
        )}
      </div>
    ),
    '생산 설비': (
      <div
        className={`flex items-center gap-2.5 ${
          operationStatus === 'completed' ? '' : 'cursor-pointer'
        }`}
        onClick={(e) => {
          if (operationStatus === 'pending') {
            e.stopPropagation();
            onFacilityClick(e);
          }
        }}
      >
        <p>{selectedEquipment.name}</p>
        {operationStatus === 'pending' && (
          <CaretDown size={16} className="text-sv" />
        )}
      </div>
    ),
    생산일자: (
      <Controller
        name="start_date"
        control={control}
        render={({ field }) => (
          <input
            type="text"
            value={field.value}
            onChange={(e) => {
              const formatted = formatDateTime(e.target.value);
              field.onChange(formatted);
            }}
            placeholder="YYYY-MM-DD 00:00"
            maxLength={16}
            className="w-full h-8 text-left border-none bg-transparent p-0"
            style={{ outline: 'none' }}
            disabled={operationStatus !== 'pending'}
          />
        )}
      />
    ),
    '단위당 소요 시간': `${item.avg_production_time}초`,
    '마감 예정일자': (
      <Controller
        name="end_date"
        control={control}
        render={({ field }) => (
          <input
            type="text"
            value={field.value}
            onChange={(e) => {
              const formatted = formatDateTime(e.target.value);
              field.onChange(formatted);
            }}
            placeholder="YYYY-MM-DD 00:00"
            maxLength={16}
            className="w-full h-8 text-left border-none bg-transparent p-0"
            style={{ outline: 'none' }}
            disabled={operationStatus !== 'pending'}
          />
        )}
      />
    ),
  };

  return (
    <>
      <div
        className={`group flex items-center min-w-[1494px] h-12 border-b border-lg Me_Body-1 bg-whit ${
          operationStatus === '가동 완료' ? 'text-gr' : 'text-dg'
        }`}
      >
        {tableHeader.map((header) => (
          <div
            key={header.name}
            className={`${header.width} px-3 truncate ${
              header.name === '가동 상태' ? 'relative' : ''
            }`}
            title={String(itemData[header.name as keyof typeof itemData] ?? '')}
          >
            {itemData[header.name as keyof typeof itemData]}
          </div>
        ))}
      </div>

      {isProductDetailOpen && (
        <ProductDetail
          productId={item.id}
          onClose={() => setIsProductDetailOpen(false)}
        />
      )}
    </>
  );
};

export default TableItem;
