'use client';

import { useTranslations } from 'next-intl';

const ProductionTableHeader = () => {
  const t = useTranslations('common');

  return (
    <div className="flex min-w-[1421px] h-12 items-center Me_Body-1 text-sv border-t border-b border-[#eeeeee]">
      <div className="py-1 px-3 flex-2">
        <p>{t('clientName')}</p>
      </div>
      <div className="py-1 px-3 flex-2">
        <p>{t('productName')}</p>
      </div>
      <div className="py-1 px-3 flex-[1.5]">
        <p>{t('productCode')}</p>
      </div>
      <div className="py-1 px-3 flex-1">
        <p>{t('specification')}</p>
      </div>
      <div className="py-1 px-3 w-[80px]">
        <p>{t('unit')}</p>
      </div>
      <div className="py-1 px-3 flex-1">
        <p>{t('productionQuantity')}</p>
      </div>
      <div className="py-1 px-3 flex-[1.5]">
        <p>{t('productionEquipment')}</p>
      </div>
      <div className="py-1 px-3 flex-2">
        <p>{t('productionTime')}</p>
      </div>
    </div>
  );
};

export default ProductionTableHeader;
