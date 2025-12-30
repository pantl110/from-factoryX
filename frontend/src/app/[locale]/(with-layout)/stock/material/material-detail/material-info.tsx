import { useGetMaterial } from '@/hooks';
import InfoLabelValue from '@/ui/info-label-value';
import {
  useEffect,
  forwardRef,
  useImperativeHandle,
  useState,
  useCallback,
} from 'react';
import { useForm, Controller, ControllerRenderProps } from 'react-hook-form';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';
import {
  getMaterialStockStatus,
  removeTrailingZeros,
  handleQuantityInput,
} from '@/utils';
import { ExpiryStatusType } from '@/types/status-type';
import { mapExpiryStatus, mapMaterialToFormData } from './utils';

interface MaterialInfoProps {
  materialId: number;
  onIsDirtyChange?: (isDirty: boolean) => void;
  onRequiredFieldsChange?: (areFilled: boolean) => void;
  onExpiryWarningDaysChange?: (days: number | null) => void;
}

export interface MaterialInfoModel {
  getValues: () => MaterialInfoFormModel;
  isDirty: boolean;
  areRequiredFieldsFilled: () => boolean;
  refetchMaterialInfo: () => Promise<void>;
}

interface MaterialInfoFormModel {
  materialName: string;
  materialCode: string;
  size: string;
  unit: string;
  currentStock: string;
  standardStock: string;
  rop: string; // rop
  maxStock: string; // 적정 재고 (최대 재고)
  expiryDays: string;
  memo: string;
}

// Helper to remove commas
function uncomma(str: string) {
  return str.replace(/,/g, '');
}

// Helper to convert string to number (handles commas and empty strings)
function stringToNumber(str: string | undefined | null): number | null {
  if (str === undefined || str === null || str === '') return null;
  const num = Number(uncomma(str));
  return isNaN(num) ? null : num;
}

