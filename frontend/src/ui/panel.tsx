import { CaretLineRightIcon } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useState } from "react";

interface PanelProps {
  children: React.ReactNode;
  title: string;
  onClose: () => void;
}

const Panel = ({ children, title, onClose }: PanelProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    // 스크롤 막기
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // 애니메이션 시작
    requestAnimationFrame(() => {
      setIsVisible(true);
    });

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  useEffect(() => {
    // ESC 키 이벤트 리스너
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    // 애니메이션이 끝난 후 DOM에서 제거
    setTimeout(() => {
      setShouldRender(false);
      onClose();
    }, 200); // duration-200과 맞춤
  };

  if (!shouldRender) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-bl/50 transition-opacity duration-200 z-40"
        role="button"
        tabIndex={0}
        onClick={handleClose}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") handleClose();
        }}
      />

      <div
        className={`fixed top-0 right-0 h-full transition-transform duration-200 ease-in-out z-40 ${
          isVisible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="w-[1000px] bg-white h-full flex flex-col gap-6 px-10 pt-5">
          <div className="flex gap-2 items-center border-b border-[#eeeeee] pb-2 sticky top-0 bg-white z-10">
            <button
              onClick={handleClose}
              className="flex items-center justify-center w-10 h-10 cursor-pointer hover:bg-bg rounded-lg transition-all duration-200"
            >
              <CaretLineRightIcon size={20} />
            </button>
            <h3 className="Heading-3">{title}</h3>
          </div>

          <div className="h-full overflow-y-auto scrollbar-hide mb-5">
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

export default Panel;
