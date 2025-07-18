import PriceInfo from '@/ui/price-info';
import TaxInvoiceTableHeader from './tax-invoice-table-header';
import TaxInvoiceTableItem from './tax-invoice-table-item';
import TaxInvoiceTitle from './tax-invoice-title';
import TaxInvoiceInfo from './tax-invoice-input';

const TaxInvoice = () => {
  return (
    <div className="flex flex-col w-[1080px] max-h-[1400px] py-10 gap-11">
      <TaxInvoiceTitle />
      <div className="flex flex-col gap-9 px-10">
        <TaxInvoiceInfo />
        <div className="flex flex-col gap-5">
          <h3 className="Heading-3 text-dg">주문 품목 정보</h3>
          <PriceInfo />
          <div>
            <TaxInvoiceTableHeader />
            <TaxInvoiceTableItem />
            <TaxInvoiceTableItem />
            <TaxInvoiceTableItem />
            <TaxInvoiceTableItem />
            <TaxInvoiceTableItem />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaxInvoice;
