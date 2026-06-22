import { useTranslations } from 'next-intl';
import Chip from '@/ui/chip';
import {
  OperationStatusColorMap,
  InventoryStatusColorMap,
  ProjectStatusType,
  OperationStatusType,
  InventoryStatusType,
} from '@/types/status-type';
import { RoundChip } from '@/ui';
import { ProjectPlanModel, EquipmentResponseModel } from '@/types/data-model';
import { tableHeader } from './types';
import {
  ArrowLineUpRight,
  CaretDown,
  Trash,
} from '@phosphor-icons/react/dist/ssr';
import { useState, useEffect } from 'react';
import ProductDetail from '../../stock/product/product-detail';
import { formatDateTime } from '@/utils/format-number';
import { calculateAvgProductionTime } from '@/utils/calculate-production-time';
import { formatSecondsToDuration } from '@/utils/format-seconds';
import { useForm, Controller } from 'react-hook-form';
import MiniBtn from '@/ui/mini-btn';
import useMemberStore from '@/store/member-store';
import IconBtn from '@/ui/icon-btn';
import useSubscriptionStore from '@/store/subscription-store';

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
  onDelete?: (planId: number) => void; // 삭제 함수
  formData?: ProductionPlanFormDataModel; // 현재 form 데이터
  equipments?: EquipmentResponseModel[]; // 설비 목록 (선택된 설비명 표시용)
  projectStatus?: ProjectStatusType;
  isFirstOfProduct?: boolean; // 같은 제품의 첫 번째 plan인지 여부
  onSaveSuccess?: () => void; // 제품/자재 정보 변경 시 호출
}

