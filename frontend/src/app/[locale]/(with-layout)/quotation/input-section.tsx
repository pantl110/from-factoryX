'use client';

import Input from '@/ui/input';
import {
  Controller,
  UseFormSetValue,
  FieldErrors,
  Control,
} from 'react-hook-form';
import { ClientNameDropdown } from '@/ui/dropdown/client-name-dropdown';
import { ClientModel, ClientResponseModel } from '@/types/data-model';
import { useState } from 'react';

// Extend ClientModel for quotation form to include due_date
interface QuotationFormModel extends ClientModel {
  due_date: string;
}
import {
  formatBusinessNumber,
  formatPhoneNumber,
  formatFaxNumber,
  formatDate,
} from '@/utils/format-number';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';
import { useTranslations } from 'next-intl';

interface InputSectionProps {
  setValue: UseFormSetValue<QuotationFormModel>;
  errors: FieldErrors<QuotationFormModel>;
  control: Control<QuotationFormModel>;
  onClientSelect?: (clientId: number | null) => void;
  showErrors?: boolean;
}

const InputSection = ({
  setValue,
  errors,
  control,
  onClientSelect,
  showErrors = false,
}: InputSectionProps) => {
  const tCommon = useTranslations('common');
  const tInput = useTranslations('quotation.inputSection');
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSelectClient = (item: ClientResponseModel) => {
    // 선택한 거래처 정보로 폼 자동 채우기
    setValue('name', item.name);
    setValue(
      'business_registration_number',
      formatBusinessNumber(String(item.business_registration_number ?? ''))
    );
    setValue('representative_name', item.representative_name);
    setValue('due_date', '');
    setValue('business_type', item.business_type || '');
    setValue('business_category', item.business_category || '');
    setValue('address', item.address || '');
    setValue('manager', item.manager_name || '');
    setValue('email', item.email || '');
    setValue('phone', formatPhoneNumber(String(item.phone ?? '')));
    setValue('fax', formatFaxNumber(String(item.fax ?? '')));

    // 선택된 거래처 ID를 부모 컴포넌트로 전달
    onClientSelect?.(item.id);

    setIsDropdownOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Controller
            name="name"
            control={control}
            rules={{ required: true }}
            render={({ field }) => {
              const handleCompanyNameBlur = () =>
                setTimeout(() => setIsDropdownOpen(false), 150);
              return (
                <Input
                  label={tCommon('clientName')}
                  placeholder={tInput('placeholders.clientName')}
                  required
                  showError={showErrors && !!errors.name}
                  value={field.value ?? ''}
                  onChange={(e) => {
                    field.onChange(e);
                    const { value } = e.target;
                    setSearchTerm(value);
                    if (value.length > 0) {
                      setIsDropdownOpen(true);
                    } else {
                      setIsDropdownOpen(false);
                    }
                  }}
                  onFocus={() => {
                    if (field.value && field.value.length > 0) {
                      setSearchTerm(field.value);
                      setIsDropdownOpen(true);
                    }
                  }}
                  onBlur={handleCompanyNameBlur}
                  ref={field.ref}
                  name={field.name}
                  disabledReadOnly={isViewer || !hasSubscription()}
                />
              );
            }}
          />
          {isDropdownOpen && searchTerm && (
            <div className="absolute left-0 top-21 z-10 w-full">
              <ClientNameDropdown
                searchTerm={searchTerm}
                onSelect={handleSelectClient}
                onClose={() => {
                  setIsDropdownOpen(false);
                  setSearchTerm('');
                }}
                width="w-full"
              />
            </div>
          )}
        </div>
        <div className="flex-1">
          <Controller
            name="business_registration_number"
            control={control}
            rules={{
              required: true,
              pattern: {
                value: /^\d{3}-\d{2}-\d{5}$/,
                message: tInput('errors.invalidBusinessRegistrationNumber'),
              },
            }}
            render={({ field }) => (
              <Input
                label={tCommon('businessRegistrationNumber')}
                placeholder={tInput('placeholders.businessRegistrationNumber')}
                required
                showError={showErrors && !!errors.business_registration_number}
                disabledReadOnly={isViewer || !hasSubscription()}
                value={field.value ?? ''}
                onChange={(e) => {
                  const formatted = formatBusinessNumber(e.target.value);
                  field.onChange(formatted);
                }}
                ref={field.ref}
                name={field.name}
              />
            )}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Controller
          name="representative_name"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <Input
              label={tCommon('representativeName')}
              placeholder={tInput('placeholders.representativeName')}
              required
              showError={showErrors && !!errors.representative_name}
              disabledReadOnly={isViewer || !hasSubscription()}
              {...field}
            />
          )}
        />
        <Controller
          name="due_date"
          control={control}
          rules={{
            required: true,
            pattern: {
              value: /^\d{4}-\d{2}-\d{2}$/,
              message: tInput('errors.invalidDateFormat'),
            },
          }}
          render={({ field }) => (
            <Input
              label={tCommon('dueDate')}
              placeholder={tInput('placeholders.dueDate')}
              required
              showError={showErrors && !!errors.due_date}
              value={field.value ?? ''}
              onChange={(e) => {
                const formatted = formatDate(e.target.value);
                field.onChange(formatted);
              }}
              ref={field.ref}
              name={field.name}
              disabledReadOnly={isViewer || !hasSubscription()}
            />
          )}
        />
      </div>
      <div className="flex gap-2">
        <Controller
          name="business_type"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <Input
              label={tCommon('businessType')}
              placeholder={tInput('placeholders.businessType')}
              showError={showErrors && !!errors.business_type}
              required
              disabledReadOnly={isViewer || !hasSubscription()}
              {...field}
            />
          )}
        />
        <Controller
          name="business_category"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <Input
              label={tCommon('businessCategory')}
              required
              placeholder={tInput('placeholders.businessCategory')}
              showError={showErrors && !!errors.business_category}
              disabledReadOnly={isViewer || !hasSubscription()}
              {...field}
            />
          )}
        />
      </div>
      <div className="flex gap-2">
        <Controller
          name="address"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <Input
              label={tCommon('businessAddress')}
              placeholder={tInput('placeholders.businessAddress')}
              required
              showError={showErrors && !!errors.address}
              disabledReadOnly={isViewer || !hasSubscription()}
              {...field}
            />
          )}
        />
      </div>
      <div className="flex gap-2">
        <Controller
          name="manager"
          control={control}
          render={({ field }) => (
            <Input
              label={tCommon('managerName')}
              placeholder={tInput('placeholders.managerName')}
              required
              showError={showErrors && !!errors.manager}
              disabledReadOnly={isViewer || !hasSubscription()}
              {...field}
            />
          )}
        />
        <Controller
          name="email"
          control={control}
          rules={{
            pattern: {
              value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
              message: tInput('errors.invalidEmail'),
            },
          }}
          render={({ field }) => (
            <Input
              label={tCommon('email')}
              placeholder={tInput('placeholders.managerEmail')}
              required
              showError={showErrors && !!errors.email}
              disabledReadOnly={isViewer || !hasSubscription()}
              {...field}
            />
          )}
        />
      </div>
      <div className="flex gap-2">
        <Controller
          name="phone"
          control={control}
          rules={{
            pattern: {
              value: /^(01[016789]-\d{3,4}-\d{4}|0\d{1,2}-\d{3,4}-\d{4})$/,
              message: tInput('errors.invalidPhone'),
            },
          }}
          render={({ field }) => {
            return (
              <Input
                placeholder={tInput('placeholders.phone')}
                label={tCommon('phone')}
                showError={showErrors && !!errors.phone}
                value={field.value ?? ''}
                onChange={(e) => {
                  const formatted = formatPhoneNumber(e.target.value);
                  field.onChange(formatted);
                }}
                ref={field.ref}
                name={field.name}
                disabledReadOnly={isViewer || !hasSubscription()}
              />
            );
          }}
        />
        <Controller
          name="fax"
          control={control}
          rules={{
            pattern: {
              value: /^(0\d{1,3}-\d{3,4}-\d{4})$/,
              message: tInput('errors.invalidFax'),
            },
          }}
          render={({ field }) => {
            return (
              <Input
                label={tCommon('fax')}
                placeholder={tInput('placeholders.fax')}
                showError={showErrors && !!errors.fax}
                value={field.value ?? ''}
                onChange={(e) => {
                  const formatted = formatFaxNumber(e.target.value);
                  field.onChange(formatted);
                }}
                ref={field.ref}
                name={field.name}
                disabledReadOnly={isViewer || !hasSubscription()}
              />
            );
          }}
        />
      </div>
    </div>
  );
};

export default InputSection;
