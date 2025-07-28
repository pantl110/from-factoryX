import { ReactNode, useRef, useEffect } from 'react';

interface DropdownProps {
  children: ReactNode;
  onClose: () => void;
  width?: string;
  style?: React.CSSProperties;
  className?: string;
  padding?: string;
  borderColor?: string;
  maxHeight?: boolean;
}

const Dropdown = ({
  children,
  onClose,
  width = 'w-[220px]',
  style,
  className = '',
  padding = 'p-2',
  borderColor = '',
  maxHeight = false,
}: DropdownProps) => {
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

    document.addEventListener('mousedown', handleClickOutside); // 이벤트 리스너 등록

    return () => {
      document.removeEventListener('mousedown', handleClickOutside); // 언마운트 시 제거
    };
  }, [onClose]);

  return (
    <div
      ref={dropdownRef}
      className={`${borderColor ? `border ${borderColor}` : ''} flex flex-col ${width} rounded-lg ${padding} shadow-lg bg-white z-30 ${className} ${
        maxHeight ? 'max-h-[256px] overflow-y-auto scrollbar-hide' : ''
      }`}
      style={style}
    >
      <div className={maxHeight ? 'min-h-0' : ''}>{children}</div>
    </div>
  );
};

export default Dropdown;
