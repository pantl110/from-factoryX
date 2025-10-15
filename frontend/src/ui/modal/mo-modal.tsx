import { useEffect } from 'react';

interface MoModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

const MoModal = ({ title, children, onClose }: MoModalProps) => {
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-30 flex items-end bg-black/50`}
      onClick={(e) => {
        if (e.target !== e.currentTarget) return;
        onClose?.();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose?.();
      }}
    >
      <div
        className="px-7 pt-5 pb-6 bg-wh rounded-[16px] shadow-[4px_4px_40px_-24px_rgba(0,0,0,0.25)] w-full relative"
        onClick={(e) => e.stopPropagation()}
      >
        <h4 className="m-Heading-4b mb-4">{title}</h4>
        {children}
      </div>
    </div>
  );
};

export default MoModal;
