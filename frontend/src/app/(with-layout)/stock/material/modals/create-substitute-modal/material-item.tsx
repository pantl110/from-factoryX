import Checkbox from '@/ui/checkbox';

const MaterialItem = () => {
  return (
    <div className="flex items-center h-14 border-b border-lg transition-colors duration-200 ease-in-out Me_Body-1 cursor-default">
      <Checkbox isChecked={false} onToggle={() => {}} />
      <p className="flex-1 px-3 text-dg">자재명</p>
      <p className="flex-1 px-3 text-dg">자재코드</p>
      <p className="flex-1 px-3 text-dg">규격</p>
      <p className="flex-1 px-3 text-dg">단위</p>
    </div>
  );
};

export default MaterialItem;
