'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';

import ClientInfo from '../../client-info';
import DeliveryInfo from '../../delivery-info';
import Topbar from '../../topbar';
import { useGetProjectStatus } from '@/hooks';
import { ProjectStatusResponseModel } from '@/types/data-model';

const DeliveryPage = () => {
  const params = useParams<{ id: string }>();
  const projectId = Number(params.id);

  const { getProjectStatus, isLoading, error } = useGetProjectStatus();
  const [projectStatus, setProjectStatus] =
    useState<ProjectStatusResponseModel | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchProjectStatus = async () => {
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
    <div className="pb-8">
      <Topbar title="납기 상세 조회" />
      {error || (isLoading && !projectStatus) ? (
        <></>
      ) : (
        <>
          <ClientInfo
            clientInfo={projectStatus?.quotations?.[0]?.client_info}
          />
          <div className="h-2 bg-bg" />
          <DeliveryInfo
            address={projectStatus?.quotations?.[0]?.client_info?.address}
            products={projectStatus?.quotations?.[0]?.products} // products_info아닌 납품 제품 정보
            dueDate={projectStatus?.due_date}
          />
        </>
      )}
    </div>
  );
};

export default DeliveryPage;
