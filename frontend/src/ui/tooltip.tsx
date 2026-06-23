import React from 'react';

interface TooltipProps {
  text: string | React.ReactNode;
  color: 'red' | 'primary' | 'white' | 'black';
  position: 'left' | 'right';
  // 'top': 툴팁이 아래에 있을 때(꼭지 위), 'bottom': 툴팁이 위에 있을 때(꼭지 아래)
  arrow?: 'top' | 'bottom';
}

const Tooltip = ({ text, color, position, arrow = 'top' }: TooltipProps) => {
  const colorMap = {
    red: 'text-red bg-[#FFF0F5]',
    primary: 'text-primary bg-green-8',
    white: 'text-dg bg-wh',
    black: 'text-wh bg-dg',
  };
  const horizontalMap = {
    left: 'left-[15px]',
    right: 'right-[21px]',
  };
  const arrowMap = {
    top: 'top-[-4px] border-t border-r',
    bottom: 'bottom-[-4px] border-b border-r',
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
        className={`border-lg w-2.5 h-2.5 rounded-[2px] rotate-[-45deg] ${colorMap[color]} absolute ${horizontalMap[position]} ${arrowMap[arrow]}`}
      />
    </div>
  );
};

export default Tooltip;
