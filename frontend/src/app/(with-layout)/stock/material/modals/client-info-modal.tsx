import MiniBtn from '@/ui/mini-btn';
import Input from '@/ui/input';
import Modal from '@/ui/modal/modal';
import { ClientModel } from '@/types/data-model';
import { useEffect, useState, useCallback } from 'react';
import useGetClient from '@/hooks/factory/factory-client/use-get-client';
import { ClientNameDropdown } from '@/ui/dropdown/client-name-dropdown';
import { useForm } from 'react-hook-form';
import {
  formatBusinessNumber,
  handleNumberKeyDown,
} from '@/hooks/format-number';
import { ClientResponseModel } from '@/types/data-model';

interface ClientInfoModalProps {
  onClose?: () => void;
  onNext: (client: ClientModel) => void;
}

interface ClientFormModel {
  name: string;
  businessRegistrationNumber: string;
  representativeName: string;
  address: string;
  businessType: string;
  businessCategory: string;
}

const ClientInfoModal = ({ onClose, onNext }: ClientInfoModalProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ClientFormModel>({
    defaultValues: {
      name: '',
      businessRegistrationNumber: '',
      representativeName: '',
      address: '',
      businessType: '',
      businessCategory: '',
    },
  });

  const { clientList, getClients, searchClients } = useGetClient();

  // 드롭다운 상태 관리
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(
    null
  );

  // 초기 거래처 목록 로드
  useEffect(() => {
    getClients();
  }, [getClients]);

  // 검색어 변경 시 debounce 적용
  const handleSearchChange = useCallback(
    (keyword: string) => {
      setSearchKeyword(keyword);

      // 이전 타이머 클리어
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      // 새 타이머 설정 (300ms debounce)
      const timer = setTimeout(() => {
        if (keyword.trim()) {
          searchClients(keyword);
        } else {
          getClients();
        }
      }, 300);

      setDebounceTimer(timer);
    },
    [debounceTimer, searchClients, getClients]
  );

  // 컴포넌트 언마운트 시 타이머 클리어
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  const handleSelectClient = (item: ClientModel | ClientResponseModel) => {
    setSearchKeyword(item.name ?? '');
    setValue('name', item.name ?? '');
    setValue(
      'businessRegistrationNumber',
      formatBusinessNumber(item.business_registration_number || '')
    );
    setValue('representativeName', item.representative_name ?? '');
    setValue('address', item.address ?? '');
    setValue('businessType', item.business_type || '');
    setValue('businessCategory', item.business_category || '');
    setIsDropdownOpen(false);
  };

  const clientItems = clientList?.data || [];

  // 필수 필드들의 값 감시
  const name = watch('name');
  const businessRegistrationNumber = watch('businessRegistrationNumber');
  const representativeName = watch('representativeName');
  const businessType = watch('businessType');
  const businessCategory = watch('businessCategory');
  const address = watch('address');

  // 모든 필수 필드가 입력되었는지 확인
  const isFormValid =
    name?.trim() &&
    businessRegistrationNumber?.trim() &&
    representativeName?.trim() &&
    businessType?.trim() &&
    businessCategory?.trim() &&
    address?.trim();

  const onSubmit = (data: ClientFormModel) => {
    const {
      name,
      businessRegistrationNumber,
      representativeName,
      address,
      businessType,
      businessCategory,
    } = data;
    onNext({
      name,
      business_registration_number: businessRegistrationNumber,
      representative_name: representativeName,
      address,
      business_type: businessType,
      business_category: businessCategory,
      type: 'supplier', // 자재 추가 시 고객 타입을 supplier로 설정
    });
  };

  return (
    <Modal
      title="거래처 정보를 입력해주세요."
      subtitle="등록된 정보는 이후 문서 작성 시 자동으로 불러와져요."
      onClose={onClose}
      width="w-[600px]"
      scroll={true}
      // className="overflow-hidden"
    >
      <form
        className="flex flex-col gap-7 mt-4 px-6 pb-6 max-h-[calc(85vh-123px)] overflow-y-auto scrollbar-hide"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="flex flex-col gap-4">
          <div className="flex-1 relative">
            <Input
              label="업체명"
              placeholder="업체명을 입력하세요."
              required
              {...register('name', { required: true })}
              value={searchKeyword}
              onChange={(e) => {
                const { value } = e.target;
                setValue('name', value);
                handleSearchChange(value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              onBlur={() => setTimeout(() => setIsDropdownOpen(false), 150)}
              showError={!!errors.name}
            />
            {isDropdownOpen && clientItems.length > 0 && (
              <div className="absolute left-0 top-21 z-10 w-full">
                <ClientNameDropdown
                  items={clientItems}
                  onSelect={handleSelectClient}
                  width="w-full"
                  onClose={() => setIsDropdownOpen(false)}
                />
              </div>
            )}
          </div>
          <div className="flex-1">
            <Input
              label="사업자등록번호"
              placeholder="사업자등록번호를 입력하세요."
              required
              {...register('businessRegistrationNumber', {
                required: true,
                validate: (v) =>
                  /^\d{3}-\d{2}-\d{5}$/.test(v ?? '') ||
                  '사업자등록번호 형식이 올바르지 않습니다.',
              })}
              value={watch('businessRegistrationNumber') ?? ''}
              onChange={(e) => {
                const formatted = formatBusinessNumber(e.target.value);
                e.target.value = formatted;
                setValue('businessRegistrationNumber', formatted);
              }}
              onKeyDown={handleNumberKeyDown}
              showError={!!errors.businessRegistrationNumber}
            />
          </div>
          <Input
            label="대표자명"
            placeholder="대표자명을 입력하세요."
            required
            {...register('representativeName', {
              required: true,
            })}
            value={watch('representativeName') ?? ''}
            showError={!!errors.representativeName}
          />
          <div className="flex gap-2.5">
            <Input
              label="업태"
              placeholder="업태를 입력하세요."
              required
              {...register('businessType', {
                required: true,
              })}
              value={watch('businessType') ?? ''}
              showError={!!errors.businessType}
            />
            <Input
              label="종목"
              placeholder="종목을 입력하세요."
              required
              {...register('businessCategory', {
                required: true,
              })}
              value={watch('businessCategory') ?? ''}
              showError={!!errors.businessCategory}
            />
          </div>
          <div className="flex-1">
            <Input
              label="사업장 주소"
              required
              placeholder="사업장 주소를 입력하세요."
              {...register('address', {
                required: true,
              })}
              value={watch('address') ?? ''}
              showError={!!errors.address}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2.5">
          <MiniBtn
            text="취소"
            textColor="text-sv"
            onClick={onClose}
            hoverColor=""
          />
          <MiniBtn
            text="다음"
            bgColor="bg-primary"
            textColor="text-wh"
            type="submit"
            hoverColor="hover:bg-primary-hover"
            disabled={!isFormValid}
          />
        </div>
      </form>
    </Modal>
  );
};

export default ClientInfoModal;
