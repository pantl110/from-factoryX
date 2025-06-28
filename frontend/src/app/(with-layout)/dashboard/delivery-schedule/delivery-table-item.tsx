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
    <div className="flex w-full h-14 items-center Me_Body-1 text-dg border-b border-[#eeeeee]">
      <div className="flex items-center py-1 px-3 w-[150px]">
        <Chip text={status} textColor="text-green" bgColor="bg-green-8" />
      </div>
    </div>
  );
};

export default DeliveryTableItem;
