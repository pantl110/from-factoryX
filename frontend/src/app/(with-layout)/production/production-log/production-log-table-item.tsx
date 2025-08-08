import { ProjectPlanModel, ProjectStatusType } from '@/types/data-model';
import Chip from '@/ui/chip';
import { useState } from 'react';
import ProductDetail from '../../stock/product/product-detail';
import { useMaterialStatus, formatDateTime } from '@/hooks';
import { ArrowLineUpRight } from '@phosphor-icons/react';
import { useForm, Controller } from 'react-hook-form';

interface ProductionLogTableItemProps {
  plan: ProjectPlanModel;
  projectStatus: ProjectStatusType;
  onFormChange?: (
    planId: number,
    formData: { quantity: number; start_date: string; end_date: string }
  ) => void;
}

const ProductionLogTableItem = ({
  plan,
  projectStatus,
  onFormChange,
}: ProductionLogTableItemProps) => {
  const [isProductDetailOpen, setIsProductDetailOpen] = useState(false);
  const { materialStatus, isLoading: isMaterialStatusLoading } =
    useMaterialStatus(plan.quotation_product.product.id);

  // 생산 완료 상태일 때만 수정 가능
  const isEditable =
    projectStatus === '생산 완료' || projectStatus === 'manufactured';

  // React Hook Form 설정
  const { control, watch } = useForm({
    defaultValues: {
      quantity: plan.quantity || 0,
      start_date: plan.start_date || '',
      end_date: plan.end_date || '',
    },
  });

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
      start_date: field === 'start_date' ? (value as string) : watchedStartDate,
      end_date: field === 'end_date' ? (value as string) : watchedEndDate,
    });
  };
  return (
    <>
      <div className="flex items-center h-14 min-w-[1559px] border-b border-lg group Me_Body-1 text-dg">
        <p className="flex-2 px-3">{plan.quotation_product.product.name}</p>
        <p className="flex-1 px-3">{plan.quotation_product.product.code}</p>
        <p className="flex-1 px-3">{plan.quotation_product.product.spec}</p>
        <p className="w-[80px] px-3">{plan.quotation_product.product.unit}</p>
        <p className="flex-1 px-3">
          {plan.quotation_product.quantity?.toLocaleString() || '-'}
        </p>
        <div className="flex-1 px-3">
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
                  handleFormChange('quantity', numValue);
                }}
                className="w-full h-8 text-left border-none bg-transparent p-0"
                style={{ outline: 'none' }}
                disabled={!isEditable}
              />
            )}
          />
        </div>
        <p className="flex-1 px-3">{plan.equipment.name || '-'}</p>
        <div className="w-[200px] px-3">
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
        <p className="w-[140px] px-3">
          {plan.avg_production_time ? `${plan.avg_production_time}초` : '-'}
        </p>
        <div className="w-[150px] px-3">
          {!isMaterialStatusLoading && materialStatus && (
            <div className="flex justify-between">
              <Chip
                text={materialStatus}
                textColor={
                  materialStatus === '충분' ? 'text-primary' : 'text-red'
                }
                bgColor={
                  materialStatus === '충분' ? 'bg-primary-8' : 'bg-red-8'
                }
              />
              {materialStatus === '부족' && (
                <div
                  className="cursor-pointer hover:bg-bg rounded-[8px] w-9 h-9 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out"
                  onClick={() => setIsProductDetailOpen(true)}
                >
                  <ArrowLineUpRight size={16} className="text-dg" />
                </div>
              )}
            </div>
          )}
        </div>
        <div className="w-[200px] px-3">
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

        {/* 품목 디테일 판넬 보기 */}
        {isProductDetailOpen && (
          <ProductDetail
            productId={plan.quotation_product.product.id}
            onClose={() => setIsProductDetailOpen(false)}
          />
        )}
      </div>
    </>
  );
};

export default ProductionLogTableItem;
