'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import usePageStatusStore from '@/store/page-status-store';
import SystemSetting from './system-setting';
import MasterData from './master-data';
import MiniBtn from '@/ui/mini-btn';
import { AddUnitModal } from './master-data/unit/modals/add-unit-modal';
import AddUnitDropdown from './master-data/unit/modals/add-unit-dropdown';

const SettingPageContent = () => {
  const t = useTranslations('setting');
  const { settingTab, setSettingTab, settingChip } = usePageStatusStore();

  // 페이지 진입 시마다 시스템 탭으로 초기화
  useEffect(() => {
    setSettingTab('system');
  }, [setSettingTab]);

  const [isAddUnitDropdownOpen, setIsAddUnitDropdownOpen] = useState(false);
  const [isAddUnitModalOpen, setIsAddUnitModalOpen] = useState(false);
  const [addUnitType, setAddUnitType] = useState<'material' | 'product' | null>(
    null
  );

  return (
    <>
      <div className="max-w-[1400px] min-w-[1200px]">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-8 mt-10 mx-10 border-b border-lg">
            <div className="flex items-center justify-between">
              <h1 className="Heading-1 text-bl">{t('title')}</h1>
              {settingTab === 'master' && settingChip === 'unit' && (
                <div className="relative">
                  <MiniBtn
                    text={t('masterData.unit.convert')}
                    variant="secondary"
                    onClick={() => setIsAddUnitDropdownOpen(true)}
                  />

                  {isAddUnitDropdownOpen && (
                    <div className="absolute top-full right-0 z-10 mt-2">
                      <AddUnitDropdown
                        onClose={() => setIsAddUnitDropdownOpen(false)}
                        onSelect={(type) => {
                          setAddUnitType(type);
                          setIsAddUnitDropdownOpen(false);
                          setIsAddUnitModalOpen(true);
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-4 Heading-3 mb-3">
              <button
                type="button"
                className={`cursor-pointer ${settingTab === 'system' ? 'text-dg' : 'text-gr'}`}
                onClick={() => setSettingTab('system')}
              >
                {t('tabs.system')}
              </button>
              <button
                type="button"
                className={`cursor-pointer ${settingTab === 'master' ? 'text-dg' : 'text-gr'}`}
                onClick={() => setSettingTab('master')}
              >
                {t('tabs.master')}
              </button>
            </div>
          </div>
          {settingTab === 'system' && <SystemSetting />}
          {settingTab === 'master' && <MasterData />}
        </div>
      </div>

      {/* 단위 추가 모달 */}
      {isAddUnitModalOpen && (
        <AddUnitModal
          onClose={() => setIsAddUnitModalOpen(false)}
          addUnitType={addUnitType as 'material' | 'product'}
        />
      )}
    </>
  );
};

export default SettingPageContent;
