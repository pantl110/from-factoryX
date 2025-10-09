import React from 'react';

interface MoBtnProps {
  text: string;
  icon?: React.ReactNode;
  variant: 'ghost' | 'outline' | 'primary' | 'secondary';
  width?: string;
  height?: string;
  big?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

const MoBtn = ({
  text,
  icon,
  variant,
  width = 'w-fit',
  big = false,
  disabled = false,
  onClick,
}: MoBtnProps) => {
  const variantStyles = {
    ghost: 'bg-wh text-dg hover:bg-lg',
    outline: 'bg-wh text-dg border border-lg hover:bg-lg',
    primary: 'bg-primary text-white hover:bg-primary-hover',
    secondary: 'bg-primary-8 text-primary hover:bg-secondary-hover',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${big ? 'h-12' : variant === 'ghost' ? 'h-8' : 'h-10'}
        flex gap-1 items-center px-3 rounded-[8px] transition-colors justify-center
        ${width}
        ${disabled ? 'bg-lg text-gr cursor-default' : variantStyles[variant]}
        ${big ? 'text-m-Heading-5c' : 'text-m-Body-4'}
      `}
    >
      {text}
      {icon &&
        React.cloneElement(icon as React.ReactElement<{ size: number }>, {
          size: 16,
        })}
    </button>
  );
};

export default MoBtn;
