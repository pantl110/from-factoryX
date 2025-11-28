'use client';

import Checkbox from '@/ui/checkbox';
import { UseFormSetValue } from 'react-hook-form';
import { SignupFormDataModel } from '@/types/data-model';

interface AgreeAreaProps {
  watchedValues: SignupFormDataModel;
  setValue: UseFormSetValue<SignupFormDataModel>;
}

const AgreeArea = ({ watchedValues, setValue }: AgreeAreaProps) => {
  // 모두 동의 체크박스 상태 (모든 항목 포함)
  const isAllChecked =
    watchedValues.terms_of_service &&
    watchedValues.privacy_policy_agreement &&
    watchedValues.marketing_agreement;

  // 체크박스 토글 함수
  const handleToggleAll = () => {
    const shouldCheckAll = !isAllChecked;
    setValue('terms_of_service', shouldCheckAll);
    setValue('privacy_policy_agreement', shouldCheckAll);
    setValue('marketing_agreement', shouldCheckAll);
  };

  const handleToggleService = () => {
    setValue('terms_of_service', !watchedValues.terms_of_service);
  };

  const handleTogglePrivacy = () => {
    setValue(
      'privacy_policy_agreement',
      !watchedValues.privacy_policy_agreement
    );
  };

  const handleToggleMarketing = () => {
    setValue('marketing_agreement', !watchedValues.marketing_agreement);
  };

  return (
    <div className="flex flex-col gap-2 mt-5 w-100">
      <div className="flex gap-2">
        <Checkbox isChecked={isAllChecked} onToggle={handleToggleAll} />
        <p className="text-bl Me_Body-1">모두 동의</p>
      </div>
      <div className="flex justify-between">
        <div className="flex gap-2">
          <Checkbox
            isChecked={watchedValues.terms_of_service}
            onToggle={handleToggleService}
          />
          <p className="text-sv Me_Body-1">서비스 이용약관 (필수)</p>
        </div>
        <button
          className="text-sv Me_Body-1 hover:text-primary"
          onClick={() => window.open('/signup/terms-of-service', '_blank')}
        >
          약관 보기
        </button>
      </div>
      <div className="flex justify-between">
        <div className="flex gap-2">
          <Checkbox
            isChecked={watchedValues.privacy_policy_agreement}
            onToggle={handleTogglePrivacy}
          />
          <p className="text-sv Me_Body-1">개인정보 수집 및 이용 동의 (필수)</p>
        </div>
        <button
          className="text-sv Me_Body-1 hover:text-primary"
          onClick={() => window.open('/signup/privacy-policy', '_blank')}
        >
          약관 보기
        </button>
      </div>
      <div className="flex justify-between">
        <div className="flex gap-2">
          <Checkbox
            isChecked={watchedValues.marketing_agreement}
            onToggle={handleToggleMarketing}
          />
          <p className="text-sv Me_Body-1">마케팅 정보 수신 동의 (선택)</p>
        </div>
        <button
          className="text-sv Me_Body-1 hover:text-primary"
          onClick={() => window.open('/signup/marketing-info', '_blank')}
        >
          약관 보기
        </button>
      </div>
    </div>
  );
};

export default AgreeArea;
