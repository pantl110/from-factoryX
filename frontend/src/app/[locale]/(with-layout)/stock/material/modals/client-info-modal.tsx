import { useTranslations } from 'next-intl';
import MiniBtn from '@/ui/mini-btn';
import Input from '@/ui/input';
import Modal from '@/ui/modal/modal';
import { ClientModel } from '@/types/data-model';
import { useState } from 'react';
import { ClientNameDropdown } from '@/ui/dropdown/client-name-dropdown';
import { useForm } from 'react-hook-form';
import {
  formatBusinessNumber,
  handleNumberKeyDown,
} from '@/utils/format-number';
import { ClientResponseModel } from '@/types/data-model';

interface ClientInfoModalProps {
  onClose: () => void;
  onNext: (client: ClientModel, clientId?: number | null) => void;
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
  const t = useTranslations('stock.material.modals.clientInfo');
  const tQuotation = useTranslations('quotation.inputSection');
  const tCommon = useTranslations('common');
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

  // 드롭다운 상태 관리
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);

  const handleSelectClient = (item: ClientModel | ClientResponseModel) => {
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
    setSearchKeyword(item.name ?? '');
    // ClientResponseModel인 경우 id가 있음
    if ('id' in item && item.id) {
      setSelectedClientId(item.id);
    } else {
      setSelectedClientId(null);
    }
  };

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

    onNext(
      {
        name,
        business_registration_number: businessRegistrationNumber,
        representative_name: representativeName,
        address,
        business_type: businessType,
        business_category: businessCategory,
        is_supplier: true,
        // type: 'supplier', // 자재 추가 시 고객 타입을 supplier 발주처로 설정
      },
      selectedClientId || null // 기존 거래처를 선택한 경우 client_id 전달, 없으면 null
    );
  };

  return (
    <Modal
      title={t('title')}
      subtitle={t('subtitle')}
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
              label={tCommon('clientName')}
              placeholder={t('placeholders.clientName')}
              required
              {...register('name', { required: true })}
              value={searchKeyword}
              onChange={(e) => {
                const { value } = e.target;
                setValue('name', value);
                setSearchKeyword(value);
                if (value.length > 0) {
                  setIsDropdownOpen(true);
                } else {
                  setIsDropdownOpen(false);
                }
              }}
              onFocus={() => {
                if (searchKeyword.length > 0) {
                  setIsDropdownOpen(true);
                }
              }}
              onBlur={() => setTimeout(() => setIsDropdownOpen(false), 150)}
              showError={!!errors.name}
            />
            {isDropdownOpen && searchKeyword && (
              <div className="absolute left-0 top-21 z-10 w-full">
                <ClientNameDropdown
                  searchTerm={searchKeyword}
                  onSelect={handleSelectClient}
                  width="w-full"
                  onClose={() => {
                    setIsDropdownOpen(false);
                    setSearchKeyword('');
                  }}
                />
              </div>
            )}
          </div>
          <div className="flex-1">
            <Input
              label={tCommon('businessRegistrationNumber')}
              placeholder={tQuotation(
                'placeholders.businessRegistrationNumber'
              )}
              required
              {...register('businessRegistrationNumber', {
                required: true,
                validate: (v) =>
                  /^\d{3}-\d{2}-\d{5}$/.test(v ?? '') ||
                  tQuotation('errors.invalidBusinessRegistrationNumber'),
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
            label={tCommon('representativeName')}
            placeholder={tQuotation('placeholders.representativeName')}
            required
            {...register('representativeName', {
              required: true,
            })}
            value={watch('representativeName') ?? ''}
            showError={!!errors.representativeName}
          />
          <div className="flex gap-2.5">
            <Input
              label={tCommon('businessType')}
              placeholder={tQuotation('placeholders.businessType')}
              required
              {...register('businessType', {
                required: true,
              })}
              value={watch('businessType') ?? ''}
              showError={!!errors.businessType}
            />
            <Input
              label={tCommon('businessCategory')}
              placeholder={tQuotation('placeholders.businessCategory')}
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
              label={tCommon('businessAddress')}
              required
              placeholder={tQuotation('placeholders.businessAddress')}
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
            text={tCommon('cancel')}
            variant="white"
            type="button"
            onClick={onClose}
          />
          <MiniBtn
            text={tCommon('next')}
            variant="primary"
            type="submit"
            disabled={!isFormValid}
          />
        </div>
      </form>
    </Modal>
  );
};

export default ClientInfoModal;
