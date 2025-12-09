'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import DeliveryInfo from '../../delivery-info';
import Topbar from '../../topbar';
import ProjectInfo from './project-info';
import { useGetProjectStatus, useGetQuotationProductDetail } from '@/hooks';
import { ProjectStatusResponseModel } from '@/types/data-model';
import Scan from './scan';
import { MoBottomNavigation } from '@/ui';
import { useRouter } from 'next/navigation';

const DeliveryPage = () => {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const quotationProductId = params?.id ? Number(params.id) : 0;
  const projectId = searchParams.get('project_id')
    ? Number(searchParams.get('project_id'))
    : null;
  const router = useRouter();

  const { getProjectStatus, isLoading, error } = useGetProjectStatus();
  const [projectStatus, setProjectStatus] =
    useState<ProjectStatusResponseModel | null>(null);

  const { data: quotationProductDetail } =
    useGetQuotationProductDetail(quotationProductId);

  useEffect(() => {
    let isMounted = true;

    const fetchProjectStatus = async () => {
      if (!projectId) return;
      const result = await getProjectStatus(projectId);
      if (isMounted && result.success && result.data) {
        setProjectStatus(result.data);
      }
    };

    fetchProjectStatus();

    return () => {
      isMounted = false;
    };
  }, [getProjectStatus, projectId]);

  return (
    <div className="pb-30 ">
      <Topbar title="납기 상세 조회" />
      {error || (isLoading && !projectStatus) ? (
        <></>
      ) : (
        <>
          <ProjectInfo
            projectStatus={projectStatus}
            orderQuantity={quotationProductDetail?.quantity || 0}
          />
          <div className="h-2 bg-bg" />
          <DeliveryInfo
            address={projectStatus?.quotations?.[0]?.client_info?.address}
            dueDate={projectStatus?.due_date}
          />
          <div className="h-2 bg-bg" />
          <Scan />
          <MoBottomNavigation
            type="delivery"
            onClick={() =>
              router.push(`/delivery/${quotationProductId}/detail`)
            }
          />
        </>
      )}
    </div>
  );
};

export default DeliveryPage;
