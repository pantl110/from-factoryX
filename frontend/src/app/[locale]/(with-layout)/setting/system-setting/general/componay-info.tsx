import Input from '@/ui/input';
import MiniBtn from '@/ui/mini-btn';
import { useForm } from 'react-hook-form';
import { FactoriesModel } from '@/types/data-model';
import {
  useToast,
  useGetFactory,
  useUpdateFactory,
  useGetMember,
  formatBusinessNumber,
  formatPhoneNumber,
  formatFaxNumber,
} from '@/hooks';
import Toast from '@/ui/toast';
import { CheckCircle } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';
import useAuthStore from '@/store/auth-store';
import { useTranslations } from 'next-intl';

const CompanyInfo = () => {
  const { isToastOpen, isVisible, showToast } = useToast(2000);
  const tCommon = useTranslations('common');
  const tCompanyInfo = useTranslations(
    'setting.systemSetting.general.companyInfo'
  );

  const { getFactory, factory } = useGetFactory();
  const { updateFactory } = useUpdateFactory();
  const { getMember } = useGetMember();
  const factoryId = useMemberStore((state) => state.factoryId);
  const role = useMemberStore((state) => state.role);
  const { setIsBarobillUser } = useMemberStore();
  const { userInfo, fetchUserInfo } = useAuthStore();
  const memberId = userInfo?.member_id;
  const isAdmin = role === 'admin';
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<FactoriesModel>({
    defaultValues: {
      name: '',
      business_registration_number: '',
      representative_name: '',
      manager_email: '',
      manager_phone: '',
      manager_fax: '',
      business_type: '',
      business_category: '',
      business_address: '',
    },
    reValidateMode: 'onSubmit', // 모든 필드 유효성 검사를 동시에 실행
  });

  useEffect(() => {
    if (factoryId) {
      getFactory(factoryId);
    }
    // getFactory는 의존성 배열에서 제거!
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factoryId]);

  useEffect(() => {
    if (factory) {
      setValue('name', factory.name || '');
      setValue(
        'business_registration_number',
        factory.business_registration_number
          ? formatBusinessNumber(factory.business_registration_number)
          : ''
      );
      setValue('representative_name', factory.representative_name || '');
      setValue('manager_email', factory.manager_email || '');
      setValue('manager_phone', factory.manager_phone || '');
      setValue('manager_fax', factory.manager_fax || '');
      setValue('business_type', factory.business_type || '');
      setValue('business_category', factory.business_category || '');
      setValue('business_address', factory.business_address || '');
    }
  }, [factory, setValue]);

  const [isProcessing, setIsProcessing] = useState(false);

  const onSubmit = async (data: FactoriesModel) => {
    if (isProcessing || !factoryId || !factory) return;
    setIsProcessing(true);

    try {
      if (!data.name || data.name.trim() === '') {
        setError('name', {
          type: 'manual',
          message: tCompanyInfo('errors.companyNameRequired'),
        });
        setIsProcessing(false);
        return;
      } else {
        clearErrors('name');
      }

      // 기존 공장 수정
      const updateData = {
        factory_id: factoryId,
        name: data.name || '',
        business_registration_number: data.business_registration_number || '',
        representative_name: data.representative_name || '',
        manager_email: data.manager_email || '',
        manager_phone: data.manager_phone || '',
        manager_fax: data.manager_fax || '',
        business_type: data.business_type || '',
        business_category: data.business_category || '',
        business_address: data.business_address || '',
        billing_key: factory.billing_key,
      };
      // 사업자 번호가 변경되었는지 확인
      const hasBusinessNumberChanged =
        factory.business_registration_number !==
        data.business_registration_number;

      const result = await updateFactory(updateData);
      if (result && result.success) {
        showToast();
        // 수정 후 최신 factory 정보로 폼 동기화
        await getFactory(factoryId);

        // 사업자 번호가 변경되었으면 백엔드에서 바로빌 상태를 업데이트하므로
        // 최신 정보를 가져와서 auth-store와 member-store 업데이트 (localStorage에 자동 저장됨)
        if (hasBusinessNumberChanged && memberId && factoryId) {
          // auth-store 업데이트 (barobill_user_id 포함)
          await fetchUserInfo();

          // member-store 업데이트 (isBarobillUser 포함)
          try {
            const memberResult = await getMember({
              factory_id: factoryId,
              member_id: memberId,
            });
            if (memberResult.success && memberResult.data) {
              setIsBarobillUser(memberResult.data.is_barobill_user);
            }
          } catch {
            // 멤버 정보 조회 실패 시 무시
          }
        }
      } else if (result && result.error) {
        setError('name', { type: 'manual', message: result.error });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="flex flex-col py-8 gap-4 border-b border-b-[#eeeeee]">
        <h3 className="Heading-3">{tCompanyInfo('title')}</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Input
              placeholder={`${tCommon('required')} ${tCommon('placeholders.companyName')}`}
              label={tCommon('companyName')}
              required
              {...register('name')}
              showError={!!errors.name}
              disabledSetting={!isAdmin || !hasSubscription()}
            />
            <Input
              label={tCommon('businessRegistrationNumber')}
              placeholder={`${tCommon('required')} ${tCommon('placeholders.businessRegistrationNumber')}`}
              required
              showError={!!errors.business_registration_number}
              disabledSetting={!isAdmin || !hasSubscription()}
              {...register('business_registration_number', {
                onChange: (e) => {
                  const formatted = formatBusinessNumber(e.target.value);
                  e.target.value = formatted;
                },
                pattern: {
                  value: /^\d{3}-\d{2}-\d{5}$/,
                  message: '',
                },
              })}
            />
          </div>
          <div className="flex gap-2">
            <Input
              placeholder={`${tCommon('required')} ${tCommon('placeholders.representativeName')}`}
              label={tCommon('representativeName')}
              required
              disabledSetting={!isAdmin || !hasSubscription()}
              {...register('representative_name')}
            />
            <Input
              placeholder={`${tCommon('required')} ${tCommon('placeholders.email')}`}
              label={tCommon('email')}
              required
              showError={!!errors.manager_email}
              disabledSetting={!isAdmin || !hasSubscription()}
              {...register('manager_email', {
                pattern: {
                  value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                  message: '',
                },
              })}
            />
          </div>
          <div className="flex gap-2">
            <Input
              placeholder={tCommon('placeholders.phone')}
              label={tCommon('phone')}
              showError={!!errors.manager_phone}
              disabledSetting={!isAdmin || !hasSubscription()}
              {...register('manager_phone', {
                onChange: (e) => {
                  const formatted = formatPhoneNumber(e.target.value);
                  e.target.value = formatted;
                },
                pattern: {
                  value: /^(01[016789]-\d{3,4}-\d{4}|0\d{1,2}-\d{3,4}-\d{4})$/,
                  message: '',
                },
              })}
            />
            <Input
              placeholder={tCommon('placeholders.fax')}
              label={tCommon('fax')}
              showError={!!errors.manager_fax}
              disabledSetting={!isAdmin || !hasSubscription()}
              {...register('manager_fax', {
                onChange: (e) => {
                  const formatted = formatFaxNumber(e.target.value);
                  e.target.value = formatted;
                },
                pattern: {
                  value: /^(0\d{1,3}-\d{3,4}-\d{4})$/,
                  message: '',
                },
              })}
            />
          </div>
          <div className="flex gap-2">
            <Input
              placeholder={tCommon('placeholders.businessType')}
              label={tCommon('businessType')}
              disabledSetting={!isAdmin || !hasSubscription()}
              {...register('business_type')}
            />
            <Input
              placeholder={tCommon('placeholders.businessCategory')}
              label={tCommon('businessCategory')}
              disabledSetting={!isAdmin || !hasSubscription()}
              {...register('business_category')}
            />
          </div>
          <Input
            placeholder={tCommon('placeholders.businessAddress')}
            label={tCommon('businessAddress')}
            disabledSetting={!isAdmin || !hasSubscription()}
            {...register('business_address')}
          />
          {isAdmin && hasSubscription() && (
            <div className="flex justify-end">
              <MiniBtn
                text={tCommon('save')}
                textColor="text-primary"
                bgColor="bg-primary-8"
                hoverColor="hover:bg-secondary-hover"
                type="submit"
                disabled={isProcessing || !factoryId}
              />
            </div>
          )}
        </form>
      </div>

      {/* 토스트 */}
      {isToastOpen && (
        <Toast
          icon={<CheckCircle size={24} className="text-primary" />}
          text={tCompanyInfo('toast.saveSuccess')}
          subtext={tCompanyInfo('toast.saveSuccessSubtext')}
          type="primary"
          isVisible={isVisible}
        />
      )}
    </>
  );
};

export default CompanyInfo;
