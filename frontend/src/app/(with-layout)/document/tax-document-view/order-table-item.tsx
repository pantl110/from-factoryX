import { PublishedTaxInvoiceResponseModel } from '@/types/data-model';

interface OrderTableItemProps {
  lineItem: PublishedTaxInvoiceResponseModel['line_items'][number];
  productInfo: PublishedTaxInvoiceResponseModel['products_info'][number] | null;
}

const OrderTableItem = ({ lineItem, productInfo }: OrderTableItemProps) => {
  return (
    <div className="h-14 w-full flex items-center Me_Body-1 text-dg border-b border-[#eeeeee]">
      <p
        className="flex-2 px-3 truncate"
        title={productInfo?.name || lineItem.name}
      >
        {lineItem.name || productInfo?.name}
      </p>
      <p
        className="flex-2 px-3 truncate"
        title={productInfo?.spec || lineItem.information}
      >
        {lineItem.information || productInfo?.spec}
      </p>
      <p className="w-[80px] px-3 truncate" title={productInfo?.unit || '-'}>
        {productInfo?.unit || '-'}
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

export default OrderTableItem;
