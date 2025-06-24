import Chip from "@/ui/chip";
import { ClientType, ClientTypeColorMap } from "./types";

interface ClientTableItemProps {
  clientType: ClientType;
  companyName: string;
  businessNumber: string;
  representativeName: string;
  businessType: string;
  businessCategory: string;
  contact: string;
  email: string;
  onClick?: () => void;
}

const ClientTableItem = ({
  clientType,
  companyName,
  businessNumber,
  representativeName,
  businessType,
  businessCategory,
  contact,
  email,
  onClick,
}: ClientTableItemProps) => {
  const clientTypeColor = ClientTypeColorMap[clientType];
  return (
    <div
      className="flex h-14 items-center w-[1697px] border-b border-[#eeeeee] Me_Body-1 text-dg cursor-pointer"
      onClick={onClick}
    >
      <div className="w-[150px]">
        <Chip
          text={clientType}
          bgColor={clientTypeColor.bgColor}
          textColor={clientTypeColor.textColor}
          radius="rounded-sm"
        />
      </div>
      <p className="px-3 flex-1">{companyName}</p>
      <p className="px-3 flex-1">{businessNumber}</p>
      <p className="px-3 w-[100px]">{representativeName}</p>
      <p className="px-3 w-[200px]">{businessType}</p>
      <p className="px-3 flex-1">{businessCategory}</p>
      <p className="px-3 w-[150px]">{contact}</p>
      <p className="px-3 flex-1">{email}</p>
    </div>
  );
};

export default ClientTableItem;
