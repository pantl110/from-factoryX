'use client';

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

interface TableItemProps {
  project: ProjectResponseModel;
  checked?: boolean;
  onToggle?: () => void;
}

const TableItem = ({ project, checked = false, onToggle }: TableItemProps) => {
  const router = useRouter();

  const chipColors = ProjectStatusColorMap[project.status as ProjectStatusType];

  // production 페이지로 이동
  const handleClick = () => {
    if (project.status === 'quotation') router.push(`/quotation`);
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
    <div
      className="flex items-center h-14 w-[1448px] border-b border-lg Me_Body-1 cursor-pointer hover:bg-bg"
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
          text={project.status}
          bgColor={chipColors.bgColor}
          textColor={chipColors.textColor}
        />
      </div>
      <p className="flex-2 px-3 text-dg truncate" title={project.client_name}>
        {project.client_name}
      </p>
      <p
        className="flex-2 px-3 text-dg truncate"
        title={
          project.product_names.length > 1
            ? `${project.product_names[0]} 외 ${project.product_names.length - 1}개`
            : project.product_names[0]
        }
      >
        {project.product_names.length > 1
          ? `${project.product_names[0]} 외 ${project.product_names.length - 1}개`
          : project.product_names[0]}
      </p>
      <p className="w-[200px] px-3 text-dg truncate" title={project.start_date}>
        {project.start_date}
      </p>
      <p className="w-[200px] px-3 text-dg truncate" title={project.due_date}>
        {project.due_date}
      </p>
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
    </div>
  );
};

export default TableItem;
