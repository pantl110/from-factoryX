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
const RESIZE_HANDLE_SIZE = 8;
const RESIZE_CORNER_SIZE = 12;

type ResizeType =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'topLeft'
  | 'topRight'
  | 'bottomLeft'
  | 'bottomRight'
  | null;

interface ResizeStartStateModel {
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
  startBottom: number;
  startRight: number;
  startPositionX?: number;
  startPositionY?: number;
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
  const [positionX, setPositionX] = useState(0);
  const [positionY, setPositionY] = useState(0);
  const router = useRouter();
  const resizeStartRef = useRef<ResizeStartStateModel | null>(null);
  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    startPosX: number;
    startPosY: number;
  } | null>(null);
  const isInitializedRef = useRef(false);
  const savedPositionRef = useRef<{ x: number; y: number } | null>(null);

  // 초기화
  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      const defaultWidth = window.innerWidth * DEFAULT_WIDTH_RATIO;
      const defaultHeight = window.innerHeight * DEFAULT_HEIGHT_RATIO;
      setWidth(initialWidth ?? defaultWidth);
      setHeight(initialHeight ?? defaultHeight);

      // 처음 마운트될 때만 위치 초기화, 이후에는 저장된 위치 사용
      if (!isInitializedRef.current) {
        const initialX =
          window.innerWidth - (initialWidth ?? defaultWidth) - POSITION_OFFSET;
        const initialY =
          window.innerHeight -
          (initialHeight ?? defaultHeight) -
          POSITION_OFFSET;
        setPositionX(initialX);
        setPositionY(initialY);
        savedPositionRef.current = { x: initialX, y: initialY };
        isInitializedRef.current = true;
      } else if (savedPositionRef.current) {
        // 이미 초기화된 경우 저장된 위치 사용
        setPositionX(savedPositionRef.current.x);
        setPositionY(savedPositionRef.current.y);
      }
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
        startPositionY: positionY,
        resizeType: 'top',
      };

      const handleMouseMove = (e: MouseEvent) => {
        const ref = resizeStartRef.current;
        if (!ref || ref.resizeType !== 'top') return;

        // 위로 드래그하면 높이 증가, 아래로 드래그하면 높이 감소
        const deltaY = ref.startY - e.clientY; // 위로 드래그하면 양수
        const startPosY = ref.startPositionY ?? positionY;

        // 최대 높이: 화면 높이에서 시작 위치와 패딩을 뺀 값
        const maxHeight = window.innerHeight - startPosY - POSITION_OFFSET;

        // 높이 계산
        const newHeight = Math.max(
          MIN_HEIGHT,
          Math.min(maxHeight, ref.startHeight + deltaY)
        );

        // 높이 변화에 따라 위치 조정 (위로 늘어나도록)
        const heightDiff = newHeight - ref.startHeight;
        const newY = Math.max(POSITION_OFFSET, startPosY - heightDiff);

        setHeight(newHeight);
        setPositionY(newY);
        ref.currentHeight = newHeight;
      };

      const handleMouseUp = () => {
        if (resizeStartRef.current) {
          const finalHeight = resizeStartRef.current.currentHeight ?? height;
          // 위쪽 리사이즈: 아래 고정 → 아래쪽이 고정되도록 위치 계산
          // 높이 변화에 따라 위치를 조정하여 아래쪽이 고정되도록 함
          const heightDiff =
            finalHeight - (resizeStartRef.current.startHeight ?? height);
          const newY = Math.max(
            POSITION_OFFSET,
            (resizeStartRef.current.startPositionY ?? positionY) - heightDiff
          );
          setPositionY(newY);
          if (savedPositionRef.current) {
            savedPositionRef.current.y = newY;
          }
          setTimeout(() => {
            onSizeChange?.(width, finalHeight);
          }, 0);
        }
        resizeStartRef.current = null;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [width, height, positionY, onSizeChange]
  );

  // 아래쪽 리사이즈 핸들러
  const handleBottomResizeStart = useCallback(
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
        resizeType: 'bottom',
      };

      const handleMouseMove = (e: MouseEvent) => {
        const ref = resizeStartRef.current;
        if (!ref || ref.resizeType !== 'bottom') return;

        const deltaY = e.clientY - ref.startY;
        const maxHeight = window.innerHeight - positionY - POSITION_OFFSET;
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
          // 아래쪽 리사이즈: 위 고정 → 현재 위치 유지 (위쪽이 고정)
          if (savedPositionRef.current) {
            savedPositionRef.current.y = positionY;
          }
          setTimeout(() => {
            onSizeChange?.(width, finalHeight);
          }, 0);
        }
        resizeStartRef.current = null;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [width, height, positionY, onSizeChange]
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
        startPositionX: positionX,
        resizeType: 'left',
      };

      const handleMouseMove = (e: MouseEvent) => {
        const ref = resizeStartRef.current;
        if (!ref || ref.resizeType !== 'left') return;

        // 왼쪽으로 드래그하면 너비 증가, 오른쪽으로 드래그하면 너비 감소
        const deltaX = ref.startX - e.clientX; // 왼쪽으로 드래그하면 양수
        const startPosX = ref.startPositionX ?? positionX;

        // 너비 변화에 따라 위치 조정 (왼쪽으로 늘어나도록)
        const tempWidthDiff = deltaX; // 임시 너비 변화
        const tempNewX = Math.max(POSITION_OFFSET, startPosX - tempWidthDiff);

        // 위치가 왼쪽으로 이동한 후의 최대 너비 계산
        const maxWidth = window.innerWidth - tempNewX - POSITION_OFFSET;
        const newWidth = Math.max(
          MIN_WIDTH,
          Math.min(maxWidth, ref.startWidth + deltaX)
        );

        // 너비 변화에 따라 위치 조정 (왼쪽으로 늘어나도록)
        const widthDiff = newWidth - ref.startWidth;
        const newX = Math.max(POSITION_OFFSET, startPosX - widthDiff);

        setWidth(newWidth);
        setPositionX(newX);
        ref.currentWidth = newWidth;
      };

      const handleMouseUp = () => {
        if (resizeStartRef.current) {
          const finalWidth = resizeStartRef.current.currentWidth ?? width;
          // 왼쪽 리사이즈: 오른쪽 고정 → 오른쪽이 고정되도록 위치 계산
          // 새로운 너비에 맞춰 오른쪽이 같은 위치에 있도록 위치 조정
          const widthDiff =
            finalWidth - (resizeStartRef.current.startWidth ?? width);
          const newX = Math.max(
            POSITION_OFFSET,
            (resizeStartRef.current.startPositionX ?? positionX) - widthDiff
          );
          setPositionX(newX);
          if (savedPositionRef.current) {
            savedPositionRef.current.x = newX;
          }
          setTimeout(() => {
            onSizeChange?.(finalWidth, height);
          }, 0);
        }
        resizeStartRef.current = null;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [width, height, positionX, onSizeChange]
  );

  // 오른쪽 리사이즈 핸들러
  const handleRightResizeStart = useCallback(
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
        resizeType: 'right',
      };

      const handleMouseMove = (e: MouseEvent) => {
        const ref = resizeStartRef.current;
        if (!ref || ref.resizeType !== 'right') return;

        const deltaX = e.clientX - ref.startX;
        const maxWidth = window.innerWidth - positionX - POSITION_OFFSET;
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
          // 오른쪽 리사이즈: 왼쪽 고정 → 현재 위치 유지 (왼쪽이 고정)
          if (savedPositionRef.current) {
            savedPositionRef.current.x = positionX;
          }
          setTimeout(() => {
            onSizeChange?.(finalWidth, height);
          }, 0);
        }
        resizeStartRef.current = null;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [width, height, positionX, onSizeChange]
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
        startPositionX: positionX,
        startPositionY: positionY,
        resizeType: 'topLeft',
      };

      const handleMouseMove = (e: MouseEvent) => {
        const ref = resizeStartRef.current;
        if (!ref || ref.resizeType !== 'topLeft') return;

        // 왼쪽 위로 드래그하면 크기 증가, 오른쪽 아래로 드래그하면 크기 감소
        const deltaX = ref.startX - e.clientX; // 왼쪽으로 드래그하면 양수
        const deltaY = ref.startY - e.clientY; // 위로 드래그하면 양수
        const startPosX = ref.startPositionX ?? positionX;
        const startPosY = ref.startPositionY ?? positionY;

        // 먼저 높이 변화를 계산하여 위치가 얼마나 위로 이동할지 확인
        const tempHeightDiff = deltaY; // 임시 높이 변화
        const tempNewY = Math.max(POSITION_OFFSET, startPosY - tempHeightDiff);

        // 너비 변화에 따라 위치가 얼마나 왼쪽으로 이동할지 확인
        const tempWidthDiff = deltaX; // 임시 너비 변화
        const tempNewX = Math.max(POSITION_OFFSET, startPosX - tempWidthDiff);

        // 위치가 위로, 왼쪽으로 이동한 후의 최대 크기 계산
        const maxWidth = window.innerWidth - tempNewX - POSITION_OFFSET;
        const maxHeight = window.innerHeight - tempNewY - POSITION_OFFSET;

        const newWidth = Math.max(
          MIN_WIDTH,
          Math.min(maxWidth, ref.startWidth + deltaX)
        );
        const newHeight = Math.max(
          MIN_HEIGHT,
          Math.min(maxHeight, ref.startHeight + deltaY)
        );

        // 크기 변화에 따라 위치 조정 (좌상단으로 늘어나도록)
        const widthDiff = newWidth - ref.startWidth;
        const heightDiff = newHeight - ref.startHeight;
        const newX = Math.max(POSITION_OFFSET, startPosX - widthDiff);
        const newY = Math.max(POSITION_OFFSET, startPosY - heightDiff);

        setWidth(newWidth);
        setHeight(newHeight);
        setPositionX(newX);
        setPositionY(newY);
        ref.currentWidth = newWidth;
        ref.currentHeight = newHeight;
      };

      const handleMouseUp = () => {
        if (resizeStartRef.current) {
          const finalWidth = resizeStartRef.current.currentWidth ?? width;
          const finalHeight = resizeStartRef.current.currentHeight ?? height;
          // 좌상단 리사이즈: 우하단 고정 → 우하단이 고정되도록 위치 계산
          const widthDiff =
            finalWidth - (resizeStartRef.current.startWidth ?? width);
          const heightDiff =
            finalHeight - (resizeStartRef.current.startHeight ?? height);
          const newX = Math.max(
            POSITION_OFFSET,
            (resizeStartRef.current.startPositionX ?? positionX) - widthDiff
          );
          const newY = Math.max(
            POSITION_OFFSET,
            (resizeStartRef.current.startPositionY ?? positionY) - heightDiff
          );
          setPositionX(newX);
          setPositionY(newY);
          if (savedPositionRef.current) {
            savedPositionRef.current.x = newX;
            savedPositionRef.current.y = newY;
          }
          setTimeout(() => {
            onSizeChange?.(finalWidth, finalHeight);
          }, 0);
        }
        resizeStartRef.current = null;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [width, height, positionX, positionY, onSizeChange]
  );

  // 우상단 모서리 리사이즈 핸들러 (대각선)
  const handleTopRightResizeStart = useCallback(
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
        startPositionY: positionY,
        resizeType: 'topRight',
      };

      const handleMouseMove = (e: MouseEvent) => {
        const ref = resizeStartRef.current;
        if (!ref || ref.resizeType !== 'topRight') return;

        // 오른쪽 위로 드래그하면 크기 증가, 왼쪽 아래로 드래그하면 크기 감소
        const deltaX = e.clientX - ref.startX; // 오른쪽으로 드래그하면 양수
        const deltaY = ref.startY - e.clientY; // 위로 드래그하면 양수
        const startPosY = ref.startPositionY ?? positionY;

        // 먼저 높이 변화를 계산하여 위치가 얼마나 위로 이동할지 확인
        const tempHeightDiff = deltaY; // 임시 높이 변화
        const tempNewY = Math.max(POSITION_OFFSET, startPosY - tempHeightDiff);

        // 위치가 위로 이동한 후의 최대 높이 계산
        const maxWidth = window.innerWidth - positionX - POSITION_OFFSET;
        const maxHeight = window.innerHeight - tempNewY - POSITION_OFFSET;

        const newWidth = Math.max(
          MIN_WIDTH,
          Math.min(maxWidth, ref.startWidth + deltaX)
        );
        const newHeight = Math.max(
          MIN_HEIGHT,
          Math.min(maxHeight, ref.startHeight + deltaY)
        );

        // 높이 변화에 따라 위치 조정 (위로 늘어나도록)
        const heightDiff = newHeight - ref.startHeight;
        const newY = Math.max(POSITION_OFFSET, startPosY - heightDiff);

        setWidth(newWidth);
        setHeight(newHeight);
        setPositionY(newY);
        ref.currentWidth = newWidth;
        ref.currentHeight = newHeight;
      };

      const handleMouseUp = () => {
        if (resizeStartRef.current) {
          const finalWidth = resizeStartRef.current.currentWidth ?? width;
          const finalHeight = resizeStartRef.current.currentHeight ?? height;
          // 우상단 리사이즈: 좌하단 고정 → 좌하단이 고정되도록 위치 계산
          const heightDiff =
            finalHeight - (resizeStartRef.current.startHeight ?? height);
          const newY = Math.max(
            POSITION_OFFSET,
            (resizeStartRef.current.startPositionY ?? positionY) - heightDiff
          );
          setPositionY(newY);
          if (savedPositionRef.current) {
            savedPositionRef.current.x = positionX;
            savedPositionRef.current.y = newY;
          }
          setTimeout(() => {
            onSizeChange?.(finalWidth, finalHeight);
          }, 0);
        }
        resizeStartRef.current = null;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [width, height, positionX, positionY, onSizeChange]
  );

  // 좌하단 모서리 리사이즈 핸들러 (대각선)
  const handleBottomLeftResizeStart = useCallback(
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
        startPositionX: positionX,
        resizeType: 'bottomLeft',
      };

      const handleMouseMove = (e: MouseEvent) => {
        const ref = resizeStartRef.current;
        if (!ref || ref.resizeType !== 'bottomLeft') return;

        // 왼쪽 아래로 드래그하면 크기 증가, 오른쪽 위로 드래그하면 크기 감소
        const deltaX = ref.startX - e.clientX; // 왼쪽으로 드래그하면 양수
        const deltaY = e.clientY - ref.startY; // 아래로 드래그하면 양수
        const startPosX = ref.startPositionX ?? positionX;

        // 너비 변화에 따라 위치 조정 (왼쪽으로 늘어나도록)
        const tempWidthDiff = deltaX; // 임시 너비 변화
        const tempNewX = Math.max(POSITION_OFFSET, startPosX - tempWidthDiff);

        // 위치가 왼쪽으로 이동한 후의 최대 너비 계산
        const maxWidth = window.innerWidth - tempNewX - POSITION_OFFSET;
        const maxHeight = window.innerHeight - positionY - POSITION_OFFSET;

        const newWidth = Math.max(
          MIN_WIDTH,
          Math.min(maxWidth, ref.startWidth + deltaX)
        );
        const newHeight = Math.max(
          MIN_HEIGHT,
          Math.min(maxHeight, ref.startHeight + deltaY)
        );

        // 너비 변화에 따라 위치 조정 (왼쪽으로 늘어나도록)
        const widthDiff = newWidth - ref.startWidth;
        const newX = Math.max(POSITION_OFFSET, startPosX - widthDiff);

        setWidth(newWidth);
        setHeight(newHeight);
        setPositionX(newX);
        ref.currentWidth = newWidth;
        ref.currentHeight = newHeight;
      };

      const handleMouseUp = () => {
        if (resizeStartRef.current) {
          const finalWidth = resizeStartRef.current.currentWidth ?? width;
          const finalHeight = resizeStartRef.current.currentHeight ?? height;
          // 좌하단 리사이즈: 우상단 고정 → 우상단이 고정되도록 위치 계산
          const widthDiff =
            finalWidth - (resizeStartRef.current.startWidth ?? width);
          const newX = Math.max(
            POSITION_OFFSET,
            (resizeStartRef.current.startPositionX ?? positionX) - widthDiff
          );
          setPositionX(newX);
          if (savedPositionRef.current) {
            savedPositionRef.current.x = newX;
            savedPositionRef.current.y = positionY;
          }
          setTimeout(() => {
            onSizeChange?.(finalWidth, finalHeight);
          }, 0);
        }
        resizeStartRef.current = null;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [width, height, positionX, positionY, onSizeChange]
  );

  // 우하단 모서리 리사이즈 핸들러 (대각선)
  const handleBottomRightResizeStart = useCallback(
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
        resizeType: 'bottomRight',
      };

      const handleMouseMove = (e: MouseEvent) => {
        const ref = resizeStartRef.current;
        if (!ref || ref.resizeType !== 'bottomRight') return;

        const deltaX = e.clientX - ref.startX;
        const deltaY = e.clientY - ref.startY;
        const maxWidth = window.innerWidth - positionX - POSITION_OFFSET;
        const maxHeight = window.innerHeight - positionY - POSITION_OFFSET;

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
          // 우하단 리사이즈: 좌상단 고정 → 현재 위치 유지 (좌상단이 고정)
          if (savedPositionRef.current) {
            savedPositionRef.current.x = positionX;
            savedPositionRef.current.y = positionY;
          }
          setTimeout(() => {
            onSizeChange?.(finalWidth, finalHeight);
          }, 0);
        }
        resizeStartRef.current = null;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [width, height, positionX, positionY, onSizeChange]
  );

  // 헤더 드래그 핸들러
  const handleHeaderDragStart = useCallback(
    (e: React.MouseEvent) => {
      // 버튼이나 클릭 가능한 요소를 클릭한 경우 드래그 시작하지 않음
      const target = e.target as HTMLElement;
      if (
        target.closest('button') ||
        target.closest('[role="button"]') ||
        target.tagName === 'BUTTON' ||
        target.closest('svg') ||
        target.closest('[onclick]')
      ) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      dragStartRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startPosX: positionX,
        startPosY: positionY,
      };

      const handleMouseMove = (e: MouseEvent) => {
        const ref = dragStartRef.current;
        if (!ref) return;

        const deltaX = e.clientX - ref.startX;
        const deltaY = e.clientY - ref.startY;

        const newX = ref.startPosX + deltaX;
        const newY = ref.startPosY + deltaY;

        // 경계 체크: 패딩 안에서만 이동 가능
        const minX = POSITION_OFFSET;
        const maxX = window.innerWidth - width - POSITION_OFFSET;
        const minY = POSITION_OFFSET;
        const maxY = window.innerHeight - height - POSITION_OFFSET;

        const finalX = Math.max(minX, Math.min(maxX, newX));
        const finalY = Math.max(minY, Math.min(maxY, newY));

        setPositionX(finalX);
        setPositionY(finalY);

        // 드래그 중에도 위치 저장
        if (savedPositionRef.current) {
          savedPositionRef.current.x = finalX;
          savedPositionRef.current.y = finalY;
        }
      };

      const handleMouseUp = () => {
        dragStartRef.current = null;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [positionX, positionY, width, height]
  );

  if (!isMounted || typeof window === 'undefined') return null;

  return (
    <div
      className={`fixed bg-wh rounded-lg shadow-[4px_4px_40px_-24px_rgba(0,0,0,0.25)] flex flex-col z-[100] pointer-events-auto overflow-hidden ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      } ${resizeStartRef.current || dragStartRef.current ? '' : 'transition-all duration-300'}`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        left: `${positionX}px`,
        top: `${positionY}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 리사이즈 핸들 - 위쪽 가장자리 */}
      <div
        className="absolute top-0 left-0 right-0 cursor-ns-resize z-[60]"
        style={{ height: `${RESIZE_HANDLE_SIZE}px`, pointerEvents: 'auto' }}
        onMouseDown={handleTopResizeStart}
      />

      {/* 리사이즈 핸들 - 아래쪽 가장자리 */}
      <div
        className="absolute bottom-0 left-0 right-0 cursor-ns-resize z-40"
        style={{ height: `${RESIZE_HANDLE_SIZE}px` }}
        onMouseDown={handleBottomResizeStart}
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

      {/* 리사이즈 핸들 - 오른쪽 가장자리 */}
      <div
        className="absolute top-0 right-0 bottom-0 cursor-ew-resize z-50"
        style={{
          width: `${RESIZE_HANDLE_SIZE}px`,
          pointerEvents: 'auto',
        }}
        onMouseDown={handleRightResizeStart}
      />

      {/* 리사이즈 핸들 - 좌상단 모서리 (대각선) */}
      <div
        className="absolute top-0 left-0 cursor-nwse-resize z-[60]"
        style={{
          width: `${RESIZE_CORNER_SIZE}px`,
          height: `${RESIZE_CORNER_SIZE}px`,
          pointerEvents: 'auto',
        }}
        onMouseDown={handleTopLeftResizeStart}
      />

      {/* 리사이즈 핸들 - 우상단 모서리 (대각선) */}
      <div
        className="absolute top-0 right-0 cursor-nesw-resize z-[60]"
        style={{
          width: `${RESIZE_CORNER_SIZE}px`,
          height: `${RESIZE_CORNER_SIZE}px`,
          pointerEvents: 'auto',
        }}
        onMouseDown={handleTopRightResizeStart}
      />

      {/* 리사이즈 핸들 - 좌하단 모서리 (대각선) */}
      <div
        className="absolute bottom-0 left-0 cursor-nesw-resize z-50"
        style={{
          width: `${RESIZE_CORNER_SIZE}px`,
          height: `${RESIZE_CORNER_SIZE}px`,
        }}
        onMouseDown={handleBottomLeftResizeStart}
      />

      {/* 리사이즈 핸들 - 우하단 모서리 (대각선) */}
      <div
        className="absolute bottom-0 right-0 cursor-nwse-resize z-50"
        style={{
          width: `${RESIZE_CORNER_SIZE}px`,
          height: `${RESIZE_CORNER_SIZE}px`,
        }}
        onMouseDown={handleBottomRightResizeStart}
      />

      {/* 헤더 */}
      <div
        className="flex justify-end items-center gap-2 border-b border-lg shrink-0 w-full box-border px-2 py-2 relative z-10 cursor-move select-none"
        style={{
          marginTop: `${RESIZE_HANDLE_SIZE}px`,
          paddingLeft: `${RESIZE_CORNER_SIZE}px`,
          paddingRight: `${RESIZE_CORNER_SIZE}px`,
        }}
        onMouseDown={(e) => {
          // 모서리 리사이즈 핸들 영역에서는 드래그 시작하지 않음
          const target = e.target as HTMLElement;
          const rect = target.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          // 좌상단 모서리 영역 체크
          if (x < RESIZE_CORNER_SIZE && y < RESIZE_CORNER_SIZE) {
            return;
          }
          // 우상단 모서리 영역 체크
          if (x > rect.width - RESIZE_CORNER_SIZE && y < RESIZE_CORNER_SIZE) {
            return;
          }

          handleHeaderDragStart(e);
        }}
      >
        <div className="flex gap-2" onMouseDown={(e) => e.stopPropagation()}>
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
      </div>

      {/* 챗봇 컨텐츠 */}
      <div className="flex-1 min-w-0 min-h-0 w-full overflow-hidden relative z-0">
        <NoraComponent />
      </div>
    </div>
  );
};

export default NoraModal;
