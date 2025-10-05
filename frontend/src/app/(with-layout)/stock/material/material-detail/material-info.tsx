import { useGetMaterial } from '@/hooks';
import InfoLabelValue from '@/ui/info-label-value';
import { useEffect, forwardRef, useImperativeHandle, useState } from 'react';
import { useForm, Controller, ControllerRenderProps } from 'react-hook-form';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';

interface MaterialInfoProps {
  materialId: number;
  onIsDirtyChange?: (isDirty: boolean) => void;
}

export interface MaterialInfoModel {
  getValues: () => MaterialInfoFormModel;
  isDirty: boolean;
}

interface MaterialInfoFormModel {
  materialName: string;
  materialCode: string;
  size: string;
  unit: string;
  currentStock: string;
  minStock: string;
}

// Helper to remove commas
function uncomma(str: string) {
  return str.replace(/,/g, '');
}
// Helper to add commas (string only, safe for big numbers)
function addComma(num: string | number) {
  if (num === '' || num === undefined || num === null) return '';
  const str = String(num).replace(/,/g, '');
  // 소수점 이하도 지원하려면 아래 정규식 사용
  return str.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

const MaterialInfo = forwardRef<MaterialInfoModel, MaterialInfoProps>(
  ({ materialId, onIsDirtyChange }, ref) => {
    const role = useMemberStore((state) => state.role);
    const isViewer = role === 'viewer';
    const hasSubscription = useSubscriptionStore(
      (state) => state.hasSubscription
    );

    const [isStockEditing, setIsStockEditing] = useState(false);
    const [stockInputValue, setStockInputValue] = useState<string>('');

    const { getMaterialDetail } = useGetMaterial();
    const {
      control,
      reset,
      getValues,
      formState: { isDirty },
    } = useForm<MaterialInfoFormModel>({
      defaultValues: {
        materialName: '',
        materialCode: '',
        size: '',
        unit: '',
        currentStock: '',
        minStock: '',
      },
    });

    useEffect(() => {
      if (onIsDirtyChange) {
        onIsDirtyChange(isDirty);
      }
    }, [isDirty, onIsDirtyChange]);

    useImperativeHandle(
      ref,
      () => ({
        getValues,
        isDirty,
      }),
      [getValues, isDirty]
    );

    useEffect(() => {
      const fetchDetail = async () => {
        const result = await getMaterialDetail(materialId);
        if (result && result.success && result.data) {
          const mat = result.data;
          const formData = {
            materialName: mat.name ?? '',
            materialCode: mat.code ?? '',
            size: mat.spec ?? '',
            unit: mat.unit ?? '',
            currentStock:
              mat.current_stock !== undefined && mat.current_stock !== null
                ? mat.current_stock.toString()
                : '',
            minStock:
              mat.standard_stock !== undefined && mat.standard_stock !== null
                ? mat.standard_stock.toString()
                : '',
          };
          reset(formData, { keepDefaultValues: false });
          if (onIsDirtyChange) {
            onIsDirtyChange(false);
          }
        }
      };
      fetchDetail();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [materialId]);

    return (
      <div className="flex flex-col">
        <div className="flex">
          <Controller
            name="materialName"
            control={control}
            render={({ field }) => (
              <InfoLabelValue
                label="자재명"
                value={field.value ?? '-'}
                handleChange={field.onChange}
                isEditing={!isViewer && hasSubscription()}
                required
                placeholder="(필수) 자재명을 입력하세요."
              />
            )}
          />
          <Controller
            name="materialCode"
            control={control}
            render={({ field }) => (
              <InfoLabelValue
                label="자재 코드"
                value={field.value ?? '-'}
                handleChange={field.onChange}
                isEditing={!isViewer && hasSubscription()}
                required
                placeholder="(필수) 자재 코드를 입력하세요."
              />
            )}
          />
        </div>
        <div className="flex">
          <Controller
            name="size"
            control={control}
            render={({ field }) => (
              <InfoLabelValue
                label="규격"
                value={field.value ?? '-'}
                handleChange={field.onChange}
                isEditing={!isViewer && hasSubscription()}
                required
                placeholder="(필수) 규격을 입력하세요."
              />
            )}
          />
          <Controller
            name="unit"
            control={control}
            render={({ field }) => (
              <InfoLabelValue
                label="단위"
                value={field.value ?? '-'}
                handleChange={field.onChange}
                isEditing={!isViewer && hasSubscription()}
                required
                placeholder="(필수) 단위를 입력하세요."
              />
            )}
          />
        </div>
        <div className="flex">
          <Controller
            name="currentStock"
            control={control}
            render={({
              field,
            }: {
              field: ControllerRenderProps<
                MaterialInfoFormModel,
                'currentStock'
              >;
            }) => {
              // 입력 중일 때는 stockInputValue, 아니면 포맷된 값 표시
              const displayValue = isStockEditing
                ? stockInputValue
                : field.value === undefined ||
                    field.value === null ||
                    field.value === ''
                  ? ''
                  : field.value === '0'
                    ? '0'
                    : (() => {
                        // 음수 처리를 포함한 포맷팅
                        const numStr = field.value.toString();
                        const isNegative = numStr.startsWith('-');
                        const absValue = numStr.replace('-', '');
                        const formatted = addComma(absValue);
                        return isNegative ? `-${formatted}` : formatted;
                      })();

              const handleChangeCurrentStock = (
                e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
              ) => {
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

                // 실제 저장할 값 (문자열로 저장)
                const finalValue =
                  numValue === '' ? '' : (isNegative ? '-' : '') + numValue;
                field.onChange(finalValue);
              };

              return (
                <InfoLabelValue
                  label="현재 재고"
                  value={displayValue}
                  isEditing={!isViewer && hasSubscription()}
                  placeholder="현재 재고 수량을 입력하세요."
                  inputType="text"
                  handleChange={handleChangeCurrentStock}
                  onFocus={() => {
                    setIsStockEditing(true);
                    // 포커스 시 현재 값으로 초기화 (쉼표 포함)
                    if (
                      field.value === undefined ||
                      field.value === null ||
                      field.value === ''
                    ) {
                      setStockInputValue('');
                    } else {
                      const numStr = field.value.toString();
                      const isNegative = numStr.startsWith('-');
                      const absValue = numStr.replace('-', '');
                      const formatted = absValue.replace(
                        /\B(?=(\d{3})+(?!\d))/g,
                        ','
                      );
                      setStockInputValue(
                        isNegative ? `-${formatted}` : formatted
                      );
                    }
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
            name="minStock"
            control={control}
            render={({
              field,
            }: {
              field: ControllerRenderProps<MaterialInfoFormModel, 'minStock'>;
            }) => {
              const handleChangeMinStock = (
                e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
              ) => {
                const numValue = e.target.value.replace(/[^0-9]/g, '');
                field.onChange(numValue === '' ? '' : numValue);
              };
              return (
                <InfoLabelValue
                  label="최소 재고"
                  value={
                    field.value === undefined || field.value === null
                      ? ''
                      : field.value === '0'
                        ? '0'
                        : addComma(field.value)
                  }
                  isEditing={!isViewer && hasSubscription()}
                  placeholder="최소 재고를 입력하세요."
                  inputType="text"
                  handleChange={handleChangeMinStock}
                />
              );
            }}
          />
        </div>
        <div className="flex">
          <Controller
            name="currentStock"
            control={control}
            render={({ field: { value: currentStock } }) => (
              <Controller
                name="minStock"
                control={control}
                render={({ field: { value: minStock } }) => {
                  const isValid =
                    currentStock !== '' &&
                    minStock !== '' &&
                    minStock !== undefined &&
                    minStock !== null &&
                    !isNaN(Number(uncomma(currentStock))) &&
                    !isNaN(Number(uncomma(minStock)));
                  const cs = Number(uncomma(currentStock));
                  const ms = Number(uncomma(minStock));
                  const status = isValid
                    ? cs === 0
                      ? '부족'
                      : cs >= ms
                        ? '충분'
                        : '부족'
                    : '-';
                  return (
                    <InfoLabelValue
                      label="재고 상태"
                      value={status}
                      chip={
                        status === '충분' || status === '부족'
                          ? { status }
                          : undefined
                      }
                      isEditing={false}
                    />
                  );
                }}
              />
            )}
          />
        </div>
      </div>
    );
  }
);

MaterialInfo.displayName = 'MaterialInfo';

export default MaterialInfo;
