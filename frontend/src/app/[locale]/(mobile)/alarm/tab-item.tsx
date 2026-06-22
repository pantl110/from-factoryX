interface TabItemProps {
  text: string;
  isSelected: boolean;
  onClick: () => void;
}

const TabItem = ({ text, isSelected, onClick }: TabItemProps) => {
  return (
    <button
      className="relative flex items-center justify-center h-[51px] py-4 px-3 w-fit shrink-0"
      onClick={onClick}
    >
      <h4
        className={`${isSelected ? 'm-Heading-5c text-primary' : 'm-Body-2 text-gr'}`}
      >
        {text}
      </h4>
      {isSelected && (
        <span className="absolute left-0 right-0 bottom-0 h-0.5 bg-primary" />
      )}
    </button>
  );
};

export default TabItem;
