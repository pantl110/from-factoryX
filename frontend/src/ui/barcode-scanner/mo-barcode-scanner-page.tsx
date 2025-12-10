'use client';

import { useZxing } from 'react-zxing';
import { useEffect, useState } from 'react';
import { WarningCircle } from '@phosphor-icons/react';
import Spinner from '../spinner';

interface MoBarcodeScannerPageProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
  title?: string;
}

const MoBarcodeScannerPage = ({
  isOpen,
  onClose,
  onScan,
  title = '바코드 스캔',
}: MoBarcodeScannerPageProps) => {
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const { ref } = useZxing({
    onDecodeResult(result) {
      const scannedText = result.getText();
      if (scannedText) {
        onScan(scannedText);
        onClose();
      }
    },
    onError(err: unknown) {
      console.error('Barcode scanner error:', err);
      const error = err as { name?: string };
      if (error.name === 'NotAllowedError') {
        setError(
          '카메라 권한이 필요합니다.\n설정에서 카메라 권한을 허용해주세요.'
        );
      } else if (error.name === 'NotFoundError') {
        setError(
          '카메라를 찾을 수 없습니다.\n카메라가 연결되어 있는지 확인해주세요.'
        );
      } else {
        setError('바코드 스캔 중 오류가 발생했습니다.');
      }
      setIsScanning(false);
    },
    paused: !isOpen,
  });

  useEffect(() => {
    if (isOpen) {
      // body 스크롤 방지
      const originalStyle = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      setError(null);
      setIsScanning(true);
      // 카메라 접근 시도
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'environment' } })
        .then(() => {
          setIsScanning(false);
        })
        .catch((err) => {
          console.error('Camera access error:', err);
          setIsScanning(false);
        });

      return () => {
        document.body.style.overflow = originalStyle;
      };
    } else {
      setIsScanning(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // MoModal 대신 전체 화면 레이아웃 사용
  return (
    <div
      className={`fixed inset-0 z-50 bg-black flex flex-col transition-opacity duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* 헤더 */}
      <div className="px-7 pt-5 pb-4 flex items-center justify-between">
        <h4 className="m-Heading-4b text-white">{title}</h4>
        <button
          onClick={onClose}
          className="text-white hover:text-primary transition-colors"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* 카메라 영역 - 전체 화면 */}
      <div className="flex-1 relative overflow-hidden">
        {isScanning && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <Spinner />
          </div>
        )}
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 z-10">
            <WarningCircle size={48} className="text-red" />
            <p className="text-white text-center m-Body-1 whitespace-pre-line">
              {error}
            </p>
            <button
              onClick={() => {
                setError(null);
                setIsScanning(true);
                window.location.reload();
              }}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-8 transition-colors m-Body-1"
            >
              다시 시도
            </button>
          </div>
        ) : (
          <video
            ref={ref}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted
          />
        )}
      </div>

      {/* 하단 안내 */}
      <div className="px-7 pb-8 pt-4 flex flex-col gap-2 bg-black/50">
        <p className="text-white m-Body-2 text-center">
          바코드를 카메라 중앙에 맞춰주세요.
        </p>
        <p className="text-white/70 m-Caption text-center">
          자동으로 인식됩니다.
        </p>
      </div>
    </div>
  );
};

export default MoBarcodeScannerPage;
