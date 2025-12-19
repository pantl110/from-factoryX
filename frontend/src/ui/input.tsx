'use client';

import {
  CaretDown,
  EyeIcon,
  EyeSlashIcon,
} from '@phosphor-icons/react/dist/ssr';
import { useState, forwardRef, useMemo, useEffect, useRef } from 'react';
import TextareaAutosize from 'react-textarea-autosize';

interface InputProps {
  label?: string;
  value?: string | number | readonly string[];
  onChange?: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  placeholder?: string;
  required?: boolean;
  type?: HTMLInputElement['type'];
  disabled?: boolean;
  isShowPasswordToggle?: boolean;
  showError?: boolean;
  errorMessage?: string;
  message?: string;
  inputRef?: React.RefObject<HTMLInputElement | HTMLTextAreaElement>;
  onKeyDown?: (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onFocus?: (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onBlur?: (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  name?: string;
  disabledSetting?: boolean;
  disabledReadOnly?: boolean;
  step?: string;
  className?: string;
  button?: boolean;
  onClickButton?: () => void;
  textarea?: boolean;
  minRows?: number;
}

const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(
  (
    {
      label,
      value,
      onChange,
      placeholder = '검색어를 입력하세요.',
      required,
      type = 'text',
      disabled = false,
      isShowPasswordToggle = false,
      showError = false,
      errorMessage,
      message,
      inputRef,
      onKeyDown,
      onFocus,
      onBlur,
      name,
      disabledSetting = false,
      disabledReadOnly = false,
      step,
      className,
      button = false,
      onClickButton,
      textarea = false,
      minRows = 3,
    },
    ref
  ) => {
    const [isShowPassword, setisShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    const togglePasswordVisibility = () => {
      setisShowPassword(!isShowPassword);
    };

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

    const inputClassName = useMemo(() => {
      let className = textarea
        ? 'w-full rounded px-3 py-3 Re_Body-1 placeholder:text-sv outline-none transition-colors duration-200 ease-in-out resize-none'
        : 'w-full h-12 min-h-9 rounded px-3 Re_Body-1 placeholder:text-sv outline-none transition-colors duration-200 ease-in-out';

      if (!textarea && type === 'number') {
        className +=
          ' appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';
      }

      if (disabled) {
        className += ' bg-bg text-dg border border-lg';
      } else if (disabledSetting || disabledReadOnly) {
        className += disabledSetting
          ? ' text-sv border border-lg '
          : ' text-bl border border-lg ';
      } else if (showError) {
        const borderClass = textarea
          ? ' border'
          : ' border border-red hover:border-primary focus:border-primary';
        className += borderClass + ' focus:text-bl';
      } else {
        const borderClass = textarea
          ? ' border'
          : ' border border-lg hover:border-primary focus:border-primary';
        className += borderClass + ' focus:text-bl';
      }

      if (!textarea && type === 'date') {
        className += !value ? ' text-sv' : ' text-bl';
      }

      return className;
    }, [
      textarea,
      type,
      disabled,
      disabledSetting,
      disabledReadOnly,
      showError,
      value,
    ]);

    const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      if (!textarea && type === 'number') {
        // 소수점 입력 허용
        e.target.value = e.target.value.replace(/[^0-9.]/g, '');
        // 소수점이 여러 개 입력되는 것을 방지
        const parts = e.target.value.split('.');
        if (parts.length > 2) {
          e.target.value = parts[0] + '.' + parts.slice(1).join('');
        }
      }
      if (onChange) {
        onChange(e);
      }
    };
    const handleFocus = (
      e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      // textarea의 경우 useEffect의 DOM 이벤트 리스너가 처리하므로 여기서는 onFocus만 호출
      if (onFocus) {
        onFocus(e);
      }
    };

    const handleBlur = (
      e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      // textarea의 경우 useEffect의 DOM 이벤트 리스너가 처리하므로 여기서는 onBlur만 호출
      if (onBlur) {
        onBlur(e);
      }
    };

    return (
      <div className="flex flex-col gap-2 w-full">
        {label && (
          <div className="flex items-center gap-1 h-5">
            <label className="Heading-5 text-sv">{label}</label>
            {required && <span className="Heading-5 text-primary">*</span>}
          </div>
        )}

        {button ? (
          <button
            type="button"
            onClick={onClickButton}
            className="w-full h-12 min-h-9 rounded px-3 Re_Body-1 border border-lg hover:border-primary flex items-center justify-between transition-colors duration-200 ease-in-out"
          >
            <span className={`Re_Body-1 ${value ? 'text-dg' : 'text-sv'}`}>
              {value || placeholder}
            </span>
            <CaretDown size={20} className="text-sv" />
          </button>
        ) : textarea ? (
          <div className="relative">
            <TextareaAutosize
              ref={(node) => {
                textareaRef.current = node;
                if (ref) {
                  if (typeof ref === 'function') {
                    ref(node);
                  } else {
                    (
                      ref as React.MutableRefObject<
                        HTMLInputElement | HTMLTextAreaElement | null
                      >
                    ).current = node;
                  }
                }
                if (inputRef && node) {
                  (
                    inputRef as React.MutableRefObject<
                      HTMLInputElement | HTMLTextAreaElement | null
                    >
                  ).current = node;
                }
              }}
              name={name}
              value={value}
              onChange={handleChange}
              onKeyDown={onKeyDown}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder={placeholder}
              disabled={disabled || disabledSetting || disabledReadOnly}
              className={`${inputClassName} ${className ?? ''}`}
              style={{
                borderColor:
                  disabled || disabledSetting || disabledReadOnly
                    ? undefined
                    : showError
                      ? isFocused
                        ? '#016fee'
                        : '#f31260'
                      : isFocused
                        ? '#016fee'
                        : '#e3e3e3',
              }}
              minRows={minRows}
            />
          </div>
        ) : (
          <div className="relative">
            <input
              ref={
                (ref as React.RefObject<HTMLInputElement>) ||
                (inputRef as React.RefObject<HTMLInputElement>)
              }
              name={name}
              type={
                isShowPasswordToggle
                  ? isShowPassword
                    ? 'text'
                    : 'password'
                  : type
              }
              value={value}
              onChange={handleChange}
              onKeyDown={onKeyDown}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder={placeholder}
              disabled={disabled || disabledSetting || disabledReadOnly}
              className={`${inputClassName} ${className ?? ''}`}
              onWheel={
                type === 'number' ? (e) => e.preventDefault() : undefined
              }
              pattern={type === 'number' ? '[0-9.]*' : undefined}
              step={type === 'number' ? step || '0.1' : undefined}
            />

            {isShowPasswordToggle && (
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dg hover:text-primary transition-colors duration-200 ease-in-out"
              >
                {isShowPassword ? (
                  <EyeSlashIcon size={20} className="text-sv" />
                ) : (
                  <EyeIcon size={20} className="text-sv" />
                )}
              </button>
            )}
          </div>
        )}

        {errorMessage && <p className="text-red Re_Body-1">{errorMessage}</p>}
        {message && <p className="text-sv Re_Body-1">{message}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
