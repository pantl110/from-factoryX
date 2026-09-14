import { MasterTaxType } from '@/types/status-type';
import { useTranslations } from 'next-intl';

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
    <div className="flex-1 min-w-0 border-r border-lg px-5 py-4">
      <p className="Me_Body-3 text-sv mb-2">{t('taxClassification')}</p>
      <select
        value={value}
        onChange={(event) => handleChange(event.target.value as MasterTaxType)}
        disabled={disabled}
        className="h-9 w-full rounded-md border border-lg bg-white px-3 text-dg outline-none disabled:cursor-not-allowed disabled:bg-bg"
      >
        <option value="taxable">{t('taxable')}</option>
        <option value="exempt">{t('taxExempt')}</option>
      </select>
      <p className="Me_Body-4 mt-2 text-sv">{t('taxTypeAutoHelp')}</p>
    </div>
  );
};

export default MasterTaxTypeField;
