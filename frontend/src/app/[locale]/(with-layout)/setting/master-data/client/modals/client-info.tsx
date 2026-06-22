import { Controller, Control } from 'react-hook-form';
import {
  formatBusinessNumber,
  formatFaxNumber,
  formatPhoneNumber,
} from '@/hooks';
import { ClientUpdateModel, ClientResponseModel } from '@/types/data-model';
import InfoLabelValue from '@/ui/info-label-value';
import { RoundChip } from '@/ui/round-chip';
import { useTranslations } from 'next-intl';

interface ClientInfoProps {
  control: Control<ClientUpdateModel>;
  isViewer: boolean;
  hasSubscription: () => boolean;
  clientDetail: ClientResponseModel | null;
}

export const ClientInfo = ({
  control,
  isViewer,
  hasSubscription,
  clientDetail,
}: ClientInfoProps) => {
  const tCommon = useTranslations('common');
  const tClientInfo = useTranslations('setting.masterData.client.clientInfo');

  return (
    <form className="flex flex-col gap-3">
      <h3 className="Heading-3">{tClientInfo('title')}</h3>

      <div>
        <div className="flex">
          <Controller
            name="name"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <InfoLabelValue
                label={tCommon('companyName')}
                isEditing={!isViewer && hasSubscription()}
                placeholder={`${tCommon('required')} ${tCommon('placeholders.companyName')}`}
                required
                {...field}
              />
            )}
          />
          <Controller
            name="business_registration_number"
            control={control}
            rules={{
              required: true,
              pattern: /^\d{3}-\d{2}-\d{5}$/,
            }}
            render={({ field }) => (
              <InfoLabelValue
                label={tCommon('businessRegistrationNumber')}
                isEditing={!isViewer && hasSubscription()}
                placeholder={`${tCommon('required')} ${tCommon('placeholders.businessRegistrationNumber')}`}
                required
                value={field.value}
                onChange={(e) => {
                  const formatted = formatBusinessNumber(e.target.value);
                  field.onChange(formatted);
                }}
                onBlur={() => field.onBlur()}
              />
            )}
          />
        </div>
        <div className="flex">
          <Controller
            name="representative_name"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <InfoLabelValue
                label={tCommon('representativeName')}
                isEditing={!isViewer && hasSubscription()}
                placeholder={`${tCommon('required')} ${tCommon('placeholders.representativeName')}`}
                required
                {...field}
              />
            )}
          />
          <Controller
            name="email"
            control={control}
            rules={{
              pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            }}
            render={({ field }) => (
              <InfoLabelValue
                label={tCommon('email')}
                isEditing={!isViewer && hasSubscription()}
                placeholder={tCommon('placeholders.email')}
                {...field}
              />
            )}
          />
        </div>
        <div className="flex">
          <Controller
            name="phone"
            control={control}
            rules={{
              pattern: /^(01[016789]-\d{3,4}-\d{4}|0\d{1,2}-\d{3,4}-\d{4})$/,
            }}
            render={({ field }) => (
              <InfoLabelValue
                label={tCommon('phone')}
                isEditing={!isViewer && hasSubscription()}
                placeholder={tCommon('placeholders.phone')}
                value={field.value}
                onChange={(e) => {
                  const formatted = formatPhoneNumber(e.target.value);
                  field.onChange(formatted);
                }}
                onBlur={() => field.onBlur()}
              />
            )}
          />
          <Controller
            name="fax"
            control={control}
            rules={{ pattern: /^(0\d{1,3}-\d{3,4}-\d{4})$/ }}
            render={({ field }) => (
              <InfoLabelValue
                label={tCommon('fax')}
                isEditing={!isViewer && hasSubscription()}
                placeholder={tCommon('placeholders.fax')}
                value={field.value}
                onChange={(e) => {
                  const formatted = formatFaxNumber(e.target.value);
                  field.onChange(formatted);
                }}
                onBlur={() => field.onBlur()}
              />
            )}
          />
        </div>
        <div className="flex">
          <Controller
            name="business_type"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <InfoLabelValue
                label={tCommon('businessType')}
                isEditing={!isViewer && hasSubscription()}
                placeholder={`${tCommon('required')} ${tCommon('placeholders.businessType')}`}
                required
                {...field}
              />
            )}
          />
          <Controller
            name="business_category"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <InfoLabelValue
                label={tCommon('businessCategory')}
                isEditing={!isViewer && hasSubscription()}
                placeholder={`${tCommon('required')} ${tCommon('placeholders.businessCategory')}`}
                required
                {...field}
              />
            )}
          />
        </div>
        <div className="flex">
          <Controller
            name="address"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <InfoLabelValue
                label={tCommon('businessAddress')}
                isEditing={!isViewer && hasSubscription()}
                placeholder={`${tCommon('required')} ${tCommon('placeholders.businessAddress')}`}
                required
                {...field}
              />
            )}
          />
        </div>
        <div className="flex">
          <InfoLabelValue
            label={tClientInfo('clientType')}
            value={
              <div className="flex gap-1">
                {clientDetail?.is_customer === true && (
                  <RoundChip
                    text={tCommon('customer')}
                    variant="sm"
                    color="blue"
                  />
                )}
                {clientDetail?.is_supplier === true && (
                  <RoundChip
                    text={tCommon('supplier')}
                    variant="sm"
                    color="red"
                  />
                )}
                {clientDetail?.is_supplier === false &&
                  clientDetail?.is_customer === false &&
                  '-'}
              </div>
            }
          />
        </div>
        <div className="flex border-b border-lg w-full">
          <Controller
            name="note"
            control={control}
            render={({ field }) => (
              <InfoLabelValue
                label={tCommon('note')}
                isEditing={!isViewer && hasSubscription()}
                placeholder="-"
                textarea={true}
                {...field}
              />
            )}
          />
        </div>
      </div>
    </form>
  );
};
