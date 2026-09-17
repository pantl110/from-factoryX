'use client';

import { CaretDown } from '@phosphor-icons/react';
import Dropdown from '@/ui/dropdown/dropdown';
import DropdownItem from '@/ui/dropdown/dropdown-item';
import MiniBtn from '@/ui/mini-btn';
import { useState } from 'react';

interface ButtonSelectOptionModel<T extends string> {
  value: T;
  label: string;
}

interface ButtonSelectDropdownProps<T extends string> {
  ariaLabel: string;
  value: T;
  options: readonly ButtonSelectOptionModel<T>[];
  onChange: (value: T) => void;
  width?: string;
  height?: string;
  padding?: string;
  textStyle?: string;
  className?: string;
  disabled?: boolean;
}

const ButtonSelectDropdown = <T extends string>({
  ariaLabel,
  value,
  options,
  onChange,
  width = 'w-[120px]',
  height = 'h-10',
  padding = 'px-4',
  textStyle = 'Me_Body-3',
  className = '',
  disabled = false,
}: ButtonSelectDropdownProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption =
    options.find((option) => option.value === value) ?? options[0];

  return (
    <div className={`relative ${className}`}>
      <MiniBtn
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        variant="outline"
        text={selectedOption.label}
        icon={CaretDown}
        iconPosition="right"
        justifyBetween
        width={width}
        height={height}
        padding={padding}
        textStyle={textStyle}
        disabled={disabled}
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
      />
      {isOpen && !disabled && (
        <div className="absolute left-0 top-full z-40 mt-2 w-full">
          <Dropdown onClose={() => setIsOpen(false)} width={width} maxHeight="">
            {options.map((option) => (
              <DropdownItem
                key={option.value || 'all'}
                text={option.label}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              />
            ))}
          </Dropdown>
        </div>
      )}
    </div>
  );
};

export default ButtonSelectDropdown;
