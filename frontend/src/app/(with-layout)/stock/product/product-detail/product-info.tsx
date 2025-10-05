import { ProductModel } from '@/types/data-model';
import InfoLabelValue from '@/ui/info-label-value';
import { useEffect, forwardRef, useImperativeHandle, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';

interface ProductInfoProps {
  formData: ProductModel;
  productId: number | null;
  onIsDirtyChange?: (isDirty: boolean) => void;
  onIsValidChange?: (isValid: boolean) => void;
}

export interface ProductInfoModel {
  getValues: () => ProductModel;
}

const ProductInfo = forwardRef<ProductInfoModel, ProductInfoProps>(
  ({ formData, productId, onIsDirtyChange, onIsValidChange }, ref) => {
    const role = useMemberStore((state) => state.role);
    const isViewer = role === 'viewer';
    const hasSubscription = useSubscriptionStore(
      (state) => state.hasSubscription
    );

    const [isStockEditing, setIsStockEditing] = useState(false);
    const [stockInputValue, setStockInputValue] = useState<string>('');

    const {
      control,
      reset,
      formState: { isDirty, isValid },
      getValues,
    } = useForm<ProductModel>({
      defaultValues: formData,
      mode: 'onChange',
    });

    // isDirty 상태가 변경될 때 부모에게 알림
    useEffect(() => {
      if (onIsDirtyChange) {
        onIsDirtyChange(isDirty);
      }
    }, [isDirty, onIsDirtyChange]);

    // isValid 상태가 변경될 때 부모에게 알림
    useEffect(() => {
      if (onIsValidChange) {
        onIsValidChange(isValid);
      }
    }, [isValid, onIsValidChange]);

    // 부모 컴포넌트에 getValues 메서드 노출
    useImperativeHandle(
      ref,
      () => ({
        getValues: () => getValues(),
      }),
      [getValues]
    );

    // product prop이 바뀌면 폼 전체를 reset으로 초기화
    useEffect(() => {
      reset(formData);
      if (onIsDirtyChange) {
        onIsDirtyChange(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productId, formData]);

    return (
      <div className="flex flex-col border-b border-lg">
        <div className="flex relative">
          <Controller
            name="name"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <InfoLabelValue
                label="품목명"
                placeholder="(필수) 품목명을 입력하세요."
                required
                value={field.value}
                onChange={(e) => {
                  field.onChange(e);
                }}
                isEditing={!isViewer && hasSubscription()}
              />
            )}
          />
          <Controller
            name="code"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <InfoLabelValue
                label="품목 코드"
                placeholder="(필수) 품목 코드를 입력하세요."
                required
                value={field.value}
                onChange={(e) => {
                  field.onChange(e);
                }}
                isEditing={!isViewer && hasSubscription()}
              />
            )}
          />
        </div>
        <div className="flex">
          <Controller
            name="spec"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <InfoLabelValue
                label="규격"
                placeholder="(필수) 규격을 입력하세요."
                isEditing={!isViewer && hasSubscription()}
                required
                value={field.value}
                onChange={(e) => {
                  field.onChange(e);
                }}
              />
            )}
          />
          <Controller
            name="unit"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <InfoLabelValue
                label="단위"
                placeholder="(필수) 단위를 입력하세요."
                isEditing={!isViewer && hasSubscription()}
                required
                value={field.value}
                onChange={(e) => {
                  field.onChange(e);
                }}
              />
            )}
          />
        </div>
        <div className="flex">
          <Controller
            name="current_stock"
            control={control}
            render={({ field }) => {
              // 입력 중일 때는 stockInputValue, 아니면 포맷된 값 표시
              const displayValue = isStockEditing
                ? stockInputValue
                : field.value === undefined || field.value === null
                  ? ''
                  : field.value === 0
                    ? '0'
                    : (() => {
                        const num = Number(field.value);
                        const abs = Math.abs(num);
                        const formatted = abs
                          .toString()
                          .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                        return num < 0 ? `-${formatted}` : formatted;
                      })();

              return (
                <InfoLabelValue
                  label="현재 재고"
                  value={displayValue}
                  isEditing={!isViewer && hasSubscription()}
                  placeholder="현재 재고 수량을 입력하세요."
                  inputType="text"
                  onFocus={() => {
                    setIsStockEditing(true);
                    // 포커스 시 현재 값으로 초기화 (쉼표 포함)
                    if (field.value === undefined || field.value === null) {
                      setStockInputValue('');
                    } else {
                      const num = Number(field.value);
                      if (num === 0) {
                        setStockInputValue('0');
                      } else {
                        const abs = Math.abs(num);
                        const formatted = abs
                          .toString()
                          .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                        setStockInputValue(
                          num < 0 ? `-${formatted}` : formatted
                        );
                      }
                    }
                  }}
                  onChange={(e) => {
                    const inputValue = e.target.value;

                    // 음수 기호 체크 (맨 앞의 -만 허용)
                    const isNegative = inputValue.startsWith('-');
                    // 숫자만 추출
                    const numValue = inputValue.replace(/[^0-9]/g, '');

                    // 표시할 값 (쉼표 포함)
                    let displayVal = '';
                    if (inputValue === '-') {
                      displayVal = '-';
                    } else if (numValue === '') {
                      displayVal = '';
                    } else {
                      const formatted = numValue.replace(
                        /\B(?=(\d{3})+(?!\d))/g,
                        ','
                      );
                      displayVal = isNegative ? `-${formatted}` : formatted;
                    }

                    setStockInputValue(displayVal);

                    // 실제 저장할 값
                    const finalValue =
                      numValue === ''
                        ? undefined
                        : Number((isNegative ? '-' : '') + numValue);
                    field.onChange(finalValue);
                  }}
                  onBlur={() => {
                    setIsStockEditing(false);
                    setStockInputValue('');
                  }}
                />
              );
            }}
          />
          <Controller
            name="average_production_time"
            control={control}
            render={({ field }) => (
              <InfoLabelValue
                label="평균 생산 시간"
                value={
                  field.value === undefined ||
                  field.value === null ||
                  (typeof field.value === 'string' && field.value === '')
                    ? '-'
                    : `${field.value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}초`
                }
                isEditing={!isViewer && hasSubscription()}
                inputType="text"
              />
            )}
          />
        </div>
        <Controller
          name="note"
          control={control}
          render={({ field }) => (
            <InfoLabelValue
              label="특이사항"
              value={field.value || ''}
              isEditing={!isViewer && hasSubscription()}
              textarea={true}
              placeholder="특이사항을 입력하세요."
              onChange={(e) => {
                field.onChange(e);
              }}
            />
          )}
        />
      </div>
    );
  }
);
ProductInfo.displayName = 'ProductInfo';

export default ProductInfo;
