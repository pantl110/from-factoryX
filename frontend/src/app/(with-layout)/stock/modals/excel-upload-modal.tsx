import Modal from '@/ui/modal/modal';
import DropzoneArea from '@/ui/dropzone-area';
import { useState } from 'react';
import { parseExcelFile, ExcelRowModel } from '@/utils/excel-parser';
import { ProductCreateExcelModel } from '@/types/data-model';
import Toast from '@/ui/toast';
import { WarningCircle } from '@phosphor-icons/react';
import { useToast, useCreateProduct, useCreateMaterial } from '@/hooks';
import Spinner from '@/ui/spinner';

interface ExcelUploadModalProps {
  onClose: () => void;
  type?: 'product' | 'material';
  onSuccess?: (hasDuplicates?: boolean) => void;
}

const ExcelUploadModal = ({
  onClose,
  type = 'product',
  onSuccess,
}: ExcelUploadModalProps) => {
  const [hasFiles, setHasFiles] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [subtext, setSubtext] = useState('다시 시도해주세요.');

  const { isToastOpen, isVisible, showToast } = useToast();
  const { createProduct } = useCreateProduct();
  const { createMaterial } = useCreateMaterial();

  const handleComplete = async (files: File[]) => {
    if (files && files.length > 0) {
      try {
        setIsProcessing(true);
        const file = files[0];
        const data = await parseExcelFile(file);

        // 파일 파싱 후 바로 제품 등록 처리
        await handleUpload(data);
      } catch (err) {
        // handleUpload에서 이미 에러 처리를 했으므로 여기서는 파일 파싱 에러만 처리
        if (err instanceof Error) {
          setSubtext(err.message + ' 파일을 확인 후 다시 시도해주세요.');
          setHasFiles(false);
          showToast();
        }
        // handleUpload의 에러는 handleUpload 내부에서 처리됨
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const onFileUpload = (hasFiles: boolean) => {
    setHasFiles(hasFiles);
  };

  const handleUpload = async (data: ExcelRowModel[]) => {
    const dataToProcess = data;

    try {
      // 숫자 추출 함수
      const extractNumber = (value: unknown): number => {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
          // 문자열에서 숫자만 추출 (소수점 포함)
          const match = value.match(/\d+\.?\d*/);
          return match ? parseFloat(match[0]) : 0;
        }
        return 0;
      };

      // 정수 필드는 반올림 처리 (버퍼 비율 제외)
      const extractRoundedInt = (value: unknown): number => {
        const num = extractNumber(value);
        return Math.round(num);
      };

      // 원본 데이터에서 비어있는 데이터가 있는지 확인 (모든 필드가 비어있는 행은 제외)
      const hasEmptyData = dataToProcess.some((row) => {
        const name = String(
          row[type === 'product' ? '제품명' : '자재명'] ?? ''
        );
        const code = String(
          row[type === 'product' ? '제품 코드' : '자재 코드'] ?? ''
        );
        const spec = String(row['규격'] ?? '');
        const unit = String(row['단위'] ?? '');

        // 모든 필드가 비어있으면 건너뛰기 (자재/제품에 따라 다른 기준)
        let isAllEmpty = false;
        if (type === 'material') {
          // 자재: 자재명, 자재 코드, 규격, 단위, 현재 재고, 최소 재고 모두 비어있어야 함
          const currentStock = String(row['현재 재고'] ?? '').trim();
          const minStock = String(row['최소 재고'] ?? '').trim();
          isAllEmpty =
            name.trim() === '' &&
            code.trim() === '' &&
            spec.trim() === '' &&
            unit.trim() === '' &&
            currentStock === '' &&
            minStock === '';
        } else {
          // 제품: 제품명, 제품 코드, 규격, 단위, 현재 재고, 평균 생산 시간(초), 버퍼 비율(%), 특이 사항 모두 비어있어야 함
          const currentStock = String(row['현재 재고'] ?? '').trim();
          const avgProductionTime = String(
            row['평균 생산 시간(초)'] ?? ''
          ).trim();
          const bufferRate = String(row['버퍼 비율(%)'] ?? '').trim();
          const note = String(row['특이 사항'] ?? '').trim();
          isAllEmpty =
            name.trim() === '' &&
            code.trim() === '' &&
            spec.trim() === '' &&
            unit.trim() === '' &&
            currentStock === '' &&
            avgProductionTime === '' &&
            bufferRate === '' &&
            note === '';
        }

        if (isAllEmpty) {
          return false; // 빈 행은 검증에서 제외
        }

        // 빈 행이 아닌 경우에만 필수 필드 검증
        return (
          name.trim() === '' ||
          code.trim() === '' ||
          unit.trim() === '' ||
          spec.trim() === ''
        );
      });

      // 비어있는 데이터가 있으면 토스트 표시하고 멈춤
      if (hasEmptyData) {
        setSubtext(
          type === 'product'
            ? '제품명, 제품 코드, 규격, 단위는 필수입니다. 모든 필수 항목을 확인해주세요.'
            : '자재명, 자재 코드, 규격, 단위는 필수입니다. 모든 필수 항목을 확인해주세요.'
        );
        showToast();
        return;
      }

      // 빈 행을 필터링하는 함수
      const isEmptyRow = (row: ExcelRowModel) => {
        const name = String(
          row[type === 'product' ? '제품명' : '자재명'] ?? ''
        ).trim();
        const code = String(
          row[type === 'product' ? '제품 코드' : '자재 코드'] ?? ''
        ).trim();
        const spec = String(row['규격'] ?? '').trim();
        const unit = String(row['단위'] ?? '').trim();

        if (type === 'material') {
          const currentStock = String(row['현재 재고'] ?? '').trim();
          const minStock = String(row['최소 재고'] ?? '').trim();
          return (
            name === '' &&
            code === '' &&
            spec === '' &&
            unit === '' &&
            currentStock === '' &&
            minStock === ''
          );
        } else {
          const currentStock = String(row['현재 재고'] ?? '').trim();
          const avgProductionTime = String(
            row['평균 생산 시간(초)'] ?? ''
          ).trim();
          const bufferRate = String(row['버퍼 비율(%)'] ?? '').trim();
          const note = String(row['특이 사항'] ?? '').trim();
          return (
            name === '' &&
            code === '' &&
            spec === '' &&
            unit === '' &&
            currentStock === '' &&
            avgProductionTime === '' &&
            bufferRate === '' &&
            note === ''
          );
        }
      };

      // 빈 행을 제외하고 엑셀 데이터를 ProductCreateExcelModel 형식으로 변환
      const productData = dataToProcess
        .filter((row) => !isEmptyRow(row))
        .map((row) => {
          const name = String(
            row[type === 'product' ? '제품명' : '자재명'] ?? ''
          ).trim();
          const code = String(
            row[type === 'product' ? '제품 코드' : '자재 코드'] ?? ''
          ).trim();
          const unit = String(row['단위'] ?? '').trim();
          const spec = String(row['규격'] ?? '').trim();
          const currentStock = extractRoundedInt(row['현재 재고']);
          const avgProductionTime =
            type === 'product'
              ? extractRoundedInt(row['평균 생산 시간(초)'])
              : null;
          const bufferRate =
            type === 'product' ? extractNumber(row['버퍼 비율(%)']) : null;
          const minStock =
            type === 'material' ? extractRoundedInt(row['최소 재고']) : null;

          return {
            name,
            code,
            unit,
            spec,
            ...(currentStock > 0 ? { current_stock: currentStock } : {}),
            ...(type === 'product' &&
            avgProductionTime !== null &&
            avgProductionTime > 0
              ? { average_production_time: avgProductionTime }
              : {}),
            ...(type === 'product'
              ? {
                  buffer_rate:
                    bufferRate !== null && bufferRate > 0
                      ? bufferRate / 100
                      : 0.1,
                }
              : {}),
            ...(type === 'material' && minStock !== null && minStock > 0
              ? { min_stock: minStock }
              : {}),
            ...(type === 'product' && row['특이 사항']
              ? { note: String(row['특이 사항']).trim() }
              : {}),
          };
        });

      const result =
        type === 'product'
          ? await createProduct(productData as ProductCreateExcelModel[])
          : await createMaterial(productData as ProductCreateExcelModel[]);

      if (result.success) {
        let message = '';
        if (type === 'product') {
          // 제품: result.message
          if (
            'message' in result &&
            typeof (result as { message?: unknown }).message === 'string'
          ) {
            message = (result as { message?: string }).message ?? '';
          }
        } else {
          // 자재: result.data.message
          const { data } = result as { data?: { message?: unknown } };
          const { message: dataMessage } = (data || {}) as {
            message?: unknown;
          };
          if (typeof dataMessage === 'string') {
            message = dataMessage;
          }
        }

        // 중복된 코드가 있다는 메시지가 포함되면 상위 컴포넌트에 알림
        if (message && message.includes('중복된')) {
          onClose();
          onSuccess?.(true); // 중복 코드가 있음을 알림
        } else {
          onClose();
          onSuccess?.(false); // 중복 코드가 없음을 알림
        }
      } else {
        if (result.error.includes('이미 존재하는')) {
          // [] 안의 자재 코드 추출
          const codeMatch = result.error.match(/\[([^\]]+)\]/);
          const extractedCode = codeMatch ? codeMatch[1] : '';
          setSubtext(
            extractedCode +
              (type === 'product' ? ' 제품 코드' : ' 자재 코드') +
              '가 이미 존재합니다. 파일을 확인 후 다시 시도해주세요.'
          );
        } else {
          setSubtext(result.error + ' 다시 시도해 주세요.');
        }
        showToast();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '오류가 발생했습니다.';
      setSubtext(errorMessage + ' 다시 시도해 주세요.');
      showToast();
      // 에러를 다시 throw하지 않음 (handleComplete의 catch로 전파되지 않도록)
    }
  };

  const getTitle = () => {
    if (hasFiles) {
      return '업로드된 파일을 확인해 주세요.';
    }
    return type === 'product'
      ? '엑셀 파일을 업로드하여 재고를 등록해주세요.'
      : '엑셀 파일로 자재 목록을 한번에 등록하세요.';
  };

  const getSubtitle = () => {
    if (hasFiles) {
      return '파일이 맞는지 확인 후, 업로드를 눌러주세요.';
    }
    return type === 'product'
      ? '샘플 파일 양식에 맞춰 작성한 후 업로드해 주세요.'
      : '샘플 파일 양식에 맞춰 작성한 후 업로드해 주세요.';
  };

  return (
    <>
      <Modal
        title={getTitle()}
        subtitle={getSubtitle()}
        onClose={onClose}
        width="w-[600px]"
      >
        <div className="mt-3">
          {isProcessing ? (
            <div className="flex justify-center items-center h-50">
              <Spinner />
            </div>
          ) : (
            <DropzoneArea
              onClose={onClose}
              onComplete={handleComplete}
              onFileUpload={onFileUpload}
              accept={{
                'application/vnd.ms-excel': ['.xls'],
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
                  ['.xlsx'],
                'application/excel': ['.xls', '.xlsx'],
                'application/vnd.apple.numbers': ['.numbers'],
                'text/csv': ['.csv'],
                'application/csv': ['.csv'],
              }}
            />
          )}
        </div>
      </Modal>

      {isToastOpen && (
        <Toast
          text={
            type === 'product'
              ? '제품 등록에 실패했습니다.'
              : '자재 등록에 실패했습니다.'
          }
          subtext={subtext}
          type="red"
          isVisible={isVisible}
          icon={<WarningCircle size={20} className="text-red" />}
        />
      )}
    </>
  );
};

export default ExcelUploadModal;
