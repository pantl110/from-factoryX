'use client';

import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { useRef, useMemo } from 'react';
import { MoBtn } from '@/ui';
import ScanItem from './scan-item';
import {
  BrowserMultiFormatReader,
  DecodeHintType,
  BarcodeFormat,
} from '@zxing/library';
import { useTranslations } from 'next-intl';

const Scan = () => {
  const t = useTranslations('mobile.delivery.scan');
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const deliveryId = params?.id;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  // 모바일 디바이스 감지
  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }, []);

  // 이미지에서 바코드 인식
  const handleImageDecode = async (file: File) => {
    if (!file) return;

    try {
      // BrowserMultiFormatReader 초기화
      if (!codeReaderRef.current) {
        const hints = new Map();
        hints.set(DecodeHintType.TRY_HARDER, true);
        if (isMobile) {
          hints.set(DecodeHintType.POSSIBLE_FORMATS, [
            BarcodeFormat.EAN_13,
            BarcodeFormat.EAN_8,
            BarcodeFormat.UPC_A,
            BarcodeFormat.UPC_E,
            BarcodeFormat.CODE_128,
            BarcodeFormat.CODE_39,
            BarcodeFormat.CODE_93,
            BarcodeFormat.ITF,
            BarcodeFormat.CODABAR,
            BarcodeFormat.QR_CODE,
            BarcodeFormat.DATA_MATRIX,
            BarcodeFormat.PDF_417,
          ]);
        }
        codeReaderRef.current = new BrowserMultiFormatReader(hints);
      }

      // 이미지를 HTMLImageElement로 로드
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });

      // 여러 각도로 시도
      const rotations = [0, 90, 180, 270];
      let result = null;

      for (const rotation of rotations) {
        try {
          let imageToDecode: HTMLImageElement | HTMLCanvasElement = image;

          if (rotation !== 0) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) continue;

            if (rotation === 90 || rotation === 270) {
              canvas.width = image.height;
              canvas.height = image.width;
            } else {
              canvas.width = image.width;
              canvas.height = image.height;
            }

            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.drawImage(image, -image.width / 2, -image.height / 2);
            imageToDecode = canvas;
          }

          result = await codeReaderRef.current.decodeFromImageElement(
            imageToDecode as HTMLImageElement
          );

          if (result && result.getText()) {
            break;
          }
        } catch {
          continue;
        }
      }

      URL.revokeObjectURL(image.src);

      if (result && result.getText()) {
        const scannedText = result.getText();
        // 스캔 결과 페이지로 이동
        router.push(
          `/delivery/${deliveryId}/detail?scanned_code=${scannedText}`
        );
      } else {
        alert(t('barcodeRecognitionFailed'));
      }
    } catch {
      alert(t('barcodeRecognitionFailed'));
    }

    // input 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageDecode(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleScanClick = () => {
    if (isMobile) {
      // 모바일: 바로 카메라 앱 열기
      fileInputRef.current?.click();
    } else {
      // 데스크톱: 바코드 스캔 페이지로 이동
      const callbackUrl = `/delivery/${deliveryId}/detail`;
      router.push(
        `/barcode-scanner?callback=${encodeURIComponent(callbackUrl)}&title=${encodeURIComponent(t('barcodeScanTitle'))}`
      );
    }
  };

  return (
    <div className="px-7 py-8 flex flex-col gap-8">
      <h3 className="m-Heading-3-semibold">{t('title')}</h3>
      <div className="flex flex-col gap-7">
        <MoBtn
          text={t('button')}
          variant="secondary"
          width="w-full"
          big
          onClick={handleScanClick}
        />
        <div className="h-[1px] bg-bg" />
        <ScanItem />
      </div>
      {/* 숨겨진 파일 input - 모바일에서만 capture 속성 사용 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        {...(isMobile ? { capture: 'environment' } : {})}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default Scan;
