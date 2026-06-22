import React from 'react';

interface MoBtnProps {
  text: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  variant: 'ghost' | 'outline' | 'primary' | 'secondary' | 'outline-primary';
  width?: string;
  height?: string;
  big?: boolean;
  disabled?: boolean;
  onClick: () => void;
  align?: string;
}

const MoBtn = ({
  text,
  icon,
  iconPosition = 'right',
  variant,
  width = 'w-fit',
  big = false,
  disabled = false,
  onClick,
  align = 'justify-center',
}: MoBtnProps) => {
  const variantStyles = {
    ghost: 'bg-wh text-dg hover:bg-lg',
    outline: 'bg-wh text-dg border border-lg hover:bg-lg',
    primary: 'bg-primary text-white hover:bg-primary-hover',
    secondary: 'bg-green-8 text-primary hover:bg-secondary-hover',
    'outline-primary': 'text-primary border border-primary',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${big ? 'h-12' : variant === 'ghost' ? 'h-8' : 'h-10'}
        flex gap-1 items-center px-3 rounded-[8px] transition-colors ${align}
        ${width}
        ${disabled ? 'bg-lg text-gr cursor-default' : variantStyles[variant]}
        ${big ? 'text-m-Heading-5c' : 'text-m-Body-4'}
      `}
    >
      {iconPosition === 'left' &&
        icon &&
        React.cloneElement(icon as React.ReactElement<{ size: number }>, {
          size: 16,
        })}
      {text}
      {iconPosition === 'right' &&
        icon &&
        React.cloneElement(icon as React.ReactElement<{ size: number }>, {
          size: 16,
        })}
    </button>
  );
};

export default MoBtn;
