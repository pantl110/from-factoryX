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
      className={`flex gap-2 items-center ${direction === 'col' ? 'flex-col' : 'justify-between'}`}
    >
      <h3 className="m-Body-2 text-sv">{label}</h3>
      {value && <p className="m-Body-2 text-bl">{value}</p>}
      {chip && chip}
    </div>
  );
};
