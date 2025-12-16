'use client';

import { LabelInfo } from '@/app/(mobile)/label-info';
import Topbar from '@/app/(mobile)/topbar';
import { MoBottomNavigation } from '@/ui';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const DeliveryDetailPage = () => {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const deliveryId = params?.id;
  const [scannedCode, setScannedCode] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('scanned_code');
    if (code) {
      setScannedCode(code);
      // URL에서 scanned_code 제거 (중복 실행 방지)
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete('scanned_code');
      const newUrl =
        newSearchParams.toString() === ''
          ? window.location.pathname
          : `${window.location.pathname}?${newSearchParams.toString()}`;
      router.replace(newUrl);
    }
  }, [searchParams, router]);

  // LOT 번호에 스캔된 바코드 표시
  const lotNumber = scannedCode
    ? `LOT-2025-00123 (스캔: ${scannedCode})`
    : 'LOT-2025-00123';

  // 다음 스캔하기 버튼 클릭 핸들러
  const handleNextScan = () => {
    const callbackUrl = `/delivery/${deliveryId}/detail`;
    router.push(
      `/barcode-scanner?callback=${encodeURIComponent(callbackUrl)}&title=${encodeURIComponent('바코드 스캔')}`
    );
  };

  // 확인 버튼 클릭 핸들러 (delivery 페이지로 이동)
  const handleConfirm = () => {
    router.push(`/delivery/${deliveryId}`);
  };

  return (
    <div className="pb-6">
      <Topbar title="스캔 결과" />
      <div className="px-7 py-8 flex flex-col gap-8">
        <h3 className="m-Heading-3-semibold">스캔된 LOT 정보</h3>
        <div className="flex flex-col gap-5">
          <LabelInfo label="제품명" value="플라스틱 1" />
          <LabelInfo label="제품코드" value="12345678" />
          <LabelInfo label="규격" value="200ml" />
          <LabelInfo label="생산 일자" value="2025-12-04" />
          <LabelInfo label="LOT 번호" value={lotNumber} />
          <LabelInfo label="포장 수량" value="1 Box (100EA)" />
        </div>
      </div>
      <MoBottomNavigation
        type="scan"
        onClick={handleNextScan}
        onConfirm={handleConfirm}
      />
    </div>
  );
};

export default DeliveryDetailPage;
