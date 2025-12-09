'use client';

import React, { useCallback, useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import MiniBtn from './mini-btn';
import {
  Image,
  FilePdf,
  MicrosoftExcelLogo,
  File,
  X,
  WarningCircle,
} from '@phosphor-icons/react';
import { useToast } from '@/hooks';
import Toast from './toast';

interface DropzoneProps {
  variant?: 'default' | 'location';
  fileCount?: number;
  onClose?: () => void;
  onComplete?: (files: File[]) => void;
  accept?: Record<string, string[]>;
  onFileUpload?: (hasFiles: boolean) => void;
}

const DropzoneArea = ({
  variant = 'default',
  fileCount = 1,
  onClose,
  onComplete,
  accept,
  onFileUpload,
}: DropzoneProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isToastOpen, isVisible, showToast } = useToast();
  const [pendingFiles, setPendingFiles] = useState<File[] | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const currentCount = files.length;
      const availableSlots = fileCount - currentCount;
      let filesToAdd = acceptedFiles;
      const shouldShowToast = acceptedFiles.length > availableSlots;

      if (shouldShowToast) {
        showToast();
        filesToAdd = acceptedFiles.slice(0, availableSlots);
      }

      const newFiles = filesToAdd.filter(
        (file) => !files.some((f) => f.name === file.name)
      ); // 중복된 파일은 제외하고 새로운 파일만 추가

      // variant가 'location'이고 onComplete가 있으면 업로드 처리
      if (variant === 'location' && onComplete && newFiles.length > 0) {
        if (shouldShowToast) {
          // 토스트가 표시되는 경우 2000ms 후에 처리
          setPendingFiles(newFiles);
        } else {
          // 토스트가 없는 경우 바로 처리
          onComplete(newFiles);
          setFiles([]); // 파일 목록 초기화
        }
        return;
      }

      const updatedFiles = [...files, ...newFiles];
      setFiles(updatedFiles);
      onFileUpload?.(updatedFiles.length > 0);
    },
    [files, fileCount, onFileUpload, variant, onComplete, showToast]
  );

  const handleRemoveFile = (indexToRemove: number) => {
    const updatedFiles = files.filter((_, index) => index !== indexToRemove);
    setFiles(updatedFiles);
    onFileUpload?.(updatedFiles.length > 0);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(event.target.files || []);
    const currentCount = files.length;
    const availableSlots = fileCount - currentCount;
    let filesToAdd = newFiles;
    const shouldShowToast = newFiles.length > availableSlots;

    if (shouldShowToast) {
      showToast();
      filesToAdd = newFiles.slice(0, availableSlots);
    }

    const uniqueNewFiles = filesToAdd.filter(
      (file) => !files.some((f) => f.name === file.name)
    );

    // variant가 'location'이고 onComplete가 있으면 업로드 처리
    if (variant === 'location' && onComplete && uniqueNewFiles.length > 0) {
      if (shouldShowToast) {
        // 토스트가 표시되는 경우 2000ms 후에 처리
        setPendingFiles(uniqueNewFiles);
      } else {
        // 토스트가 없는 경우 바로 처리
        onComplete(uniqueNewFiles);
        setFiles([]); // 파일 목록 초기화
      }
      // input 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const updatedFiles = [...files, ...uniqueNewFiles];
    setFiles(updatedFiles);
    onFileUpload?.(updatedFiles.length > 0);
  };

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    noClick: true,
    onDrop,
    accept,
  });

  // pendingFiles가 설정되면 2000ms 후에 처리
  React.useEffect(() => {
    if (pendingFiles && onComplete && variant === 'location') {
      const timer = setTimeout(() => {
        onComplete(pendingFiles);
        setFiles([]);
        setPendingFiles(null);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [pendingFiles, onComplete, variant]);

  // 파일 유형별 아이콘, 텍스트 반환 함수
  const getFileTypeInfo = (type: string) => {
    if (type.startsWith('image/')) {
      return {
        icon: <Image size={32} className="text-primary" alt="" />,
        label: '이미지',
      };
    }
    if (type === 'application/pdf') {
      return {
        icon: <FilePdf size={32} className="text-primary" alt="" />,
        label: 'PDF',
      };
    }
    if (
      type === 'application/vnd.ms-excel' ||
      type ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      type === 'application/excel'
    ) {
      return {
        icon: <MicrosoftExcelLogo size={32} className="text-primary" alt="" />,
        label: '엑셀',
      };
    }
    return {
      icon: <File size={32} className="text-primary" alt="" />,
      label: '기타',
    };
  };

  return (
    <>
      {/* 파일 목록이 없을 때만 드래그 영역 표시 */}
      {files.length === 0 && (
        <div
          {...getRootProps()}
          className={`${variant === 'location' ? 'h-30' : 'h-60'} rounded-lg border-2 border-dashed ${variant === 'location' ? 'border-lg' : 'border-gr'} flex flex-col gap-2 justify-center items-center ${
            isDragActive
              ? 'bg-secondary transition-colors duration-200 border-primary'
              : ''
          }`}
        >
          {isDragActive ? (
            <>
              {/* 드래그 시 이미지 */}
              <Image
                className="text-primary w-[68px] h-[73px]"
                weight="fill"
                alt=""
              />
            </>
          ) : (
            <>
              {/* 기본 이미지 */}
              <input {...getInputProps()} />
              <p className="Me_Body-2 text-dg">
                파일을 끌어다 놓거나, 아래 버튼으로 업로드 할 수 있어요.{' '}
                {variant === 'location' ? '(최대 10장)' : ''}
              </p>
              <MiniBtn
                text="내 컴퓨터에서 선택"
                textColor="text-dg"
                bgColor="bg-wh"
                hoverColor="hover:bg-bg"
                borderColor="border-lg"
                type="button"
                onClick={open}
              />
            </>
          )}
        </div>
      )}

      {/* 파일 목록 렌더링 */}
      {files.length > 0 && (
        <>
          <ul className="list-disc gap-2.5 flex flex-col">
            {files.map((file, index) => (
              <li
                key={index}
                className="p-3 flex gap-3 border border-lg rounded-[4px] items-center"
              >
                <div className="w-10 h-10 rounded-[4px] border border-lg p-1">
                  {React.cloneElement(getFileTypeInfo(file.type).icon, {
                    alt: '',
                  })}
                </div>
                <div className="flex justify-between w-full items-center">
                  <div className="flex flex-col">
                    <p className="Me_Body-2 text-dg">{file.name}</p>
                    <p className="Re_Body-1 text-gr">
                      {getFileTypeInfo(file.type).label}
                    </p>
                  </div>
                  <button
                    className="w-9 h-9 hover:bg-bg rounded-[8px] flex justify-center items-center"
                    onClick={() => handleRemoveFile(index)}
                  >
                    <X size={16} className="text-sv" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-end gap-[5px]">
            {fileCount > files.length && (
              <MiniBtn
                text="추가"
                textColor="text-sv"
                hoverColor="hover:bg-bg"
                onClick={() => {
                  if (fileInputRef.current && files.length < fileCount) {
                    fileInputRef.current.click();
                  }
                }}
                disabled={files.length >= fileCount}
              />
            )}

            {variant !== 'location' && (
              <MiniBtn
                text="업로드"
                textColor="text-wh"
                bgColor="bg-primary"
                hoverColor="hover:bg-primary-hover"
                onClick={onComplete ? () => onComplete(files) : onClose}
              />
            )}
          </div>
        </>
      )}

      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        multiple
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        // Prevent selecting more files if already 9
        disabled={files.length >= fileCount}
      />

      {/* 토스트 */}
      {isToastOpen && (
        <Toast
          icon={<WarningCircle size={20} className="text-red" />}
          text="파일은 최대 10개까지만 업로드할 수 있습니다."
          subtext=""
          type="red"
          isVisible={isVisible}
        />
      )}
    </>
  );
};

export default DropzoneArea;
