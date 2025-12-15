'use client';

import { useZxing } from 'react-zxing';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { WarningCircle } from '@phosphor-icons/react';
import Spinner from '@/ui/spinner';
import Topbar from '@/app/(mobile)/topbar';

const BarcodeScannerContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callback') || '/dashboard';
  const title = searchParams.get('title') || '바코드 스캔';

  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(
    null
  );

  const handleFocusPoint = (
    video: HTMLVideoElement,
    clientX: number,
    clientY: number
  ) => {
    if (!video) return;

    const rect = video.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const normalizedX = x / rect.width;
    const normalizedY = y / rect.height;

    // UI 피드백: 클릭한 위치 표시
    setFocusPoint({ x, y });
    setTimeout(() => {
      setFocusPoint(null);
    }, 1000);

    // 비디오 스트림에서 비디오 트랙 가져오기
    const stream = video.srcObject as MediaStream | null;
    if (!stream) return;

    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return;

    // 포커스 포인트 설정 (실험적 API)
    const capabilities = videoTrack.getCapabilities() as any;
    if (
      capabilities?.focusMode?.includes('manual') ||
      capabilities?.focusMode?.includes('single-shot')
    ) {
      videoTrack
        .applyConstraints({
          advanced: [
            {
              pointsOfInterest: [{ x: normalizedX, y: normalizedY }],
            },
          ] as any,
        } as any)
        .catch((err) => {
          console.error('초점 설정 실패:', err);
        });
    }
  };

  const handleVideoClick = (e: React.MouseEvent<HTMLVideoElement>) => {
    handleFocusPoint(e.currentTarget, e.clientX, e.clientY);
  };

  const handleVideoTouch = (e: React.TouchEvent<HTMLVideoElement>) => {
    const touch = e.touches[0];
    if (touch) {
      handleFocusPoint(e.currentTarget, touch.clientX, touch.clientY);
    }
  };

  const { ref } = useZxing({
    onDecodeResult(result) {
      const scannedText = result.getText();
      if (scannedText) {
        // 스캔된 바코드를 쿼리 파라미터로 전달하여 이전 페이지로 이동
        const url = new URL(callbackUrl, window.location.origin);
        url.searchParams.set('scanned_code', scannedText);
        router.push(url.pathname + url.search);
      }
    },
    onError(err: unknown) {
      console.error('바코드 스캐너 오류:', err);
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
    paused: false,
  });

  useEffect(() => {
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
        console.error('카메라 접근 오류:', err);
        setIsScanning(false);
      });

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-wh flex flex-col">
      {/* 헤더 */}
      <div className="bg-wh">
        <Topbar title={title} onBackClick={() => router.back()} />
      </div>

      {/* 카메라 영역 - 전체 화면 */}
      <div className="flex-1 relative overflow-hidden">
        {isScanning && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <Spinner />
          </div>
        )}
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 z-10 bg-wh">
            <WarningCircle size={48} className="text-red" />
            <p className="text-dg text-center m-Body-1 whitespace-pre-line">
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
          <>
            <video
              ref={ref}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
              onClick={handleVideoClick}
              onTouchStart={handleVideoTouch}
            />
            {/* 포커스 링 UI */}
            {focusPoint && (
              <div
                className="absolute pointer-events-none z-20"
                style={{
                  left: `${focusPoint.x}px`,
                  top: `${focusPoint.y}px`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className="relative w-20 h-20">
                  {/* 외부 링 */}
                  <div className="absolute inset-0 border-2 border-white rounded-full animate-ping opacity-75" />
                  {/* 내부 링 */}
                  <div className="absolute inset-2 border-2 border-white rounded-full" />
                  {/* 중앙 점 */}
                  <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2" />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 하단 안내 */}
      <div className="px-7 pb-8 pt-4 flex flex-col gap-2 bg-wh">
        <p className="text-dg m-Body-2 text-center">
          바코드를 카메라 중앙에 맞춰주세요.
        </p>
        <p className="text-sv m-Caption text-center">자동으로 인식됩니다.</p>
      </div>
    </div>
  );
};

const BarcodeScannerPage = () => {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 z-50 bg-wh flex items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <BarcodeScannerContent />
    </Suspense>
  );
};

export default BarcodeScannerPage;
