'use client';

import IconBtn from '@/ui/icon-btn';
import { CaretLeft } from '@phosphor-icons/react';

interface TopbarProps {
  title: string;
  onBackClick: () => void;
}

const Topbar = ({ title, onBackClick }: TopbarProps) => {
  return (
    <div className="sticky top-0 z-30 h-[50px] bg-wh flex items-center justify-between px-5">
      <IconBtn
        icon={CaretLeft}
        iconSize={20}
        size="w-9 h-9"
        onClick={() => {
          onBackClick();
        }}
      />
      <h4 className="m-Heading-4b text-dg">{title}</h4>
      <div className="w-9" />
    </div>
  );
};

export default Topbar;
