import { X } from "@phosphor-icons/react/dist/ssr";
import { useEffect } from "react";

interface ModalProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  onClose?: () => void;
  sm?: boolean;
  width?: string;
}

const Modal = ({
  children,
  title,
  subtitle,
  onClose,
  width = "w-[631px]",
  sm = false,
}: ModalProps) => {
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
      className="bg-black/50 w-full h-full fixed top-0 left-0 z-50 flex justify-center items-center"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose?.();
      }}
    >
      <div
        className={`bg-white ${width} p-6 rounded-lg`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h3 className="Heading-3">{title}</h3>
          <button
            className={`${sm ? "w-9 h-9" : "w-10 h-10"} flex justify-center items-center cursor-pointer`}
            onClick={onClose}
          >
            <X size={sm ? 16 : 20} />
          </button>
        </div>
        <div className={`mt-1 ${sm ? "Re_Body-2" : "Me_Body-2"} text-gr`}>
          {subtitle}
        </div>

        {children}
      </div>
    </div>
  );
};

export default Modal;
