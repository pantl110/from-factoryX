import { ReactNode } from 'react';

interface SelectableTableRowProps {
  isSelected: boolean;
  onClick?: () => void;
  children: ReactNode;
}

const SelectableTableRow = ({
  isSelected,
  onClick,
  children,
}: SelectableTableRowProps) => {
  return (
    <div
      className={`flex items-center h-14 w-full text-bl Me_Body-3 transition-colors duration-200 cursor-pointer ${
        isSelected
          ? 'border border-primary bg-green-8'
          : 'border-b border-lg hover:bg-bg'
      }`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick?.();
      }}
    >
      {children}
    </div>
  );
};

export default SelectableTableRow;
