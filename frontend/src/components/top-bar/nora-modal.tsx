'use client';

import { X, FrameCorners } from '@phosphor-icons/react/dist/ssr';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import IconBtn from '@/ui/icon-btn';

const NoraComponent = dynamic(() => import('@/nora/nora-component'), {
  ssr: false,
});

interface NoraModalProps {
  onClose: () => void;
  initialWidth?: number;
  initialHeight?: number;
  onSizeChange?: (width: number, height: number) => void;
}

const MIN_WIDTH = 200;
const MIN_HEIGHT = 300;
const DEFAULT_WIDTH_RATIO = 0.4;
const DEFAULT_HEIGHT_RATIO = 0.8;
const POSITION_OFFSET = 24;
const RESIZE_HANDLE_SIZE = 4;
const RESIZE_CORNER_SIZE = 12;

type ResizeType = 'top' | 'left' | 'topLeft' | null;

interface ResizeStartStateModel {
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
  startBottom: number;
  startRight: number;
  resizeType: ResizeType;
  currentWidth?: number;
  currentHeight?: number;
}

const NoraModal = ({
  onClose,
  initialWidth,
  initialHeight,
  onSizeChange,
}: NoraModalProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const router = useRouter();
  const resizeStartRef = useRef<ResizeStartStateModel | null>(null);

  // 초기화
  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      const defaultWidth = window.innerWidth * DEFAULT_WIDTH_RATIO;
      const defaultHeight = window.innerHeight * DEFAULT_HEIGHT_RATIO;
      setWidth(initialWidth ?? defaultWidth);
      setHeight(initialHeight ?? defaultHeight);
    }
    requestAnimationFrame(() => {
      setIsVisible(true);
    });

    const originalBodyOverflow = document.body.style.overflow || '';
    return () => {
      document.body.style.overflow = originalBodyOverflow;
    };
  }, [initialWidth, initialHeight]);

  // 모달 닫기 핸들러
  const handleClose = useCallback(() => {
    if (width > 0 && height > 0) {
      onSizeChange?.(width, height);
    }
    onClose();
  }, [width, height, onSizeChange, onClose]);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [handleClose]);

  // 위쪽 리사이즈 핸들러
  const handleTopResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      resizeStartRef.current = {
        startX: 0,
        startY: e.clientY,
        startWidth: width,
        startHeight: height,
        startBottom: POSITION_OFFSET,
        startRight: POSITION_OFFSET,
        resizeType: 'top',
      };

      const handleMouseMove = (e: MouseEvent) => {
        const ref = resizeStartRef.current;
        if (!ref || ref.resizeType !== 'top') return;

        const deltaY = ref.startY - e.clientY;
        const maxHeight =
          window.innerHeight - ref.startBottom - POSITION_OFFSET;
        const newHeight = Math.max(
          MIN_HEIGHT,
          Math.min(maxHeight, ref.startHeight + deltaY)
        );

        setHeight(newHeight);
        ref.currentHeight = newHeight;
      };

      const handleMouseUp = () => {
        if (resizeStartRef.current) {
          const finalHeight = resizeStartRef.current.currentHeight ?? height;
          onSizeChange?.(width, finalHeight);
        }
        resizeStartRef.current = null;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [width, height, onSizeChange]
  );

  // 왼쪽 리사이즈 핸들러
  const handleLeftResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      resizeStartRef.current = {
        startX: e.clientX,
        startY: 0,
        startWidth: width,
        startHeight: height,
        startBottom: POSITION_OFFSET,
        startRight: POSITION_OFFSET,
        resizeType: 'left',
      };

      const handleMouseMove = (e: MouseEvent) => {
        const ref = resizeStartRef.current;
        if (!ref || ref.resizeType !== 'left') return;

        const deltaX = ref.startX - e.clientX;
        const maxWidth = window.innerWidth - ref.startRight - POSITION_OFFSET;
        const newWidth = Math.max(
          MIN_WIDTH,
          Math.min(maxWidth, ref.startWidth + deltaX)
        );

        setWidth(newWidth);
        ref.currentWidth = newWidth;
      };

      const handleMouseUp = () => {
        if (resizeStartRef.current) {
          const finalWidth = resizeStartRef.current.currentWidth ?? width;
          onSizeChange?.(finalWidth, height);
        }
        resizeStartRef.current = null;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [width, height, onSizeChange]
  );

  // 좌상단 모서리 리사이즈 핸들러 (대각선)
  const handleTopLeftResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      resizeStartRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startWidth: width,
        startHeight: height,
        startBottom: POSITION_OFFSET,
        startRight: POSITION_OFFSET,
        resizeType: 'topLeft',
      };

      const handleMouseMove = (e: MouseEvent) => {
        const ref = resizeStartRef.current;
        if (!ref || ref.resizeType !== 'topLeft') return;

        const deltaX = ref.startX - e.clientX;
        const deltaY = ref.startY - e.clientY;
        const maxWidth = window.innerWidth - ref.startRight - POSITION_OFFSET;
        const maxHeight =
          window.innerHeight - ref.startBottom - POSITION_OFFSET;

        const newWidth = Math.max(
          MIN_WIDTH,
          Math.min(maxWidth, ref.startWidth + deltaX)
        );
        const newHeight = Math.max(
          MIN_HEIGHT,
          Math.min(maxHeight, ref.startHeight + deltaY)
        );

        setWidth(newWidth);
        setHeight(newHeight);
        ref.currentWidth = newWidth;
        ref.currentHeight = newHeight;
      };

      const handleMouseUp = () => {
        if (resizeStartRef.current) {
          const finalWidth = resizeStartRef.current.currentWidth ?? width;
          const finalHeight = resizeStartRef.current.currentHeight ?? height;
          onSizeChange?.(finalWidth, finalHeight);
        }
        resizeStartRef.current = null;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [width, height, onSizeChange]
  );

  if (!isMounted || typeof window === 'undefined') return null;

  return (
    <div
      className={`fixed bg-wh rounded-lg shadow-[4px_4px_40px_-24px_rgba(0,0,0,0.25)] flex flex-col z-[100] pointer-events-auto overflow-hidden ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      } ${resizeStartRef.current ? '' : 'transition-all duration-300'}`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        bottom: `${POSITION_OFFSET}px`,
        right: `${POSITION_OFFSET}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 리사이즈 핸들 - 위쪽 가장자리 */}
      <div
        className="absolute top-0 left-0 right-0 cursor-ns-resize z-40"
        style={{ height: `${RESIZE_HANDLE_SIZE}px` }}
        onMouseDown={handleTopResizeStart}
      />

      {/* 리사이즈 핸들 - 왼쪽 가장자리 */}
      <div
        className="absolute top-0 left-0 bottom-0 cursor-ew-resize z-50"
        style={{
          width: `${RESIZE_HANDLE_SIZE}px`,
          pointerEvents: 'auto',
        }}
        onMouseDown={handleLeftResizeStart}
      />

      {/* 리사이즈 핸들 - 좌상단 모서리 (대각선) */}
      <div
        className="absolute top-0 left-0 cursor-nwse-resize z-50"
        style={{
          width: `${RESIZE_CORNER_SIZE}px`,
          height: `${RESIZE_CORNER_SIZE}px`,
        }}
        onMouseDown={handleTopLeftResizeStart}
      />

      {/* 헤더 */}
      <div className="flex justify-end items-center gap-2 border-b border-lg shrink-0 w-full box-border px-2 py-2 relative z-10">
        <IconBtn
          icon={FrameCorners}
          onClick={() => {
            router.push('/nora');
            handleClose();
          }}
          size="w-10 h-10"
        />
        <IconBtn icon={X} onClick={handleClose} size="w-10 h-10" />
      </div>

      {/* 챗봇 컨텐츠 */}
      <div className="flex-1 min-w-0 min-h-0 w-full overflow-hidden relative z-0">
        <NoraComponent />
      </div>
    </div>
  );
};

export default NoraModal;
