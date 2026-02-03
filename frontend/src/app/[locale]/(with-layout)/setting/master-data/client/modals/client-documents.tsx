'use client';

import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import MiniBtn from '@/ui/mini-btn';
import Spinner from '@/ui/spinner';
import {
  Image as ImageIcon,
  FilePdf,
  MicrosoftExcelLogo,
  File,
  DownloadSimple,
  Trash,
  Plus,
} from '@phosphor-icons/react';

export interface ClientDocumentItemModel {
  id: string | number;
  name: string;
  size: number; // bytes
  mimeType?: string;
  uploadedAt?: string;
  uploaderName?: string;
}

interface ClientDocumentsProps {
  documents: ClientDocumentItemModel[];
  isLoading?: boolean;
  isViewer: boolean;
  hasSubscription: () => boolean;
  // 업로드 버튼/드래그앤드랍으로 파일이 선택되었을 때
  onFilesSelected?: (files: File[]) => void;
  // 업로드 플로우 진입(모달 열기 등)이 필요할 때
  onUploadClick?: () => void;
  onDownloadClick?: (document: ClientDocumentItemModel) => void;
  onDeleteClick?: (document: ClientDocumentItemModel) => void;
}

const formatFileSizeLocal = (bytes: number): string => {
  if (!bytes || bytes <= 0) return '-';
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }
  const mb = kb / 1024;
  if (mb < 1024) {
    return `${mb.toFixed(1)} MB`;
  }
  const gb = mb / 1024;
  return `${gb.toFixed(1)} GB`;
};

const getFileTypeInfo = (name: string, mimeType?: string) => {
  const ext = name.split('.').pop()?.toLowerCase();

  if (
    mimeType?.startsWith('image/') ||
    ext === 'jpg' ||
    ext === 'jpeg' ||
    ext === 'png'
  ) {
    return {
      icon: <ImageIcon size={20} className="text-primary" aria-hidden />,
      labelKey: 'image' as const,
    };
  }

  if (mimeType === 'application/pdf' || ext === 'pdf') {
    return {
      icon: <FilePdf size={20} className="text-primary" />,
      labelKey: 'pdf' as const,
    };
  }

  if (
    mimeType === 'application/vnd.ms-excel' ||
    mimeType === 'application/excel' ||
    mimeType ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    ext === 'xls' ||
    ext === 'xlsx'
  ) {
    return {
      icon: <MicrosoftExcelLogo size={20} className="text-primary" />,
      labelKey: 'excel' as const,
    };
  }

  return {
    icon: <File size={20} className="text-primary" />,
    labelKey: 'other' as const,
  };
};

export const ClientDocuments = ({
  documents,
  isLoading,
  isViewer,
  hasSubscription,
  onFilesSelected,
  onUploadClick,
  onDownloadClick,
  onDeleteClick,
}: ClientDocumentsProps) => {
  const tCommon = useTranslations('common');
  const tClient = useTranslations('setting.masterData.client.documents');
  const tDocument = useTranslations('document');
  const tDropzone = useTranslations('dropzone');

  const canUpload = !isViewer && hasSubscription();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFiles = (files: File[]) => {
    if (!files.length) return;
    onFilesSelected?.(files);
    onUploadClick?.();
  };

  const handleUploadButtonClick = () => {
    if (!canUpload) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!canUpload) return;
    const files = Array.from(event.target.files || []);
    handleFiles(files);
    // 같은 파일 다시 선택 가능하도록 초기화
    event.target.value = '';
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!canUpload) return;
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (!canUpload) return;
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    if (!canUpload) return;
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(event.dataTransfer.files || []);
    handleFiles(files);
  };

  return (
    <section className="flex flex-col gap-3 pb-8">
      <div className="flex items-center justify-between">
        <h3 className="Heading-3">{tClient('title')}</h3>

        {canUpload && (
          <MiniBtn
            text={tCommon('upload')}
            variant="secondary"
            icon={Plus}
            iconSize={18}
            iconColor="text-primary"
            onClick={handleUploadButtonClick}
          />
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40 border border-lg rounded-sm">
          <Spinner />
        </div>
      ) : documents.length === 0 ? (
        <div
          className={`h-40 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-3 px-4 text-center ${
            canUpload
              ? isDragOver
                ? 'border-primary bg-secondary'
                : 'border-lg'
              : 'border-lg bg-bg'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <p className="Me_Body-2 text-dg whitespace-pre-line">
            {tDropzone('dragAndDrop')}
          </p>
          {canUpload && (
            <MiniBtn
              text={tCommon('upload')}
              variant="secondary"
              onClick={handleUploadButtonClick}
            />
          )}
        </div>
      ) : (
        <div
          className={`border border-lg rounded-sm max-h-72 overflow-y-auto transition-colors ${
            canUpload && isDragOver ? 'bg-secondary border-primary' : ''
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="px-3 py-2 border-b border-lg bg-secondary/40 flex items-center justify-between">
            <p className="Re_Body-1 text-gr">
              {tDocument('title')} · {documents.length.toLocaleString()}
            </p>
          </div>

          <ul className="divide-y divide-lg">
            {documents.map((document) => {
              const { icon, labelKey } = getFileTypeInfo(
                document.name,
                document.mimeType
              );

              let typeLabel: string;
              if (labelKey === 'image') {
                typeLabel = tDropzone('fileTypes.image');
              } else if (labelKey === 'excel') {
                typeLabel = tDropzone('fileTypes.excel');
              } else if (labelKey === 'pdf') {
                typeLabel = 'PDF';
              } else {
                typeLabel = tDropzone('fileTypes.other');
              }

              return (
                <li
                  key={document.id}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-bg transition-colors"
                >
                  <div className="w-9 h-9 flex items-center justify-center rounded border border-lg bg-wh shrink-0">
                    {icon}
                  </div>

                  <div className="flex-1 flex flex-col gap-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <span
                        className="Me_Body-2 text-dg truncate"
                        title={document.name}
                      >
                        {document.name}
                      </span>
                      <span className="Re_Caption text-gr shrink-0">
                        {document.uploadedAt || '-'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-gr Re_Caption">
                      <span>{typeLabel}</span>
                      <span>·</span>
                      <span>{formatFileSizeLocal(document.size)}</span>
                      {document.uploaderName && (
                        <>
                          <span>·</span>
                          <span>{document.uploaderName}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-bg"
                      onClick={() => onDownloadClick?.(document)}
                      aria-label={tCommon('preview')}
                    >
                      <DownloadSimple size={18} className="text-sv" />
                    </button>
                    {canUpload && (
                      <button
                        type="button"
                        className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-bg"
                        onClick={() => onDeleteClick?.(document)}
                        aria-label={tCommon('delete')}
                      >
                        <Trash size={18} className="text-red" />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* 숨겨진 파일 입력 (Finder/Explorer 오픈용) */}
      {canUpload && (
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      )}
    </section>
  );
};

export default ClientDocuments;
