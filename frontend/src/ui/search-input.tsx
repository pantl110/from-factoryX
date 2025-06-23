import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr";

interface SearchInputProps {
  width?: string;
  placeholder?: string;
}

const SearchInput = ({
  width = "w-[360px]",
  placeholder = "검색어를 입력하세요.",
}: SearchInputProps) => {
  return (
    <div
      className={`flex items-center ${width} h-12 rounded-lg border border-[#e4e4e7] hover:border-primary focus-within:border-gr transition-colors`}
    >
      <div className="flex items-center gap-2 py-1 px-3 w-full">
        <MagnifyingGlassIcon
          size={20}
          className="text-sv focus-within:text-dg"
        />
        <input
          className="Re_Body-1 w-full h-full outline-none text-sv placeholder:text-sv focus:text-dg transition-colors"
          type="text"
          placeholder={placeholder}
        />
      </div>
    </div>
  );
};

export default SearchInput;
