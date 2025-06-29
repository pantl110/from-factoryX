import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useState } from "react";

interface InputDatepickerProps {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  showError?: boolean;
  inputRef?: React.RefObject<HTMLInputElement>;
  onKeyDown?: (e: React.KeyboardEvent<HTMLElement>) => void;
}

const InputDatepicker = ({
  label,
  value,
  onChange,
  placeholder = "연도-월-일",
  required,
  showError = false,
  inputRef,
  onKeyDown,
}: InputDatepickerProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    value ? new Date(value) : null,
  );

  const handleChange = (date: Date | null) => {
    setSelectedDate(date);
    onChange?.(date ? date.toISOString().slice(0, 10) : "");
  };

  const hasError = showError && required && (!value || value.trim() === "");

  return (
    <div className="flex flex-col gap-2 w-full">
      <style>{`
        .react-datepicker-wrapper { width: 100% !important; display: block !important; }
        .react-datepicker__input-container { width: 100%; }
        .react-datepicker-popper,
        .react-datepicker {
          display: flex !important;
          justify-content: center !important;
          min-width: 100% !important;
          /* width: 100% !important; */
          /* max-width: 100% !important; */
        }
        .react-datepicker__month-container {
          margin: 0 auto !important;
        }
        .react-datepicker__header {
          width: 100% !important;
          background-color: transparent !important;
          border-bottom: 1px solid #e4e4e7 !important;
          text-align: center;
        }
        .react-datepicker__current-month,
        .react-datepicker__month-year {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
        }
        .react-datepicker__month-container {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .react-datepicker__month {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
        }
        .react-datepicker__day-names,
        .react-datepicker__week {
          display: flex;
          justify-content: center;
          width: 100%;
        }
      `}</style>

      {label && (
        <div className="flex items-center gap-1 h-5">
          <label className="Me_Body-1 text-dg">{label}</label>
          {required && <span className="text-primary">*</span>}
        </div>
      )}
      <div
        className="relative w-full flex items-center justify-center"
        ref={inputRef}
      >
        <DatePicker
          value={value}
          selected={selectedDate}
          onKeyDown={onKeyDown}
          onChange={handleChange}
          dateFormat="yyyy-MM-dd"
          placeholderText={placeholder}
          className={`w-full h-12 min-h-9 rounded px-3 Re_Body-1 placeholder:text-sv outline-none border transition-colors duration-200
          ${
            hasError
              ? "border-red hover:border-primary focus:border-primary focus:text-bl"
              : "border-[#e4e4e7] hover:border-primary focus:border-primary focus:text-bl"
          }
          ${!value ? "text-sv" : "text-bl"}
        `}
          calendarClassName="w-full"
          popperClassName="w-full"
        />
      </div>
    </div>
  );
};

export default InputDatepicker;
