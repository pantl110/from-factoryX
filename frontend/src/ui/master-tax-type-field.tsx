import { MasterTaxType } from '@/types/status-type';
import { useTranslations } from 'next-intl';
import { Info } from '@phosphor-icons/react';
import ButtonSelectDropdown from '@/ui/button-select-dropdown';

interface MasterTaxTypeFieldProps {
  value: MasterTaxType;
  handleChange: (value: MasterTaxType) => void;
  disabled?: boolean;
}

const MasterTaxTypeField = ({
  value,
  handleChange,
  disabled = false,
}: MasterTaxTypeFieldProps) => {
  const t = useTranslations('common');

  return (
    <div className="flex flex-1 min-w-0 border-r border-lg Me_Body-3">
      <div className="flex w-[137px] shrink-0 items-center gap-2 bg-bg p-3 text-sv">
        <span>{t('taxClassification')}</span>
        <span
          title={t('taxTypeAutoHelp')}
          aria-label={t('taxTypeAutoHelp')}
          className="cursor-help"
        >
          <Info size={16} />
        </span>
      </div>
      <div className="flex flex-1 items-center px-3">
        <ButtonSelectDropdown
          ariaLabel={t('taxClassification')}
          value={value}
          options={[
            { value: 'taxable', label: t('taxable') },
            { value: 'exempt', label: t('taxExempt') },
          ]}
          onChange={handleChange}
          disabled={disabled}
          width="w-full"
          height="h-9"
          padding="px-3"
          className="w-full"
        />
      </div>
    </div>
  );
};

export default MasterTaxTypeField;
