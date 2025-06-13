import React from "react";
interface SupplierItemProps {
  title: string;
  content: string;
}

const SupplierItem = ({ title, content }: SupplierItemProps) => {
  return (
    <div className="flex w-full border-t border-lg">
      <div className="w-[134px] p-3 Me_body-1 bg-bg text-sv">{title}</div>
      <div className="p-3 Me_body-1">{content}</div>
    </div>
  );
};

export default SupplierItem;
