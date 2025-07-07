"use client";

import { ArrowSquareOut } from "@phosphor-icons/react/dist/ssr";

interface DeliveryTableItemProps {
  projectName: string;
  productName: string;
  date: string;
}

const DeliveryTableItem = ({
  projectName,
  productName,
  date,
}: DeliveryTableItemProps) => {
  return (
    <div className="group flex w-full h-15 items-center Me_Body-1 text-dg border-b border-[#eeeeee] cursor-pointer hover:bg-bg transition-colors ease-in-out duration-200">
      <p className="px-3 w-[150px] truncate" title={projectName}>
        {projectName}
      </p>
      <p className="px-3 flex-1 truncate" title={productName || ""}>
        {productName}
      </p>
      <p className="px-3 flex-1">{date}</p>
      <div className="w-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ease-in-out duration-200">
        <ArrowSquareOut size={24} />
      </div>
    </div>
  );
};

export default DeliveryTableItem;
