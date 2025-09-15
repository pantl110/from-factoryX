import { CashReceiptResponseModel } from '@/types/data-model';
import { getProductNamesDisplay } from '@/utils/get-product-names-display';

interface TableItemProps {
  item: CashReceiptResponseModel;
  onClick?: () => void;
}

const TableItem = ({ item, onClick }: TableItemProps) => {
  return (
    <div
      className="flex items-center border-b border-lg h-14 w-full min-w-[1248px] text-bl Me_Body-1 hover:bg-bg transition-colors duration-200 cursor-pointer"
      onClick={onClick}
    >
      <p className="flex-1 px-3 text-dg">{item.transaction_date}</p>
      <p className="flex-2 px-3 text-dg truncate" title={item.client_name}>
        {item.client_name}
      </p>
      <p
        className="flex-2 px-3 text-dg truncate"
        title={getProductNamesDisplay(item.product_names)}
      >
        {getProductNamesDisplay(item.product_names)}
      </p>
      <p
        className="flex-1 px-3 text-dg truncate"
        title={item.transaction_amount.toLocaleString()}
      >
        {item.transaction_amount.toLocaleString()}
      </p>
      <p
        className="flex-1 px-3 text-dg truncate"
        title={item.tax_amount.toLocaleString()}
      >
        {item.tax_amount.toLocaleString()}
      </p>
      <p
        className="flex-1 px-3 text-dg truncate"
        title={item.total_amount.toLocaleString()}
      >
        {item.total_amount.toLocaleString()}
      </p>
    </div>
  );
};

export default TableItem;
