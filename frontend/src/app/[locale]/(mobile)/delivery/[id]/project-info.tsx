import { LabelInfo } from '../../label-info';
import { ProjectStatusResponseModel } from '@/types/data-model';
import InfoDetail from '../../info-detail';

interface ProjectInfoProps {
  projectStatus: ProjectStatusResponseModel | null;
  orderQuantity: number;
}

const ProjectInfo = ({ projectStatus, orderQuantity }: ProjectInfoProps) => {
  if (!projectStatus) {
    return null;
  }

  const clientInfo = projectStatus?.quotations?.[0]?.client_info;

  return (
    <div className="px-7 py-8 flex flex-col gap-8">
      <h3 className="m-Heading-3-semibold">프로젝트 정보</h3>
      <div className="flex flex-col gap-5">
        <LabelInfo
          label="프로젝트명(거래처명)"
          value={clientInfo?.name || '-'}
        />
        <LabelInfo label="수량" />
        <div className="flex flex-col gap-2">
          <InfoDetail
            label="주문 수량"
            value={orderQuantity > 0 ? orderQuantity.toLocaleString() : '-'}
          />
          <InfoDetail label="스캔된 수량" value="구현필요300" />
        </div>
        <LabelInfo label="납기일" value={projectStatus?.due_date || '-'} />
      </div>
    </div>
  );
};

export default ProjectInfo;
