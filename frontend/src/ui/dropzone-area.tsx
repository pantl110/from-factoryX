import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import MiniBtn from "./mini-btn";
import {
  Image,
  FilePdf,
  MicrosoftExcelLogo,
  File,
} from "@phosphor-icons/react";

interface DropzoneProps {
  isMultiple?: boolean;
  onClose?: () => void;
  onComplete?: (files: File[]) => void;
}

const DropzoneArea = ({
  isMultiple = false,
  onClose,
  onComplete,
}: DropzoneProps) => {
  const [files, setFiles] = useState<File[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = acceptedFiles.filter(
        (file) => !files.some((f) => f.name === file.name),
      ); // 중복된 파일은 제외하고 새로운 파일만 추가
      setFiles((prev) => [...prev, ...newFiles]);
    },
    [files],
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    noClick: true,
    onDrop,
    multiple: isMultiple,
    // accept: {
    //   "image/*": [], // 이미지 허용
    //   "application/pdf": [], // PDF 허용
    //   "application/excel": [], // excel 허용
    // },
  });

  // 파일 유형별 아이콘, 텍스트 반환 함수
  const getFileTypeInfo = (type: string) => {
    if (type.startsWith("image/")) {
      return {
        icon: <Image size={32} className="text-primary" />,
        label: "이미지",
      };
    }
    if (type === "application/pdf") {
      return {
        icon: <FilePdf size={32} className="text-primary" />,
        label: "PDF",
      };
    }
    if (
      type === "application/vnd.ms-excel" ||
      type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      type === "application/excel"
    ) {
      return {
        icon: <MicrosoftExcelLogo size={32} className="text-primary" />,
        label: "엑셀",
      };
    }
    return {
      icon: <File size={32} className="text-primary" />,
      label: "기타",
    };
  };

  return (
    <>
      <div
        {...getRootProps()}
        className={`h-60 rounded-lg border-2 border-dashed border-gr flex flex-col gap-2 justify-center items-center ${
          isDragActive
            ? "bg-secondary transition-colors duration-200 border-primary"
            : ""
        }`}
      >
        {isDragActive ? (
          <>
            {/* 드래그 시 이미지 */}
            <Image className="text-primary w-[68px] h-[73px]" weight="fill" />
          </>
        ) : (
          <>
            {/* 기본 이미지 */}
            <input {...getInputProps()} />
            <p className="Me_Body-2 text-dg">
              파일을 끌어다 놓거나, 아래 버튼으로 업로드 할 수 있어요.
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

      {/* 파일 목록 렌더링 */}
      {files.length > 0 && (
        <ul className="mt-4 list-disc gap-2.5 flex flex-col">
          {files.map((file, index) => (
            <li
              key={index}
              className="p-3 flex gap-3 border border-lg rounded-[4px] items-center"
            >
              <div className="w-10 h-10 rounded-[4px] border border-lg p-1">
                {getFileTypeInfo(file.type).icon}
              </div>
              <div className="flex flex-col">
                <p className="Me_Body-2 text-dg">{file.name}</p>
                <p className="Re_Body-1 text-gr">
                  {getFileTypeInfo(file.type).label}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex justify-end">
        <MiniBtn
          text="완료"
          textColor="text-wh"
          bgColor="bg-primary"
          hoverColor="hover:bg-primary-hover"
          onClick={onComplete ? onComplete : onClose}
        />
      </div>
    </>
  );
};

export default DropzoneArea;
