'use client';

interface MoToastProps {
  icon: React.ReactNode;
  text: string;
  subtext: string;
  type: 'red' | 'primary';
  isVisible: boolean;
  position?: 'top' | 'bottom'; // 상단/하단 선택 가능 (기본값: bottom)
}

const MoToast = ({
  icon,
  text,
  subtext,
  type,
  isVisible = true,
  position = 'bottom',
}: MoToastProps) => {
  const positionClasses =
    position === 'top'
      ? 'top-4 left-1/2 -translate-x-1/2'
      : 'bottom-24 left-1/2 -translate-x-1/2'; // MoBottomNavigation 위에 표시

  return (
    <div
      className={`fixed ${positionClasses} z-50 w-full max-w-[calc(100%-32px)] px-4`}
    >
      <div
        className={`bg-wh p-4 flex flex-col gap-1 rounded-[8px] w-full ${
          isVisible ? 'toast-in' : 'toast-out'
        } ${
          type === 'red'
            ? 'border border-red shadow-[4px_4px_20px_-12px_rgba(243,18,96,1)]'
            : 'border border-primary shadow-[4px_4px_20px_-12px_rgba(1,111,238,1)]'
        }`}
      >
        <div className="flex items-center gap-1">
          {icon}
          <p className="Me_Body-1">{text}</p>
        </div>
        <p className="Re_Body-1 text-[#363636]">{subtext}</p>
      </div>
    </div>
  );
};

export default MoToast;
