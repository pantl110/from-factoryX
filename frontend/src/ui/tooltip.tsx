import React from 'react';

interface TooltipProps {
  text: string | React.ReactNode;
  color: 'red' | 'primary' | 'white';
  position: 'left' | 'right';
}

const Tooltip = ({ text, color, position }: TooltipProps) => {
  const colorMap = {
    red: 'text-red bg-[#FFF0F5]',
    primary: 'text-primary bg-primary-8',
    white: 'text-white',
  };
  const positionMap = {
    left: 'left-[15px] top-[-4px]',
    right: 'right-[21px] top-[-4px]',
  };
  return (
    <div
      className={`Re_Body-2 rounded-[12px] px-3 py-1 ${colorMap[color]} relative w-fit whitespace-pre-line`}
      style={{
        boxShadow: `
          0 0px 1px 0px rgba(0,0,0,0.3),
          0 2px 30px 0px rgba(0,0,0,0.08),
          0 0px 15px 0px rgba(0,0,0,0.03)
        `,
      }}
    >
      {text}
      <div
        className={`border-t border-r border-lg w-2.5 h-2.5 rounded-[2px] rotate-[-45deg] ${colorMap[color]} absolute ${positionMap[position]}`}
      />
    </div>
  );
};

export default Tooltip;
