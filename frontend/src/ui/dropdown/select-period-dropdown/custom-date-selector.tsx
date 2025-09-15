import { CalendarCheck } from '@phosphor-icons/react/dist/ssr';

interface CustomDateSelectorProps {
  customStartDate: string;
  customEndDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onDateAutoHyphen: (value: string, setter: (value: string) => void) => void;
  onCustomDateKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const CustomDateSelector = ({
  customStartDate,
  customEndDate,
  onStartDateChange,
  onEndDateChange,
  onDateAutoHyphen,
  onCustomDateKeyDown,
}: CustomDateSelectorProps) => {
  return (
    <div className="flex items-center px-3 h-9 gap-2 border border-lg rounded-lg">
      <CalendarCheck size={20} className="text-dg" />
      <input
        type="text"
        inputMode="numeric"
        placeholder="YYYY-MM-DD"
        className="Me_Body-1 text-dg border-none outline-none focus:outline-none w-fit"
        value={customStartDate}
        onChange={(e) => onDateAutoHyphen(e.target.value, onStartDateChange)}
        maxLength={10}
        size={(customStartDate || 'YYYY-MM-DDDD').length}
        onKeyDown={onCustomDateKeyDown}
      />
      <span className="mx-0">~</span>
      <input
        type="text"
        inputMode="numeric"
        placeholder="YYYY-MM-DD"
        className="Me_Body-1 text-dg border-none outline-none focus:outline-none w-fit"
        value={customEndDate}
        onChange={(e) => onDateAutoHyphen(e.target.value, onEndDateChange)}
        maxLength={10}
        size={(customEndDate || 'YYYY-MM-DDDD').length}
        onKeyDown={onCustomDateKeyDown}
      />
    </div>
  );
};

export default CustomDateSelector;
