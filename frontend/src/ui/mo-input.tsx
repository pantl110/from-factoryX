interface MoInputProps {
  label?: string;
  value?: string;
  placeholder?: string;
}
const MoInput = ({ label, value, placeholder }: MoInputProps) => {
  return (
    <div className="flex flex-col gap-2">
      {label && <label className="m-Body-2 text-sv">{label}</label>}
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        className="h-12 min-h-9 rounded-[4px] px-3 flex items-center m-Body-2 placeholder:text-sv outline-none border border-lg hover:border-primary focus:border-primary focus:text-bl"
      />
    </div>
  );
};

export default MoInput;
