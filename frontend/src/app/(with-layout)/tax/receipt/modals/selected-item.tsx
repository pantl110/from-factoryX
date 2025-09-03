import { X } from '@phosphor-icons/react';

const SelectedItem = () => {
  return (
    <div className="flex items-center py-2 pr-1 pl-3 bg-wh border border-lg rounded-[8px]">
      <div className="flex-1 h-13 flex flex-col justify-between">
        <p className="Me_Body-1 text-dg">폴리 수지</p>
        <div className="flex gap-1 items-center">
          <p className="Re_Body-2 text-gr">규격</p>
          <div className="w-1 h-[60%] border-r border-lg" />
          <p className="Re_Body-2 text-gr">사용 수량 단위</p>
          <div className="w-1 h-[60%] border-r border-lg" />
          <p className="Re_Body-2 text-gr">금액</p>
        </div>
      </div>
      <button className="flex justify-center items-center w-9 h-9 hover:bg-bg rounded-[8px]">
        <X size={16} className="text-gr" />
      </button>
    </div>
  );
};

export default SelectedItem;
