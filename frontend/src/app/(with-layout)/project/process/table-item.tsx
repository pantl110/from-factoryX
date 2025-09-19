'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import Chip from '@/ui/chip';
import { useRouter } from 'next/navigation';
import { getTaxStatusColor, ProjectStatusColorMap } from '@/types/status-type';
import Checkbox from '@/ui/checkbox';
import MiniBtn from '@/ui/mini-btn';
import { ProjectResponseModel } from '@/types/data-model';
import { CopySimple } from '@phosphor-icons/react';
import Tooltip from '@/ui/tooltip';
import useCloneProject from '@/hooks/project/project-plan/use-clone-project';
import LinkTaxModal from './modals/link-tax-modal/link-tax-modal';
import useMemberStore from '@/store/member-store';
import { getStartDate } from '@/utils/get-start-date';
import Skeleton from '@/app/(without-layout)/skeleton';

interface TableItemProps {
  project: ProjectResponseModel;
  checked?: boolean;
  onToggle?: () => void;
  isArchived?: boolean;
  onReload?: () => void; // 세금계산서 연결 후 리로드 콜백
}

const TableItem = ({
  project,
  checked = false,
  onToggle,
  isArchived = false,
  onReload,
}: TableItemProps) => {
  const router = useRouter();
  const role = useMemberStore((state) => state.role);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isLinkTaxModalOpen, setIsLinkTaxModalOpen] = useState(false);
  const { cloneProject, isLoading: isCloning } = useCloneProject();
  const [isNavigating, setIsNavigating] = useState(false);
  // 프로젝트 상태 색상 가져오기 (영어/한글 모두 지원)
  const chipColors =
    ProjectStatusColorMap[project.status] || ProjectStatusColorMap.quotation;

  // 칩에서 표시할 텍스트 매핑 (영어/한글 모두 지원)
  const getDisplayText = (status: string): string => {
    const displayMap: Record<string, string> = {
      // 영어 상태
      quotation: '견적 요청',
      confirmed: '주문 확정',
      pending: '생산 대기',
      production: '생산 중',
      manufactured: '생산 완료',
      delivery: '납품',
      completed: '완료',
      suspended: '중단',
    };

    return displayMap[status] || '견적 요청';
  };

  const displayText = getDisplayText(project.status);

  const productsName =
    project.status === 'quotation' ||
    project.status === 'confirmed' ||
    project.status === 'suspended'
      ? project.quotations[0].products.length > 1
        ? `${project.quotations[0].products[0].product.name} 외 ${project.quotations[0].products.length - 1}개`
        : project.quotations[0].products[0]?.product?.name || '-'
      : project.quotations &&
          project.quotations.length > 0 &&
          project.quotations[0].products_info &&
          project.quotations[0].products_info.length > 1
        ? `${project.quotations[0].products_info[0].name} 외 ${project.quotations[0].products_info.length - 1}개`
        : project.quotations[0].products_info[0]?.name || '-';

  // 생산계획 중 가장 빠른 생산시작일
  const startDate = getStartDate(project);

  // products 중 가장 늦은 납기일자
  const completedDate =
    project.quotations &&
    project.quotations.length > 0 &&
    project.quotations[0].products &&
    project.quotations[0].products.length > 0
      ? project.quotations[0].products
          .filter((product) => product.delivery_date)
          .reduce((latest, product) => {
            if (!latest) return product.delivery_date;
            return product.delivery_date > latest
              ? product.delivery_date
              : latest;
          }, project.quotations[0].products[0]?.delivery_date || '')
          .split('T')[0]
      : '-';

  const dueDate =
    // 프로젝트 완료에서는 납기일자가 없음, 완료일자
    project.status === 'suspended'
      ? '-'
      : project.status === 'completed'
        ? completedDate
        : project.quotations &&
            project.quotations.length > 0 &&
            project.quotations[0].due_date
          ? project.quotations[0].due_date
          : '-';

  // 프로젝트 복제 핸들러
  const handleCloneProject = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isCloning) return; // 이미 진행 중이면 중복 실행 방지

    const result = await cloneProject(project.id);
    if (result.success) {
      //  production 페이지로 이동
      router.push(`/production/${result.data.project_id}`);
    } else {
      alert(`프로젝트 복제에 실패했습니다: ${result.error}`);
    }
  };

  // production 페이지로 이동
  const handleClick = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    // 견적 관련 상태들 (영어/한글 모두 체크)
    const isQuotationStatus =
      project.status === 'quotation' ||
      project.status === 'confirmed' ||
      project.status === 'suspended';

    if (isQuotationStatus) {
      const quotationId =
        project.quotations && project.quotations.length > 0
          ? project.quotations[0].id
          : null;
      if (quotationId) {
        router.push(
          `/quotation?quotation_id=${quotationId}&project_id=${project.id}`
        );
      }
    } else {
      router.push(`/production/${project.id}`);
    }
  };

  return (
    <>
      <div
        className={`group flex items-center h-14 ${
          isArchived ? 'w-full' : 'w-[1448px]'
        } border-b border-lg Me_Body-1 cursor-pointer hover:bg-bg`}
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') handleClick();
        }}
      >
        <Checkbox isChecked={checked} onToggle={onToggle || (() => {})} />
        <div className={`px-3 ${isArchived ? 'w-[150px]' : 'w-[200px]'}`}>
          <Chip
            text={displayText}
            bgColor={chipColors.bgColor}
            textColor={chipColors.textColor}
          />
        </div>
        <p
          className="flex-2 px-3 text-dg truncate"
          title={
            project.status === 'quotation' ||
            project.status === 'confirmed' ||
            project.status === 'suspended'
              ? project.client_name || '-'
              : project.quotations[0].client_info.name || '-'
          }
        >
          {project.status === 'quotation' ||
          project.status === 'confirmed' ||
          project.status === 'suspended'
            ? project.client_name || '-'
            : project.quotations[0].client_info.name || '-'}
        </p>
        <p className="flex-2 px-3 text-dg truncate" title={productsName}>
          {productsName}
        </p>
        {!isArchived && (
          <p className="w-[200px] px-3 text-dg truncate" title={startDate}>
            {startDate}
          </p>
        )}
        <p className="w-[200px] px-3 text-dg truncate" title={dueDate}>
          {dueDate}
        </p>
        {!isArchived && (
          <div
            className="w-[200px] px-3"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            {!project.tax_invoice ||
            project.tax_invoice.publish_status === undefined ? (
              <MiniBtn
                text="연결 필요"
                bgColor="bg-bg"
                textColor="text-dg"
                hoverColor="hover:bg-lg"
                height="h-8"
                onClick={() => {
                  setIsLinkTaxModalOpen(true);
                }}
                disabled={role === 'viewer'}
              />
            ) : (
              <p className="text-dg px-4">연결 완료</p>
            )}
          </div>
        )}
        {!isArchived && (
          <p
            className={`w-[200px] px-3 ${getTaxStatusColor(project.tax_invoice?.publish_status).textColor}`}
          >
            {!project.tax_invoice
              ? '-'
              : project.tax_invoice.publish_status === 'temporary'
                ? '임시 저장'
                : project.tax_invoice.publish_status === 'pending'
                  ? '전송 대기'
                  : project.tax_invoice.publish_status === 'processing'
                    ? '처리 중'
                    : project.tax_invoice.publish_status === 'published'
                      ? '발행 완료'
                      : project.tax_invoice.publish_status === 'cancled'
                        ? '발행 취소'
                        : project.tax_invoice.publish_status === 'failed'
                          ? '발행 실패'
                          : project.tax_invoice.publish_status === null
                            ? '-'
                            : '-'}
          </p>
        )}

        {isArchived && role !== 'viewer' && (
          <button
            onClick={handleCloneProject}
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setTooltipPosition({
                x: rect.right, // div의 오른쪽 = 툴팁의 오른쪽
                y: rect.bottom, // div의 아래쪽 = 툴팁의 위쪽
              });
              setIsTooltipVisible(true);
            }}
            onMouseLeave={() => setIsTooltipVisible(false)}
            className="w-9 h-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <CopySimple size={20} className="text-dg" />
          </button>
        )}
      </div>

      {isTooltipVisible &&
        getDisplayText(project.status) === '완료' &&
        createPortal(
          <div
            className="fixed z-50"
            style={{
              right: `${window.innerWidth - tooltipPosition.x}px`, // 툴팁의 오른쪽을 div 오른쪽에 맞춤
              top: `${tooltipPosition.y - 18}px`, // 툴팁의 위쪽을 div 아래쪽에 맞춤
            }}
          >
            <Tooltip
              text={`같은 업체에서 요청이 들어왔다면,
이 프로젝트를 복제해서 바로 시작해보세요.`}
              color="primary"
              position="right"
            />
          </div>,
          document.body
        )}

      {isLinkTaxModalOpen && (
        <LinkTaxModal
          onClose={() => setIsLinkTaxModalOpen(false)}
          linkedItemId={project.id}
          type="project"
          onSuccess={onReload} // 연결 완료 시 리로드 콜백 호출
        />
      )}

      {isNavigating && createPortal(<Skeleton />, document.body)}
    </>
  );
};

export default TableItem;
