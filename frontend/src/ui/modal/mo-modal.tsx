import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

interface MoModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export interface MoModalHandleModel {
  close: () => void;
}

const TRANSITION_DURATION = 300;

const MoModal = forwardRef<MoModalHandleModel, MoModalProps>(
  ({ title, children, onClose }, ref) => {
    const [isVisible, setIsVisible] = useState(false);
    const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      setIsVisible(true);
      return () => {
        document.body.style.overflow = original;
        if (closeTimeoutRef.current) {
          clearTimeout(closeTimeoutRef.current);
        }
      };
    }, []);

    const handleClose = () => {
      if (closeTimeoutRef.current) {
        return;
      }

      setIsVisible(false);
      closeTimeoutRef.current = setTimeout(() => {
        onClose?.();
        closeTimeoutRef.current = null;
      }, TRANSITION_DURATION);
    };

    useImperativeHandle(ref, () => ({
      close: handleClose,
    }));

    return (
      <div
        className={`fixed inset-0 z-30 flex items-end bg-black/50 transition-opacity duration-300 ease-out ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={(e) => {
          if (e.target !== e.currentTarget) return;
          handleClose();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') handleClose();
        }}
      >
        <div
          className={`px-7 pt-5 pb-6 bg-wh rounded-[16px] shadow-[4px_4px_40px_-24px_rgba(0,0,0,0.25)] w-full relative transition-transform duration-300 ease-out transform ${
            isVisible ? 'translate-y-0' : 'translate-y-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <h4 className="m-Heading-4b mb-4">{title}</h4>
          {children}
        </div>
      </div>
    );
  }
);

MoModal.displayName = 'MoModal';

export default MoModal;
