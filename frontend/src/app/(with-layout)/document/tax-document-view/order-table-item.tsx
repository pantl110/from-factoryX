import { PublishedTaxInvoiceResponseModel } from '@/types/data-model';

interface OrderTableItemProps {
  product: PublishedTaxInvoiceResponseModel['products_info'][number];
}

const OrderTableItem = ({ product }: OrderTableItemProps) => {
  return (
    <div className="h-14 w-full flex items-center Me_Body-1 text-dg border-b border-[#eeeeee]">
      <p className="flex-2 px-3 truncate title={title}">{product.name}</p>
      <p className="flex-2 px-3">{product.spec}</p>
      <p className="w-[80px] px-3">{product.unit}</p>
      {/* <p className="flex-1 px-3">{product.quantity}</p>
      <p className="flex-1 px-3">{product.unit_price}</p>
      <p className="flex-1 px-3">{product.price}</p> */}
    </div>
  );
};

export default OrderTableItem;
