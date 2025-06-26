import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";

import { InputType } from "@/types/input-type";

interface InputProps {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: InputType;
  disabled?: boolean;
  isShowPasswordToggle?: boolean;
  showError?: boolean;
}

const Input = ({
  label,
  value,
  onChange,
  placeholder = "검색어를 입력하세요.",
  required,
  type = "text",
  disabled = false,
  isShowPasswordToggle = false,
  showError = false,
}: InputProps) => {
  const [isShowPassword, setisShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setisShowPassword(!isShowPassword);
  };

  const hasError = showError && required && (!value || value.trim() === "");

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
          type={
            isShowPasswordToggle ? (isShowPassword ? "text" : "password") : type
          }
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full h-12 min-h-9 rounded px-3 Re_Body-1 text-bl placeholder:text-sv outline-none border transition-colors ${
            type === "number"
              ? "appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              : ""
          } ${
            disabled
              ? "bg-lg text-dg cursor-not-allowed border-[#e4e4e7]"
              : hasError
                ? "border-red hover:border-primary focus:border-primary focus:text-bl"
                : "border-[#e4e4e7] hover:border-primary focus:border-primary focus:text-bl"
          }`}
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
    </div>
  );
};

export default Input;
