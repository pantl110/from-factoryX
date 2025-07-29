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

  // 뷰포트 크기 변경 시 닫기
  useEffect(() => {
    const handleResize = () => {
      onClose();
    };
    window.addEventListener('resize', handleResize); // 리사이즈 이벤트 리스너 등록
    return () => {
      window.removeEventListener('resize', handleResize); // 언마운트 시 제거
    };
  }, [onClose]);

  return (
    <div
      ref={dropdownRef}
      className={`shadow-[0px_0px_8px_0px_rgba(0,0,0,0.12)] ${borderColor ? `border ${borderColor}` : ''} flex flex-col ${width} rounded-lg ${padding} bg-white z-30 ${className} ${
        maxHeight ? 'max-h-[256px] overflow-y-auto scrollbar-hide' : ''
      }`}
      style={style}
    >
      <div className={maxHeight ? 'min-h-0' : ''}>{children}</div>
    </div>
  );
};

export default Dropdown;
