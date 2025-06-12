import { ReactNode } from "react";

interface ClientInfoItemProps {
  label: string;
  value: ReactNode;
}

const ClientInfoItem = ({ label, value }: ClientInfoItemProps) => {
  return (
    <div className="flex w-full Me_Body-1">
      <div className="w-[134px] h-full bg-lg-table">
        <p className="text-sv p-3">{label}</p>
      </div>
      <div className="flex-1">
        <p className="text-dg p-3">{value}</p>
      </div>
    </div>
  );
};

export default ClientInfoItem;
