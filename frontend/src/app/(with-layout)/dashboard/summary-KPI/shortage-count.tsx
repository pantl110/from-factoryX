import { useRouter } from 'next/navigation';
import { ShortageMaterialCountModel } from '@/app/(with-layout)/dashboard/type';

interface ShortageCountProps {
  shortageMaterialsCount: number;
}

const ShortageCount = ({ shortageMaterialsCount }: ShortageCountProps) => {
  const router = useRouter();

  return (
    shortageMaterialsCount !== undefined && (
      <div className="pt-5 pb-4 px-5 rounded-lg border border-lg h-[141px] shadow-[2px_2px_22px_rgba(0,0,0,0.1)] group">
        <div className="flex flex-col gap-1">
          <p className="Heading-4 text-sv">부족한 원자재 수</p>
          <div className="flex flex-col gap-1">
            <p className="Heading-1">
              {shortageMaterialsCount} <span>개</span>
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => {
                  router.push('/stock?tab=material');
                }}
                className="px-4 rounded-md Me_Body-1 text-dg border border-lg opacity-0 hover:bg-bg group-hover:opacity-100 transition-opacity duration-200"
              >
                부족한 자재 확인
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );
};

export default ShortageCount;
