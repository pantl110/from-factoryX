import { useGetMaterial } from '@/hooks';
import InfoLabelValue from '@/ui/info-label-value';
import { useEffect, forwardRef, useImperativeHandle, useState } from 'react';
import { useForm, Controller, ControllerRenderProps } from 'react-hook-form';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';
import { MaterialType } from '@/types/status-type';
import { formatDate } from '@/utils';
import { WarningCircle } from '@phosphor-icons/react';

interface MaterialInfoProps {
  materialId: number;
  onIsDirtyChange?: (isDirty: boolean) => void;
}

export interface MaterialInfoModel {
  getValues: () => MaterialInfoFormModel;
  isDirty: boolean;
}

interface MaterialInfoFormModel {
  materialType: string;
  materialName: string;
  materialCode: string;
  size: string;
  unit: string;
  stockUnit: string;
  currentStock: string;
  safeStock: string;
  minStock: string; // rop
  unitWeight: string;
  expirationDate: string;
  memo: string;
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

// Helper to calculate stock status
function calculateStockStatus(currentStock: string, minStock: string) {
  const isValid =
    currentStock !== '' &&
    minStock !== '' &&
    minStock !== undefined &&
    minStock !== null &&
    !isNaN(Number(uncomma(currentStock))) &&
    !isNaN(Number(uncomma(minStock)));

  if (!isValid) return null;

  const cs = Number(uncomma(currentStock));
  const ms = Number(uncomma(minStock));

  return cs === 0 ? '부족' : cs >= ms ? '충분' : '부족';
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
        materialType: '',
        materialName: '',
        materialCode: '',
        size: '',
        unit: '',
        stockUnit: '',
        currentStock: '',
        safeStock: '',
        minStock: '', // rop
        unitWeight: '',
        expirationDate: '',
        memo: '',
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
            materialType: 'rawMaterial', // TODO: 설정 변경 설정
            materialName: mat.name ?? '',
            materialCode: mat.code ?? '',
            size: mat.spec ?? '',
            unit: mat.unit ?? '',
            stockUnit: 'EA', // TODO: 재고 관리 단위 추가
            currentStock:
              mat.current_stock !== undefined && mat.current_stock !== null
                ? mat.current_stock.toString()
                : '',
            safeStock: '', // TODO: 안전재고 추가
            minStock:
              mat.standard_stock !== undefined && mat.standard_stock !== null
                ? mat.standard_stock.toString()
                : '',
            unitWeight: '', // TODO: 단위 중량 추가
            expirationDate: '', // TODO: 유통기한 추가
            memo: '', // TODO: 메모 추가
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
      <>
        <div className="flex flex-col">
          <div className="flex">
            <Controller
              name="materialType"
              control={control}
              render={({ field }) => (
                <InfoLabelValue
                  label="구분"
                  chip={{
                    status: (field.value as MaterialType) || 'rawMaterial',
                  }}
                  handleChange={field.onChange}
                  // isEditing={!isViewer && hasSubscription()}
                  required
                />
              )}
            />
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
          </div>
          <div className="flex">
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
          </div>
          <div className="flex">
            <Controller
              name="unit"
              control={control}
              render={({ field }) => (
                <InfoLabelValue
                  label="개별 단위"
                  value={field.value ?? '-'}
                  handleChange={field.onChange}
                  isEditing={!isViewer && hasSubscription()}
                  placeholder="개별 단위를 입력하세요."
                />
              )}
            />
            <Controller
              name="stockUnit"
              control={control}
              render={({ field }) => (
                <InfoLabelValue
                  label="재고 관리 단위"
                  value={field.value ?? '-'}
                  handleChange={field.onChange}
                  isEditing={!isViewer && hasSubscription()}
                  placeholder="재고 관리 단위를 입력하세요."
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

                // 재고 상태 계산
                const minStockValue = getValues('minStock');
                const stockStatus = calculateStockStatus(
                  field.value,
                  minStockValue
                );

                return (
                  <InfoLabelValue
                    label="현재 재고"
                    chip={
                      stockStatus === '부족'
                        ? {
                            status: 'danger',
                          }
                        : undefined
                    }
                    value={displayValue}
                    isEditing={!isViewer && hasSubscription()}
                    placeholder="현재 재고를 입력하세요."
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
              name="safeStock"
              control={control}
              render={({
                field,
              }: {
                field: ControllerRenderProps<
                  MaterialInfoFormModel,
                  'safeStock'
                >;
              }) => {
                const handleChangeRop = (
                  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                ) => {
                  const numValue = e.target.value.replace(/[^0-9]/g, '');
                  field.onChange(numValue === '' ? '' : numValue);
                };
                return (
                  <InfoLabelValue
                    label="안전재고"
                    value={
                      field.value === undefined || field.value === null
                        ? ''
                        : field.value === '0'
                          ? '0'
                          : addComma(field.value)
                    }
                    isEditing={!isViewer && hasSubscription()}
                    placeholder="안전재고를 입력하세요."
                    inputType="text"
                    handleChange={handleChangeRop}
                  />
                );
              }}
            />
          </div>
          <div className="flex">
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
                    label="ROP"
                    value={
                      field.value === undefined || field.value === null
                        ? ''
                        : field.value === '0'
                          ? '0'
                          : addComma(field.value)
                    }
                    isEditing={!isViewer && hasSubscription()}
                    placeholder="ROP를 입력하세요."
                    inputType="text"
                    handleChange={handleChangeMinStock}
                  />
                );
              }}
            />
            <Controller
              name="currentStock"
              control={control}
              render={({ field: { value: currentStock } }) => (
                <Controller
                  name="minStock"
                  control={control}
                  render={({ field: { value: minStock } }) => {
                    const status =
                      calculateStockStatus(currentStock, minStock) || '-';
                    return (
                      <InfoLabelValue
                        label="재고 상태"
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
          <div className="flex">
            <Controller
              name="unitWeight"
              control={control}
              render={({ field }) => (
                <InfoLabelValue
                  label="단위 중량"
                  value={field.value ?? '-'}
                  handleChange={field.onChange}
                  isEditing={!isViewer && hasSubscription()}
                  required
                  placeholder="(필수) 단위 중량을 입력하세요."
                />
              )}
            />
            <Controller
              name="expirationDate"
              control={control}
              render={({ field }) => {
                const handleChangeExpirationDate = (
                  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                ) => {
                  const formattedValue = formatDate(e.target.value);
                  field.onChange(formattedValue);
                };

                return (
                  <InfoLabelValue
                    label="유통기한"
                    value={field.value ?? '-'}
                    handleChange={handleChangeExpirationDate}
                    isEditing={!isViewer && hasSubscription()}
                    placeholder="유통기한을 입력하세요."
                  />
                );
              }}
            />
          </div>
          <div className="flex">
            <Controller
              name="memo"
              control={control}
              render={({ field }) => (
                <InfoLabelValue
                  label="특이사항"
                  value={field.value ?? '-'}
                  handleChange={field.onChange}
                  isEditing={!isViewer && hasSubscription()}
                  placeholder="특이사항을 입력하세요."
                  textarea={true}
                  onChange={(e) => {
                    field.onChange(e);
                  }}
                />
              )}
            />
          </div>
        </div>

        <div className="px-4 py-2 flex gap-1 rounded-[8px] bg-bg items-center">
          <div className="w-4 h-4 flex items-center justify-center">
            <WarningCircle size={16} className="text-sv" />
          </div>
          <span className="text-sv Re_Body-2">
            개별 단위는 품목 한 개 기준의 단위이고, 재고 관리 단위는 입·출고 시
            수량을 관리하는 기준이에요.
          </span>
        </div>
      </>
    );
  }
);

MaterialInfo.displayName = 'MaterialInfo';

export default MaterialInfo;
