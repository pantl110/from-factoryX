import { usePathname, useRouter } from '@/i18n/navigation';
import { CaretRight } from '@phosphor-icons/react';
import {
  SettingTabType,
  SettingChipType,
  StockTabType,
} from '@/components/top-bar/types';
import usePageStatusStore, { PageStatusModel } from '@/store/page-status-store';
import { locales } from '@/i18n/config';
import { useTranslations } from 'next-intl';

interface TopBarCrumbProps {
  stockTab?: StockTabType;
  settingTab?: SettingTabType;
  settingChip?: SettingChipType;
}

const TopBarCrumb = ({
  stockTab,
  settingTab,
  settingChip,
}: TopBarCrumbProps) => {
  const tNav = useTranslations('navigation');
  const tSetting = useTranslations('setting');
  const pathname = usePathname();
  const router = useRouter();

  const crumbHrefMap: Record<string, string> = {
    dashboard: '/dashboard',
  };
  const allCrumbs = pathname.split('/').filter(Boolean);

  const getCrumbName = (crumb: string): string => {
    const crumbMap: Record<string, () => string> = {
      dashboard: () => tNav('dashboard'),
      'profit-detail': () => tNav('profitDetail'),
      project: () => tNav('project'),
      completed: () => tNav('projectDropdown.completed'),
      process: () => tNav('projectDropdown.process'),
      production: () => tNav('production'),
      quotation: () => tNav('quotation'),
      stock: () => tNav('stock'),
      product: () => tNav('product'),
      material: () => tNav('material'),
      tax: () => tNav('tax'),
      list: () => tNav('taxDropdown.list'),
      draft: () => tNav('taxDropdown.draft'),
      document: () => tNav('document'),
      setting: () => tNav('setting'),
      general: () => tSetting('systemSetting.chips.general'),
      permission: () => tSetting('systemSetting.chips.permission'),
      subscription: () => tSetting('systemSetting.chips.subscription'),
      equipment: () => tSetting('masterData.chips.facility'),
      client: () => tSetting('masterData.chips.client'),
    };

    return crumbMap[crumb]?.() || crumb;
  };

  // 첫 번째 요소가 locale인 경우 제외
  const crumbs =
    allCrumbs.length > 0 &&
    locales.includes(allCrumbs[0] as (typeof locales)[number])
      ? allCrumbs.slice(1)
      : allCrumbs;

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
    if (
      projectStatusData?.status === 'completed' ||
      projectStatusData?.status === 'suspended'
    ) {
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
      finalCrumbs = ['setting', 'system'];
      if (
        settingChip &&
        ['general', 'permission', 'subscription'].includes(settingChip)
      ) {
        finalCrumbs.push(settingChip);
      }
    } else if (settingTab === 'master') {
      finalCrumbs = ['setting', 'master'];
      if (settingChip && ['equipment', 'client'].includes(settingChip)) {
        finalCrumbs.push(settingChip);
      }
    }
  }

  return (
    <div className="flex items-center gap-1">
      {finalCrumbs.map((crumb, idx) => {
        let displayText: string;
        if (crumb === 'system') {
          displayText = tSetting('tabs.system');
        } else if (crumb === 'master') {
          displayText = tSetting('tabs.master');
        } else {
          displayText = getCrumbName(crumb);
        }

        const href = crumbHrefMap[crumb];
        const isLast = idx === finalCrumbs.length - 1;

        return (
          <div key={idx} className="flex items-center gap-1">
            {href && !isLast ? (
              <button
                type="button"
                onClick={() => router.push(href)}
                className="Re_Body-1 text-dg cursor-pointer hover:underline"
              >
                {displayText}
              </button>
            ) : (
              <p className="Re_Body-1 text-dg">{displayText}</p>
            )}
            {!isLast && <CaretRight size={16} className="text-[#8c8c8c]" />}
          </div>
        );
      })}
    </div>
  );
};

export default TopBarCrumb;
