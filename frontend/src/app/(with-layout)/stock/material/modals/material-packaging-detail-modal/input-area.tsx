import InfoLabelValue from '@/ui/info-label-value';
import { useForm, Controller, ControllerRenderProps } from 'react-hook-form';
import {
  formatDate,
  handleQuantityInput,
  removeTrailingZeros,
} from '@/utils/format-number';
import {
  useGetMaterialRepackagingDetail,
  useUpdateMaterialRepackaging,
  useCreateMaterialRepackaging,
  useGetMaterialHistoryDetail,
} from '@/hooks';
import { useEffect, useState } from 'react';
import { convertUTCToKSTDate, isValidDateString } from '@/utils';
import {
  UpdateMaterialRepackagingModel,
  CreateMaterialRepackagingModel,
} from '@/types/data-model';
import axios from 'axios';

interface MaterialPackagingFormModel {
  quantity: string;
  location: string;
  expirationDate: string;
}

interface InputAreaProps {
  repackagingId?: number | null;
  nextRepackagingLotNumber?: string | null;
  parentHistoryId?: number | null;
  onUpdateSuccess?: () => Promise<void> | void;
  onError?: (message: { text: string; subtext: string }) => void;
  formId?: string;
  onQuantityChange?: (hasValue: boolean) => void;
}

