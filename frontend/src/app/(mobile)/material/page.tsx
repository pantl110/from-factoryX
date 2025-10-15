'use client';

import { useRouter } from 'next/navigation';
import Topbar from '../topbar';
import MaterialInfo from './material-info';
import StockInfo from './stock-info';

const MaterialPage = () => {
  const router = useRouter();
  return (
    <div className="pb-8">
      <Topbar title="원자재 A" onBackClick={() => router.back()} />
      <MaterialInfo />
      <div className="h-2 bg-bg" />
      <StockInfo />
      {/* <div className="h-2 bg-bg" /> */}
    </div>
  );
};

export default MaterialPage;
