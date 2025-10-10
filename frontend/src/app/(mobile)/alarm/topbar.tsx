'use client';

import IconBtn from '@/ui/icon-btn';
import { CaretLeft } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';

const Topbar = () => {
  const router = useRouter();

  return (
    <div className="sticky top-0 z-30 h-[50px] bg-wh flex items-center justify-between px-5 border-b border-lg">
      <IconBtn
        icon={CaretLeft}
        iconSize={20}
        size="w-9 h-9"
        onClick={router.back}
      />
      <h4 className="m-Heading-4b text-dg">알림</h4>
      <div className="w-9" />
    </div>
  );
};

export default Topbar;
