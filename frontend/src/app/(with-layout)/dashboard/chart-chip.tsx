import { TrendUpIcon, TrendDownIcon } from "@phosphor-icons/react/dist/ssr";

interface ChartChipProps {
  up: boolean;
}

const ChartChip = ({ up }: ChartChipProps) => {
  return (
    <div className="py-1 px-2 rounded-xl bg-primary-8">
      <div className="flex gap-1 items-center">
        <div className={`w-4 h-4 ${up ? "text-red-500" : "text-primary"}`}>
          {up ? <TrendUpIcon size={16} /> : <TrendDownIcon size={16} />}
        </div>
        <p className={`Heading-5 ${up ? "text-red-500" : "text-primary"}`}>
          90%
        </p>
      </div>
    </div>
  );
};

export default ChartChip;
