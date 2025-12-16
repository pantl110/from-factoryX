'use client';

import { useZxing } from 'react-zxing';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { WarningCircle } from '@phosphor-icons/react';
import Spinner from '@/ui/spinner';
import Topbar from '@/app/(mobile)/topbar';
import { DecodeHintType } from '@zxing/library';

interface PointOfInterestModel {
  x: number;
  y: number;
}

type ExtendedMediaTrackConstraintSetType = MediaTrackConstraintSet & {
  pointsOfInterest?: PointOfInterestModel[];
  focusMode?: string;
};

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);

  const handleFocusPoint = async (
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
    if (!stream) {
      return;
    }

    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) {
      return;
    }

    // Image Capture API를 사용한 초점 설정 (더 안정적)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const imageCapture = new (window as any).ImageCapture(videoTrack);
      if (imageCapture && imageCapture.setOptions) {
        await imageCapture.setOptions({
          pointsOfInterest: [{ x: normalizedX, y: normalizedY }],
        });
        return; // ImageCapture 성공 시 추가 제약 호출하지 않음
      }
    } catch {
      // Image Capture API 사용 불가 - 무시
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

      // 이미 처리 중이거나 같은 바코드가 반복 인식되는 경우 무시
      if (isProcessing || lastScannedCode === scannedText) {
        return;
      }

      if (scannedText) {
        // 처리 중 상태로 설정하여 중복 인식 방지
        setIsProcessing(true);
        setLastScannedCode(scannedText);

        // 스캔된 바코드를 쿼리 파라미터로 전달하여 이전 페이지로 즉시 이동
        const url = new URL(callbackUrl, window.location.origin);
        url.searchParams.set('scanned_code', scannedText);

        // 즉시 이동
        router.push(url.pathname + url.search);
      }
    },
    onError(err: unknown) {
      const error = err as { name?: string; message?: string };

      // 비디오 재생 관련 오류는 무시 (BrowserCodeReader 내부 오류)
      const errorMessage = error.message || '';
      if (
        errorMessage.includes('play') ||
        errorMessage.includes('already playing') ||
        errorMessage.includes('not possible to play') ||
        errorMessage.includes('Trying to play video')
      ) {
        // 비디오 재생 관련 오류는 정상 동작 중이므로 무시
        // 이 경고는 스캔 기능에 영향을 주지 않음
        return;
      }

      if (error.name === 'NotAllowedError') {
        setError(
          '카메라 권한이 필요합니다.\n설정에서 카메라 권한을 허용해주세요.'
        );
      } else if (error.name === 'NotFoundError') {
        setError(
          '카메라를 찾을 수 없습니다.\n카메라가 연결되어 있는지 확인해주세요.'
        );
      } else {
        setError(
          `바코드 스캔 중 오류가 발생했습니다.\n${error.message || error.name || '알 수 없는 오류'}`
        );
      }
      setIsScanning(false);
    },
    paused: isProcessing, // 처리 중이면 스캔 일시정지
    // 내장 카메라 직접 사용 설정
    constraints: {
      video: {
        facingMode: 'environment', // 후면 카메라 우선, 없으면 전면 카메라 사용
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    },
    // 모든 방향에서 바코드 인식 가능하도록 설정
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    hints: new Map([[DecodeHintType.TRY_HARDER, true]]) as any,
  });

  useEffect(() => {
    // body 스크롤 방지
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    setError(null);
    setIsScanning(true);

    // BrowserCodeReader의 비디오 재생 오류를 전역에서 필터링
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorMessage = event.reason?.message || String(event.reason || '');
      if (
        errorMessage.includes('not possible to play') ||
        errorMessage.includes('already playing') ||
        errorMessage.includes('play()') ||
        errorMessage.includes('Trying to play video')
      ) {
        // BrowserCodeReader 내부 비디오 재생 오류는 무시
        event.preventDefault();
        return;
      }
    };

    // Console.warn을 가로채서 BrowserCodeReader의 비디오 재생 경고 억제
    const originalWarn = console.warn;
    const suppressVideoWarnings = (...args: unknown[]) => {
      const message = args.join(' ');
      if (
        message.includes('not possible to play') ||
        message.includes('already playing') ||
        message.includes('Trying to play video') ||
        message.includes('play()')
      ) {
        // 비디오 재생 관련 경고는 무시 (정상 동작 중)
        return;
      }
      // 다른 경고는 정상적으로 출력
      originalWarn.apply(console, args);
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    console.warn = suppressVideoWarnings;

    // useZxing이 카메라를 자동으로 처리하므로, 비디오가 준비될 때까지 대기
    let checkCount = 0;
    const maxChecks = 50; // 최대 5초 대기 (100ms * 50)

    const checkVideoReady = () => {
      const video = ref.current;
      checkCount++;

      if (video && video.readyState >= 2 && video.videoWidth > 0) {
        setIsScanning(false);
        return;
      }

      if (checkCount < maxChecks) {
        // 비디오가 아직 준비되지 않았으면 잠시 후 다시 확인
        setTimeout(checkVideoReady, 100);
      } else {
        setIsScanning(false);
      }
    };

    // 초기 확인을 약간 지연시켜 useZxing이 비디오를 설정할 시간을 줌
    const timeoutId = setTimeout(checkVideoReady, 300);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener(
        'unhandledrejection',
        handleUnhandledRejection
      );
      // console.warn 복원
      console.warn = originalWarn;
      document.body.style.overflow = originalStyle;
    };
  }, [ref]);

  // 비디오가 준비되면 자동 초점 활성화
  useEffect(() => {
    const video = ref.current;
    if (!video) {
      return;
    }

    const setupAutofocus = () => {
      const stream = video.srcObject as MediaStream | null;
      if (!stream) return;

      const videoTrack = stream.getVideoTracks()[0];
      if (!videoTrack) return;

      // continuous autofocus 활성화 (가장 안정적)
      videoTrack
        .applyConstraints({
          advanced: [
            {
              focusMode: 'continuous',
            } as ExtendedMediaTrackConstraintSetType,
          ],
        } as unknown as MediaTrackConstraints)
        .catch(() => {
          // 초점 설정 실패는 무시 (모든 기기에서 지원하지 않음)
        });
    };

    // 비디오가 로드되면 초점 설정
    if (video.readyState >= 2) {
      setupAutofocus();
    } else {
      video.addEventListener('loadedmetadata', setupAutofocus, { once: true });
    }

    return () => {
      video.removeEventListener('loadedmetadata', setupAutofocus);
    };
  }, [ref]);

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
              onError={(e) => {
                const { error } = e.currentTarget;
                if (error && error.code === 4) {
                  setError('비디오 형식을 지원하지 않습니다.');
                }
              }}
              onCanPlay={() => {
                setIsScanning(false);
              }}
              onPlaying={() => {
                setIsScanning(false);
              }}
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
