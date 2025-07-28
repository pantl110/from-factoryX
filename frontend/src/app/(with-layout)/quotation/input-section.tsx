'use client';

import Input from '@/ui/input';
import {
  Controller,
  UseFormSetValue,
  FieldErrors,
  Control,
} from 'react-hook-form';
import { useEffect } from 'react';
import { useDropdownFilter } from '@/hooks/use-dropdown-filter';
import { ClientNameDropdown } from '@/ui/dropdown/client-name-dropdown';
import { ClientModel, ClientResponseModel } from '@/types/data-model';

// Extend ClientModel for quotation form to include due_date
interface QuotationFormModel extends ClientModel {
  due_date: string;
}
import {
  formatBusinessNumber,
  formatPhoneNumber,
  formatFaxNumber,
  formatDate,
} from '@/hooks/format-number';
import useGetClient from '@/hooks/factory/factory-client/use-get-client';

interface InputSectionProps {
  setValue: UseFormSetValue<QuotationFormModel>;
  errors: FieldErrors<QuotationFormModel>;
  control: Control<QuotationFormModel>;
}

const InputSection = ({ setValue, errors, control }: InputSectionProps) => {
  const { clientList, searchClients } = useGetClient();

  const {
    setInput: setCompanyNameInput,
    isOpen: isCompanyNameDropdownOpen,
    setIsOpen: setIsCompanyNameDropdownOpen,
    filtered: filteredClients,
    handleSelect: handleCompanyNameSelect,
  } = useDropdownFilter(clientList?.data || [], (item) => item.name);

  // 초기 클라이언트 데이터 로드
  useEffect(() => {
    searchClients('');
  }, [searchClients]);

  //   useEffect(() => {
  //     if (clientDataParam) {
  //       try {
  //         const data = JSON.parse(decodeURIComponent(clientDataParam));
  //         Object.entries(data).forEach(([key, value]) => {
  //           if (key === 'businessNumber') {
  //             setValue(
  //               'business_registration_number',
  //               formatBusinessNumber(String(value ?? ''))
  //             );
  //           } else if (key === 'contact') {
  //             setValue('phone', formatPhoneNumber(String(value ?? '')));
  //           } else if (key === 'fax') {
  //             setValue('fax', formatFaxNumber(String(value ?? '')));
  //           } else if (key === 'companyName') {
  //             setValue('name', String(value ?? ''));
  //           } else {
  //             setValue(key as keyof ClientModel, value as string);
  //           }
  //         });
  //       } catch {
  //         // 파싱 에러 무시
  //       }
  //     }
  //   }, [clientDataParam, setValue]);

  const handleSelectClient = (item: ClientResponseModel) => {
    handleCompanyNameSelect(item);

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
    setValue('manager', item.manager || '');
    setValue('email', item.email || '');
    setValue('phone', formatPhoneNumber(String(item.phone ?? '')));
    setValue('fax', formatFaxNumber(String(item.fax ?? '')));

    setIsCompanyNameDropdownOpen(false);
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
                setTimeout(() => setIsCompanyNameDropdownOpen(false), 150);
              return (
                <Input
                  label="업체명"
                  placeholder="업체명을 입력하세요."
                  required
                  showError={!!errors.name}
                  value={field.value ?? ''}
                  onChange={(e) => {
                    field.onChange(e);
                    setCompanyNameInput(e.target.value);
                    searchClients(e.target.value);
                  }}
                  onFocus={() => setIsCompanyNameDropdownOpen(true)}
                  onBlur={handleCompanyNameBlur}
                  ref={field.ref}
                  name={field.name}
                />
              );
            }}
          />
          {isCompanyNameDropdownOpen && filteredClients.length > 0 && (
            <div className="absolute left-0 top-21 z-10 w-full">
              <ClientNameDropdown
                items={filteredClients}
                onSelect={handleSelectClient}
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
                message: '올바른 사업자등록번호 형식이 아닙니다.',
              },
            }}
            render={({ field }) => {
              return (
                <Input
                  label="사업자등록번호"
                  placeholder="사업자등록번호를 입력하세요."
                  required
                  showError={!!errors.business_registration_number}
                  value={field.value ?? ''}
                  onChange={(e) => {
                    const formatted = formatBusinessNumber(e.target.value);
                    field.onChange(formatted);
                  }}
                  ref={field.ref}
                  name={field.name}
                />
              );
            }}
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
              label="대표자명"
              placeholder="대표자명을 입력하세요."
              required
              showError={!!errors.representative_name}
              {...field}
            />
          )}
        />
        <Controller
          name="due_date"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <Input
              label="납기일자"
              placeholder="납기일자를 입력하세요."
              required
              showError={!!errors.due_date}
              value={field.value ?? ''}
              onChange={(e) => {
                const formatted = formatDate(e.target.value);
                field.onChange(formatted);
              }}
              ref={field.ref}
              name={field.name}
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
              label="업태"
              placeholder="업태를 입력하세요."
              showError={!!errors.business_type}
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
            <Input
              label="종목"
              required
              placeholder="종목을 입력하세요."
              showError={!!errors.business_category}
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
              label="사업장 주소"
              placeholder="사업장 주소를 입력하세요."
              required
              showError={!!errors.address}
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
              label="담당자명"
              placeholder="담당자명을 입력하세요."
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
              message: '올바른 이메일 형식이 아닙니다.',
            },
          }}
          render={({ field }) => (
            <Input
              label="이메일"
              placeholder="담당자 이메일을 입력하세요."
              showError={!!errors.email}
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
              message: '올바른 전화번호 형식이 아닙니다.',
            },
          }}
          render={({ field }) => {
            return (
              <Input
                placeholder="연락처를 입력하세요."
                label="연락처"
                showError={!!errors.phone}
                value={field.value ?? ''}
                onChange={(e) => {
                  const formatted = formatPhoneNumber(e.target.value);
                  field.onChange(formatted);
                }}
                ref={field.ref}
                name={field.name}
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
              message: '올바른 팩스번호 형식이 아닙니다.',
            },
          }}
          render={({ field }) => {
            return (
              <Input
                label="팩스 번호"
                placeholder="팩스 번호를 입력하세요."
                showError={!!errors.fax}
                value={field.value ?? ''}
                onChange={(e) => {
                  const formatted = formatFaxNumber(e.target.value);
                  field.onChange(formatted);
                }}
                ref={field.ref}
                name={field.name}
              />
            );
          }}
        />
      </div>
    </div>
  );
};

export default InputSection;
