import { useEffect } from 'react';

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
  useEffect(() => {
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  return (
    <div
      role="presentation"
      className={`${bgColor} w-full min-w-[1000px] h-full fixed top-0 left-0 z-50 flex justify-center items-center`}
      onClick={blockExit ? undefined : onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && !blockExit) onClose?.();
      }}
    >
      <div
        className={`${pageColor} w-[1000px] max-h-[85%] overflow-y-auto scrollbar-hide`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

export default OverlayView;
