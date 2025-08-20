import { PublishedTaxInvoiceResponseModel } from '@/types/data-model';

interface PurchaseTableTiemProps {
  lineItem: PublishedTaxInvoiceResponseModel['line_items'][number];
}

const PurchaseTableTiem = ({ lineItem }: PurchaseTableTiemProps) => {
  return (
    <div className="h-14 w-full flex items-center Me_Body-1 text-dg border-b border-[#eeeeee]">
      <p className="flex-2 px-3 truncate" title={lineItem.name}>
        {lineItem.name}
      </p>
      <p className="flex-2 px-3 truncate" title={lineItem.information}>
        {lineItem.information}
      </p>
      <p
        className="flex-1 px-3 truncate"
        title={Number(lineItem.chargeable_unit).toLocaleString()}
      >
        {Number(lineItem.chargeable_unit).toLocaleString()}
      </p>
      <p
        className="flex-1 px-3 truncate"
        title={Number(lineItem.unit_price).toLocaleString()}
      >
        {Number(lineItem.unit_price).toLocaleString()}
      </p>
      <p
        className="flex-1 px-3 truncate"
        title={Number(lineItem.amount).toLocaleString()}
      >
        {Number(lineItem.amount).toLocaleString()}
      </p>
      <p
        className="flex-1 px-3 truncate"
        title={Number(lineItem.tax).toLocaleString()}
      >
        {Number(lineItem.tax).toLocaleString()}
      </p>
    </div>
  );
};

export default PurchaseTableTiem;
