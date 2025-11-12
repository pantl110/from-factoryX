import Input from '@/ui/input';
import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { ClientInfoFormDataModel } from '../type';
import { ClientNameDropdown } from '@/ui/dropdown/client-name-dropdown';
import { ClientResponseModel, TaxClientInfoModel } from '@/types/data-model';
import { formatBusinessNumber } from '@/hooks';
import useMemberStore from '@/store/member-store';

interface ClientInfoProps {
  onFormChange: (
    isValid: boolean,
    isDirty: boolean,
    hasRequiredValues: boolean,
    clientId?: number,
    formData?: ClientInfoFormDataModel
  ) => void;
  showErrors?: boolean;
  initialData?: TaxClientInfoModel;
}

const ClientInfo = ({
  onFormChange,
  showErrors = false,
  initialData,
}: ClientInfoProps) => {
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';

  const {
    register,
    formState: { isValid, isDirty, errors },
    watch,
    trigger,
    setValue,
    reset,
  } = useForm<ClientInfoFormDataModel>({
    mode: 'onChange', // 실시간 유효성 검사
    defaultValues: {
      companyName: '',
      businessNumber: '',
      representativeName: '',
      businessType: '',
      businessCategory: '',
      address: '',
    },
  });

  // initialData가 변경될 때마다 폼 리셋
  useEffect(() => {
    if (initialData) {
      reset({
        companyName: initialData.name || '',
        businessNumber: initialData.business_registration_number || '',
        representativeName: initialData.representative_name || '',
        businessType: initialData.business_type || '',
        businessCategory: initialData.business_category || '',
        address: initialData.address || '',
      });
      setSelectedClientId(initialData.id);
    }
  }, [initialData, reset]);

  // 각 필드별로 에러 표시 여부를 추적하는 상태
  const [validatedFields, setValidatedFields] = useState<
    Set<keyof ClientInfoFormDataModel>
  >(new Set());

  // 검색 관련 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<
    number | undefined
  >();

  // 폼 데이터 실시간 감시
  const formData = watch();

  // 모든 필수 필드에 값이 있는지 확인
  const hasRequiredValues = Boolean(
    formData.companyName &&
      formData.businessNumber &&
      formData.representativeName &&
      formData.businessType &&
      formData.businessCategory
  );

  // 거래처 선택 핸들러
  const handleClientSelect = (client: ClientResponseModel) => {
    // 선택된 거래처 ID 저장
    setSelectedClientId(client.id);

    // 선택된 거래처 정보로 모든 폼 필드 자동 채우기
    setValue('companyName', client.name, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue('businessNumber', client.business_registration_number || '', {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue('representativeName', client.representative_name || '', {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue('businessType', client.business_type || '', {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue('businessCategory', client.business_category || '', {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue('address', client.address || '', {
      shouldValidate: true,
      shouldDirty: true,
    });

    // 드롭다운 상태만 업데이트
    setIsDropdownOpen(false);
    setSearchQuery(client.name);
  };

  // 폼 상태가 변경될 때마다 부모 컴포넌트에 알림 (의존성 배열에서 onFormChange 제거)
  useEffect(() => {
    onFormChange(
      isValid,
      isDirty,
      hasRequiredValues,
      selectedClientId,
      formData
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isValid,
    isDirty,
    hasRequiredValues,
    selectedClientId,
    formData.companyName,
    formData.businessNumber,
    formData.representativeName,
    formData.businessType,
    formData.businessCategory,
    formData.address,
  ]);

  // showErrors가 true가 되면 유효성 검사 실행
  useEffect(() => {
    if (showErrors) {
      trigger(); // 모든 필드에 대해 유효성 검사 실행
      // 모든 필드를 검증된 것으로 표시
      setValidatedFields(
        new Set([
          'companyName',
          'businessNumber',
          'representativeName',
          'businessType',
          'businessCategory',
          'address',
        ])
      );
    }
  }, [showErrors, trigger]);

  // showErrors가 true일 때 실시간으로 에러 상태 업데이트
  const shouldShowError = (fieldName: keyof ClientInfoFormDataModel) => {
    // 해당 필드가 검증되었고, 에러가 있을 때만 에러 표시
    return validatedFields.has(fieldName) && !!errors[fieldName];
  };

  // 필드 값이 변경될 때 해당 필드를 검증된 것으로 표시
  const handleFieldChange = (fieldName: keyof ClientInfoFormDataModel) => {
    if (validatedFields.has(fieldName)) {
      setValidatedFields((prev) => {
        const newSet = new Set(prev);
        newSet.delete(fieldName);
        return newSet;
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-5">
      <h3 className="Heading-3">거래처 정보</h3>
      <form className="flex flex-col gap-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              label="업체명"
              required
              placeholder="업체명을 입력하세요."
              showError={shouldShowError('companyName')}
              value={formData.companyName || ''}
              onChange={(e) => {
                const { value } = e.target;
                setSearchQuery(value);
                setValue('companyName', value, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
                handleFieldChange('companyName');
                if (value.length > 0) {
                  setIsDropdownOpen(true);
                } else {
                  setIsDropdownOpen(false);
                }
              }}
              disabledReadOnly={isViewer}
            />
            {isDropdownOpen && searchQuery && (
              <div className="absolute top-full left-0 right-0 z-10 mt-1">
                <ClientNameDropdown
                  searchTerm={searchQuery}
                  onSelect={handleClientSelect}
                  onClose={() => {
                    setIsDropdownOpen(false);
                    setSearchQuery('');
                  }}
                  width="100%"
                />
              </div>
            )}
          </div>
          <div className="flex-1">
            <Input
              label="사업자등록번호"
              required
              placeholder="사업자등록번호를 입력하세요."
              showError={shouldShowError('businessNumber')}
              {...register('businessNumber', {
                required: '사업자등록번호는 필수입니다.',
                pattern: {
                  value: /^\d{3}-\d{2}-\d{5}$/,
                  message:
                    '올바른 사업자등록번호 형식입니다. (예: 123-45-67890)',
                },
                onChange: (e) => {
                  const formatted = formatBusinessNumber(e.target.value);
                  setValue('businessNumber', formatted, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                  handleFieldChange('businessNumber');
                },
              })}
              disabledReadOnly={isViewer}
            />
          </div>
        </div>
        <div>
          <Input
            label="대표자명"
            required
            placeholder="대표자명을 입력하세요."
            showError={shouldShowError('representativeName')}
            {...register('representativeName', {
              required: '대표자명은 필수입니다.',
              onChange: () => {
                handleFieldChange('representativeName');
              },
            })}
            disabledReadOnly={isViewer}
          />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              label="업태"
              required
              placeholder="업태를 입력하세요."
              showError={shouldShowError('businessType')}
              {...register('businessType', {
                required: '업태는 필수입니다.',
                onChange: () => {
                  handleFieldChange('businessType');
                },
              })}
              disabledReadOnly={isViewer}
            />
          </div>
          <div className="flex-1">
            <Input
              label="종목"
              required
              placeholder="종목을 입력하세요."
              showError={shouldShowError('businessCategory')}
              {...register('businessCategory', {
                required: '종목은 필수입니다.',
                onChange: () => {
                  handleFieldChange('businessCategory');
                },
              })}
              disabledReadOnly={isViewer}
            />
          </div>
        </div>
        <Input
          label="사업장 주소"
          placeholder="사업장 주소를 입력하세요."
          showError={shouldShowError('address')}
          {...register('address', {
            onChange: () => {
              handleFieldChange('address');
            },
          })}
          disabledReadOnly={isViewer}
        />
      </form>
    </div>
  );
};

export default ClientInfo;
