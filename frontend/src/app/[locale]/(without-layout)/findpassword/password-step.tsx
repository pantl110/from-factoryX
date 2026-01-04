import {
  UseFormRegister,
  UseFormHandleSubmit,
  FieldErrors,
  UseFormWatch,
} from 'react-hook-form';
import { ResetPasswordModel } from '@/types/data-model';
import { validatePassword } from '@/utils/validation';
import { UseResetPasswordReturnModel } from '@/hooks/users/use-reset-password';
import Input from '@/ui/input';
import MiniBtn from '@/ui/mini-btn';
import { useTranslations } from 'next-intl';

interface PasswordStepProps {
  register: UseFormRegister<ResetPasswordModel>;
  handleSubmit: UseFormHandleSubmit<ResetPasswordModel>;
  errors: FieldErrors<ResetPasswordModel>;
  watch: UseFormWatch<ResetPasswordModel>;
  isValid: boolean;
  onSubmit: (data: ResetPasswordModel) => void;
  resetPassword: UseResetPasswordReturnModel;
}

const PasswordStep = ({
  register,
  handleSubmit,
  errors,
  watch,
  isValid,
  onSubmit,
  resetPassword,
}: PasswordStepProps) => {
  const t = useTranslations('findPassword.password');
  const watchedValues = watch();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-100">
      <div className="flex flex-col">
        <Input
          type="password"
          placeholder={t('newPassword.placeholder')}
          label={t('newPassword.label')}
          isShowPasswordToggle={true}
          {...register('new_password', {
            required: t('newPassword.required'),
            validate: (value) => {
              const error = validatePassword(value);
              return error || true;
            },
          })}
        />
        <div className="mt-1 mb-2 h-5">
          {errors.new_password && (
            <span className="text-red Re_Body-1">
              {errors.new_password.message}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col">
        <Input
          type="password"
          placeholder={t('confirmPassword.placeholder')}
          label={t('confirmPassword.label')}
          isShowPasswordToggle={true}
          {...register('new_password_confirm', {
            required: t('confirmPassword.required'),
            validate: (value) => {
              if (value !== watchedValues.new_password) {
                return t('errors.passwordMismatch');
              }
              return true;
            },
          })}
        />
        <div className="mt-1 mb-2 h-5">
          {errors.new_password_confirm && (
            <span className="text-red Re_Body-1">
              {errors.new_password_confirm.message}
            </span>
          )}
          {!errors.new_password_confirm && resetPassword.error && (
            <span className="text-red Re_Body-1">{resetPassword.error}</span>
          )}
        </div>
      </div>

      <MiniBtn
        width="w-full"
        text={t('buttons.changePassword')}
        bgColor="bg-primary"
        textColor="text-wh"
        hoverColor="hover:bg-primary-hover"
        height="h-12"
        type="submit"
        disabled={!isValid || resetPassword.isLoading}
      />
    </form>
  );
};

export default PasswordStep;
