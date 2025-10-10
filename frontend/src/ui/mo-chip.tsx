interface MoChipProps {
  text: string;
  variant:
    | 'primary'
    | 'secondary'
    | 'red'
    | 'red-secondary'
    | 'orange'
    | 'purple'
    | 'outline'
    | 'outline-blue'
    | 'outline-red';
  info?: boolean;
}

const MoChip = ({ text, variant, info = false }: MoChipProps) => {
  const getVariant = (variant: MoChipProps['variant']) => {
    switch (variant) {
      case 'primary':
        return 'bg-primary text-wh';
      case 'secondary':
        return 'bg-primary-8 text-primary';
      case 'red':
        return 'bg-red text-wh';
      case 'red-secondary':
        return 'bg-red-8 text-red';
      case 'orange':
        return 'bg-orange-8 text-orange';
      case 'purple':
        return 'bg-purple-8 text-purple';
      case 'outline':
        return 'bg-wh text-dg border border-lg';
      case 'outline-blue':
        return 'bg-wh text-primary border border-lg';
      case 'outline-red':
        return 'bg-wh text-red border border-lg';
    }
  };
  return (
    <div
      className={`rounded-full w-fit ${getVariant(variant)} ${info ? 'px-2 py-0.5 m-Info-Me' : 'px-2.5 py-1 m-Body-4'}`}
    >
      {text}
    </div>
  );
};

export default MoChip;
