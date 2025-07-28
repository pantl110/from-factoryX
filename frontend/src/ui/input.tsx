import { EyeIcon, EyeSlashIcon } from '@phosphor-icons/react/dist/ssr';
import { useState, forwardRef } from 'react';

interface InputProps {
  label?: string;
  value?: string | number | readonly string[];
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  type?: HTMLInputElement['type'];
  disabled?: boolean;
  isShowPasswordToggle?: boolean;
  showError?: boolean;
  errorMessage?: string;
  inputRef?: React.RefObject<HTMLInputElement>;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onFocus?: (() => void) | ((e: React.FocusEvent<HTMLInputElement>) => void);
  onBlur?: (() => void) | ((e: React.FocusEvent<HTMLInputElement>) => void);
  name?: string;
  disabledSetting?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      value,
      onChange,
      placeholder = '검색어를 입력하세요.',
      required,
      type = 'text',
      disabled = false,
      isShowPasswordToggle = false,
      showError = false,
      errorMessage,
      inputRef,
      onKeyDown,
      onFocus,
      onBlur,
      name,
      disabledSetting = false,
    },
    ref
  ) => {
    const [isShowPassword, setisShowPassword] = useState(false);

    const togglePasswordVisibility = () => {
      setisShowPassword(!isShowPassword);
    };

    const getInputClassName = () => {
      let className =
        'w-full h-12 min-h-9 rounded px-3 Re_Body-1 placeholder:text-sv outline-none border transition-colors duration-300';

      if (type === 'number') {
        className +=
          ' appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';
      }

      if (disabled) {
        className += ' bg-lg text-dg cursor-not-allowed border-[#e4e4e7]';
      } else if (disabledSetting) {
        className += ' text-bl cursor-not-allowed border-[#e4e4e7] ';
      } else if (showError) {
        className +=
          ' border-red hover:border-primary focus:border-primary focus:text-bl';
      } else {
        className +=
          ' border-[#e4e4e7] hover:border-primary focus:border-primary focus:text-bl';
      }

      if (type === 'date') {
        className += !value ? ' text-sv' : ' text-bl';
      }

      return className;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (type === 'number') {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
      }
      if (onChange) {
        onChange(e);
      }
    };
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      if (onBlur) {
        onBlur(e);
      }
    };

    return (
      <div className="flex flex-col gap-2 w-full">
        {label && (
          <div className="flex items-center gap-1 h-5">
            <label className="Me_Body-1 text-dg">{label}</label>
            {required && <span className="text-primary">*</span>}
          </div>
        )}

        <div className="relative">
          <input
            ref={ref || inputRef}
            name={name}
            type={
              isShowPasswordToggle
                ? isShowPassword
                  ? 'text'
                  : 'password'
                : type
            }
            value={value ?? ''}
            onChange={handleChange}
            onKeyDown={onKeyDown}
            onFocus={onFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled || disabledSetting}
            className={getInputClassName()}
            onWheel={type === 'number' ? (e) => e.preventDefault() : undefined}
            pattern={type === 'number' ? '[0-9]*' : undefined}
          />

          {isShowPasswordToggle && (
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-dg hover:text-primary transition-colors"
            >
              {isShowPassword ? (
                <EyeSlashIcon size={20} className="text-sv" />
              ) : (
                <EyeIcon size={20} className="text-sv" />
              )}
            </button>
          )}
        </div>

        {errorMessage && <p className="text-red Re_Body-1">{errorMessage}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
