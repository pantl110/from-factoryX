'use client';

import { LabelInfo } from '@/app/[locale]/(mobile)/label-info';
import Topbar from '@/app/[locale]/(mobile)/topbar';
import { MoBottomNavigation } from '@/ui';
import { useSearchParams, useParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

const DeliveryDetailPage = () => {
  const t = useTranslations('mobile.delivery.detail');
  const tCommon = useTranslations('common');
  const tTopbar = useTranslations('mobile.topbar');
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
    ? `LOT-2025-00123 (${t('scannedPrefix')}${scannedCode})`
    : 'LOT-2025-00123';

  // 다음 스캔하기 버튼 클릭 핸들러
  const handleNextScan = () => {
    const callbackUrl = `/delivery/${deliveryId}/detail`;
    router.push(
      `/barcode-scanner?callback=${encodeURIComponent(callbackUrl)}&title=${encodeURIComponent(tTopbar('barcodeScan'))}`
    );
  };

  // 확인 버튼 클릭 핸들러 (delivery 페이지로 이동)
  const handleConfirm = () => {
    router.push(`/delivery/${deliveryId}`);
  };

  return (
    <div className="pb-6">
      <Topbar title={tTopbar('scanResult')} />
      <div className="px-7 py-8 flex flex-col gap-8">
        <h3 className="m-Heading-3-semibold">{t('title')}</h3>
        <div className="flex flex-col gap-5">
          <LabelInfo label={tCommon('productName')} value="플라스틱 1" />
          <LabelInfo label={tCommon('productCode')} value="12345678" />
          <LabelInfo label={tCommon('specification')} value="200ml" />
          <LabelInfo label={tCommon('productionDate')} value="2025-12-04" />
          <LabelInfo label={tCommon('lotNumber')} value={lotNumber} />
          <LabelInfo label={t('packagingQuantity')} value="1 Box (100EA)" />
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
