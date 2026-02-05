'use client';

import { useTranslations } from 'next-intl';
import { ProjectPlanModel } from '@/types/data-model';
import InfoLabelValue from '@/ui/info-label-value';
import { useForm, Controller } from 'react-hook-form';
import { formatDateTime } from '@/hooks';
import { useEffect } from 'react';
import { calculateAvgProductionTime } from '@/utils/calculate-production-time';

interface ProductionInfoProps {
  plan: ProjectPlanModel;
  onFormChange?: (data: {
    quantity: number;
    start_date: string;
    end_date: string;
  }) => void;
  onIsDirtyChange?: (isDirty: boolean) => void;
}

export const ProductionInfo = ({
  plan,
  onFormChange,
  onIsDirtyChange,
}: ProductionInfoProps) => {
  const t = useTranslations('production.productionInfo');
  const tCommon = useTranslations('common');
  const { control, watch, formState } = useForm({
    defaultValues: {
      quantity: plan.quantity || 0,
      start_date: plan.start_date || '',
      end_date: plan.end_date || '',
    },
    mode: 'onChange',
  });

  const watchedQuantity = watch('quantity');
  const watchedStartDate = watch('start_date');
  const watchedEndDate = watch('end_date');

  // 시작/종료 시간과 수량으로 한 개당 소요 시간(초) 계산
  const calculatedAvgTime = calculateAvgProductionTime(
    watchedStartDate,
    watchedEndDate,
    watchedQuantity
  );

  // 폼 데이터 변경 시 부모 컴포넌트에 알림
  useEffect(() => {
    onFormChange?.({
      quantity: watchedQuantity,
      start_date: watchedStartDate,
      end_date: watchedEndDate,
    });
  }, [watchedQuantity, watchedStartDate, watchedEndDate, onFormChange]);

  // isDirty 상태 변경 시 부모 컴포넌트에 알림
  useEffect(() => {
    onIsDirtyChange?.(formState.isDirty);
  }, [formState.isDirty, onIsDirtyChange]);

  return (
    <div className="flex flex-col gap-3">
      <h3 className="Heading-3 h-10 flex items-center">{t('title')}</h3>

      <div>
        <div className="flex">
          <InfoLabelValue
            label={tCommon('productName')}
            value={plan.quotation_product.product.name}
          />
          <InfoLabelValue
            label={tCommon('productCode')}
            value={plan.quotation_product.product.code}
          />
        </div>
        <div className="flex">
          <InfoLabelValue
            label={tCommon('specification')}
            value={plan.quotation_product.product.spec}
          />
          <InfoLabelValue
            label={tCommon('unit')}
            value={plan.quotation_product.product.unit}
          />
        </div>
        <div className="flex">
          <InfoLabelValue
            label={t('orderQuantity')}
            value={plan.quotation_product.quantity?.toLocaleString()}
          />
          <Controller
            name="quantity"
            control={control}
            rules={{
              validate: (value) =>
                value > 0 || t('validation.quantityRequired'),
            }}
            render={({ field }) => (
              <InfoLabelValue
                label={t('productionQuantity')}
                isEditing={true}
                value={field.value > 0 ? field.value.toLocaleString() : ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/,/g, '');
                  const numValue = parseInt(value) || 0;
                  field.onChange(numValue);
                }}
                inputType="text"
                placeholder={tCommon('required')}
              />
            )}
          />
        </div>
        <div className="flex">
          <InfoLabelValue
            label={tCommon('productionEquipment')}
            value={plan.equipment.name}
          />
          <InfoLabelValue
            label={t('timePerUnit')}
            value={(() => {
              // 계산된 값이 있으면 우선 사용, 없으면 백엔드 값 사용
              const displayTime =
                calculatedAvgTime !== null
                  ? calculatedAvgTime
                  : (plan.avg_production_time ?? null);

              return displayTime !== null && displayTime !== undefined
                ? `${displayTime.toLocaleString()}${tCommon('seconds')}`
                : '-';
            })()}
          />
        </div>
        <div className="flex">
          <Controller
            name="start_date"
            control={control}
            rules={{
              required: t('validation.startDateRequired'),
            }}
            render={({ field }) => (
              <InfoLabelValue
                label={t('startDate')}
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
              required: t('validation.endDateRequired'),
            }}
            render={({ field }) => (
              <InfoLabelValue
                label={t('endDate')}
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
