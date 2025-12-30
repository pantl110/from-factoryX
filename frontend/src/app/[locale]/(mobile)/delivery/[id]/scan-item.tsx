import { MoBtn } from '@/ui';
import { useRouter, useParams } from 'next/navigation';

const ScanItem = () => {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const quotationProductId = params?.id || '';

  return (
    <div className="flex flex-col gap-3">
      <h5 className="m-Heading-5c">제품의 lot번호</h5>
      <MoBtn
        text="상세보기"
        variant="outline"
        width="w-full"
        big
        onClick={() => {
          router.push(`/delivery/${quotationProductId}/detail`);
        }}
      />
    </div>
  );
};

export default ScanItem;
