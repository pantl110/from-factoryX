import { usePathname } from 'next/navigation';
import { CaretRight } from '@phosphor-icons/react';
import {
  SettingTabType,
  SettingChipType,
  StockTabType,
} from '@/components/top-bar/types';
import usePageStatusStore, { PageStatusModel } from '@/store/page-status-store';

const crumbNameMap: Record<string, string> = {
  dashboard: '대시보드',

  project: '프로젝트 관리',
  completed: '보관된 프로젝트',
  process: '진행 중인 프로젝트',

  production: '프로젝트 관리',
  return: '반품 관리',
  quotation: '프로젝트 관리',

  stock: '재고 관리',
  product: '품목',
  material: '원자재',

  tax: '세무/회계',
  list: '세금계산서 내역',
  draft: '세금계산서 임시보관함',
  receipt: '현금영수증',

  document: '문서함',

  setting: '설정',
  general: '일반',
  permission: '권한 설정',
  subscription: '구독 관리',
  equipment: '설비 관리',
  client: '거래처 정보',
};

interface TopBarCrumbProps {
  pageStatus: string;
  stockTab?: StockTabType;
  settingTab?: SettingTabType;
  settingChip?: SettingChipType;
}

const TopBarCrumb = ({
  pageStatus,
  stockTab,
  settingTab,
  settingChip,
}: TopBarCrumbProps) => {
  const pathname = usePathname();
  const crumbs = pathname.split('/').filter(Boolean);
  const projectStatusData = usePageStatusStore(
    (state: PageStatusModel) => state.projectStatusData
  );

  // production/숫자 경로 판별 & quotation 페이지인 경우
  const isProductionDetail =
    crumbs[0] === 'production' && crumbs[1] && /^\d+$/.test(crumbs[1]);
  const isQuotation = crumbs[0] === 'quotation';

  let companyName: string | undefined;
  if (isProductionDetail || isQuotation) {
    // projectStatusData의 견적서 정보에서 클라이언트 이름 가져오기
    if (projectStatusData?.quotations?.[0]?.client_info?.name) {
      companyName = projectStatusData.quotations[0].client_info.name;
    }
  }

  let finalCrumbs: string[] = crumbs;
  if (isProductionDetail || isQuotation) {
    if (pageStatus === '완료' || pageStatus === '프로젝트 완료') {
      finalCrumbs = ['project', 'completed'];
    } else {
      finalCrumbs = ['project', 'process'];
    }
    if (companyName) finalCrumbs.push(companyName);
  }

  // stock 페이지인 경우 탭 상태 추가
  if (crumbs[0] === 'stock' && stockTab) {
    finalCrumbs = ['stock', stockTab];
  }

  // 설정 페이지인 경우 탭과 칩 상태 추가
  if (crumbs[0] === 'setting') {
    if (settingTab === 'system') {
      finalCrumbs = ['setting', '시스템 설정'];
      if (
        settingChip &&
        ['general', 'permission', 'subscription'].includes(settingChip)
      ) {
        finalCrumbs.push(crumbNameMap[settingChip] || settingChip);
      }
    } else if (settingTab === 'master') {
      finalCrumbs = ['setting', '마스터 데이터 관리'];
      if (settingChip && ['equipment', 'client'].includes(settingChip)) {
        finalCrumbs.push(crumbNameMap[settingChip] || settingChip);
      }
    }
  }

  return (
    <div className="flex items-center gap-1">
      {finalCrumbs.map((crumb, idx) => (
        <div key={idx} className="flex items-center gap-1">
          <p className="Re_Body-1 text-dg">{crumbNameMap[crumb] || crumb}</p>
          {idx < finalCrumbs.length - 1 && (
            <CaretRight size={16} className="text-[#8c8c8c]" />
          )}
        </div>
      ))}
    </div>
  );
};

export default TopBarCrumb;
