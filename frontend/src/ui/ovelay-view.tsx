import { useEffect, useRef } from 'react';

interface OverlayViewProps {
  children: React.ReactNode;
  onClose?: () => void;
  bgColor?: string;
  pageColor?: string;
  blockExit?: boolean;
}

const OverlayView = ({
  children,
  onClose,
  bgColor = 'bg-black/50',
  pageColor = 'bg-wh',
  blockExit = false,
}: OverlayViewProps) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // 마운트 시 포커스 설정하여 키 이벤트를 받을 수 있도록 함
    overlayRef.current?.focus();

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  return (
    <div
      ref={overlayRef}
      role="presentation"
      tabIndex={-1}
      className={`${bgColor} w-full min-w-[1000px] h-full fixed top-0 left-0 z-50 flex justify-center items-center`}
      onClick={blockExit ? undefined : onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && !blockExit) onClose?.();
      }}
    >
      <div
        className={`${pageColor} w-[1000px] max-h-[85%] min-h-[85%] overflow-y-auto scrollbar-hide`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

export default OverlayView;
