import Chip from "@/ui/chip";

interface DeliveryTableItemProps {
  status: string;
  productName: string;
  date: string;
}

const DeliveryTableItem = ({
  status,
  productName,
  date,
}: DeliveryTableItemProps) => {
  return (
    <div className="flex w-full h-14 items-center Me_Body-1 text-dg border-b border-[#eeeeee]">
      <div className="flex items-center px-3 w-[150px]">
        <Chip text={status} textColor="text-green" bgColor="bg-green-8" />
      </div>
      <p className="px-3 flex-1">{productName}</p>
      <p className="px-3 flex-1">{date}</p>
    </div>
  );
};

export default DeliveryTableItem;
