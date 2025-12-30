'use client';

import Input from '@/ui/input';
import MiniBtn from '@/ui/mini-btn';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { SignupFormDataModel } from '@/types/data-model';
import { validatePassword } from '@/utils/validation';
import { UseSignupReturnModel } from '@/hooks/users/use-signup';

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
  return (
    <>
      <div className="flex flex-col">
        <Input
          type="password"
          placeholder="비밀번호를 입력해주세요."
          label="비밀번호"
          isShowPasswordToggle={true}
          {...register('password', {
            required: '비밀번호를 입력해주세요.',
            validate: (value) => {
              const error = validatePassword(value);
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
          placeholder="비밀번호를 다시 입력해주세요."
          label="비밀번호 확인"
          isShowPasswordToggle={true}
          {...register('password_confirm', {
            required: '비밀번호 확인을 입력해주세요.',
            validate: (value) => {
              const passwordValue = watchedValues.password;
              if (value !== passwordValue) {
                return '비밀번호가 일치하지 않습니다.';
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

      <MiniBtn
        width="w-full"
        text="가입 완료"
        bgColor="bg-primary"
        textColor="text-wh"
        hoverColor="hover:bg-primary-hover"
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
