import { MasterTaxType } from '@/types/status-type';
import { useTranslations } from 'next-intl';
import { Info } from '@phosphor-icons/react';

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
        <select
          value={value}
          onChange={(event) =>
            handleChange(event.target.value as MasterTaxType)
          }
          disabled={disabled}
          className="h-9 w-full rounded-md border border-lg bg-white px-3 text-dg outline-none disabled:cursor-not-allowed disabled:bg-bg"
        >
          <option value="taxable">{t('taxable')}</option>
          <option value="exempt">{t('taxExempt')}</option>
        </select>
      </div>
    </div>
  );
};

export default MasterTaxTypeField;