const TableItem = ({
  item,
  onOperationStatusClick,
  onFacilityClick,
  onFormChange,
  onSave,
  onDelete,
  formData: currentFormData,
  equipments,
  projectStatus,
  isFirstOfProduct = true,
  onSaveSuccess,
}: TableItemProps) => {
  const tOperationStatus = useTranslations('production.operationStatus');
  const tCommon = useTranslations('common');
  const tInventoryStatus = useTranslations('common.inventoryStatus');
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );

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

  // Material status 번역 함수
  const getMaterialStatusTranslation = (status: InventoryStatusType | null) => {
    if (!status) return '-';
    switch (status) {
      case '과재고':
        return tInventoryStatus('overstock');
      case '충분':
        return tInventoryStatus('sufficient');
      case '위험':
        return tInventoryStatus('risk');
      case '부족':
        return tInventoryStatus('shortage');
      default:
        return status;
    }
  };
  const materialStatusText = getMaterialStatusTranslation(materialStatus);

  // React Hook Form 설정
  const { control, watch, reset } = useForm<ProductionPlanFormDataModel>({
    defaultValues: {
      quantity: currentFormData?.quantity ?? item.quantity,
      equipment_id: currentFormData?.equipment_id ?? item.equipment.id,
      start_date: currentFormData?.start_date ?? item.start_date ?? '', // 이미 KST로 변환된 값 사용
      end_date: currentFormData?.end_date ?? item.end_date ?? '', // 이미 KST로 변환된 값 사용
    },
  });

  // 컴포넌트 마운트 시에만 form을 초기화
  useEffect(() => {
    const formattedData = {
      quantity: currentFormData?.quantity ?? item.quantity,
      equipment_id: currentFormData?.equipment_id ?? item.equipment.id,
      start_date: currentFormData?.start_date ?? item.start_date ?? '', // 이미 KST로 변환된 값 사용
      end_date: currentFormData?.end_date ?? item.end_date ?? '', // 이미 KST로 변환된 값 사용
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

  // 시작/종료 시간과 수량으로 한 개당 소요 시간(초) 계산
  const calculatedAvgTime = calculateAvgProductionTime(
    watchedStartDate,
    watchedEndDate,
    watchedQuantity
  );

  // 원본 데이터와 비교하여 실제 변경사항이 있는지 확인
  const originalStartDate = item.start_date || '';
  const originalEndDate = item.end_date || '';
  const isNewPlan =
    (item as unknown as { is_new?: boolean })?.is_new === true ||
    (item?.id ?? 0) < 0;
  const hasChanges =
    isNewPlan ||
    watchedQuantity !== item.quantity ||
    watchedEquipmentId !== item.equipment.id ||
    watchedStartDate !== originalStartDate ||
    watchedEndDate !== originalEndDate;

  // 저장 버튼 클릭 시 호출되는 함수
  const handleSave = () => {
    const formData = {
      quantity: watchedQuantity,
      equipment_id: watchedEquipmentId,
      start_date: watchedStartDate,
      end_date: watchedEndDate,
    };

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

  // 저장 버튼 활성화 조건: 폼이 유효하고 변경사항이 있을 때
  const isSaveButtonEnabled = isOriginalFormValid && hasChanges;

  // 현재 선택된 설비 정보 (formData의 equipment_id 우선, 없으면 원본 데이터)
  const selectedEquipment =
    currentFormData?.equipment_id && equipments
      ? equipments.find((eq) => eq.id === currentFormData.equipment_id) ||
        item.equipment
      : item.equipment;

  const isDisabled =
    isViewer || !hasSubscription() || operationStatus !== 'pending';

  const itemData = {
    operationStatus: (
      <Chip
        text={
          operationStatus === 'pending'
            ? tOperationStatus('pending')
            : operationStatus === 'production'
              ? tOperationStatus('production')
              : tOperationStatus('completed')
        }
        textColor={operationColor.textColor}
        bgColor={operationColor.bgColor}
        cursor={
          projectStatus === 'pending' ||
          item.quotation_product?.is_delivery ||
          isViewer ||
          !hasSubscription()
            ? // || item.material_consumed
              'cursor-default'
            : 'cursor-pointer'
        }
        onClick={
          projectStatus === 'pending' ||
          item.quotation_product?.is_delivery ||
          isViewer ||
          !hasSubscription()
            ? // || item.material_consumed
              undefined
            : (e) => {
                if (e && onOperationStatusClick) {
                  e.stopPropagation();
                  onOperationStatusClick(e);
                }
              }
        }
        state={
          projectStatus === 'pending' ||
          item.quotation_product?.is_delivery ||
          isViewer ||
          !hasSubscription()
            ? // || item.material_consumed
              false
            : true
        }
      />
    ),
    productName: isFirstOfProduct ? (
      <span className="cursor-default">
        {item.quotation_product.product.name}
      </span>
    ) : (
      ''
    ),
    productCode: isFirstOfProduct ? (
      <span className="cursor-default">
        {item.quotation_product.product.code}
      </span>
    ) : (
      ''
    ),
    specification: isFirstOfProduct ? (
      <span className="cursor-default">
        {item.quotation_product.product.spec}
      </span>
    ) : (
      ''
    ),
    unit: isFirstOfProduct ? (
      <span className="cursor-default">
        {item.quotation_product.product.unit}
      </span>
    ) : (
      ''
    ),
    orderQuantity: isFirstOfProduct ? (
      <span className="cursor-default">
        {item.quotation_product.quantity?.toLocaleString() || '0'}
      </span>
    ) : (
      ''
    ),
    productionQuantity: (
      <Controller
        name="quantity"
        control={control}
        render={({ field }) => (
          <input
            type="text"
            value={
              field.value && field.value > 0 ? field.value.toLocaleString() : ''
            }
            placeholder={tCommon('required')}
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
            disabled={isDisabled}
          />
        )}
      />
    ),
    materialStatus: (
      <div className="flex gap-2.5 items-center">
        <RoundChip
          text={materialStatusText}
          variant="sm"
          color={
            operationStatus === 'completed'
              ? 'gray'
              : (materialColor?.color ?? 'gray')
          }
        />
        {materialStatus !== '충분' && operationStatus !== 'completed' && (
          <IconBtn
            icon={ArrowLineUpRight}
            iconSize={16}
            onClick={() => setIsProductDetailOpen(true)}
          />
        )}
      </div>
    ),
    equipment: (
      <div
        className={`flex items-center gap-2.5 justify-between ${
          operationStatus !== 'pending' || isViewer || !hasSubscription()
            ? 'cursor-default'
            : 'cursor-pointer'
        }`}
        onClick={(e) => {
          if (operationStatus === 'pending' && !isViewer && hasSubscription()) {
            e.stopPropagation();
            onFacilityClick(e, item.id);
          }
        }}
      >
        <p className="truncate" title={selectedEquipment.name}>
          {selectedEquipment.name}
        </p>
        {operationStatus === 'pending' && !isViewer && hasSubscription() && (
          <CaretDown size={16} className="text-sv shrink-0" />
        )}
      </div>
    ),
    productionDate: (
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
            disabled={isDisabled}
          />
        )}
      />
    ),
    productionTimePerUnit: (
      <span className="cursor-default">
        {(() => {
          const displayTime =
            calculatedAvgTime !== null
              ? calculatedAvgTime
              : (item.avg_production_time ?? null);

          const formatted = formatSecondsToDuration(displayTime);

          return formatted ?? '-';
        })()}
      </span>
    ),
    expectedCompletionDate: (
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
            disabled={isDisabled}
          />
        )}
      />
    ),
    '': (
      <div className="w-full h-full flex justify-between items-center">
        {operationStatus === 'pending' && !isViewer && hasSubscription() && (
          <MiniBtn
            text={tCommon('save')}
            onClick={handleSave}
            disabled={!isSaveButtonEnabled}
            hoverColor="hover:bg-bg"
            textColor="text-dg"
            borderColor="border-lg"
            height="h-8"
          />
        )}
        {!isFirstOfProduct &&
          operationStatus === 'pending' &&
          !isViewer &&
          hasSubscription() && (
            <button
              className="w-9 h-9 flex items-center justify-center rounded-[8px] hover:bg-bg transition-all duration-200 ease-in-out"
              onClick={() => onDelete?.(item.id)}
            >
              <Trash size={20} className="text-sv" />
            </button>
          )}
      </div>
    ),
  };

  return (
    <>
      <div
        className={`group flex items-center min-w-[1920px] h-12 border-b border-lg Me_Body-3 bg-whit ${
          operationStatus === 'completed' ? 'text-gr' : 'text-dg'
        }`}
      >
        {tableHeader.map((header) => (
          <div
            key={header.name}
            className={`${header.width} ${
              header.name === 'materialStatus' ? 'px-2' : 'px-3'
            } truncate ${header.name === 'operationStatus' ? 'relative' : ''}`}
            title={String(itemData[header.name as keyof typeof itemData] ?? '')}
          >
            {itemData[header.name as keyof typeof itemData]}
          </div>
        ))}
      </div>

      {isProductDetailOpen && (
        <ProductDetail
          productId={item.quotation_product.product.id}
          onClose={() => setIsProductDetailOpen(false)}
          onSuccess={() => {
            // 제품 정보 변경 시 material_status 및 제품 정보 업데이트를 위해 reload
            onSaveSuccess?.();
          }}
        />
      )}
    </>
  );
};

export default TableItem;
