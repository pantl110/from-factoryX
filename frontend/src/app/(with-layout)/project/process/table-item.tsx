'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import Chip from '@/ui/chip';
import { useRouter } from 'next/navigation';
import {
  ProjectStatusType,
  ProjectStatusColorMap,
  TaxStatusType,
} from '@/types/status-type';
import Checkbox from '@/ui/checkbox';
import MiniBtn from '@/ui/mini-btn';
import { ProjectResponseModel } from '@/types/data-model';
import { CopySimple } from '@phosphor-icons/react';
import Tooltip from '@/ui/tooltip';
import useCloneProject from '@/hooks/project/project-plan/use-clone-project';

interface TableItemProps {
  project: ProjectResponseModel;
  checked?: boolean;
  onToggle?: () => void;
  isArchived?: boolean;
}

const TableItem = ({
  project,
  checked = false,
  onToggle,
  isArchived = false,
}: TableItemProps) => {
  const router = useRouter();
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const { cloneProject, isLoading: isCloning } = useCloneProject();

  // 한글 상태를 영어 키로 매핑
  const mapKoreanToEnglish = (status: string): ProjectStatusType => {
    const statusMap: Record<string, ProjectStatusType> = {
      '견적 협의중': 'quotation',
      '주문 확정': 'confirmed',
      '생산 대기': 'pending',
      '생산 중': 'production',
      '생산 완료': 'manufactured',
      납품: 'delivery',
      '프로젝트 완료': 'completed',
      완료: 'completed',
      중단: 'interruption',
    };

    return statusMap[status];
  };

  const mappedStatus = mapKoreanToEnglish(project.status);
  const chipColors = ProjectStatusColorMap[mappedStatus];

  // 칩에서 표시할 텍스트 매핑
  const getDisplayText = (status: string): string => {
    const displayMap: Record<string, string> = {
      '견적 협의중': '견적 요청',
      '주문 확정': '주문 확정',
      '생산 대기': '생산 대기',
      '생산 중': '생산 중',
      '생산 완료': '생산 완료',
      납품: '납품',
      '프로젝트 완료': '완료',
      // 중단: '중단',
    };

    return displayMap[status] || status;
  };

  const displayText = getDisplayText(project.status);

  // 프로젝트 복제 핸들러
  const handleCloneProject = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isCloning) return; // 이미 진행 중이면 중복 실행 방지

    const result = await cloneProject(project.project_id);
    if (result.success) {
      alert('프로젝트가 성공적으로 복제되었습니다.');
      //  production 페이지로 이동
      // router.push(`/production/${project.}`);
    } else {
      alert(`프로젝트 복제에 실패했습니다: ${result.error}`);
    }
  };

  // production 페이지로 이동
  const handleClick = () => {
    if (
      mappedStatus === 'quotation' ||
      mappedStatus === 'confirmed' ||
      mappedStatus === 'interruption'
    )
      router.push(
        `/quotation?quotation_id=${project.project_id}&project_id=${project.project_id}`
      );
    // ‼️‼️‼️‼️‼️ quotation_id가 project_id와 같은지 확인 필요
    else router.push(`/production/${project.project_id}`);
  };

  // 세금계산서 발행 상태 표시 텍스트 변환
  const getPublishStatusText = (status: TaxStatusType | undefined) => {
    if (status === null || status === undefined) return '연결 필요';
    if (status === 'pending' || status === 'temporary') return '미발행';
    if (status === 'published') return '보기';
    return '';
  };
  const taxButtonText = getPublishStatusText(project.publish_status);

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
        <div className="px-3 w-[150px]">
          <Chip
            text={displayText}
            bgColor={chipColors.bgColor}
            textColor={chipColors.textColor}
          />
        </div>
        <p
          className="flex-2 px-3 text-dg truncate"
          title={project.client_name || '-'}
        >
          {project.client_name || '-'}
        </p>
        <p
          className="flex-2 px-3 text-dg truncate"
          title={
            project.product_names.length === 0
              ? '-'
              : project.product_names.length > 1
                ? `${project.product_names[0]} 외 ${project.product_names.length - 1}개`
                : project.product_names[0]
          }
        >
          {project.product_names.length === 0
            ? '-'
            : project.product_names.length > 1
              ? `${project.product_names[0]} 외 ${project.product_names.length - 1}개`
              : project.product_names[0]}
        </p>
        {!isArchived && (
          <p
            className="w-[200px] px-3 text-dg truncate"
            title={project.start_date || '-'}
          >
            {project.start_date || '-'}
          </p>
        )}
        <p
          className="w-[200px] px-3 text-dg truncate"
          title={project.due_date || '-'}
        >
          {project.due_date || '-'}
        </p>
        {!isArchived && (
          <div
            className="w-[200px] px-3"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            {taxButtonText === '보기' ? (
              <MiniBtn
                text={taxButtonText}
                bgColor="bg-wh"
                textColor="text-dg"
                borderColor="border-lg"
                hoverColor="hover:bg-bg"
                height="h-8"
                onClick={() => {
                  router.push(`/tax/list`);
                }}
              />
            ) : taxButtonText === '연결 필요' ? (
              <MiniBtn
                text="연결 필요"
                bgColor="bg-bg"
                textColor="text-dg"
                hoverColor="hover:bg-lg"
                height="h-8"
              />
            ) : (
              <MiniBtn
                text="미발행"
                bgColor="bg-bg"
                textColor="text-dg"
                hoverColor="hover:bg-lg"
                height="h-8"
                disabled
              />
            )}
          </div>
        )}
        {isArchived && (
          <div
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
          </div>
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
    </>
  );
};

export default TableItem;
