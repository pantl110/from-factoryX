import Chip from '@/ui/chip';
import {
  OperationStatusColorMap,
  InventoryStatusColorMap,
  ProjectStatusType,
  OperationStatusType,
  InventoryStatusType,
} from '@/types/status-type';
import { ProjectPlanModel, EquipmentResponseModel } from '@/types/data-model';
import { tableHeader } from './types';
import { ArrowLineUpRight, CaretDown } from '@phosphor-icons/react/dist/ssr';
import { useState, useEffect } from 'react';
import ProductDetail from '../../stock/product/product-detail';
import { formatDateTime } from '@/hooks/format-number';

import { useForm, Controller } from 'react-hook-form';
import MiniBtn from '@/ui/mini-btn';

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
  onFacilityClick: (e: React.MouseEvent, rowId?: number | null) => void;
  onFormChange?: (
    planId: number,
    formData: ProductionPlanFormDataModel
  ) => void;
  onSave?: (planId: number, formData: ProductionPlanFormDataModel) => void; // 저장 함수 추가
  onAddPlan?: (
    planData: ProductionPlanFormDataModel,
    parentPlanId: number
  ) => void; // 추가 계획 생성 함수
  onRemoveAdditionalPlan?: (parentPlanId: number) => void; // 추가 계획 제거 함수
  formData?: ProductionPlanFormDataModel; // 현재 form 데이터
  equipments?: EquipmentResponseModel[]; // 설비 목록 (선택된 설비명 표시용)
  projectStatus?: ProjectStatusType;
}

