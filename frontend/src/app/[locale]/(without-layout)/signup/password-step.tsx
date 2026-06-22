'use client';

import Input from '@/ui/input';
import MiniBtn from '@/ui/mini-btn';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { SignupFormDataModel } from '@/types/data-model';
import { validatePassword } from '@/utils/validation';
import { UseSignupReturnModel } from '@/hooks/users/use-signup';
import { useTranslations } from 'next-intl';

interface PasswordStepProps {
  register: UseFormRegister<SignupFormDataModel>;
  errors: FieldErrors<SignupFormDataModel>;
  watchedValues: SignupFormDataModel;
  isValid: boolean;
  signup: UseSignupReturnModel;
}

const PasswordStep = ({
  register,
  errors,
  watchedValues,
  isValid,
  signup,
}: PasswordStepProps) => {
  const t = useTranslations('signup.passwordStep');

  return (
    <>
      <div className="flex flex-col">
        <Input
          type="password"
          placeholder={t('password.placeholder')}
          label={t('password.label')}
          isShowPasswordToggle={true}
          {...register('password', {
            required: t('password.required'),
            validate: (value) => {
              const error = validatePassword(value, (key: string) => {
                // signup.passwordStep.password.* 키를 password.*로 변환
                const keyMap: Record<string, string> = {
                  'signup.passwordStep.password.required': 'password.required',
                  'signup.passwordStep.password.length': 'password.length',
                  'signup.passwordStep.password.uppercase':
                    'password.uppercase',
                  'signup.passwordStep.password.lowercase':
                    'password.lowercase',
                  'signup.passwordStep.password.number': 'password.number',
                  'signup.passwordStep.password.consecutive':
                    'password.consecutive',
                };
                return t(keyMap[key] || key);
              });
              return error || true;
            },
          })}
        />
        <div className="mt-1 mb-2 h-5">
          {errors.password && (
            <span className="text-red Re_Body-1">
              {errors.password.message}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col">
        <Input
          type="password"
          placeholder={t('passwordConfirm.placeholder')}
          label={t('passwordConfirm.label')}
          isShowPasswordToggle={true}
          {...register('password_confirm', {
            required: t('passwordConfirm.required'),
            validate: (value) => {
              const passwordValue = watchedValues.password;
              if (value !== passwordValue) {
                return t('passwordConfirm.mismatch');
              }
              return true;
            },
          })}
        />
        <div className="mt-1 mb-2 h-5">
          {errors.password_confirm && (
            <span className="text-red Re_Body-1">
              {errors.password_confirm.message}
            </span>
          )}
          {/* 프론트에서 처리하지 못한 에러 */}
          {!errors.password_confirm && signup.error && (
            <span className="text-red Re_Body-1">{signup.error}</span>
          )}
        </div>
      </div>

      <MiniBtn variant="primary"
        width="w-full"
        text={t('buttons.complete')}
        height="h-12"
        type="submit"
        disabled={
          !isValid ||
          !watchedValues.password ||
          !watchedValues.password_confirm ||
          signup.isLoading
        }
      />
    </>
  );
};

export default PasswordStep;
