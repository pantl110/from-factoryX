import Input from '@/ui/input';
import { useForm } from 'react-hook-form';
import { useEffect, useState, useCallback, useRef } from 'react';
import { ClientInfoFormDataModel } from '../type';
import { ClientNameDropdown } from '@/ui/dropdown/client-name-dropdown';
import { ClientResponseModel } from '@/types/data-model';
import { ClientDataSyncModel } from '../../../quotation/type';
import { useGetClient, formatBusinessNumber } from '@/hooks';

interface ClientInfoProps {
  onFormChange: (
    isValid: boolean,
    isDirty: boolean,
    hasRequiredValues: boolean,
    clientId?: number,
    formData?: ClientInfoFormDataModel
  ) => void;
  showErrors?: boolean;
  initialData?: ClientDataSyncModel;
}

const ClientInfo = ({
  onFormChange,
  showErrors = false,
  initialData,
}: ClientInfoProps) => {
  const {
    register,
    formState: { isValid, isDirty, errors },
    watch,
    trigger,
    setValue,
  } = useForm<ClientInfoFormDataModel>({
    mode: 'onChange', // 실시간 유효성 검사
    defaultValues: {
      companyName: initialData?.name || '',
      businessNumber: initialData?.business_registration_number || '',
      representativeName: initialData?.representative_name || '',
      businessType: initialData?.business_type || '',
      businessCategory: initialData?.business_category || '',
      address: initialData?.address || '',
    },
  });

  // 각 필드별로 에러 표시 여부를 추적하는 상태
  const [validatedFields, setValidatedFields] = useState<
    Set<keyof ClientInfoFormDataModel>
  >(new Set());

  // 검색 관련 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<ClientResponseModel[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<
    number | undefined
  >();

  // useGetClient 훅 사용
  const { searchClients, getClients } = useGetClient();

  // 디바운싱을 위한 타이머 ref
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  // 검색 함수를 useCallback으로 메모이제이션
  const performSearch = useCallback(
    async (query: string) => {
      if (query.trim().length === 0) {
        setSearchResults([]);
        setIsDropdownOpen(false);
        return;
      }

      try {
        // 먼저 totalCnt를 확인하기 위해 page_size=1로 호출
        const countResult = await searchClients(query);
        if (!countResult.success || !countResult.data) {
          setSearchResults([]);
          setIsDropdownOpen(false);
          return;
        }

        const totalCount = countResult.data.totalCnt;

        // totalCnt가 0이면 결과 없음
        if (totalCount === 0) {
          setSearchResults([]);
          setIsDropdownOpen(false);
          return;
        }

        // totalCnt만큼 page_size를 설정해서 모든 결과를 한 번에 가져오기
        const allResultsResult = await getClients({
          q: query,
          page: 1,
          page_size: totalCount,
        });

        if (allResultsResult.success && allResultsResult.data) {
          setSearchResults(allResultsResult.data.data || []);
          setIsDropdownOpen(true);
        } else {
          setSearchResults([]);
          setIsDropdownOpen(false);
        }
      } catch {
        setSearchResults([]);
        setIsDropdownOpen(false);
      }
    },
    [searchClients, getClients]
  );

  // 검색어 변경 시 디바운싱 적용
  useEffect(() => {
    // 이전 타이머 클리어
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    // 새 타이머 설정 (300ms 디바운싱)
    searchTimerRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    // 클린업 함수
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [searchQuery, performSearch]);

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

    // 검색 쿼리와 드롭다운 상태 업데이트
    setSearchQuery(client.name);
    setIsDropdownOpen(false);
    setSearchResults([]);
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
  }, [isValid, isDirty, hasRequiredValues, selectedClientId]); // formData 제거

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
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setValue('companyName', e.target.value, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
                handleFieldChange('companyName');
              }}
            />
            {isDropdownOpen && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-10 mt-1">
                <ClientNameDropdown
                  items={searchResults}
                  onSelect={handleClientSelect}
                  onClose={() => {
                    setIsDropdownOpen(false);
                    setSearchResults([]);
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
        />
      </form>
    </div>
  );
};

export default ClientInfo;
