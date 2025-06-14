import { InputType } from "@/types/input-type";

interface InputProps {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: InputType;
}

const Input = ({
  label,
  value,
  onChange,
  placeholder = "검색어를 입력하세요.",
  required,
  type = "text",
}: InputProps) => {
  return (
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <div className="flex items-center gap-1 h-5">
          <label className="Me_Body-1 text-dg">{label}</label>
          {required && <span className="text-primary">*</span>}
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full h-12 min-h-9 rounded px-3 Re_Body-1 text-dg placeholder:text-sv outline-none border border-[#e4e4e7] hover:border-primary focus:border-gr focus:text-dg transition-colors"
      />
    </div>
  );
};

export default Input;
