import Input from '@/ui/input';
import { useForm } from 'react-hook-form';
import { formatBusinessNumber, formatDate } from '@/hooks/format-number';
import { useEffect, useState, useRef } from 'react';
import { useGetFactory } from '@/hooks/factory/use-get-factory';
import useMemberStore from '@/store/member-store';
import { SellerInfoFormDataModel } from '../type';

interface SellerInfoProps {
  onFormChange: (
    isValid: boolean,
    isDirty: boolean,
    hasRequiredValues: boolean,
    isOtherFieldsDirty: boolean,
    formData: SellerInfoFormDataModel
  ) => void;
  showErrors?: boolean;
  showWriteDateError?: boolean; // 작성일자만 에러 표시
  onWriteDateChange?: () => void; // 작성일자 변경 시 콜백
}

const SellerInfo = ({
  onFormChange,
  showErrors = false,
  showWriteDateError = false,
  onWriteDateChange,
}: SellerInfoProps) => {
  const {
    register,
    formState: { isValid, isDirty, errors, dirtyFields },
    watch,
    trigger,
    setValue,
    reset,
  } = useForm<SellerInfoFormDataModel>({
    mode: 'onChange', // 실시간 유효성 검사
    defaultValues: {
      companyName: '',
      businessNumber: '',
      representativeName: '',
      businessType: '',
      businessCategory: '',
      address: '',
      writeDate: formatDate(new Date().toISOString().split('T')[0]),
    },
  });

  const { getFactory, factory } = useGetFactory();
  const factoryId = useMemberStore((state) => state.factoryId);

  // 공장 상세 조회 후 초기값 세팅
  useEffect(() => {
    if (factoryId) {
      getFactory(factoryId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factoryId]);

  useEffect(() => {
    if (!factory) return;
    reset({
      companyName: factory.name || '',
      businessNumber: formatBusinessNumber(
        factory.business_registration_number || ''
      ),
      representativeName: factory.representative_name || '',
      businessType: factory.business_type || '',
      businessCategory: factory.business_category || '',
      address: factory.business_address || '',
      writeDate: formatDate(new Date().toISOString().split('T')[0]),
    });
    setValidatedFields(new Set());
    trigger(); // reset 후 즉시 유효성 검사 실행
  }, [factory, reset, trigger]);

  // 각 필드별로 에러 표시 여부를 추적하는 상태
  const [validatedFields, setValidatedFields] = useState<
    Set<keyof SellerInfoFormDataModel>
  >(new Set());

  // 폼 데이터 실시간 감시
  const formData = watch();

  // 이전 formData를 저장하여 변경 감지
  const prevFormDataRef = useRef<SellerInfoFormDataModel | null>(null);

  // 작성일자를 제외한 다른 필드들의 isDirty 상태
  const isOtherFieldsDirty = Boolean(
    dirtyFields.companyName ||
      dirtyFields.businessNumber ||
      dirtyFields.representativeName ||
      dirtyFields.businessType ||
      dirtyFields.businessCategory ||
      dirtyFields.address
  );

  // 모든 필수 필드에 값이 있는지 확인
  const hasRequiredValues = Boolean(
    formData.companyName &&
      formData.businessNumber &&
      formData.representativeName &&
      formData.businessType &&
      formData.businessCategory &&
      formData.writeDate
  );

  // 폼 상태가 변경될 때마다 부모 컴포넌트에 알림
  useEffect(() => {
    // formData가 실제로 변경되었는지 확인
    const hasFormDataChanged =
      !prevFormDataRef.current ||
      JSON.stringify(prevFormDataRef.current) !== JSON.stringify(formData);

    if (hasFormDataChanged) {
      prevFormDataRef.current = formData;

      // 유효성 검사 강제 실행
      trigger().then((isFormValid) => {
        onFormChange(
          isFormValid,
          isDirty,
          hasRequiredValues,
          isOtherFieldsDirty,
          formData
        );
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValid, isDirty, hasRequiredValues, isOtherFieldsDirty, formData]);

  // triggerValidation이 true가 되면 유효성 검사 실행
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
          'writeDate',
        ])
      );
    }
  }, [showErrors, trigger]);

  // showErrors가 true일 때 실시간으로 에러 상태 업데이트
  const shouldShowError = (fieldName: keyof SellerInfoFormDataModel) => {
    // 작성일자 필드의 경우 showWriteDateError가 true이면 에러 표시
    if (fieldName === 'writeDate' && showWriteDateError) {
      return true;
    }
    // 해당 필드가 검증되었고, 에러가 있을 때만 에러 표시
    return validatedFields.has(fieldName) && !!errors[fieldName];
  };

  // 필드 값이 변경될 때 해당 필드를 검증된 것으로 표시
  const handleFieldChange = (fieldName: keyof SellerInfoFormDataModel) => {
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
      <h3 className="Heading-3">판매처 정보</h3>
      <form className="flex flex-col gap-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              label="업체명"
              required
              placeholder="업체명을 입력하세요."
              showError={shouldShowError('companyName')}
              {...register('companyName', {
                required: '업체명은 필수입니다.',
                onChange: () => {
                  handleFieldChange('companyName');
                },
              })}
            />
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
        <div>
          <Input
            label="작성일자"
            required
            placeholder="YYYY-MM-DD"
            showError={shouldShowError('writeDate')}
            {...register('writeDate', {
              required: '작성일자는 필수입니다.',
              pattern: {
                value: /^\d{4}-\d{2}-\d{2}$/,
                message: '올바른 날짜 형식입니다. (예: 2024-01-01)',
              },
              onChange: (e) => {
                const formatted = formatDate(e.target.value);
                setValue('writeDate', formatted, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
                handleFieldChange('writeDate');
                onWriteDateChange?.(); // 작성일자 변경 시 에러 초기화
              },
            })}
          />
        </div>
      </form>
    </div>
  );
};

export default SellerInfo;
