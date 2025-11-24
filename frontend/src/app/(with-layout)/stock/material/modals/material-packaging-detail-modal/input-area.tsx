import InfoLabelValue from '@/ui/info-label-value';
import { useForm, Controller, ControllerRenderProps } from 'react-hook-form';
import { formatDate, handleQuantityInput } from '@/utils/format-number';

interface MaterialPackagingFormModel {
  quantity: string;
  location: string;
  expirationDate: string;
}

interface InputAreaProps {
  mode: 'create' | 'update';
}

export const InputArea = ({ mode }: InputAreaProps) => {
  const { control, handleSubmit } = useForm<MaterialPackagingFormModel>({
    defaultValues: {
      quantity: '',
      location: '',
      expirationDate: '',
    },
  });

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
    field.onChange(e);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {mode === 'update' && (
        <InfoLabelValue label="상태" chip={{ status: 'using' }} />
      )}

      <InfoLabelValue label="부모 LOT 번호" value="LOT-20250910-01" />
      <InfoLabelValue
        label="소분 LOT 번호"
        value="LOT-20250910-01-01"
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
