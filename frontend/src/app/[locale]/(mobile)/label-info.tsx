interface LabelInfoProps {
  label: string;
  value?: string;
  chip?: React.ReactNode;
  direction?: 'row' | 'col';
}

export const LabelInfo = ({
  label,
  value,
  chip,
  direction = 'row',
}: LabelInfoProps) => {
  return (
    <div
      className={`flex gap-2 ${direction === 'col' ? 'flex-col' : 'justify-between items-center'}`}
    >
      <h3 className="m-Body-2 text-sv">{label}</h3>
      <div className="flex items-center gap-2">
        {chip && chip}
        {value && <p className="m-Body-2 text-bl">{value}</p>}
      </div>
    </div>
  );
};
