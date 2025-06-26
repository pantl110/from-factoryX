import { CaretLineRightIcon } from "@phosphor-icons/react/dist/ssr";
import { useEffect } from "react";

interface PanelProps {
  children: React.ReactNode;
  title: string;
  onClose: () => void;
}

const Panel = ({ children, title, onClose }: PanelProps) => {
  useEffect(() => {
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  return (
    <>
      <div
        className="fixed inset-0 bg-bl/50 transition-opacity duration-200"
        role="button"
        tabIndex={0}
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onClose();
        }}
      />

      <div
        className={`fixed top-0 right-0 h-full transition-transform duration-300 ease-in-out translate-x-0`}
      >
        <div className="w-[1000px] bg-white h-full flex flex-col gap-6 px-10 py-5">
          <div className="flex gap-2 items-center border-b border-[#eeeeee] pb-2 sticky top-0 bg-white z-10">
            <button
              onClick={onClose}
              className="flex items-center justify-center w-10 h-10 cursor-pointer"
            >
              <CaretLineRightIcon size={20} />
            </button>
            <h3 className="Heading-3">{title}</h3>
          </div>

          <div className="h-full overflow-y-auto">{children}</div>
        </div>
      </div>
    </>
  );
};

export default Panel;
