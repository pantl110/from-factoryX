import { ReactNode } from "react";

interface InfoLabelValueProps {
  label: string;
  value: ReactNode;
}

const InfoLabelValue = ({ label, value }: InfoLabelValueProps) => {
  return (
    <div className="flex w-full Me_Body-1">
      <div className="w-[134px] h-full bg-lg-table">
        <div className="text-sv p-3">{label}</div>
      </div>
      <div className="flex-1">
        <div className="text-dg p-3">{value}</div>
      </div>
    </div>
  );
};

export default InfoLabelValue;
