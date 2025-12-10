'use client';

import { useRouter, useParams } from 'next/navigation';
import { MoBtn } from '@/ui';
import ScanItem from './scan-item';

const Scan = () => {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const deliveryId = params?.id;

  const handleScanClick = () => {
    // 바코드 스캔 페이지로 이동
    // 스캔 완료 후 현재 페이지로 돌아오도록 callback 설정
    const callbackUrl = `/delivery/${deliveryId}`;
    router.push(
      `/barcode-scanner?callback=${encodeURIComponent(callbackUrl)}&title=${encodeURIComponent('바코드 스캔')}`
    );
  };

  return (
    <div className="px-7 py-8 flex flex-col gap-8">
      <h3 className="m-Heading-3-semibold">스캔하기</h3>
      <div className="flex flex-col gap-7">
        <MoBtn
          text="스캔하기"
          variant="secondary"
          width="w-full"
          big
          onClick={handleScanClick}
        />
        <div className="h-[1px] bg-bg" />
        <ScanItem />
      </div>
    </div>
  );
};

export default Scan;
