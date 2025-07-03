import { useEffect } from "react";

interface OverlayViewProps {
  children: React.ReactNode;
  onClose?: () => void;
}

const OverlayView = ({ children, onClose }: OverlayViewProps) => {
  useEffect(() => {
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  return (
    <div
      role="presentation"
      className="bg-black/50 w-full min-w-[1000px] h-full fixed top-0 left-0 z-50 flex justify-center items-center"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose?.();
      }}
    >
      <div
        className="bg-white w-[1000px] h-[85%] overflow-y-auto scrollbar-hide"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

export default OverlayView;
