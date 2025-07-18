// 현금영수증 아이템 타입 정의
interface ReceiptItemModel {
  id: number;
  date: string;
  company: string;
  productName: string;
  supplyAmount: number;
  taxAmount: number;
  totalAmount: number;
}

interface TableItemProps {
  item: ReceiptItemModel;
  onClick?: () => void;
}

const TableItem = ({ item, onClick }: TableItemProps) => {
  return (
    <div
      className="flex items-center border-b border-lg h-14 w-full min-w-[1248px] text-bl Me_Body-1 hover:bg-bg transition-colors duration-200 cursor-pointer"
      onClick={onClick}
    >
      <p className="flex-1 px-3 text-dg">{item.date}</p>
      <p className="flex-2 px-3 text-dg">{item.company}</p>
      <p className="flex-2 px-3 text-dg">{item.productName}</p>
      <p className="flex-1 px-3 text-dg">{item.supplyAmount}</p>
      <p className="flex-1 px-3 text-dg">{item.taxAmount}</p>
      <p className="flex-1 px-3 text-dg">{item.totalAmount}</p>
    </div>
  );
};

export default TableItem;
