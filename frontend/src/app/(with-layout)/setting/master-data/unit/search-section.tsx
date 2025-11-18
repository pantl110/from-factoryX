import MiniBtn from '@/ui/mini-btn';
import SearchInput from '@/ui/search-input';

interface SearchSectionProps {
  value: string;
  onChange: (value: string) => void;
  onEnter?: () => void;
  onDeleteClick?: () => void;
  hasSelectedItems?: boolean;
  deleteButtonText?: string;
}

const SearchSection = ({
  value,
  onChange,
  onEnter,
  onDeleteClick,
  hasSelectedItems = false,
  deleteButtonText = '삭제',
}: SearchSectionProps) => {
  return (
    <div className="flex items-center pb-4 justify-between">
      <SearchInput
        placeholder="자재명, 품목명을 입력해 검색하세요."
        value={value}
        onChange={onChange}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onEnter?.();
          }
        }}
      />
      <MiniBtn
        text={deleteButtonText}
        variant={hasSelectedItems ? 'red' : 'whiteOutline'}
        onClick={hasSelectedItems ? onDeleteClick : undefined}
      />
    </div>
  );
};

export default SearchSection;
