'use client';

import Chip from '@/ui/chip';
import { useRouter } from 'next/navigation';
import {
  ProjectStatusType,
  ProjectStatusColorMap,
  TaxStatusType,
} from '@/types/status-type';
import Checkbox from '@/ui/checkbox';
import MiniBtn from '@/ui/mini-btn';

interface TableItemProps {
  id: number;
  status: ProjectStatusType;
  companyName: string;
  items: string;
  startDate: string;
  endDate: string;
  taxIssued: TaxStatusType;
  checked?: boolean;
  onToggle?: () => void;
}

const TableItem = ({
  id,
  status,
  companyName,
  items,
  startDate,
  endDate,
  taxIssued,
  checked = false,
  onToggle,
}: TableItemProps) => {
  const router = useRouter();
  const chipColors = ProjectStatusColorMap[status];

  const handleClick = () => {
    if (status === '견적 협의') router.push(`/quotation`);
    else router.push(`/production/${id}`);
  };

  return (
    <div
      className="flex items-center h-14 w-[1448px] border-b border-lg Me_Body-1 cursor-pointer hover:bg-bg"
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleClick();
      }}
    >
      <Checkbox isChecked={checked} onToggle={onToggle || (() => {})} />
      <div className="py-1 px-3 w-[150px]">
        <Chip
          text={status}
          bgColor={chipColors.bgColor}
          textColor={chipColors.textColor}
        />
      </div>
      <p className="flex-2 py-1 px-3 text-dg truncate" title={companyName}>
        {companyName}
      </p>
      <p className="flex-2 py-1 px-3 text-dg truncate" title={items}>
        {items}
      </p>
      <p className="w-[200px] py-1 px-3 text-dg truncate" title={startDate}>
        {startDate}
      </p>
      <p className="w-[200px] py-1 px-3 text-dg truncate" title={endDate}>
        {endDate}
      </p>
      <div
        className="w-[200px] px-3"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {taxIssued === '보기' ? (
          <MiniBtn
            text={taxIssued}
            bgColor="bg-wh"
            textColor="text-dg"
            borderColor="border-lg"
            hoverColor="hover:bg-bg"
            height="h-8"
            onClick={() => {
              router.push(`/tax/list`);
            }}
          />
        ) : taxIssued === '연결 필요' ? (
          <MiniBtn
            text="연결 필요"
            bgColor="bg-bg"
            textColor="text-dg"
            hoverColor="hover:bg-lg"
            height="h-8"
          />
        ) : (
          <MiniBtn
            text="미발행"
            bgColor="bg-bg"
            textColor="text-dg"
            hoverColor="hover:bg-lg"
            height="h-8"
            disabled
          />
        )}
      </div>
    </div>
  );
};

export default TableItem;
