import Modal from '@/ui/modal/modal';
import DropzoneArea from '@/ui/dropzone-area';
import { useState } from 'react';
import { parseExcelFile, ExcelRowModel } from '@/utils/excel-parser';
import { ProductCreateExcelModel } from '@/types/data-model';
import Toast from '@/ui/toast';
import { WarningCircle } from '@phosphor-icons/react';
import { useToast, useCreateProduct, useCreateMaterial } from '@/hooks';
import Spinner from '@/ui/spinner';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('stock.material.modals.excelUpload');
  // 엑셀 파일의 헤더는 로케일에 따라 동적으로 설정
  const excelColumns = {
    productName: t('excelColumns.productName'),
    materialName: t('excelColumns.materialName'),
    productCode: t('excelColumns.productCode'),
    materialCode: t('excelColumns.materialCode'),
    specification: t('excelColumns.specification'),
    unit: t('excelColumns.unit'),
    currentStock: t('excelColumns.currentStock'),
    minStock: t('excelColumns.minStock'),
    avgProductionTime: t('excelColumns.avgProductionTime'),
    note: t('excelColumns.note'),
  };
  const [hasFiles, setHasFiles] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [subtext, setSubtext] = useState(t('errors.tryAgain'));

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
          // 에러 메시지를 번역 키로 매핑
          let errorKey = 'unknownError';
          if (
            err.message.includes('업로드할 데이터가 없습니다') ||
            err.message.includes('No data to upload')
          ) {
            errorKey = 'noDataToUpload';
          } else if (
            err.message.includes('엑셀 파일 파싱에 실패했습니다') ||
            err.message.includes('Failed to parse')
          ) {
            errorKey = 'parseFailed';
          } else if (
            err.message.includes('파일 읽기에 실패했습니다') ||
            err.message.includes('Failed to read')
          ) {
            errorKey = 'fileReadFailed';
          }
          setSubtext(
            t(`errors.${errorKey}`) + ' ' + t('errors.checkFileAndRetry')
          );
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

      // 정수 필드는 반올림 처리
      const extractRoundedInt = (value: unknown): number => {
        const num = extractNumber(value);
        return Math.round(num);
      };

      // 원본 데이터에서 비어있는 데이터가 있는지 확인 (모든 필드가 비어있는 행은 제외)
      const hasEmptyData = dataToProcess.some((row) => {
        const name = String(
          row[
            type === 'product'
              ? excelColumns.productName
              : excelColumns.materialName
          ] ?? ''
        );
        const code = String(
          row[
            type === 'product'
              ? excelColumns.productCode
              : excelColumns.materialCode
          ] ?? ''
        );
        const spec = String(row[excelColumns.specification] ?? '');
        const unit = String(row[excelColumns.unit] ?? '');

        // 모든 필드가 비어있으면 건너뛰기 (자재/제품에 따라 다른 기준)
        let isAllEmpty = false;
        if (type === 'material') {
          // 자재: 자재명, 자재 코드, 규격, 단위, 현재 재고, 최소 재고 모두 비어있어야 함
          const currentStock = String(
            row[excelColumns.currentStock] ?? ''
          ).trim();
          const minStock = String(row[excelColumns.minStock] ?? '').trim();
          isAllEmpty =
            name.trim() === '' &&
            code.trim() === '' &&
            spec.trim() === '' &&
            unit.trim() === '' &&
            currentStock === '' &&
            minStock === '';
        } else {
          // 제품: 제품명, 제품 코드, 규격, 단위, 현재 재고, 평균 생산 시간(초), 특이 사항 모두 비어있어야 함
          const currentStock = String(
            row[excelColumns.currentStock] ?? ''
          ).trim();
          const avgProductionTime = String(
            row[excelColumns.avgProductionTime] ?? ''
          ).trim();
          const note = String(row[excelColumns.note] ?? '').trim();
          isAllEmpty =
            name.trim() === '' &&
            code.trim() === '' &&
            spec.trim() === '' &&
            unit.trim() === '' &&
            currentStock === '' &&
            avgProductionTime === '' &&
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
            ? t('errors.requiredFields.product')
            : t('errors.requiredFields.material')
        );
        showToast();
        return;
      }

      // 빈 행을 필터링하는 함수
      const isEmptyRow = (row: ExcelRowModel) => {
        const name = String(
          row[
            type === 'product'
              ? excelColumns.productName
              : excelColumns.materialName
          ] ?? ''
        ).trim();
        const code = String(
          row[
            type === 'product'
              ? excelColumns.productCode
              : excelColumns.materialCode
          ] ?? ''
        ).trim();
        const spec = String(row[excelColumns.specification] ?? '').trim();
        const unit = String(row[excelColumns.unit] ?? '').trim();

        if (type === 'material') {
          const currentStock = String(
            row[excelColumns.currentStock] ?? ''
          ).trim();
          const minStock = String(row[excelColumns.minStock] ?? '').trim();
          return (
            name === '' &&
            code === '' &&
            spec === '' &&
            unit === '' &&
            currentStock === '' &&
            minStock === ''
          );
        } else {
          const currentStock = String(
            row[excelColumns.currentStock] ?? ''
          ).trim();
          const avgProductionTime = String(
            row[excelColumns.avgProductionTime] ?? ''
          ).trim();
          const note = String(row[excelColumns.note] ?? '').trim();
          return (
            name === '' &&
            code === '' &&
            spec === '' &&
            unit === '' &&
            currentStock === '' &&
            avgProductionTime === '' &&
            note === ''
          );
        }
      };

      // 빈 행을 제외하고 엑셀 데이터를 ProductCreateExcelModel 형식으로 변환
      const productData = dataToProcess
        .filter((row) => !isEmptyRow(row))
        .map((row) => {
          const name = String(
            row[
              type === 'product'
                ? t('excelColumns.productName')
                : t('excelColumns.materialName')
            ] ?? ''
          ).trim();
          const code = String(
            row[
              type === 'product'
                ? t('excelColumns.productCode')
                : t('excelColumns.materialCode')
            ] ?? ''
          ).trim();
          const unit = String(row[t('excelColumns.unit')] ?? '').trim();
          const spec = String(
            row[t('excelColumns.specification')] ?? ''
          ).trim();
          const currentStock = extractRoundedInt(
            row[t('excelColumns.currentStock')]
          );
          const avgProductionTime =
            type === 'product'
              ? extractRoundedInt(row[excelColumns.avgProductionTime])
              : null;
          const minStock =
            type === 'material'
              ? extractRoundedInt(row[excelColumns.minStock])
              : null;

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
            ...(type === 'material' && minStock !== null && minStock > 0
              ? { min_stock: minStock }
              : {}),
            ...(type === 'product' && row[excelColumns.note]
              ? { note: String(row[excelColumns.note]).trim() }
              : {}),
          };
        });

      const result =
        type === 'product'
          ? await createProduct(productData as ProductCreateExcelModel[])
          : await createMaterial(productData as ProductCreateExcelModel[]);

      if (result.success) {
        // 중복 코드는 응답의 duplicate_codes로 판단한다.
        // (서버 메시지 문자열 매칭은 로케일에 따라 동작하지 않으므로 사용하지 않는다)
        let duplicateCodes: string[] = [];
        if (type === 'product') {
          // 제품: result.duplicateCodes
          const { duplicateCodes: codes } = result as {
            duplicateCodes?: string[];
          };
          duplicateCodes = codes ?? [];
        } else {
          // 자재: result.data.duplicate_codes
          const { data } = result as {
            data?: { duplicate_codes?: string[] };
          };
          duplicateCodes = data?.duplicate_codes ?? [];
        }

        onClose();
        onSuccess?.(duplicateCodes.length > 0); // 중복 코드 유무를 알림
      } else {
        if (result.error.includes(t('duplicateCheck.alreadyExists'))) {
          // [] 안의 자재 코드 추출
          const codeMatch = result.error.match(/\[([^\]]+)\]/);
          const extractedCode = codeMatch ? codeMatch[1] : '';
          setSubtext(
            t('errors.codeAlreadyExists', {
              code: extractedCode,
              type:
                type === 'product'
                  ? t('excelColumns.productCode')
                  : t('excelColumns.materialCode'),
            })
          );
        } else {
          setSubtext(result.error + ' ' + t('errors.tryAgain'));
        }
        showToast();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : t('errors.unknownError');
      setSubtext(errorMessage + ' ' + t('errors.tryAgain'));
      showToast();
      // 에러를 다시 throw하지 않음 (handleComplete의 catch로 전파되지 않도록)
    }
  };

  const getTitle = () => {
    if (hasFiles) {
      return t('title.hasFiles');
    }
    return type === 'product'
      ? t('title.noFiles.product')
      : t('title.noFiles.material');
  };

  const getSubtitle = () => {
    if (hasFiles) {
      return t('subtitle.hasFiles');
    }
    return t('subtitle.noFiles');
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
              fileCount={1}
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
              ? t('toast.productRegistrationFailed')
              : t('toast.materialRegistrationFailed')
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
