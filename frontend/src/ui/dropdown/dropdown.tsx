import { ReactNode, useRef, useEffect } from "react";

interface DropdownProps {
  children: ReactNode;
  onClose: () => void;
}

const Dropdown = ({ children, onClose }: DropdownProps) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside); // 이벤트 리스너 등록

    return () => {
      document.removeEventListener("mousedown", handleClickOutside); // 언마운트 시 제거
    };
  }, [onClose]);

  return (
    <div
      ref={dropdownRef}
      className="flex flex-col w-[235px] rounded-lg p-2 shadow-lg bg-wh"
    >
      {children}
    </div>
  );
};

export default Dropdown;
