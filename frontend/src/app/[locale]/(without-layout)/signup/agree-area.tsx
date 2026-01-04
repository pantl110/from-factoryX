'use client';

import Checkbox from '@/ui/checkbox';
import { UseFormSetValue, UseFormRegister } from 'react-hook-form';
import { SignupFormDataModel } from '@/types/data-model';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';

interface AgreeAreaProps {
  watchedValues: SignupFormDataModel;
  setValue: UseFormSetValue<SignupFormDataModel>;
  register: UseFormRegister<SignupFormDataModel>;
}

const AgreeArea = ({ watchedValues, setValue, register }: AgreeAreaProps) => {
  const t = useTranslations('signup.agreeArea');
  const locale = useLocale();
  // 모두 동의 체크박스 상태 (모든 항목 포함)
  const isAllChecked =
    watchedValues.terms_of_service &&
    watchedValues.privacy_policy_agreement &&
    watchedValues.marketing_agreement;

  // 체크박스 토글 함수
  // setValue 옵션을 추가하여 form state가 제대로 업데이트되도록 함
  const handleToggleAll = () => {
    const shouldCheckAll = !isAllChecked;
    setValue('terms_of_service', shouldCheckAll, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue('privacy_policy_agreement', shouldCheckAll, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue('marketing_agreement', shouldCheckAll, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const handleToggleService = () => {
    setValue('terms_of_service', !watchedValues.terms_of_service, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const handleTogglePrivacy = () => {
    setValue(
      'privacy_policy_agreement',
      !watchedValues.privacy_policy_agreement,
      {
        shouldValidate: true,
        shouldDirty: true,
      }
    );
  };

  const handleToggleMarketing = () => {
    setValue('marketing_agreement', !watchedValues.marketing_agreement, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  return (
    <div className="flex flex-col gap-2 mt-5 w-100">
      {/* Hidden inputs for react-hook-form to track values */}
      {/* register로 필드를 등록하여 handleSubmit 시 값이 포함되도록 함 */}
      <input type="hidden" {...register('terms_of_service')} />
      <input type="hidden" {...register('privacy_policy_agreement')} />
      <input type="hidden" {...register('marketing_agreement')} />
      <div className="flex gap-2">
        <Checkbox isChecked={isAllChecked} onToggle={handleToggleAll} />
        <p className="text-bl Me_Body-1">{t('agreeAll')}</p>
      </div>
      <div className="flex justify-between">
        <div className="flex gap-2">
          <Checkbox
            isChecked={watchedValues.terms_of_service}
            onToggle={handleToggleService}
          />
          <p className="text-sv Me_Body-1">{t('termsOfService.label')}</p>
        </div>
        <button
          className="text-sv Me_Body-1 hover:text-primary"
          onClick={() =>
            window.open(`/${locale}/signup/terms-of-service`, '_blank')
          }
        >
          {t('termsOfService.viewButton')}
        </button>
      </div>
      <div className="flex justify-between">
        <div className="flex gap-2">
          <Checkbox
            isChecked={watchedValues.privacy_policy_agreement}
            onToggle={handleTogglePrivacy}
          />
          <p className="text-sv Me_Body-1">{t('privacyPolicy.label')}</p>
        </div>
        <button
          className="text-sv Me_Body-1 hover:text-primary"
          onClick={() =>
            window.open(`/${locale}/signup/privacy-policy`, '_blank')
          }
        >
          {t('privacyPolicy.viewButton')}
        </button>
      </div>
      <div className="flex justify-between">
        <div className="flex gap-2">
          <Checkbox
            isChecked={watchedValues.marketing_agreement}
            onToggle={handleToggleMarketing}
          />
          <p className="text-sv Me_Body-1">{t('marketingAgreement.label')}</p>
        </div>
        <button
          className="text-sv Me_Body-1 hover:text-primary"
          onClick={() =>
            window.open(`/${locale}/signup/marketing-info`, '_blank')
          }
        >
          {t('marketingAgreement.viewButton')}
        </button>
      </div>
    </div>
  );
};

export default AgreeArea;
