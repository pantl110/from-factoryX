'use client';

import { useRouter } from 'next/navigation';
import Topbar from '../topbar';

const RopPage = () => {
  const router = useRouter();
  return (
    <div>
      <Topbar title="납기 상세 조회" onBackClick={() => router.back()} />
    </div>
  );
};

export default RopPage;