export const InputArea = ({
  repackagingId,
  nextRepackagingLotNumber,
  parentHistoryId,
  onUpdateSuccess,
  onError,
  formId,
  onQuantityChange,
}: InputAreaProps) => {
  const mode = repackagingId ? 'update' : 'create';

  // update 모드일 때 repackaging 상세 데이터 가져오기
  const { data: repackaging } = useGetMaterialRepackagingDetail(
    repackagingId ?? null
  );

  // create 모드일 때 부모 히스토리 데이터 가져오기
  const { data: parentHistory } = useGetMaterialHistoryDetail(
    mode === 'create' ? (parentHistoryId ?? null) : null
  );

  const updateMutation = useUpdateMaterialRepackaging();
  const createMutation = useCreateMaterialRepackaging();

  const { control, handleSubmit, reset, watch } =
    useForm<MaterialPackagingFormModel>({
      defaultValues: {
        quantity: '',
        location: '',
        expirationDate: '',
      },
    });

  const [isQuantityEditing, setIsQuantityEditing] = useState(false);
  const [quantityInputValue, setQuantityInputValue] = useState<string>('');

  // repackaging 데이터가 로드되면 form에 채우기 (update 모드)
  useEffect(() => {
    if (mode === 'update' && repackaging) {
      reset({
        quantity: removeTrailingZeros(repackaging.quantity),
        location: repackaging.warehouse_location || '',
        expirationDate: repackaging.expiration_date
          ? convertUTCToKSTDate(repackaging.expiration_date) || ''
          : '',
      });
    }
  }, [mode, repackaging, reset]);

  // 부모 히스토리 데이터가 로드되면 form에 기본값 채우기 (create 모드)
  useEffect(() => {
    if (mode === 'create' && parentHistory) {
      reset({
        quantity: '',
        location: parentHistory.warehouse_location || '',
        expirationDate: parentHistory.expiration_date
          ? convertUTCToKSTDate(parentHistory.expiration_date) || ''
          : '',
      });
    }
  }, [mode, parentHistory, reset]);

  const quantityValue = watch('quantity');

  useEffect(() => {
    onQuantityChange?.(Boolean(quantityValue?.toString().trim()));
  }, [quantityValue, onQuantityChange]);

  // 날짜를 API 형식으로 변환 (빈 문자열이면 null, 아니면 그대로 사용)
  const formatDateForAPI = (dateString: string): string | null => {
    const trimmed = dateString?.trim();
    return trimmed === '' ? null : trimmed || null;
  };

  // 수량을 숫자로 변환 (콤마 제거)
  const parseQuantity = (quantityString: string): number | null => {
    if (!quantityString || quantityString.trim() === '') {
      return null;
    }
    const numbers = quantityString.replace(/,/g, '');
    const parsed = parseFloat(numbers);
    return isNaN(parsed) ? null : parsed;
  };

  const onSubmit = async (data: MaterialPackagingFormModel) => {
    const trimmedExpiration = data.expirationDate?.trim();

    if (trimmedExpiration && !isValidDateString(trimmedExpiration)) {
      onError?.({
        text: '유효한 유통기한을 입력해 주세요.',
        subtext: 'YYYY-MM-DD 형식으로 입력해 주세요.',
      });
      return;
    }

    const parsedQuantity = parseQuantity(data.quantity);

    try {
      if (mode === 'update' && repackagingId) {
        const payload: UpdateMaterialRepackagingModel = {
          quantity: parsedQuantity ?? undefined,
          warehouse_location: data.location.trim() || null,
          expiration_date: formatDateForAPI(data.expirationDate),
        };

        await updateMutation.mutateAsync({
          repackagingId,
          payload,
        });

        if (onUpdateSuccess) {
          await onUpdateSuccess();
        }
      } else if (mode === 'create' && parentHistoryId && parsedQuantity) {
        const payload: CreateMaterialRepackagingModel = {
          parent_history_id: parentHistoryId,
          quantity: parsedQuantity,
          warehouse_location: data.location.trim() || null,
          expiration_date: formatDateForAPI(data.expirationDate),
        };

        await createMutation.mutateAsync(payload);

        if (onUpdateSuccess) {
          await onUpdateSuccess();
        }
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const detailMessageRaw =
          (typeof error.response?.data?.detail === 'string'
            ? error.response?.data?.detail
            : '') ||
          (typeof error.response?.data?.message === 'string'
            ? error.response?.data?.message
            : '') ||
          error.message ||
          '';
        const detailMessage = detailMessageRaw.trim();
        const parentLotErrorKeyword =
          '수량 증가가 불가능합니다. 부모 이력의 잔량이 부족합니다';
        const quantityInsufficientKeyword = '소분 수량이 부족합니다';
        const isParentLotQuantityError = detailMessage.includes(
          parentLotErrorKeyword
        );
        const isQuantityInsufficientError = detailMessage.includes(
          quantityInsufficientKeyword
        );

        onError?.({
          text:
            isParentLotQuantityError || isQuantityInsufficientError
              ? '수량을 다시 확인해 주세요.'
              : detailMessage ||
                (mode === 'create'
                  ? '소분 내역 생성 중 오류가 발생했습니다.'
                  : '소분 내역 수정 중 오류가 발생했습니다.'),
          subtext:
            isParentLotQuantityError || isQuantityInsufficientError
              ? '부모 이력의 잔량이 부족해요.'
              : '잠시 후 다시 시도해 주세요.',
        });
      } else {
        onError?.({
          text:
            mode === 'create'
              ? '소분 내역 생성 중 오류가 발생했습니다.'
              : '소분 내역 수정 중 오류가 발생했습니다.',
          subtext: '잠시 후 다시 시도해 주세요.',
        });
      }
    }
  };

  const handleDateChange = (
    field: ControllerRenderProps<MaterialPackagingFormModel, 'expirationDate'>,
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const formatted = formatDate(e.target.value);
    field.onChange(formatted);
  };

  const handleQuantityChange = (
    field: ControllerRenderProps<MaterialPackagingFormModel, 'quantity'>,
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const inputValue = e.target.value;
    const result = handleQuantityInput(inputValue);

    // 입력 중인 값 표시
    let displayVal = result.displayValue;
    if (inputValue.endsWith('.') && !result.displayValue.includes('.')) {
      displayVal = `${result.displayValue}.`;
    }
    setQuantityInputValue(displayVal);

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

  const handleLocationChange = (
    field: ControllerRenderProps<MaterialPackagingFormModel, 'location'>,
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    field.onChange(e.target.value);
  };

  // 부모 LOT 번호 계산 (update 모드: 소분 LOT 번호에서 마지막 -00 제거)
  const effectiveParentLotNumber =
    mode === 'update' && repackaging
      ? repackaging.lot_number.replace(/-\d+$/, '')
      : nextRepackagingLotNumber
        ? nextRepackagingLotNumber.replace(/-\d+$/, '')
        : '';

  // create 모드일 때 소분 LOT 번호
  const displayLotNumber =
    mode === 'create'
      ? (nextRepackagingLotNumber ?? '')
      : (repackaging?.lot_number ?? '');

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)}>
      {/* {mode === 'update' && (
        <InfoLabelValue label="상태" chip={{ status: 'using' }} />
      )} */}

      <InfoLabelValue
        label="부모 LOT 번호"
        value={effectiveParentLotNumber}
        disabled
      />
      <InfoLabelValue label="소분 LOT 번호" value={displayLotNumber} disabled />

      <Controller
        name="quantity"
        control={control}
        render={({ field }) => {
          const displayValue = isQuantityEditing
            ? quantityInputValue
            : field.value
              ? removeTrailingZeros(field.value)
              : '';

          return (
            <InfoLabelValue
              label="수량"
              value={displayValue}
              placeholder="(필수) 소분할 수량을 입력하세요."
              required={true}
              isEditing={true}
              onChange={(e) => handleQuantityChange(field, e)}
              onFocus={() => {
                setIsQuantityEditing(true);
                if (field.value) {
                  const formatted = removeTrailingZeros(field.value);
                  setQuantityInputValue(formatted);
                } else {
                  setQuantityInputValue('');
                }
              }}
              onBlur={() => {
                setIsQuantityEditing(false);
                setQuantityInputValue('');
              }}
            />
          );
        }}
      />

      <Controller
        name="location"
        control={control}
        render={({ field }) => (
          <InfoLabelValue
            label="창고 위치"
            value={field.value}
            placeholder="창고 위치를 입력하세요."
            isEditing={true}
            onChange={(e) => handleLocationChange(field, e)}
          />
        )}
      />

      <Controller
        name="expirationDate"
        control={control}
        render={({ field }) => (
          <InfoLabelValue
            label="유통기한"
            value={field.value}
            placeholder="유통기한을 입력하세요"
            isEditing={true}
            onChange={(e) => handleDateChange(field, e)}
          />
        )}
      />
    </form>
  );
};
