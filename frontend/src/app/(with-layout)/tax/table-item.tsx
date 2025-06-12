import Chip from "@/ui/chip";

interface TableItemProps {
  id: number;
  status: string;
  date: string;
  company: string;
  supplyAmount: string;
  taxAmount: string;
  totalAmount: string;
  state: string;
  onClick: (id: number) => void;
}

const TableItem = ({
  id,
  status,
  date,
  company,
  supplyAmount,
  taxAmount,
  totalAmount,
  state,
  onClick,
}: TableItemProps) => {
  return (
    <div
      className="flex items-center w-[1373px] h-14 border-b border-[#eeeeee] Me_Body-1 cursor-pointer"
      onClick={() => onClick(id)}
    >
      <div className="flex items-center py-3 px-2">
        <input type="checkbox" className="w-4 h-4 border-sv" />
      </div>
      <div className="py-1 px-3 w-[150px]">
        <Chip text={status} bgColor="bg-primary-8" textColor="text-primary" />
      </div>
      <p className="w-[200px] py-1 px-3 text-dg">{date}</p>
      <p className="flex-1 py-1 px-3 text-dg">{company}</p>
      <p className="flex-1 py-1 px-3 text-dg">{supplyAmount}</p>
      <p className="flex-1 py-1 px-3 text-dg">{taxAmount}</p>
      <p className="flex-1 py-1 px-3 text-dg">{totalAmount}</p>
      <p className="w-[110px] py-1 px-3 text-dg">{state}</p>
    </div>
  );
};

export default TableItem;
