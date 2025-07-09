import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr";

interface SearchInputProps {
  width?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  showIcon?: boolean;
}

const SearchInput = ({
  width = "w-[420px]",
  placeholder = "검색어를 입력하세요.",
  value,
  onChange,
  onFocus,
  onBlur,
  showIcon = true,
}: SearchInputProps) => {
  return (
    <div
      className={`flex items-center ${width} h-12 rounded-lg border border-[#e4e4e7] hover:border-primary focus-within:border-primary transition-colors`}
    >
      <div className="flex items-center gap-2 py-1 px-3 w-full">
        {showIcon && (
          <MagnifyingGlassIcon
            size={20}
            className="text-sv focus-within:text-dg"
          />
        )}
        <input
          className="Re_Body-1 w-full h-full outline-none text-bl placeholder:text-sv transition-colors"
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </div>
    </div>
  );
};

export default SearchInput;
