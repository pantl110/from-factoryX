'use client';

import { useTranslations } from 'next-intl';

interface PriceInfoProps {
  supplyAmount: number;
  taxAmount: number;
  textColor: string;
}

const PriceInfo = ({
  supplyAmount,
  taxAmount,
  textColor = 'text-primary',
}: PriceInfoProps) => {
  const tCommon = useTranslations('common');

  return (
    <div className="flex flex-col gap-4 bg-lg-table px-4 py-4 rounded-lg w-full">
      <div className="flex w-full justify-between items-center">
        <span className="w-[200 px] Me_Body-3 text-sv">
          {tCommon('supplyAmount')}
        </span>
        <span className={`${textColor} Me_Body-1`}>
          {supplyAmount?.toLocaleString()}
          <span className="text-sv Me_Body-2">{tCommon('won')}</span>
        </span>
      </div>
      <div className="flex w-full justify-between items-center">
        <span className="w-[200px] Me_Body-3 text-sv">
          {tCommon('taxAmountVAT')}
        </span>
        <span className={`${textColor} Me_Body-1`}>
          {taxAmount?.toLocaleString()}
          <span className="text-sv Me_Body-2">{tCommon('won')}</span>
        </span>
      </div>
      <div className="flex w-full justify-between items-center">
        <span className="w-[200px] Me_Body-3 text-sv">
          {tCommon('totalAmount')}
        </span>
        <span className={`${textColor} Me_Body-1`}>
          {(supplyAmount + taxAmount)?.toLocaleString()}
          <span className="text-sv Me_Body-2">{tCommon('won')}</span>
        </span>
      </div>
    </div>
  );
};

export default PriceInfo;
