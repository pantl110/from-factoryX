import { useTranslations } from 'next-intl';

interface PriceInfoSectionProps {
  supplyAmount: number;
  taxAmount: number;
  selectedAmount: number;
  differenceAmount: number;
}

const PriceInfoSection = ({
  supplyAmount,
  taxAmount,
  selectedAmount,
  differenceAmount,
}: PriceInfoSectionProps) => {
  const t = useTranslations('tax.list.receipt.linkReceiptModal.priceInfo');
  const tCommon = useTranslations('common');
  const tTax = useTranslations('tax');

  return (
    <div className="flex flex-col gap-4">
      <h4 className="Heading-4">{t('title')}</h4>

      <div className="flex gap-2.5 h-25">
        {/* 현금 영수증의 정보 */}
        <div className="flex-1 flex gap-2 border border-lg rounded-[8px] px-2 py-4.5">
          <div className="flex-1 px-3 py-2 flex flex-col items-center justify-center">
            <p className="Re_Body-2 text-sv">{tCommon('supplyAmount')}</p>
            <p className="Me_Body-1 ">{supplyAmount.toLocaleString()}</p>
          </div>
          <div className="flex-1 px-3 py-2 flex flex-col items-center justify-center border-x border-lg">
            <p className="Re_Body-2 text-sv">{tTax('taxAmount')}</p>
            <p className="Me_Body-1">{taxAmount.toLocaleString()}</p>
          </div>
          <div className="flex-1 px-3 py-2 flex flex-col items-center justify-center">
            <p className="Re_Body-2 text-sv">{tCommon('totalAmount')}</p>
            <p className="Me_Body-1">
              {(supplyAmount + taxAmount).toLocaleString()}
            </p>
          </div>
        </div>
        {/* 선택한 정보 */}
        <div
          className={`flex-[0.5] flex flex-col gap-2 p-4 bg-bg rounded-[8px] ${differenceAmount < 0 ? 'bg-red-8' : 'bg-bg'}`}
        >
          <div className="flex justify-between items-center h-7.5">
            <p className="Me_Body-3 text-dg">{t('selectedAmount')}</p>
            <p className="Me_Body-2 text-bl">
              {selectedAmount.toLocaleString()}
              {tCommon('won')}
            </p>
          </div>
          <div className="flex justify-between items-center h-7.5">
            <p className="Me_Body-3 text-dg">{t('differenceAmount')}</p>
            <p
              className={`Me_Body-2 ${differenceAmount < 0 ? 'text-red' : 'text-primary'}`}
            >
              {differenceAmount.toLocaleString()}
              {tCommon('won')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceInfoSection;
