'use client';

import { useState, useEffect, useRef } from 'react';
import TextareaAutosize from 'react-textarea-autosize';

interface MoInputProps {
  label?: string;
  value?: string;
  placeholder?: string;
  required?: boolean;
  textarea?: boolean;
  minRows?: number;
  maxRows?: number;
  onChange?: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onFocus?: (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onBlur?: (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
}
const MoInput = ({
  label,
  value,
  placeholder,
  required,
  textarea = false,
  minRows = 3,
  maxRows,
  onChange,
  onFocus,
  onBlur,
}: MoInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // textarea일 때 직접 DOM 이벤트 리스너 추가
  useEffect(() => {
    if (!textarea || !textareaRef.current) return;

    const textareaElement = textareaRef.current;

    const handleFocusEvent = () => {
      setIsFocused(true);
    };

    const handleBlurEvent = () => {
      setIsFocused(false);
    };

    textareaElement.addEventListener('focus', handleFocusEvent);
    textareaElement.addEventListener('blur', handleBlurEvent);

    return () => {
      textareaElement.removeEventListener('focus', handleFocusEvent);
      textareaElement.removeEventListener('blur', handleBlurEvent);
    };
  }, [textarea]);

  const handleFocus = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setIsFocused(true);
    if (onFocus) {
      onFocus(e);
    }
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setIsFocused(false);
    if (onBlur) {
      onBlur(e);
    }
  };

  const inputClassName = textarea
    ? 'w-full rounded-[4px] px-3 py-3 m-Body-2 placeholder:text-sv outline-none transition-colors duration-200 ease-in-out resize-none border'
    : 'w-full h-12 min-h-9 rounded-[4px] px-3 flex items-center m-Body-2 placeholder:text-sv outline-none transition-colors duration-200 ease-in-out border border-lg hover:border-primary focus:border-primary focus:text-bl';

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <div className="flex items-center gap-1 h-5">
          <label className="m-Body-2 text-sv">{label}</label>
          {required && <span className="m-Body-2 text-primary">*</span>}
        </div>
      )}
      {textarea ? (
        <div className="relative">
          <TextareaAutosize
            ref={(node) => {
              textareaRef.current = node;
            }}
            value={value}
            placeholder={placeholder}
            onChange={onChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            minRows={minRows}
            maxRows={maxRows}
            className={inputClassName}
            style={{
              borderColor: isFocused ? '#016fee' : '#e3e3e3',
              paddingTop: '12px',
              paddingBottom: '12px',
              overflow: 'hidden',
            }}
          />
        </div>
      ) : (
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={inputClassName}
        />
      )}
    </div>
  );
};

export default MoInput;
