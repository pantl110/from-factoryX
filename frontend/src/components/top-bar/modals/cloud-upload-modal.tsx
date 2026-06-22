'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import Modal from '@/ui/modal/modal';
import MiniBtn from '@/ui/mini-btn';
import DropzoneArea from '@/ui/dropzone-area';
import { ClientResponseModel } from '@/types/data-model';
import { ClientNameDropdown } from '@/ui/dropdown/client-name-dropdown';
import SearchInput from '@/ui/search-input';
import IconBtn from '@/ui/icon-btn';
import { X } from '@phosphor-icons/react';
import Spinner from '@/ui/spinner';

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
  const [, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [hasFiles, setHasFiles] = useState(false);
  const dropzoneFilesRef = useRef<File[]>([]);

  // 파일 크기 포맷팅 함수 (향후 표시용으로 사용 가능)
  const _formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // 거래처 선택 핸들러
  const handleClientSelect = (client: ClientResponseModel) => {
    setSelectedClient(client);
    setClientSearchTerm(client.name);
    setIsClientDropdownOpen(false);
  };

  // 파일 선택 핸들러
  const handleFileUpload = (hasFilesSelected: boolean) => {
    setHasFiles(hasFilesSelected);
  };

  // DropzoneArea에서 파일이 선택되었을 때
  const handleFilesSelected = (selectedFiles: File[]) => {
    dropzoneFilesRef.current = selectedFiles;
    setFiles(selectedFiles);
    setHasFiles(selectedFiles.length > 0);
  };

  // 업로드 핸들러
  const handleUpload = async () => {
    const selectedFiles = dropzoneFilesRef.current;
    if (selectedFiles.length === 0) return;

    // 거래처 클라우드 선택 시 거래처가 선택되지 않았으면 업로드 불가
    if (uploadTarget === 'client' && !selectedClient) {
      alert('거래처를 선택해주세요.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // TODO: 실제 업로드 API 호출
      // 현재는 시뮬레이션
      for (let i = 0; i < selectedFiles.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        setUploadProgress(((i + 1) / selectedFiles.length) * 100);
      }

      // 업로드 완료 후 모달 닫기
      setTimeout(() => {
        onClose();
        // 상태 초기화
        setFiles([]);
        setHasFiles(false);
        setIsUploading(false);
        setUploadProgress(0);
        setSelectedClient(null);
        setClientSearchTerm('');
        setUploadTarget('factory');
      }, 500);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('업로드에 실패했습니다.');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // 모달 닫기 시 상태 초기화
  const handleClose = () => {
    setFiles([]);
    setHasFiles(false);
    setIsUploading(false);
    setUploadProgress(0);
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
      title="파일 업로드"
      subtitle={t('subtitle')}
      scroll={true}
    >
      <div className="mt-4 mx-6 pb-6 flex flex-col">
        {/* 1단계: 업로드 대상 선택 */}
        <div className="flex flex-col gap-3">
          <h4 className="Heading-4 text-dg">업로드 위치</h4>
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
                <h5 className="Heading-5 text-dg mb-1">내부 자료실</h5>
                <p className="Re_Body-2 text-gr">내부 자료실에 저장됩니다</p>
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
                  <h5 className="Heading-5 text-dg mb-1">거래처 자료실</h5>
                  <p className="Re_Body-2 text-gr">
                    선택한 거래처의 자료실에 저장됩니다
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
                          placeholder="거래처를 검색하세요"
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
        {!isUploading && (
          <div className="flex flex-col gap-3 mt-5">
            <h4 className="Heading-4 text-dg">파일 선택</h4>
            <div className="max-h-[calc(85vh-536px)] overflow-y-auto">
              <DropzoneArea
                variant="default"
                onFileUpload={handleFileUpload}
                onComplete={handleFilesSelected}
                accept={undefined}
                hideUploadButton={true}
              />
            </div>
          </div>
        )}

        {/* 3단계: 업로드 진행 */}
        {isUploading && (
          <div className="flex flex-col gap-3">
            <h4 className="Heading-4 text-dg">업로드 중...</h4>
            <div className="flex flex-col gap-2">
              <div className="w-full bg-bg rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-center gap-2">
                <Spinner />
                <span className="Me_Body-2 text-gr">
                  {Math.round(uploadProgress)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 버튼 영역 */}
        {!isUploading && (
          <div className="flex justify-end gap-1.5 mt-5">
            <MiniBtn
              text={tCommon('cancel')}
              variant="gray"
              onClick={handleClose}
            />
            <MiniBtn
              text={tCommon('upload')}
              variant="primary"
              onClick={handleUpload}
              disabled={
                !hasFiles || (uploadTarget === 'client' && !selectedClient)
              }
            />
          </div>
        )}
      </div>
    </Modal>
  );
};

export default CloudUploadModal;
