import { Controller, Control } from 'react-hook-form';
import { ClientUpdateModel } from '@/types/data-model';
import InfoLabelValue from '@/ui/info-label-value';
import { extractNumbers } from '@/utils/format-number';

interface AccountInfoProps {
  control: Control<ClientUpdateModel>;
  isViewer: boolean;
  hasSubscription: () => boolean;
}

// 발주처용 계좌 정보 컴포넌트
export const AccountInfo = ({
  control,
  isViewer,
  hasSubscription,
}: AccountInfoProps) => {
  if (!control) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="Heading-3">지급 계좌 정보</h3>

      <div>
        <div className="flex">
          <Controller
            name="bank_name"
            control={control}
            render={({ field }) => (
              <InfoLabelValue
                label="은행명"
                isEditing={!isViewer && hasSubscription()}
                placeholder="은행명을 입력하세요."
                {...field}
              />
            )}
          />
          <Controller
            name="account_number"
            control={control}
            render={({ field }) => (
              <InfoLabelValue
                label="계좌번호"
                isEditing={!isViewer && hasSubscription()}
                placeholder="계좌번호를 입력하세요."
                value={field.value}
                onChange={(e) => {
                  const numbersOnly = extractNumbers(e.target.value);
                  field.onChange(numbersOnly);
                }}
                onBlur={() => field.onBlur()}
              />
            )}
          />
        </div>
        <div className="flex border-b border-lg w-full">
          <Controller
            name="account_holder"
            control={control}
            render={({ field }) => (
              <InfoLabelValue
                label="예금주"
                isEditing={!isViewer && hasSubscription()}
                placeholder="예금주를 입력하세요."
                {...field}
              />
            )}
          />
        </div>
      </div>
    </div>
  );
};
