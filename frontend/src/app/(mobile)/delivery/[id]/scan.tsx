import { MoBtn } from '@/ui';
import ScanItem from './scan-item';

const Scan = () => {
  return (
    <div className="px-7 py-8 flex flex-col gap-8">
      <h3 className="m-Heading-3-semibold">스캔하기</h3>
      <div className="flex flex-col gap-7">
        <MoBtn
          text="스캔하기"
          variant="secondary"
          width="w-full"
          big
          onClick={() => {}}
        />
        <div className="h-[1px] bg-bg" />
        <ScanItem />
      </div>
    </div>
  );
};

export default Scan;
