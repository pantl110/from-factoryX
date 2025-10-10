interface TabItemProps {
  text: string;
  isSelected: boolean;
  onClick: () => void;
}

const TabItem = ({ text, isSelected, onClick }: TabItemProps) => {
  return (
    <button
      className={`flex items-center justify-center h-[51px] py-4 px-3 w-fit shrink-0 ${isSelected ? 'border-b border-primary' : ''}`}
      onClick={onClick}
    >
      <h4
        className={`${isSelected ? 'm-Heading-5c text-primary' : 'm-Body-2 text-gr'}`}
      >
        {text}
      </h4>
    </button>
  );
};

export default TabItem;
