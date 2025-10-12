interface LabelInfoProps {
  label: string;
  value: string;
  direction?: 'row' | 'col';
}

export const LabelInfo = ({
  label,
  value,
  direction = 'row',
}: LabelInfoProps) => {
  return (
    <div
      className={`flex gap-2 ${direction === 'col' ? 'flex-col' : 'justify-between'}`}
    >
      <h3 className="m-Body-2 text-sv">{label}</h3>
      <p className="m-Body-2 text-bl">{value}</p>
    </div>
  );
};