const TableItem = ({
  item,
  onOperationStatusClick,
  onFacilityClick,
  onFormChange,
  onSave,
  onAddPlan,
  onRemoveAdditionalPlan,
  formData: currentFormData,
  equipments,
  projectStatus,
}: TableItemProps) => {
  // 백엔드에서 한글 상태값을 반환하므로 영어로 변환
  const getOperationStatus = (status: string): OperationStatusType => {
    const statusMap: Record<string, OperationStatusType> = {
      '가동 대기': 'pending',
      '가동 중': 'production',
      '가동 완료': 'completed',
      pending: 'pending',
      production: 'production',
      completed: 'completed',
    };
    return statusMap[status] || 'pending';
  };

  const operationStatus = getOperationStatus(item.status);
  // ProjectPlanModel의 material_status 필드 사용
  const materialStatus = item.material_status as InventoryStatusType;
  const operationColor =
    OperationStatusColorMap[operationStatus] || OperationStatusColorMap.pending;
  const materialColor = InventoryStatusColorMap[materialStatus];
  const [isProductDetailOpen, setIsProductDetailOpen] = useState(false);

  // React Hook Form 설정
  const { control, watch, reset } = useForm<ProductionPlanFormDataModel>({
    defaultValues: {
      quantity: currentFormData?.quantity ?? item.quantity,
      equipment_id: currentFormData?.equipment_id ?? item.equipment.id,
      start_date:
        currentFormData?.start_date ??
        (item.start_date
          ? new Date(item.start_date)
              .toISOString()
              .slice(0, 16)
              .replace('T', ' ')
          : ''),
      end_date:
        currentFormData?.end_date ??
        (item.end_date
          ? new Date(item.end_date).toISOString().slice(0, 16).replace('T', ' ')
          : ''),
    },
  });

  // 컴포넌트 마운트 시에만 form을 초기화
  useEffect(() => {
    const formattedData = {
      quantity: currentFormData?.quantity ?? item.quantity,
      equipment_id: currentFormData?.equipment_id ?? item.equipment.id,
      start_date:
        currentFormData?.start_date ??
        (item.start_date
          ? new Date(item.start_date)
              .toISOString()
              .slice(0, 16)
              .replace('T', ' ')
          : ''),
      end_date:
        currentFormData?.end_date ??
        (item.end_date
          ? new Date(item.end_date).toISOString().slice(0, 16).replace('T', ' ')
          : ''),
    };
    reset(formattedData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentFormData,
    item.start_date,
    item.end_date,
    item.quantity,
    item.equipment.id,
  ]);

  // Form 데이터 변경 시 부모 컴포넌트에 알림 (필요한 필드만 감시)
  const watchedQuantity = watch('quantity');
  const watchedEquipmentId = watch('equipment_id');
  const watchedStartDate = watch('start_date');
  const watchedEndDate = watch('end_date');

  // 생산수량에 따라 추가 계획 동적 관리
  useEffect(() => {
    const orderQuantity = item.quotation_product.quantity || 0;

    if (watchedQuantity > 0 && watchedQuantity < orderQuantity && onAddPlan) {
      // 생산 수량이 주문 수량보다 작으면 추가 계획 생성
      const bufferRate = item.quotation_product.product.buffer_rate || 0;
      const remainingQuantity = orderQuantity - watchedQuantity;
      const bufferedQuantity = Math.ceil(remainingQuantity * (1 + bufferRate));

      onAddPlan(
        {
          quantity: bufferedQuantity,
          equipment_id: watchedEquipmentId,
          start_date: watchedStartDate,
          end_date: watchedEndDate,
        },
        item.id
      );
    } else if (watchedQuantity >= orderQuantity && onRemoveAdditionalPlan) {
      // 생산 수량이 주문 수량보다 크거나 같으면 추가 계획 제거
      onRemoveAdditionalPlan(item.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    watchedQuantity,
    item.quotation_product.quantity,
    item.quotation_product.product.buffer_rate,
    item.id,
  ]);

  // 저장 버튼 클릭 시 호출되는 함수
  const handleSave = () => {
    const formData = {
      quantity: watchedQuantity,
      equipment_id: watchedEquipmentId,
      start_date: watchedStartDate,
      end_date: watchedEndDate,
    };

    // 원본 데이터와 비교하여 실제 변경사항이 있는지 확인
    const originalStartDate = item.start_date
      ? new Date(item.start_date).toISOString().slice(0, 16).replace('T', ' ')
      : '';
    const originalEndDate = item.end_date
      ? new Date(item.end_date).toISOString().slice(0, 16).replace('T', ' ')
      : '';

    const hasChanges =
      watchedQuantity !== item.quantity ||
      watchedEquipmentId !== item.equipment.id ||
      watchedStartDate !== originalStartDate ||
      watchedEndDate !== originalEndDate;

    if (hasChanges && onSave) {
      onSave(item.id, formData);
    }
  };

  // 원본 플랜 폼 유효성 검사
  const isOriginalFormValid =
    watchedQuantity > 0 &&
    watchedEquipmentId &&
    watchedStartDate &&
    watchedEndDate;

  // 현재 선택된 설비 정보 (formData의 equipment_id 우선, 없으면 원본 데이터)
  const selectedEquipment =
    currentFormData?.equipment_id && equipments
      ? equipments.find((eq) => eq.id === currentFormData.equipment_id) ||
        item.equipment
      : item.equipment;

  const itemData = {
    '가동 상태': (
      <Chip
        text={
          operationStatus === 'pending'
            ? '가동 대기'
            : operationStatus === 'production'
              ? '가동 중'
              : '가동 완료'
        }
        textColor={operationColor.textColor}
        bgColor={operationColor.bgColor}
        cursor={
          projectStatus === 'pending' || item.quotation_product?.is_delivery
            ? 'cursor-default'
            : 'cursor-pointer'
        }
        onClick={
          projectStatus === 'pending' || item.quotation_product?.is_delivery
            ? undefined
            : (e) => {
                if (e && onOperationStatusClick) {
                  e.stopPropagation();
                  onOperationStatusClick(e);
                }
              }
        }
        state={
          projectStatus === 'pending' || item.quotation_product?.is_delivery
            ? false
            : true
        }
      />
    ),
    품목명: item.quotation_product.product.name,
    품목코드: item.quotation_product.product.code,
    규격: item.quotation_product.product.spec,
    단위: item.quotation_product.product.unit,
    '주문 수량':
      item.id < 0
        ? ''
        : item.quotation_product.quantity?.toLocaleString() || '0',
    '생산 수량': (
      <Controller
        name="quantity"
        control={control}
        render={({ field }) => (
          <input
            type="text"
            value={
              field.value && field.value > 0 ? field.value.toLocaleString() : ''
            }
            placeholder="(필수)"
            onChange={(e) => {
              const value = e.target.value.replace(/,/g, '');
              const numValue = parseInt(value) || 0;
              field.onChange(numValue);
              // 부모 컴포넌트에 변경사항 알림
              if (onFormChange) {
                onFormChange(item.id, {
                  quantity: numValue,
                  equipment_id: watchedEquipmentId,
                  start_date: watchedStartDate,
                  end_date: watchedEndDate,
                });
              }
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
            onFacilityClick(e, item.id);
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
            value={field.value || ''}
            onChange={(e) => {
              const formatted = formatDateTime(e.target.value);
              field.onChange(formatted);
              // 부모 컴포넌트에 변경사항 알림
              if (onFormChange) {
                onFormChange(item.id, {
                  quantity: watchedQuantity,
                  equipment_id: watchedEquipmentId,
                  start_date: formatted,
                  end_date: watchedEndDate,
                });
              }
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
            value={field.value || ''}
            onChange={(e) => {
              const formatted = formatDateTime(e.target.value);
              field.onChange(formatted);
              // 부모 컴포넌트에 변경사항 알림
              if (onFormChange) {
                onFormChange(item.id, {
                  quantity: watchedQuantity,
                  equipment_id: watchedEquipmentId,
                  start_date: watchedStartDate,
                  end_date: formatted,
                });
              }
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
    '': (
      <MiniBtn
        text="저장"
        onClick={handleSave}
        disabled={operationStatus === 'completed' || !isOriginalFormValid}
        hoverColor="hover:bg-bg"
        textColor="text-dg"
        borderColor="border-lg"
        height="h-8"
      />
    ),
  };

  return (
    <>
      <div
        className={`group flex items-center min-w-[1729px] h-12 border-b border-lg Me_Body-1 bg-whit ${
          operationStatus === 'completed' ? 'text-gr' : 'text-dg'
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
