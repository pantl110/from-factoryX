import { Square, Check } from '@phosphor-icons/react';

interface CheckboxProps {
  isChecked: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

const Checkbox = ({ isChecked, onToggle, disabled = false }: CheckboxProps) => {
  if (disabled) {
    return null;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onToggle();
  };

  return (
    <div
      className="flex items-center justify-center w-9 h-full cursor-pointer"
      onClick={handleClick}
    >
      <div className="w-5 h-5 relative pointer-events-none">
        <Square size={20} className={isChecked ? 'text-primary' : 'text-sv'} />
        {isChecked && (
          <Check
            size={12}
            weight="bold"
            className="z-10 text-primary absolute top-[3.8px] left-[3.8px]"
          />
        )}
      </div>
    </div>
  );
};

export default Checkbox;
