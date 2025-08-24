import { CaretLineRightIcon } from '@phosphor-icons/react/dist/ssr';
import {
  useEffect,
  useState,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from 'react';
import MiniBtn from './mini-btn';

interface PanelProps {
  children: React.ReactNode;
  title: string;
  onClose: () => void;
  hasSaveButton?: boolean;
  // 헤더 버튼 (함수로 받아서 handleClose를 전달)
  headerButton?:
    | React.ReactNode
    | ((handleClose: () => void) => React.ReactNode);
}

export interface PanelRef {
  handleClose: () => void;
}

const Panel = forwardRef<PanelRef, PanelProps>(
  ({ children, title, onClose, hasSaveButton = false, headerButton }, ref) => {
    const [isVisible, setIsVisible] = useState(false);
    const [shouldRender, setShouldRender] = useState(true);

    const handleClose = useCallback(() => {
      setIsVisible(false);
      // 애니메이션이 끝난 후 DOM에서 제거
      setTimeout(() => {
        setShouldRender(false);
        onClose();
      }, 200); // duration-200과 맞춤
    }, [onClose]);

    // handleClose 함수를 외부로 노출
    useImperativeHandle(
      ref,
      () => ({
        handleClose,
      }),
      [handleClose]
    );

    useEffect(() => {
      // 스크롤 막기
      const originalStyle = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

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
        if (e.key === 'Escape') {
          handleClose();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, [handleClose]);

    if (!shouldRender) return null;

    return (
      <>
        <div
          className="fixed inset-0 bg-bl/50 transition-opacity duration-200 z-40"
          role="button"
          tabIndex={0}
          onClick={handleClose}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') handleClose();
          }}
        />

        <div
          className={`fixed top-0 right-0 h-full transition-transform duration-200 ease-in-out z-40 ${
            isVisible ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="w-[1000px] bg-white h-full flex flex-col px-10 pt-5">
            <div className="flex justify-between border-b border-lg pb-3">
              <div className="flex gap-2 items-center sticky top-0 bg-white z-10">
                <h3 className="Heading-3">{title}</h3>
                <button
                  onClick={handleClose}
                  className="flex items-center justify-center w-10 h-10 cursor-pointer hover:bg-bg rounded-lg transition-all duration-200"
                >
                  <CaretLineRightIcon size={20} className="text-sv" />
                </button>
              </div>

              {typeof headerButton === 'function'
                ? headerButton(handleClose)
                : headerButton}

              {/* 나중에 정리하기 */}
              {hasSaveButton && (
                <MiniBtn
                  text="저장"
                  textColor="text-primary"
                  bgColor="bg-primary-8"
                  hoverColor="bg-secondary-hover"
                />
              )}
            </div>

            <div className="h-full overflow-y-auto scrollbar-hide pb-5 pt-6">
              {children}
            </div>
          </div>
        </div>
      </>
    );
  }
);

Panel.displayName = 'Panel';

export default Panel;
