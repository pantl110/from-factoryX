'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Modal from '@/ui/modal/modal';
import MiniBtn from '@/ui/mini-btn';
import DropzoneArea from '@/ui/dropzone-area';
import { ClientResponseModel } from '@/types/data-model';
import { ClientNameDropdown } from '@/ui/dropdown/client-name-dropdown';
import SearchInput from '@/ui/search-input';
import IconBtn from '@/ui/icon-btn';
import { X } from '@phosphor-icons/react';

interface CloudUploadModalProps {
  onClose: () => void;
}

type UploadTargetType = 'factory' | 'client';

const CloudUploadModal = ({ onClose }: CloudUploadModalProps) => {
  const t = useTranslations('cloudUpload');
  const tCommon = useTranslations('common');

  const [uploadTarget, setUploadTarget] = useState<UploadTargetType>('factory');
  const [selectedClient, setSelectedClient] =
    useState<ClientResponseModel | null>(null);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);

  // 거래처 선택 핸들러
  const handleClientSelect = (client: ClientResponseModel) => {
    setSelectedClient(client);
    setClientSearchTerm(client.name);
    setIsClientDropdownOpen(false);
  };

  // 모달 닫기 시 상태 초기화
  const handleClose = () => {
    setSelectedClient(null);
    setClientSearchTerm('');
    setUploadTarget('factory');
    onClose();
  };

  // 거래처 검색어 변경 핸들러
  const handleClientSearchChange = (value: string) => {
    setClientSearchTerm(value);
    if (value.length > 0) {
      setIsClientDropdownOpen(true);
    } else {
      setIsClientDropdownOpen(false);
      setSelectedClient(null);
    }
  };

  return (
    <Modal
      onClose={handleClose}
      width="w-[800px]"
      title={t('title')}
      subtitle={t('subtitle')}
      scroll={true}
    >
      <div className="mt-4 mx-6 pb-6 flex flex-col">
        <div
          className="mb-5 rounded-lg border border-primary bg-secondary p-4"
          role="status"
        >
          <p className="Me_Body-2 text-dg">{t('unavailableTitle')}</p>
          <p className="Re_Body-2 mt-1 text-gr">
            {t('unavailableDescription')}
          </p>
        </div>

        {/* 1단계: 업로드 대상 선택 */}
        <div className="flex flex-col gap-3">
          <h4 className="Heading-4 text-dg">{t('uploadLocation')}</h4>
          <div className="flex flex-col gap-3">
            {/* 공장 클라우드 카드 */}
            <div
              onClick={() => {
                setUploadTarget('factory');
                setSelectedClient(null);
                setClientSearchTerm('');
              }}
              className={`flex-1 p-4 border rounded-lg cursor-pointer transition-colors duration-200 ${
                uploadTarget === 'factory'
                  ? 'border border-primary bg-secondary'
                  : 'border border-lg hover:bg-bg'
              }`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setUploadTarget('factory');
                  setSelectedClient(null);
                  setClientSearchTerm('');
                }
              }}
            >
              <div className="flex flex-col">
                <h5 className="Heading-5 text-dg mb-1">
                  {t('internalRepository')}
                </h5>
                <p className="Re_Body-2 text-gr">
                  {t('internalRepositoryDesc')}
                </p>
              </div>
            </div>

            {/* 거래처 클라우드 카드 */}
            <div
              onClick={() => {
                if (uploadTarget !== 'client') {
                  setUploadTarget('client');
                }
              }}
              className={`cursor-pointer flex-1 border rounded-lg transition-colors duration-200 ${
                uploadTarget === 'client'
                  ? 'border border-primary'
                  : 'border border-lg hover:bg-bg'
              }`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (uploadTarget !== 'client') {
                    setUploadTarget('client');
                  }
                }
              }}
            >
              <div
                className={`p-4 rounded-[8px] ${uploadTarget === 'client' ? 'bg-secondary' : ''}`}
              >
                <div className="flex flex-col">
                  <h5 className="Heading-5 text-dg mb-1">
                    {t('clientRepository')}
                  </h5>
                  <p className="Re_Body-2 text-gr">
                    {t('clientRepositoryDesc')}
                  </p>
                </div>
              </div>

              {/* 거래처 선택 UI (카드 내부) */}
              {uploadTarget === 'client' && (
                <div
                  className="p-4 border-t border-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="relative">
                    {!selectedClient ? (
                      <>
                        <SearchInput
                          placeholder={t('searchClientPlaceholder')}
                          value={clientSearchTerm}
                          onChange={handleClientSearchChange}
                          onFocus={() => {
                            if (
                              clientSearchTerm &&
                              clientSearchTerm.length > 0
                            ) {
                              setIsClientDropdownOpen(true);
                            }
                          }}
                          onBlur={() =>
                            setTimeout(
                              () => setIsClientDropdownOpen(false),
                              150
                            )
                          }
                          width="w-full"
                        />
                        {isClientDropdownOpen && clientSearchTerm && (
                          <div className="absolute left-0 top-full z-10 w-full mt-1">
                            <ClientNameDropdown
                              searchTerm={clientSearchTerm}
                              onSelect={handleClientSelect}
                              onClose={() => {
                                setIsClientDropdownOpen(false);
                              }}
                              width="w-full"
                            />
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex justify-between items-center rounded-[8px]">
                        <p className="Me_body-1 text-dg">
                          {selectedClient.name}
                        </p>
                        <IconBtn
                          icon={X}
                          iconSize={16}
                          iconColor="text-gr"
                          onClick={(e) => {
                            if (e) {
                              e.stopPropagation();
                            }
                            setSelectedClient(null);
                            setClientSearchTerm('');
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2단계: 파일 선택 영역 */}
        <div className="flex flex-col gap-3 mt-5">
          <h4 className="Heading-4 text-dg">{t('selectFile')}</h4>
          <div className="max-h-[calc(85vh-536px)] overflow-y-auto">
            <DropzoneArea
              variant="default"
              accept={undefined}
              hideUploadButton={true}
            />
          </div>
        </div>

        {/* 버튼 영역 */}
        <div className="flex justify-end gap-1.5 mt-5">
          <MiniBtn
            text={tCommon('cancel')}
            variant="white"
            onClick={handleClose}
          />
          <MiniBtn
            text={t('unavailableButton')}
            variant="secondary"
            disabled={true}
          />
        </div>
      </div>
    </Modal>
  );
};

export default CloudUploadModal;
