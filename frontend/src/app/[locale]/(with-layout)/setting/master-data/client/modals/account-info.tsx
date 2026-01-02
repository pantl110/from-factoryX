import { Controller, Control } from 'react-hook-form';
import { ClientUpdateModel } from '@/types/data-model';
import InfoLabelValue from '@/ui/info-label-value';
import { extractNumbers } from '@/utils/format-number';
import { useTranslations } from 'next-intl';

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
  const tAccountInfo = useTranslations('setting.masterData.client.accountInfo');

  if (!control) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="Heading-3">{tAccountInfo('title')}</h3>

      <div>
        <div className="flex">
          <Controller
            name="bank_name"
            control={control}
            render={({ field }) => (
              <InfoLabelValue
                label={tAccountInfo('bankName')}
                isEditing={!isViewer && hasSubscription()}
                placeholder={tAccountInfo('bankNamePlaceholder')}
                {...field}
              />
            )}
          />
          <Controller
            name="account_number"
            control={control}
            render={({ field }) => (
              <InfoLabelValue
                label={tAccountInfo('accountNumber')}
                isEditing={!isViewer && hasSubscription()}
                placeholder={tAccountInfo('accountNumberPlaceholder')}
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
                label={tAccountInfo('holder')}
                isEditing={!isViewer && hasSubscription()}
                placeholder={tAccountInfo('holderPlaceholder')}
                {...field}
              />
            )}
          />
        </div>
      </div>
    </div>
  );
};
