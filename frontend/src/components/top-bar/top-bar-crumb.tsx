import { usePathname, useRouter } from 'next/navigation';
import { CaretRight } from '@phosphor-icons/react';
import { projectData } from '@/mocks/project-data';
import {
  ProductionTabType,
  SettingTabType,
  SettingChipType,
  StockTabType,
} from '@/components/top-bar/types';

const crumbNameMap: Record<string, string> = {
  dashboard: '대시보드',

  project: '프로젝트 관리',
  completed: '보관된 프로젝트',
  process: '진행 중인 프로젝트',

  production: '프로젝트 관리',
  return: '반품 관리',
  // quotation: "프로젝트 관리",

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
  productionTab?: ProductionTabType;
  stockTab?: StockTabType;
  settingTab?: SettingTabType;
  settingChip?: SettingChipType;
}

const TopBarCrumb = ({
  pageStatus,
  // productionTab,
  stockTab,
  settingTab,
  settingChip,
}: TopBarCrumbProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const crumbs = pathname.split('/').filter(Boolean);

  // production/숫자 경로 판별 & quotation 페이지인 경우
  const isProductionDetail =
    crumbs[0] === 'production' && crumbs[1] && /^\d+$/.test(crumbs[1]);
  const isQuotation = crumbs[0] === 'quotation';

  let companyName: string | undefined;
  if (isProductionDetail || isQuotation) {
    const project = projectData.find((p) => String(p.id) === crumbs[1]);
    companyName = project?.companyName;
  }

  let finalCrumbs: string[] = crumbs;
  if (isProductionDetail || isQuotation) {
    if (pageStatus === '완료' || pageStatus === '프로젝트 완료') {
      finalCrumbs = ['project', 'completed'];
    } else {
      finalCrumbs = ['project', 'process'];
    }
    if (companyName) finalCrumbs.push(companyName);
    // if (productionTab) finalCrumbs.push(productionTab);
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

  // 크럼브 클릭 핸들러
  const handleCrumbClick = (crumb: string, index: number) => {
    if (isProductionDetail || isQuotation) return; // production 상세 페이지와 quotation 페이지에서는 이동 불가
    if (finalCrumbs[0] === 'project' && index === 0) return; // project 첫 번째 크럼브는 클릭 불가

    // 경로 구성
    let targetPath = '';
    let tabParam = '';

    if (index === 0) {
      // 첫 번째 크럼브 (메인 페이지)
      targetPath = `/${crumb}`;
    } else {
      // 2번째 크럼브 처리
      if (finalCrumbs[0] === 'project') {
        // project는 실제 URL이 존재하므로 그대로 사용
        targetPath = `/${finalCrumbs[0]}/${finalCrumbs[1]}`;
      } else {
        // 다른 페이지들은 탭 파라미터 사용
        targetPath = `/${finalCrumbs[0]}`;

        if (finalCrumbs[0] === 'stock') {
          if (finalCrumbs[1] === 'product') tabParam = '?tab=product';
          else if (finalCrumbs[1] === 'material') tabParam = '?tab=material';
        } else if (finalCrumbs[0] === 'setting') {
          if (finalCrumbs[1] === '시스템 설정') tabParam = '?tab=system';
          else if (finalCrumbs[1] === '마스터 데이터 관리')
            tabParam = '?tab=master';
        }
      }
    }

    // 실제 경로로 변환 (project 제외)
    const actualPath = targetPath
      .replace('/stock/product', '/stock')
      .replace('/stock/material', '/stock')
      .replace('/setting/시스템 설정', '/setting')
      .replace('/setting/마스터 데이터 관리', '/setting');

    router.push(actualPath + tabParam);
  };

  return (
    <div className="flex items-center gap-1">
      {finalCrumbs.map((crumb, idx) => (
        <div key={idx} className="flex items-center gap-1">
          <p
            className={`Re_Body-1 ${
              isProductionDetail ||
              isQuotation ||
              (finalCrumbs[0] === 'project' && idx === 0)
                ? 'text-dg cursor-default'
                : 'text-dg cursor-pointer hover:text-primary transition-colors'
            }`}
            onClick={() => handleCrumbClick(crumb, idx)}
          >
            {crumbNameMap[crumb] || crumb}
          </p>
          {idx < finalCrumbs.length - 1 && (
            <CaretRight size={16} className="text-[#8c8c8c]" />
          )}
        </div>
      ))}
    </div>
  );
};

export default TopBarCrumb;
