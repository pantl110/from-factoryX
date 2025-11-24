import InfoLabelValue from '@/ui/info-label-value';
import { useForm, Controller, ControllerRenderProps } from 'react-hook-form';
import {
  formatDate,
  handleQuantityInput,
  extractNumbers,
} from '@/utils/format-number';
import {
  useGetMaterialRepackagingDetail,
  useUpdateMaterialRepackaging,
} from '@/hooks';
import { useEffect, useImperativeHandle, forwardRef } from 'react';
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
}

export const InputArea = ({
  mode,
  materialId,
  repackagingId,
}: InputAreaProps) => {
  // update 모드일 때 repackaging 상세 데이터 가져오기
  const { data: repackaging } = useGetMaterialRepackagingDetail(
    mode === 'update' && repackagingId ? repackagingId : null
  );

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

  const onSubmit = (_data: MaterialPackagingFormModel) => {
    // TODO: Implement form submission logic
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
    <form onSubmit={handleSubmit(onSubmit)}>
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
            placeholder="소분할 수량을 입력하세요."
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
