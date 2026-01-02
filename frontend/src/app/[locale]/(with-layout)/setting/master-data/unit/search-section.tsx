import MiniBtn from '@/ui/mini-btn';
import SearchInput from '@/ui/search-input';
import { useTranslations } from 'next-intl';

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
  deleteButtonText,
}: SearchSectionProps) => {
  const tCommon = useTranslations('common');
  const tUnit = useTranslations('setting.masterData.unit');

  return (
    <div className="flex items-center pb-4 justify-between">
      <SearchInput
        placeholder={tUnit('placeholders.search')}
        value={value}
        onChange={onChange}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onEnter?.();
          }
        }}
      />
      <MiniBtn
        text={deleteButtonText || tCommon('delete')}
        variant={hasSelectedItems ? 'red' : 'whiteOutline'}
        onClick={hasSelectedItems ? onDeleteClick : undefined}
      />
    </div>
  );
};

export default SearchSection;
