import { ProjectPlanModel, ProjectStatusType } from '@/types/data-model';
import Chip from '@/ui/chip';
import { useEffect, useState } from 'react';
import ProductDetail from '../../stock/product/product-detail';
import { formatDateTime } from '@/hooks';
import { ArrowLineUpRight } from '@phosphor-icons/react';
import { useForm, Controller } from 'react-hook-form';
import MiniBtn from '@/ui/mini-btn';
import IconBtn from '@/ui/icon-btn';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';
import { ProductionResultPanel } from './production-result-panel';
import { RoundChip } from '@/ui';
import { InventoryStatusColorMap } from '@/types/status-type';

interface ProductionLogTableItemProps {
  plan: ProjectPlanModel;
  projectStatus: ProjectStatusType;
  onFormChange?: (
    planId: number,
    formState: { quantity: number; start_date: string; end_date: string }
  ) => void;
  onSave?: () => void;
  hasChanges?: boolean;
  onValidityChange?: (planId: number, isValid: boolean) => void;
  isFirstOfProduct?: boolean; // 같은 제품의 첫 번째 plan인지 여부
  onSaveSuccess?: () => void;
}

const ProductionLogTableItem = ({
  plan,
  projectStatus,
  onFormChange,
  onSave,
  hasChanges,
  onValidityChange,
  isFirstOfProduct,
  onSaveSuccess,
}: ProductionLogTableItemProps) => {
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );

  // 생산 완료 상태일 때만 수정 가능 // 조회자가 아닐때만 수정 가능
  const isEditable =
    projectStatus === 'manufactured' && !isViewer && hasSubscription();

  // React Hook Form 설정
  const { control, watch, formState } = useForm({
    defaultValues: {
      quantity: plan.quantity || 0,
      start_date: plan.start_date || '',
      end_date: plan.end_date || '',
    },
    mode: 'onChange', // 입력 시마다 유효성 검사
  });

  const [isProductDetailOpen, setIsProductDetailOpen] = useState(false);
  const [isProductionResultPanelOpen, setIsProductionResultPanelOpen] =
    useState(false);

  // 부모에 유효성 변경 알림
  useEffect(() => {
    onValidityChange?.(plan.id, formState.isValid);
  }, [formState.isValid, onValidityChange, plan.id]);

  // Form 데이터 변경 시 부모 컴포넌트에 알림
  const watchedQuantity = watch('quantity');
  const watchedStartDate = watch('start_date');
  const watchedEndDate = watch('end_date');

  const handleFormChange = (
    field: 'quantity' | 'start_date' | 'end_date',
    value: string | number
  ) => {
    onFormChange?.(plan.id, {
      quantity: field === 'quantity' ? (value as number) : watchedQuantity,
      start_date:
        field === 'start_date'
          ? (value as string)
          : String(watchedStartDate || ''),
      end_date:
        field === 'end_date' ? (value as string) : String(watchedEndDate || ''),
    });
  };

  return (
    <>
      <div className="flex items-center h-14 min-w-[1640px] border-b border-lg group Me_Body-1 text-dg">
        <p
          className="flex-2 px-3 truncate cursor-default"
          title={isFirstOfProduct ? plan.quotation_product.product.name : ''}
        >
          {isFirstOfProduct ? plan.quotation_product.product.name : ''}
        </p>
        <p
          className="flex-1 px-3 truncate cursor-default"
          title={isFirstOfProduct ? plan.quotation_product.product.code : ''}
        >
          {isFirstOfProduct ? plan.quotation_product.product.code : ''}
        </p>
        <p
          className="flex-1 px-3 truncate cursor-default"
          title={isFirstOfProduct ? plan.quotation_product.product.spec : ''}
        >
          {isFirstOfProduct ? plan.quotation_product.product.spec : ''}
        </p>
        <p
          className="w-[80px] px-3 truncate cursor-default"
          title={isFirstOfProduct ? plan.quotation_product.product.unit : ''}
        >
          {isFirstOfProduct ? plan.quotation_product.product.unit : ''}
        </p>
        <p
          className="flex-1 px-3 truncate cursor-default"
          title={
            isFirstOfProduct
              ? plan.quotation_product.quantity?.toLocaleString() || '-'
              : ''
          }
        >
          {isFirstOfProduct
            ? plan.quotation_product.quantity?.toLocaleString() || '-'
            : ''}
        </p>
        <div className="flex-1 px-3">
          <Controller
            name="quantity"
            control={control}
            rules={{
              validate: (value) => value > 0 || '생산수량을 입력해주세요',
            }}
            render={({ field }) => (
              <input
                type="text"
                value={field.value > 0 ? field.value.toLocaleString() : ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/,/g, '');
                  const numValue = parseInt(value) || 0;
                  field.onChange(numValue);
                  handleFormChange('quantity', numValue);
                }}
                className="w-full h-8 text-left border-none bg-transparent p-0"
                style={{ outline: 'none' }}
                disabled={!isEditable}
                placeholder="(필수)"
              />
            )}
          />
        </div>
        <p
          className="flex-1 px-3 truncate cursor-default"
          title={plan.equipment.name || '-'}
        >
          {plan.equipment.name || '-'}
        </p>
        <div className="w-[200px] px-3">
          <Controller
            name="start_date"
            control={control}
            rules={{
              required: '시작일을 입력해주세요',
            }}
            render={({ field }) => (
              <input
                type="text"
                value={String(field.value || '')}
                onChange={(e) => {
                  const formatted = formatDateTime(e.target.value);
                  field.onChange(formatted);
                  handleFormChange('start_date', formatted);
                }}
                placeholder="YYYY-MM-DD 00:00"
                maxLength={16}
                className="w-full h-8 text-left border-none bg-transparent p-0"
                style={{ outline: 'none' }}
                disabled={!isEditable}
              />
            )}
          />
        </div>
        <p className="w-[140px] px-3 cursor-default">
          {plan.avg_production_time !== null
            ? `${plan.avg_production_time.toLocaleString()}초`
            : '-'}
        </p>
        <div className="w-[150px] px-2">
          <div className="flex items-center gap-2.5">
            <RoundChip
              text={plan.material_status}
              variant="sm"
              color={
                InventoryStatusColorMap[
                  plan.material_status as keyof typeof InventoryStatusColorMap
                ]?.color ?? 'gray'
              }
            />
            {plan.material_status !== '충분' && (
              <IconBtn
                icon={ArrowLineUpRight}
                iconSize={16}
                iconColor="text-sv"
                onClick={() => setIsProductDetailOpen(true)}
              />
            )}
          </div>
        </div>
        <div className="w-[200px] px-3">
          <Controller
            name="end_date"
            control={control}
            rules={{
              required: '종료일을 입력해주세요',
            }}
            render={({ field }) => (
              <input
                type="text"
                value={String(field.value || '')}
                onChange={(e) => {
                  const formatted = formatDateTime(e.target.value);
                  field.onChange(formatted);
                  handleFormChange('end_date', formatted);
                }}
                placeholder="YYYY-MM-DD 00:00"
                maxLength={16}
                className="w-full h-8 text-left border-none bg-transparent p-0"
                style={{ outline: 'none' }}
                disabled={!isEditable}
              />
            )}
          />
        </div>
        {isEditable && (
          <div className="w-[260px] px-3 flex gap-2">
            <MiniBtn
              text="저장하기"
              variant="whiteOutline"
              height="h-8"
              onClick={onSave}
              disabled={!hasChanges || !formState.isValid}
            />
            <MiniBtn
              text={
                plan.material_consumed &&
                plan.defective_quantity !== undefined &&
                plan.defective_quantity !== null &&
                plan.defective_quantity > 0
                  ? '상세 보기'
                  : '결과 입력하기'
              }
              variant={
                plan.material_consumed &&
                plan.defective_quantity !== undefined &&
                plan.defective_quantity !== null &&
                plan.defective_quantity > 0
                  ? 'whiteOutline'
                  : 'secondary'
              }
              height="h-8"
              onClick={() => setIsProductionResultPanelOpen(true)}
            />
          </div>
        )}

        {/* 제품 디테일 판넬 보기 */}
        {isProductDetailOpen && (
          <ProductDetail
            productId={plan.quotation_product.product.id}
            onClose={() => setIsProductDetailOpen(false)}
            onSuccess={() => {
              // 제품 정보 변경 시 material_status 및 제품 정보 업데이트를 위해 reload
              onSaveSuccess?.();
            }}
          />
        )}
      </div>

      {/* 생산 결과 입력 판넬 */}
      {isProductionResultPanelOpen && (
        <ProductionResultPanel
          onClose={() => setIsProductionResultPanelOpen(false)}
          plan={plan}
          onSaveSuccess={onSaveSuccess}
        />
      )}
    </>
  );
};

export default ProductionLogTableItem;
