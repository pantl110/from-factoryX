import { MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr';

interface SearchInputProps {
  width?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  showIcon?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const SearchInput = ({
  width = 'w-[420px]',
  placeholder = '',
  value,
  onChange,
  onFocus,
  onBlur,
  showIcon = true,
  onKeyDown,
}: SearchInputProps) => {
  return (
    <div
      className={`flex items-center ${width} h-12 rounded-lg border border-lg hover:border-primary focus-within:border-primary transition-colors`}
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
          onKeyDown={onKeyDown}
        />
      </div>
    </div>
  );
};

export default SearchInput;
