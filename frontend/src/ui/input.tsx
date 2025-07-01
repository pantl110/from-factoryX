import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react/dist/ssr";
import { useState, forwardRef } from "react";
import { InputType } from "@/types/input-type";

interface InputProps {
  label?: string;
  value?: string;
  onChange?:
    | ((value: string) => void)
    | ((e: React.ChangeEvent<HTMLInputElement>) => void);
  placeholder?: string;
  required?: boolean;
  type?: InputType;
  disabled?: boolean;
  isShowPasswordToggle?: boolean;
  showError?: boolean;
  errorMessage?: string;
  inputRef?: React.RefObject<HTMLInputElement>;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onFocus?: () => void;
  onBlur?: (() => void) | ((e: React.FocusEvent<HTMLInputElement>) => void);
  name?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      value,
      onChange,
      placeholder = "검색어를 입력하세요.",
      required,
      type = "text",
      disabled = false,
      isShowPasswordToggle = false,
      showError = false,
      errorMessage,
      inputRef,
      onKeyDown,
      onFocus,
      onBlur,
      name,
    },
    ref,
  ) => {
    const [isShowPassword, setisShowPassword] = useState(false);

    const togglePasswordVisibility = () => {
      setisShowPassword(!isShowPassword);
    };

    const getInputClassName = () => {
      let className =
        "w-full h-12 min-h-9 rounded px-3 Re_Body-1 placeholder:text-sv outline-none border transition-colors duration-300";

      if (type === "number") {
        className +=
          " appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";
      }

      if (disabled) {
        className += " bg-lg text-dg cursor-not-allowed border-[#e4e4e7]";
      } else if (showError) {
        className +=
          " border-red hover:border-primary focus:border-primary focus:text-bl";
      } else {
        className +=
          " border-[#e4e4e7] hover:border-primary focus:border-primary focus:text-bl";
      }

      if (type === "date") {
        className += !value ? " text-sv" : " text-bl";
      }

      return className;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!onChange) {
        return;
      }

      try {
        // React Hook Form의 register 함수인지 확인 (매개변수 개수로 판단)
        const onChangeStr = onChange.toString();
        if (onChangeStr.includes("e.") || onChangeStr.includes("event")) {
          // React Hook Form 방식: (e: ChangeEvent) => void
          (onChange as (e: React.ChangeEvent<HTMLInputElement>) => void)(e);
        } else {
          // 기존 방식: (value: string) => void
          (onChange as (value: string) => void)(e?.target?.value || "");
        }
      } catch (error) {
        console.error("Error in handleChange:", error);
        // 에러가 발생하면 기본 방식으로 시도
        try {
          (onChange as (value: string) => void)(e?.target?.value || "");
        } catch (fallbackError) {
          console.error("Fallback error in handleChange:", fallbackError);
        }
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      if (!onBlur) {
        return;
      }

      try {
        // React Hook Form의 register 함수인지 확인
        const onBlurStr = onBlur.toString();
        if (onBlurStr.includes("e.") || onBlurStr.includes("event")) {
          // React Hook Form 방식: (e: FocusEvent) => void
          (onBlur as (e: React.FocusEvent<HTMLInputElement>) => void)(e);
        } else {
          // 기존 방식: () => void
          (onBlur as () => void)();
        }
      } catch (error) {
        console.error("Error in handleBlur:", error);
        // 에러가 발생하면 기본 방식으로 시도
        try {
          (onBlur as () => void)();
        } catch (fallbackError) {
          console.error("Fallback error in handleBlur:", fallbackError);
        }
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
                  ? "text"
                  : "password"
                : type
            }
            value={value}
            onChange={handleChange}
            onKeyDown={onKeyDown}
            onFocus={onFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={getInputClassName()}
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
  },
);

Input.displayName = "Input";

export default Input;
