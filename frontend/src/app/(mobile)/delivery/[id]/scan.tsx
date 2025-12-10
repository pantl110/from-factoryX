'use client';

import { useState } from 'react';
import { MoBtn } from '@/ui';
import ScanItem from './scan-item';
import Camera from './camera';

const Scan = () => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const handleScan = (result: string) => {
    // 스캔된 바코드 처리
    setIsCameraOpen(false);
    // 여기서 스캔된 코드를 처리하세요 (예: API 호출, 상태 업데이트 등)
    // TODO: 스캔된 바코드(result)를 사용하여 필요한 작업 수행
  };

  return (
    <>
      <div className="px-7 py-8 flex flex-col gap-8">
        <h3 className="m-Heading-3-semibold">스캔하기</h3>
        <div className="flex flex-col gap-7">
          <MoBtn
            text="스캔하기"
            variant="secondary"
            width="w-full"
            big
            onClick={() => setIsCameraOpen(true)}
          />
          <div className="h-[1px] bg-bg" />
          <ScanItem />
        </div>
      </div>

      {isCameraOpen && (
        <Camera
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onScan={handleScan}
        />
      )}
    </>
  );
};

export default Scan;
