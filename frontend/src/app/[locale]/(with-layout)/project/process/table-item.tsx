'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from '@/i18n/navigation';
import { RoundChip } from '@/ui/round-chip';
import { getTaxStatusColor, ProjectStatusType } from '@/types/status-type';
import Checkbox from '@/ui/checkbox';
import MiniBtn from '@/ui/mini-btn';
import { ProjectResponseModel } from '@/types/data-model';
import { ArrowLineUpRight, CopySimple } from '@phosphor-icons/react';
import Tooltip from '@/ui/tooltip';
import useCloneProject from '@/hooks/project/project-plan/use-clone-project';
import LinkTaxModal from './modals/link-tax-modal/link-tax-modal';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';
import { getStartDate } from '@/utils/get-start-date';
import { getProjectStatusColor } from '@/utils';
import Skeleton from '@/app/[locale]/(without-layout)/skeleton';
import CloneProjectModal from '../clone-project-modal';
import { IconBtn } from '@/ui';
import TaxDocumentOverlay from '@/app/[locale]/(with-layout)/document/tax-document-overlay';
import { useTranslations } from 'next-intl';

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
  const isViewer = role === 'viewer';
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );
  const tStatus = useTranslations('project.status');
  const t = useTranslations('project.process');
  const tCommon = useTranslations('common');
  const tTax = useTranslations('tax.publishStatus');
  const tDocumentType = useTranslations('document.type');

  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isLinkTaxModalOpen, setIsLinkTaxModalOpen] = useState(false);
  const [isTaxOverlayOpen, setIsTaxOverlayOpen] = useState(false);
  const { cloneProject, isLoading: isCloning } = useCloneProject();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isCloneProjectModalOpen, setIsCloneProjectModalOpen] = useState(false);

  // 칩에서 표시할 텍스트 매핑
  const getDisplayText = (status: string): string => {
    return tStatus(status as ProjectStatusType) || tStatus('quotation');
  };

  const displayText = getDisplayText(project.status);
  const chipColor = getProjectStatusColor(project.status);

  const productsName =
    project.status === 'quotation' ||
    project.status === 'confirmed' ||
    project.status === 'suspended'
      ? project.quotations[0].products.length > 1
        ? tCommon('listFormat', {
            first: project.quotations[0].products[0]?.product?.name || '',
            count: project.quotations[0].products.length - 1,
          })
        : project.quotations[0].products[0]?.product?.name || '-'
      : project.quotations &&
          project.quotations.length > 0 &&
          project.quotations[0].products_info &&
          project.quotations[0].products_info.length > 1
        ? tCommon('listFormat', {
            first: project.quotations[0].products_info[0]?.name || '',
            count: project.quotations[0].products_info.length - 1,
          })
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
  const handleCloneProject = async (dueDate: string) => {
    if (isCloning) return; // 이미 진행 중이면 중복 실행 방지

    setIsCloneProjectModalOpen(false); // 모달 닫기

    const result = await cloneProject(project.id, dueDate);
    if (result.success) {
      //  production 페이지로 이동
      router.push(`/production/${result.data.project_id}`);
    } else {
      alert(t('errors.cloneFailed', { error: result.error }));
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
        className={`flex items-center h-14 ${
          isArchived ? 'w-full' : 'w-[1448px]'
        } border-b border-lg Me_Body-3 cursor-pointer hover:bg-bg`}
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') handleClick();
        }}
      >
        {!isViewer && hasSubscription() && (
          <Checkbox isChecked={checked} onToggle={onToggle || (() => {})} />
        )}
        <div className={`px-2 ${isArchived ? 'w-[150px]' : 'w-[200px]'}`}>
          <RoundChip
            text={displayText}
            color={chipColor}
            variant="defaultSmall"
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
                text={tCommon('link')}
                variant="hoverWhite"
                height="h-8"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsLinkTaxModalOpen(true);
                }}
                disabled={role === 'viewer' || role === 'prod_manager'}
              />
            ) : (
              <IconBtn
                icon={ArrowLineUpRight}
                iconSize={20}
                size="w-9 h-9"
                onClick={(e?: React.MouseEvent<HTMLButtonElement>) => {
                  e?.stopPropagation();
                  setIsTaxOverlayOpen(true);
                }}
                hoverBg="hover:bg-wh"
              />
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
                ? tTax('temporary')
                : project.tax_invoice.publish_status === 'pending'
                  ? tTax('pending')
                  : project.tax_invoice.publish_status === 'processing'
                    ? tTax('processing')
                    : project.tax_invoice.publish_status === 'published'
                      ? tTax('published')
                      : project.tax_invoice.publish_status === 'cancled'
                        ? tTax('cancled')
                        : project.tax_invoice.publish_status === 'failed'
                          ? tTax('failed')
                          : project.tax_invoice.publish_status === null
                            ? '-'
                            : '-'}
          </p>
        )}

        {isArchived && project.status === 'completed' && role !== 'viewer' ? (
          <div
            className="w-20 h-full flex items-center justify-center relative"
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setTooltipPosition({
                x: rect.right, // div의 오른쪽 = 툴팁의 오른쪽
                y: rect.bottom, // div의 아래쪽 = 툴팁의 위쪽
              });
              setIsTooltipVisible(true);
            }}
            onMouseLeave={() => setIsTooltipVisible(false)}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsCloneProjectModalOpen(true);
              }}
              className="w-full h-full flex items-center cursor-pointer group"
            >
              <CopySimple
                size={20}
                className="text-sv group-hover:text-primary"
              />
            </button>
          </div>
        ) : isArchived ? (
          <div className="w-20" />
        ) : (
          <></>
        )}
      </div>

      {isTooltipVisible &&
        getDisplayText(project.status) === tStatus('completed') &&
        createPortal(
          <div
            className="fixed z-50 pointer-events-none"
            style={{
              right: `${window.innerWidth - tooltipPosition.x + 40}px`, // 툴팁의 오른쪽을 div 오른쪽에 맞춤
              top: `${tooltipPosition.y - 12}px`, // 툴팁의 위쪽을 div 아래쪽에 맞춤 (4px 아래로)
            }}
          >
            <Tooltip
              text={t('tooltip.cloneProject')}
              color="white"
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

      {isTaxOverlayOpen && project.tax_invoice?.id && (
        <TaxDocumentOverlay
          onClose={() => setIsTaxOverlayOpen(false)}
          taxId={project.tax_invoice.id}
          title={tDocumentType('salesTaxInvoice')}
        />
      )}

      {isNavigating && createPortal(<Skeleton />, document.body)}

      {isCloneProjectModalOpen && (
        <CloneProjectModal
          handleCloneProject={(dueDate) => {
            handleCloneProject(dueDate);
          }}
          onClose={() => setIsCloneProjectModalOpen(false)}
        />
      )}
    </>
  );
};

export default TableItem;
