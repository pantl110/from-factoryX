import { useTranslations } from 'next-intl';

const ReturnTableHeader = () => {
  const tCommon = useTranslations('common');

  return (
    <div className="flex items-center h-12 border-t border-b border-lg Me_Body-3 text-sv cursor-default">
      <p className="flex-[1.2] px-3">{tCommon('productName')}</p>
      <p className="flex-1 px-3">{tCommon('productCode')}</p>
      <p className="w-[90px] px-3">{tCommon('specification')}</p>
      <p className="w-[90px] px-3">{tCommon('unit')}</p>
    </div>
  );
};

export default ReturnTableHeader;
