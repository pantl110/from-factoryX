import { ProjectPlanModel } from '@/types/data-model';
import InfoLabelValue from '@/ui/info-label-value';
import { useForm, Controller } from 'react-hook-form';
import { formatDateTime } from '@/hooks';
import { useEffect } from 'react';

interface ProductionInfoProps {
  plan: ProjectPlanModel;
  onFormChange?: (data: {
    quantity: number;
    start_date: string;
    end_date: string;
  }) => void;
  values?: { quantity: number; start_date: string; end_date: string };
}

export const ProductionInfo = ({
  plan,
  onFormChange,
  values,
}: ProductionInfoProps) => {
  const { control, watch, reset } = useForm({
    defaultValues: {
      quantity: plan.quantity || 0,
      start_date: plan.start_date || '',
      end_date: plan.end_date || '',
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (values) {
      reset({
        quantity: values.quantity ?? plan.quantity ?? 0,
        start_date: values.start_date ?? plan.start_date ?? '',
        end_date: values.end_date ?? plan.end_date ?? '',
      });
    }
  }, [values, plan.quantity, plan.start_date, plan.end_date, reset]);

  const watchedQuantity = watch('quantity');
  const watchedStartDate = watch('start_date');
  const watchedEndDate = watch('end_date');

  // 폼 데이터 변경 시 부모 컴포넌트에 알림
  useEffect(() => {
    onFormChange?.({
      quantity: watchedQuantity,
      start_date: watchedStartDate,
      end_date: watchedEndDate,
    });
  }, [watchedQuantity, watchedStartDate, watchedEndDate, onFormChange]);

  return (
    <div className="flex flex-col gap-3">
      <h3 className="Heading-3 h-10 flex items-center">생산 상세 정보</h3>

      <div>
        <div className="flex">
          <InfoLabelValue
            label="제품명"
            value={plan.quotation_product.product.name}
          />
          <InfoLabelValue
            label="제품 코드"
            value={plan.quotation_product.product.code}
          />
        </div>
        <div className="flex">
          <InfoLabelValue
            label="규격"
            value={plan.quotation_product.product.spec}
          />
          <InfoLabelValue
            label="단위"
            value={plan.quotation_product.product.unit}
          />
        </div>
        <div className="flex">
          <InfoLabelValue
            label="주문 수량"
            value={plan.quotation_product.quantity?.toLocaleString()}
          />
          <Controller
            name="quantity"
            control={control}
            rules={{
              validate: (value) => value > 0 || '생산수량을 입력해주세요',
            }}
            render={({ field }) => (
              <InfoLabelValue
                label="생산 지시 수량"
                isEditing={true}
                value={field.value > 0 ? field.value.toLocaleString() : ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/,/g, '');
                  const numValue = parseInt(value) || 0;
                  field.onChange(numValue);
                }}
                inputType="text"
                placeholder="(필수)"
              />
            )}
          />
        </div>
        <div className="flex">
          <InfoLabelValue label="생산 설비" value={plan.equipment.name} />
          <InfoLabelValue
            label="단위당 소요 시간"
            value={`${plan.avg_production_time?.toLocaleString()}초`}
          />
        </div>
        <div className="flex">
          <Controller
            name="start_date"
            control={control}
            rules={{
              required: '생산 시작일자를 입력해주세요',
            }}
            render={({ field }) => (
              <InfoLabelValue
                label="생산 시작일자"
                isEditing={true}
                value={String(field.value || '')}
                onChange={(e) => {
                  const formatted = formatDateTime(e.target.value);
                  field.onChange(formatted);
                }}
                inputType="text"
                placeholder="YYYY-MM-DD 00:00"
              />
            )}
          />
          <Controller
            name="end_date"
            control={control}
            rules={{
              required: '생산 완료일자를 입력해주세요',
            }}
            render={({ field }) => (
              <InfoLabelValue
                label="생산 완료일자"
                isEditing={true}
                value={String(field.value || '')}
                onChange={(e) => {
                  const formatted = formatDateTime(e.target.value);
                  field.onChange(formatted);
                }}
                inputType="text"
                placeholder="YYYY-MM-DD 00:00"
              />
            )}
          />
        </div>
      </div>
    </div>
  );
};
