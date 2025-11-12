import { ReactNode, useRef, useEffect } from 'react';

interface DropdownProps {
  children: ReactNode;
  onClose: () => void;
  width?: string;
  style?: React.CSSProperties;
  className?: string;
  padding?: string;
  borderColor?: string;
  maxHeight?: string;
  gap?: string;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
}

const Dropdown = ({
  children,
  onClose,
  width = 'w-[220px]',
  style,
  className = '',
  padding = 'p-2',
  borderColor = '',
  maxHeight = 'max-h-[304px]',
  gap = '',
  scrollRef,
  onScroll,
  onLoadMore,
  hasMore = false,
  isLoading = false,
}: DropdownProps) => {
  const internalRef = useRef<HTMLDivElement>(null);
  const dropdownRef = scrollRef || internalRef;

  // 무한 스크롤 처리
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    // 커스텀 onScroll이 있으면 먼저 실행
    if (onScroll) {
      onScroll(e);
    }

    // onLoadMore가 있으면 무한 스크롤 처리
    if (onLoadMore && hasMore && !isLoading) {
      const target = e.currentTarget;
      const { scrollTop, scrollHeight, clientHeight } = target;

      // 스크롤이 끝에서 50px 이내에 도달하면 다음 페이지 로드
      if (scrollHeight - scrollTop - clientHeight < 50) {
        onLoadMore();
      }
    }
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // 외부 스크롤 시 닫기 (드롭다운 내부 스크롤 제외)
  useEffect(() => {
    const handleScroll = (event: Event) => {
      const target = event.target as Node;

      // 드롭다운 자체가 스크롤되는 경우 무시
      if (target === dropdownRef.current) {
        return;
      }
      // 드롭다운 내부에서 발생한 스크롤은 무시
      if (dropdownRef.current && dropdownRef.current.contains(target)) {
        return;
      }
      // 외부 스크롤인 경우 닫기
      onClose();
    };

    // document와 window 모두에서 스크롤 감지
    document.addEventListener('scroll', handleScroll, true);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('scroll', handleScroll, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose]);

  // 사이드바(aside) 이동 시 닫기: aside의 transition/scroll 및 커스텀 이벤트 수신
  useEffect(() => {
    const aside = document.querySelector('aside');
    const handleAsideMove = () => onClose();

    if (aside) {
      aside.addEventListener('transitionstart', handleAsideMove);
      aside.addEventListener('transitionend', handleAsideMove);
      aside.addEventListener('scroll', handleAsideMove, {
        passive: true,
      } as AddEventListenerOptions);
    }

    const handleSidebarToggle = () => onClose();
    window.addEventListener('sidebar:toggle', handleSidebarToggle);

    return () => {
      if (aside) {
        aside.removeEventListener('transitionstart', handleAsideMove);
        aside.removeEventListener('transitionend', handleAsideMove);
        aside.removeEventListener('scroll', handleAsideMove);
      }
      window.removeEventListener('sidebar:toggle', handleSidebarToggle);
    };
  }, [onClose]);

  return (
    <div
      ref={dropdownRef}
      className={`shadow-[0px_0px_8px_0px_rgba(0,0,0,0.12)] ${borderColor ? `border ${borderColor}` : ''} ${gap ? 'flex flex-col' : ''} ${gap} ${width} rounded-lg ${padding} bg-white z-30 ${className} ${
        maxHeight ? `${maxHeight} overflow-y-scroll scrollbar-hide` : ''
      }`}
      style={style}
      onScroll={handleScroll}
    >
      {children}
    </div>
  );
};

export default Dropdown;
