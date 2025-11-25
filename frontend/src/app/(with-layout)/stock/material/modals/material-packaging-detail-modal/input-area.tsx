import InfoLabelValue from '@/ui/info-label-value';
import { useForm, Controller, ControllerRenderProps } from 'react-hook-form';
import { formatDate, handleQuantityInput } from '@/utils/format-number';
import {
  useGetMaterialRepackagingDetail,
  useUpdateMaterialRepackaging,
} from '@/hooks';
import { useEffect } from 'react';
import { convertUTCToKSTDate } from '@/utils';
import { UpdateMaterialRepackagingModel } from '@/types/data-model';

interface MaterialPackagingFormModel {
  quantity: string;
  location: string;
  expirationDate: string;
}

interface InputAreaProps {
  mode: 'create' | 'update';
  materialId: number;
  repackagingId?: number | null;
  onUpdateSuccess?: () => void;
  formId?: string;
}

export const InputArea = ({
  mode,
  materialId,
  repackagingId,
  onUpdateSuccess,
  formId,
}: InputAreaProps) => {
  // update 모드일 때 repackaging 상세 데이터 가져오기
  const { data: repackaging } = useGetMaterialRepackagingDetail(
    mode === 'update' && repackagingId ? repackagingId : null
  );

  const updateMutation = useUpdateMaterialRepackaging();

  const { control, handleSubmit, reset } = useForm<MaterialPackagingFormModel>({
    defaultValues: {
      quantity: '',
      location: '',
      expirationDate: '',
    },
  });

  // repackaging 데이터가 로드되면 form에 채우기
  useEffect(() => {
    if (mode === 'update' && repackaging) {
      reset({
        quantity: repackaging.quantity.toLocaleString(),
        location: repackaging.warehouse_location || '',
        expirationDate: repackaging.expiration_date
          ? convertUTCToKSTDate(repackaging.expiration_date) || ''
          : '',
      });
    }
  }, [mode, repackaging, reset]);

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
    if (mode === 'update' && repackagingId) {
      try {
        const parsedQuantity = parseQuantity(data.quantity);
        const payload: UpdateMaterialRepackagingModel = {
          quantity: parsedQuantity ?? undefined,
          warehouse_location: data.location.trim() || null,
          expiration_date: formatDateForAPI(data.expirationDate),
        };

        await updateMutation.mutateAsync({
          repackagingId,
          payload,
        });

        onUpdateSuccess?.();
      } catch {
        // 에러는 mutation에서 처리됨
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
    const { displayValue } = handleQuantityInput(e.target.value);
    field.onChange(displayValue);
  };

  const handleLocationChange = (
    field: ControllerRenderProps<MaterialPackagingFormModel, 'location'>,
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    field.onChange(e.target.value);
  };

  // 부모 LOT 번호 계산 (소분 LOT 번호에서 마지막 -00 제거)
  const parentLotNumber = repackaging
    ? repackaging.lot_number.replace(/-\d+$/, '')
    : '';

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)}>
      {/* {mode === 'update' && (
        <InfoLabelValue label="상태" chip={{ status: 'using' }} />
      )} */}

      <InfoLabelValue label="부모 LOT 번호" value={parentLotNumber} />
      <InfoLabelValue
        label="소분 LOT 번호"
        value={repackaging?.lot_number || ''}
        disabled
      />

      <Controller
        name="quantity"
        control={control}
        render={({ field }) => (
          <InfoLabelValue
            label="수량"
            value={field.value}
            placeholder="(필수) 소분할 수량을 입력하세요."
            required={true}
            isEditing={true}
            onChange={(e) => handleQuantityChange(field, e)}
          />
        )}
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
