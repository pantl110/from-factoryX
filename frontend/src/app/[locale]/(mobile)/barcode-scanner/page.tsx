'use client';

import { useZxing } from 'react-zxing';
import { useEffect, useState, Suspense, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { WarningCircle, Camera } from '@phosphor-icons/react';
import Spinner from '@/ui/spinner';
import Topbar from '@/app/[locale]/(mobile)/topbar';
import {
  DecodeHintType,
  BarcodeFormat,
  BrowserMultiFormatReader,
} from '@zxing/library';
import { MoBtn } from '@/ui';

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
  const [barcodeError, setBarcodeError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  // 모바일 디바이스 감지
  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }, []);

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

  // 이미지 파일에서 바코드 인식 (개선된 버전)
  const handleImageDecode = async (file: File) => {
    if (!file) return;

    setIsProcessing(true);
    setBarcodeError(null);

    try {
      // BrowserMultiFormatReader 초기화 (한 번만)
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

      // 이미지를 HTMLImageElement로 로드 (더 안정적인 방법)
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });

      // 이미지에서 바코드 디코딩 시도
      let result = null;
      let lastError: Error | null = null;

      // 여러 각도로 시도 (원본, 90도, 180도, 270도 회전)
      const rotations = [0, 90, 180, 270];

      for (const rotation of rotations) {
        try {
          // 회전이 필요한 경우 Canvas로 변환
          let imageToDecode: HTMLImageElement | HTMLCanvasElement = image;

          if (rotation !== 0) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) continue;

            // 회전에 따라 캔버스 크기 조정
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

          // 바코드 디코딩 시도
          result = await codeReaderRef.current.decodeFromImageElement(
            imageToDecode as HTMLImageElement
          );

          if (result && result.getText()) {
            break; // 성공하면 루프 종료
          }
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          continue; // 다음 회전 시도
        }
      }

      // URL 정리
      URL.revokeObjectURL(image.src);

      if (result && result.getText()) {
        const scannedText = result.getText();
        setLastScannedCode(scannedText);

        // 스캔된 바코드를 쿼리 파라미터로 전달하여 이전 페이지로 즉시 이동
        const url = new URL(callbackUrl, window.location.origin);
        url.searchParams.set('scanned_code', scannedText);
        router.push(url.pathname + url.search);
      } else {
        throw lastError || new Error('바코드를 찾을 수 없습니다.');
      }
    } catch {
      // 바코드 인식 실패
      setBarcodeError(
        '바코드를 인식할 수 없습니다.\n다시 촬영해주세요.\n\n• 바코드가 선명하게 보이는지 확인해주세요\n• 바코드가 사진 중앙에 있는지 확인해주세요\n• 조명이 충분한지 확인해주세요'
      );
      setIsProcessing(false);
    }
  };

  // 파일 선택 핸들러
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageDecode(file);
    }
    // input 초기화 (같은 파일을 다시 선택할 수 있도록)
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 카메라 앱 열기
  const handleCameraButtonClick = () => {
    fileInputRef.current?.click();
  };

  // 모바일 디바이스에 최적화된 카메라 제약 조건
  const cameraConstraints = useMemo(() => {
    if (isMobile) {
      // 모바일: 최대 해상도 사용 (네이티브 앱 수준의 화질 추구)
      // 주의: 웹 브라우저는 네이티브 앱만큼의 화질을 제공할 수 없습니다.
      // 브라우저 보안 정책과 성능 제약으로 인해 제한이 있습니다.
      return {
        video: {
          facingMode: 'environment', // 후면 카메라 우선
          // 최대 해상도로 설정 (브라우저가 허용하는 최대치까지)
          // ideal을 높게 설정하여 브라우저가 가능한 최고 해상도 선택하도록 유도
          width: {
            min: 1280, // 최소값도 높게 설정
            ideal: 3840, // 4K를 ideal로 설정 (최대한 높은 해상도 요청)
            max: 3840, // 4K까지 시도
          },
          height: {
            min: 720, // 최소값도 높게 설정
            ideal: 2160, // 4K를 ideal로 설정
            max: 2160, // 4K까지 시도
          },
          // 프레임레이트도 높게 설정하여 더 부드러운 스캔
          frameRate: { ideal: 60, max: 60 }, // 최대 프레임레이트 요청
          aspectRatio: { ideal: 16 / 9 },
          // 추가 품질 향상 옵션
          resizeMode: 'none', // 리사이즈 없이 원본 해상도 유지
        },
      };
    }
    // 데스크톱: 고해상도 설정
    return {
      video: {
        facingMode: 'environment',
        width: { ideal: 1920, max: 3840 },
        height: { ideal: 1080, max: 2160 },
        frameRate: { ideal: 30, max: 60 },
      },
    };
  }, [isMobile]);

  // 모바일 디바이스에 최적화된 디코딩 힌트
  const decodeHints = useMemo(() => {
    const hints = new Map();

    // 더 강력한 디코딩 시도
    hints.set(DecodeHintType.TRY_HARDER, true);

    // 모바일에서 인식률 향상을 위한 추가 힌트
    if (isMobile) {
      // 가능한 모든 바코드 형식 허용
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

      // 모바일에서 더 많은 시도 허용
      hints.set(DecodeHintType.ASSUME_GS1, false);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return hints as any;
  }, [isMobile]);

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
    constraints: cameraConstraints,
    hints: decodeHints,
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

  // 비디오가 준비되면 자동 초점 활성화 및 최대 해상도 확인
  useEffect(() => {
    const video = ref.current;
    if (!video) {
      return;
    }

    const setupAutofocus = async () => {
      const stream = video.srcObject as MediaStream | null;
      if (!stream) return;

      const videoTrack = stream.getVideoTracks()[0];
      if (!videoTrack) return;

      // 현재 해상도 확인
      const currentSettings = videoTrack.getSettings();
      const currentWidth = currentSettings.width || 0;
      const currentHeight = currentSettings.height || 0;

      // 사용 가능한 최대 해상도 확인
      const capabilities = videoTrack.getCapabilities();
      const maxWidth = capabilities.width?.max || 1920;
      const maxHeight = capabilities.height?.max || 1080;

      // 디버깅: 현재 해상도와 최대 해상도 로깅
      // eslint-disable-next-line no-console
      console.log('Current resolution:', currentWidth, 'x', currentHeight);
      // eslint-disable-next-line no-console
      console.log('Max available resolution:', maxWidth, 'x', maxHeight);

      // 현재 해상도가 최대보다 낮으면 업그레이드 시도
      // exact 값을 사용하여 최대한 높은 해상도 강제 시도
      if (currentWidth < maxWidth || currentHeight < maxHeight) {
        try {
          // 먼저 ideal로 시도
          await videoTrack.applyConstraints({
            width: { ideal: maxWidth },
            height: { ideal: maxHeight },
            frameRate: { ideal: 30, max: 60 },
          });

          // 적용 후 실제 해상도 확인
          const newSettings = videoTrack.getSettings();
          // eslint-disable-next-line no-console
          console.log(
            'Upgraded resolution:',
            newSettings.width,
            'x',
            newSettings.height
          );

          // 여전히 낮으면 exact 값으로 강제 시도 (일부 브라우저에서만 작동)
          if (
            newSettings.width &&
            newSettings.height &&
            (newSettings.width < maxWidth || newSettings.height < maxHeight)
          ) {
            try {
              await videoTrack.applyConstraints({
                width: { exact: maxWidth },
                height: { exact: maxHeight },
              });
              // eslint-disable-next-line no-console
              console.log('Forced exact resolution:', maxWidth, 'x', maxHeight);
            } catch {
              // exact 값 실패는 정상 (브라우저가 지원하지 않을 수 있음)
            }
          }
        } catch (err) {
          // 해상도 업그레이드 실패는 무시 (기기 제한)
          // eslint-disable-next-line no-console
          console.log('Failed to upgrade resolution:', err);
        }
      }

      // continuous autofocus 활성화 (가장 안정적)
      try {
        await videoTrack.applyConstraints({
          advanced: [
            {
              focusMode: 'continuous',
            } as ExtendedMediaTrackConstraintSetType,
          ],
        } as unknown as MediaTrackConstraints);
      } catch {
        // 초점 설정 실패는 무시 (모든 기기에서 지원하지 않음)
      }
    };

    // 비디오가 로드되면 초점 설정 및 해상도 확인
    if (video.readyState >= 2) {
      setupAutofocus();
    } else {
      video.addEventListener('loadedmetadata', setupAutofocus, { once: true });
    }

    return () => {
      video.removeEventListener('loadedmetadata', setupAutofocus);
    };
  }, [ref]);

  // 컴포넌트 언마운트 시 codeReader 정리
  useEffect(() => {
    return () => {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
        codeReaderRef.current = null;
      }
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

      {/* 하단 안내 및 버튼 */}
      <div className="px-7 pb-8 pt-4 flex flex-col gap-4 bg-wh">
        {/* 바코드 인식 실패 메시지 */}
        {barcodeError && (
          <div className="flex flex-col items-center gap-2 p-4 bg-wh rounded-[8px] border border-red shadow-[4px_4px_20px_-12px_rgba(243,18,96,1)">
            <WarningCircle size={24} className="text-red" />
            <p className="text-[#363636] text-center m-Body-2 whitespace-pre-line">
              {barcodeError}
            </p>
          </div>
        )}

        {/* 실시간 스캔 안내 */}
        {!barcodeError && (
          <>
            <p className="text-dg m-Body-2 text-center">
              바코드를 카메라 중앙에 맞춰주세요.
            </p>
            <p className="text-sv m-Caption text-center">
              자동으로 인식됩니다.
            </p>
          </>
        )}

        {/* 카메라 앱으로 촬영 버튼 - 모바일에서만 표시 */}
        {isMobile && (
          <MoBtn
            text={isProcessing ? '인식 중...' : '카메라 앱으로 촬영'}
            icon={<Camera />}
            iconPosition="left"
            variant="primary"
            width="w-full"
            big
            onClick={handleCameraButtonClick}
            disabled={isProcessing}
          />
        )}

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
