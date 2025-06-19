interface OverlayViewProps {
  children: React.ReactNode;
  onClose?: () => void;
}

const OverlayView = ({ children, onClose }: OverlayViewProps) => {
  return (
    <div
      role="presentation"
      className="bg-black/50 w-full h-full fixed top-0 left-0 z-50 flex justify-center items-center px-15 py-9.25"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose?.();
      }}
    >
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
      <div
        className="bg-white w-full h-full overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

export default OverlayView;