const MaterialInfo = forwardRef<MaterialInfoModel, MaterialInfoProps>(
  (
    {
      materialId,
      onIsDirtyChange,
      onRequiredFieldsChange,
      onExpiryWarningDaysChange,
    },
    ref
  ) => {
    const role = useMemberStore((state) => state.role);
    const isViewer = role === 'viewer';
    const hasSubscription = useSubscriptionStore(
      (state) => state.hasSubscription
    );

    const [isStockEditing, setIsStockEditing] = useState(false);
    const [stockInputValue, setStockInputValue] = useState<string>('');
    const [isExpiryDaysEditing, setIsExpiryDaysEditing] = useState(false);
    const [expiryStatus, setExpiryStatus] = useState<ExpiryStatusType | null>(
      null
    );
    const [isStandardStockEditing, setIsStandardStockEditing] = useState(false);
    const [standardStockInputValue, setStandardStockInputValue] =
      useState<string>('');
    const [isRopEditing, setIsRopEditing] = useState(false);
    const [ropInputValue, setRopInputValue] = useState<string>('');
    const [isMaxStockEditing, setIsMaxStockEditing] = useState(false);
    const [maxStockInputValue, setMaxStockInputValue] = useState<string>('');

    const { getMaterialDetail } = useGetMaterial();
    const {
      control,
      reset,
      getValues,
      watch,
      formState: { isDirty },
    } = useForm<MaterialInfoFormModel>({
      defaultValues: {
        materialName: '',
        materialCode: '',
        size: '',
        unit: '',
        currentStock: '',
        standardStock: '', // 안전 재고
        rop: '', // rop
        maxStock: '', // 적정 재고 (최대 재고)
        expiryDays: '',
        memo: '',
      },
    });

    useEffect(() => {
      if (onIsDirtyChange) {
        onIsDirtyChange(isDirty);
      }
    }, [isDirty, onIsDirtyChange]);

    // 필수 필드들을 watch하여 실시간으로 검증
    const materialName = watch('materialName');
    const materialCode = watch('materialCode');
    const size = watch('size');
    const unit = watch('unit');
    const expiryDaysValue = watch('expiryDays');

    const areRequiredFieldsFilled = useCallback(() => {
      return !!(
        String(materialName || '').trim() !== '' &&
        String(materialCode || '').trim() !== '' &&
        String(unit || '').trim() !== '' &&
        String(size || '').trim() !== ''
      );
    }, [materialName, materialCode, unit, size]);

    // 필수 필드 값이 변경될 때마다 상위 컴포넌트에 알림
    useEffect(() => {
      if (onRequiredFieldsChange) {
        onRequiredFieldsChange(areRequiredFieldsFilled());
      }
    }, [
      materialName,
      materialCode,
      unit,
      size,
      areRequiredFieldsFilled,
      onRequiredFieldsChange,
    ]);

    const parseExpiryDaysToNumber = useCallback((value?: string) => {
      if (!value || value.trim() === '') {
        return null;
      }
      const numericValue = parseInt(value.replace(/[^0-9]/g, ''), 10);
      return Number.isNaN(numericValue) ? null : numericValue;
    }, []);

    useEffect(() => {
      if (!onExpiryWarningDaysChange) return;
      onExpiryWarningDaysChange(parseExpiryDaysToNumber(expiryDaysValue));
    }, [expiryDaysValue, onExpiryWarningDaysChange, parseExpiryDaysToNumber]);

    const fetchDetail = useCallback(async () => {
      const result = await getMaterialDetail(materialId);
      if (!result?.success || !result.data) return;

      const mat = result.data;
      reset(mapMaterialToFormData(mat), { keepDefaultValues: false });
      setExpiryStatus(mapExpiryStatus(mat.expiry_status));
      onIsDirtyChange?.(false);
    }, [getMaterialDetail, materialId, onIsDirtyChange, reset]);

    useImperativeHandle(
      ref,
      () => ({
        getValues,
        isDirty,
        areRequiredFieldsFilled,
        refetchMaterialInfo: fetchDetail,
      }),
      [getValues, isDirty, areRequiredFieldsFilled, fetchDetail]
    );

    useEffect(() => {
      fetchDetail();
    }, [fetchDetail]);

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
                placeholder="단위를 입력하세요."
                required
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
                        const formatted = removeTrailingZeros(absValue);
                        return isNegative ? `-${formatted}` : formatted;
                      })();

              const handleChangeCurrentStock = (
                e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
              ) => {
                const inputValue = e.target.value;

                // 음수 기호 체크 (맨 앞의 -만 허용)
                const isNegative = inputValue.startsWith('-');
                // 음수 기호 제거 후 handleQuantityInput 적용
                const valueWithoutSign = isNegative
                  ? inputValue.slice(1)
                  : inputValue;
                const result = handleQuantityInput(valueWithoutSign);

                // 음수 기호를 포함한 displayValue 생성
                let displayVal = result.displayValue;
                // 0 입력 시 displayValue가 빈 문자열이 되는 경우 처리
                if (
                  result.numericValue === 0 &&
                  valueWithoutSign !== '' &&
                  !valueWithoutSign.endsWith('.')
                ) {
                  displayVal = '0';
                } else if (inputValue === '-') {
                  displayVal = '-';
                } else if (isNegative && result.displayValue) {
                  displayVal = `-${result.displayValue}`;
                } else if (isNegative && valueWithoutSign.endsWith('.')) {
                  // 음수이고 소수점 입력 중 (예: "-100.")
                  displayVal = `-${result.displayValue || '0'}.`;
                } else if (
                  valueWithoutSign.endsWith('.') &&
                  !result.displayValue.includes('.')
                ) {
                  // 정수 뒤에 소수점 입력 (예: "100.")
                  displayVal = `${result.displayValue}.`;
                } else if (isNegative && !result.displayValue) {
                  displayVal = '-';
                }

                setStockInputValue(displayVal);

                // 실제 저장할 값 (문자열로 저장, 소수점 포함)
                // 입력 중에 소수점만 있는 경우는 그대로 유지
                if (
                  valueWithoutSign.endsWith('.') &&
                  valueWithoutSign !== '.'
                ) {
                  const savedValue = (isNegative ? '-' : '') + valueWithoutSign;
                  field.onChange(savedValue);
                } else {
                  // 0도 허용하도록 수정, 큰 숫자도 처리 가능하도록 formattedValue 사용
                  const savedValue =
                    (isNegative ? '-' : '') + result.formattedValue;
                  field.onChange(savedValue);
                }
              };

              return (
                <InfoLabelValue
                  label="현재 재고"
                  value={displayValue}
                  isEditing={!isViewer && hasSubscription()}
                  placeholder="현재 재고를 입력하세요."
                  inputType="text"
                  handleChange={handleChangeCurrentStock}
                  onFocus={() => {
                    setIsStockEditing(true);
                    // 포커스 시 현재 값으로 초기화 (쉼표 포함, 끝자리 0 제거)
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
                      // 끝자리 0 제거 후 포맷팅
                      const formatted = removeTrailingZeros(absValue);
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
            name="standardStock"
            control={control}
            render={({
              field,
            }: {
              field: ControllerRenderProps<
                MaterialInfoFormModel,
                'standardStock'
              >;
            }) => {
              const handleChangeStandardStock = (
                e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
              ) => {
                const inputValue = e.target.value;
                const result = handleQuantityInput(inputValue);

                // 입력 중인 값 표시
                let displayVal = result.displayValue;
                // 0 입력 시 displayValue가 빈 문자열이 되는 경우 처리
                if (
                  result.numericValue === 0 &&
                  inputValue !== '' &&
                  !inputValue.endsWith('.')
                ) {
                  displayVal = '0';
                } else if (
                  inputValue.endsWith('.') &&
                  !result.displayValue.includes('.')
                ) {
                  displayVal = `${result.displayValue}.`;
                }
                setStandardStockInputValue(displayVal);

                // 실제 저장할 값 (문자열로 저장, 소수점 포함)
                if (inputValue.endsWith('.') && inputValue !== '.') {
                  field.onChange(inputValue);
                } else {
                  // 0도 허용하도록 수정, 큰 숫자도 처리 가능하도록 formattedValue 사용
                  const savedValue = result.formattedValue;
                  field.onChange(savedValue);
                }
              };

              const displayValue = isStandardStockEditing
                ? standardStockInputValue
                : field.value === undefined ||
                    field.value === null ||
                    field.value === ''
                  ? ''
                  : field.value === '0'
                    ? '0'
                    : removeTrailingZeros(field.value);

              return (
                <InfoLabelValue
                  label="안전 재고"
                  value={displayValue}
                  isEditing={!isViewer && hasSubscription()}
                  placeholder="안전재고를 입력하세요."
                  inputType="text"
                  handleChange={handleChangeStandardStock}
                  onFocus={() => {
                    setIsStandardStockEditing(true);
                    if (
                      field.value === undefined ||
                      field.value === null ||
                      field.value === ''
                    ) {
                      setStandardStockInputValue('');
                    } else {
                      const formatted = removeTrailingZeros(field.value);
                      setStandardStockInputValue(formatted);
                    }
                  }}
                  onBlur={() => {
                    setIsStandardStockEditing(false);
                    setStandardStockInputValue('');
                  }}
                />
              );
            }}
          />
        </div>
        <div className="flex">
          <Controller
            name="rop"
            control={control}
            render={({
              field,
            }: {
              field: ControllerRenderProps<MaterialInfoFormModel, 'rop'>;
            }) => {
              const handleChangeRop = (
                e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
              ) => {
                const inputValue = e.target.value;
                const result = handleQuantityInput(inputValue);

                // 입력 중인 값 표시
                let displayVal = result.displayValue;
                // 0 입력 시 displayValue가 빈 문자열이 되는 경우 처리
                if (
                  result.numericValue === 0 &&
                  inputValue !== '' &&
                  !inputValue.endsWith('.')
                ) {
                  displayVal = '0';
                } else if (
                  inputValue.endsWith('.') &&
                  !result.displayValue.includes('.')
                ) {
                  displayVal = `${result.displayValue}.`;
                }
                setRopInputValue(displayVal);

                // 실제 저장할 값 (문자열로 저장, 소수점 포함)
                if (inputValue.endsWith('.') && inputValue !== '.') {
                  field.onChange(inputValue);
                } else {
                  // 0도 허용하도록 수정, 큰 숫자도 처리 가능하도록 formattedValue 사용
                  const savedValue = result.formattedValue;
                  field.onChange(savedValue);
                }
              };

              const displayValue = isRopEditing
                ? ropInputValue
                : field.value === undefined ||
                    field.value === null ||
                    field.value === ''
                  ? ''
                  : field.value === '0'
                    ? '0'
                    : removeTrailingZeros(field.value);

              return (
                <InfoLabelValue
                  label="ROP"
                  value={displayValue}
                  isEditing={!isViewer && hasSubscription()}
                  placeholder="ROP를 입력하세요."
                  inputType="text"
                  handleChange={handleChangeRop}
                  onFocus={() => {
                    setIsRopEditing(true);
                    if (
                      field.value === undefined ||
                      field.value === null ||
                      field.value === ''
                    ) {
                      setRopInputValue('');
                    } else {
                      const formatted = removeTrailingZeros(field.value);
                      setRopInputValue(formatted);
                    }
                  }}
                  onBlur={() => {
                    setIsRopEditing(false);
                    setRopInputValue('');
                  }}
                />
              );
            }}
          />
          <Controller
            name="maxStock"
            control={control}
            render={({ field }) => {
              const handleChangeMaxStock = (
                e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
              ) => {
                const inputValue = e.target.value;
                const result = handleQuantityInput(inputValue);

                // 입력 중인 값 표시
                let displayVal = result.displayValue;
                if (
                  inputValue.endsWith('.') &&
                  !result.displayValue.includes('.')
                ) {
                  displayVal = `${result.displayValue}.`;
                }
                setMaxStockInputValue(displayVal);

                // 실제 저장할 값 (문자열로 저장, 소수점 포함)
                if (inputValue.endsWith('.') && inputValue !== '.') {
                  field.onChange(inputValue);
                } else {
                  const savedValue =
                    result.numericValue === 0 && !inputValue.endsWith('.')
                      ? ''
                      : result.numericValue.toString();
                  field.onChange(savedValue);
                }
              };

              const displayValue = isMaxStockEditing
                ? maxStockInputValue
                : field.value === undefined ||
                    field.value === null ||
                    field.value === ''
                  ? ''
                  : field.value === '0'
                    ? '0'
                    : removeTrailingZeros(field.value);

              return (
                <InfoLabelValue
                  label="적정 재고"
                  value={displayValue}
                  handleChange={handleChangeMaxStock}
                  isEditing={!isViewer && hasSubscription()}
                  placeholder="적정 재고를 입력하세요."
                  onFocus={() => {
                    setIsMaxStockEditing(true);
                    if (
                      field.value === undefined ||
                      field.value === null ||
                      field.value === ''
                    ) {
                      setMaxStockInputValue('');
                    } else {
                      const formatted = removeTrailingZeros(field.value);
                      setMaxStockInputValue(formatted);
                    }
                  }}
                  onBlur={() => {
                    setIsMaxStockEditing(false);
                    setMaxStockInputValue('');
                  }}
                />
              );
            }}
          />
        </div>
        <div className="flex">
          {(() => {
            const currentStock = watch('currentStock');
            const maxStock = watch('maxStock');
            const rop = watch('rop');
            const standardStock = watch('standardStock');
            const status = getMaterialStockStatus({
              currentStock: stringToNumber(currentStock),
              maxStock: stringToNumber(maxStock),
              rop: stringToNumber(rop),
              standardStock: stringToNumber(standardStock),
            });
            return (
              <InfoLabelValue
                label="재고 상태"
                chip={status ? { status } : undefined}
                value={status ? '' : '-'}
                isEditing={false}
              />
            );
          })()}
          <Controller
            name="expiryDays"
            control={control}
            render={({ field }) => {
              const handleChangeExpiryDays = (
                e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
              ) => {
                // '일' 제거하고 숫자만 추출
                const numericValue = e.target.value.replace(/[^0-9]/g, '');
                // 숫자만 저장
                if (numericValue === '') {
                  field.onChange('');
                  return;
                }
                const num = parseInt(numericValue, 10);
                if (!isNaN(num)) {
                  field.onChange(num.toString());
                }
              };

              // 입력 중일 때는 천 단위 구분자 포함 숫자만, 아닐 때는 '일' 추가
              const formatNumber = (val: string) => {
                if (!val || val === '-') return '';
                const num = parseInt(val, 10);
                return isNaN(num) ? '' : num.toLocaleString();
              };

              const displayValue = isExpiryDaysEditing
                ? formatNumber(field.value ?? '')
                : field.value && field.value !== '-'
                  ? `${formatNumber(field.value)}일`
                  : (field.value ?? '-');

              // 읽기 모드이고 수정되지 않았을 때만 chip 표시
              const shouldShowChip =
                !isDirty && !isExpiryDaysEditing && expiryStatus !== null;

              return (
                <InfoLabelValue
                  label="유통기한"
                  chip={shouldShowChip ? { status: expiryStatus } : undefined}
                  value={displayValue}
                  handleChange={handleChangeExpiryDays}
                  isEditing={!isViewer && hasSubscription()}
                  placeholder="유통기한 위험일을 입력하세요."
                  onFocus={() => setIsExpiryDaysEditing(true)}
                  onBlur={() => setIsExpiryDaysEditing(false)}
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
    );
  }
);

MaterialInfo.displayName = 'MaterialInfo';

export default MaterialInfo;
