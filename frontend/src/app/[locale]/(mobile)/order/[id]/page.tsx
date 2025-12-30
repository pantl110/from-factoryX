'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';

import MoBtn from '@/ui/mo-btn';
import { useGetProjectStatus, useStartProduction } from '@/hooks';
import useMemberStore from '@/store/member-store';
import {
  ProductionDataModel,
  ProjectStatusResponseModel,
} from '@/types/data-model';

import Topbar from '../../topbar';
import ClientInfo from '../../client-info';
import OrderInfo from '../order-info';
import DeliveryInfo from '../../delivery-info';
import OrderConfirmModal, {
  OrderConfirmModalHandleModel,
} from '../order-confirm-modal';

const OrderPage = () => {
  const params = useParams<{ id: string }>();
  const projectId = Number(params.id);

  const router = useRouter();
  const queryClient = useQueryClient();
  const { getProjectStatus } = useGetProjectStatus();
  const { startProduction, isLoading: isStartProductionLoading } =
    useStartProduction();
  const factoryId = useMemberStore((state) => state.factoryId);

  const [projectStatus, setProjectStatus] =
    useState<ProjectStatusResponseModel | null>(null);
  const [isProjectStatusLoading, setIsProjectStatusLoading] = useState(true);
  const [isOrderConfirmModalOpen, setIsOrderConfirmModalOpen] = useState(false);
  const orderConfirmModalRef = useRef<OrderConfirmModalHandleModel>(null);

  const quotationData = projectStatus?.quotations?.[0];

  const productionData = useMemo<ProductionDataModel | null>(() => {
    if (!quotationData || !factoryId) {
      return null;
    }

    const clientInfo = quotationData.client_info;
    const products =
      quotationData.products
        ?.map((product) => {
          const productId =
            product.product?.id ?? product.product_info?.id ?? null;

          if (!productId) {
            return null;
          }

          return {
            product_id: productId,
            quantity: product.quantity,
            unit_price: product.unit_price,
            is_delivery: Boolean(product.is_delivery),
            delivery_date: null,
          };
        })
        .filter(
          (
            product
          ): product is NonNullable<ProductionDataModel['products'][number]> =>
            product !== null
        ) ?? [];

    if (products.length === 0) {
      return null;
    }

    return {
      quotation_id: quotationData.id,
      client: {
        factory_id: factoryId,
        client_id: quotationData.client?.id ?? null,
        name: clientInfo.name,
        business_registration_number: clientInfo.business_registration_number,
        representative_name: clientInfo.representative_name,
        email: clientInfo.email,
        phone: clientInfo.phone,
        fax: clientInfo.fax,
        business_type: clientInfo.business_type,
        business_category: clientInfo.business_category,
        address: clientInfo.address,
        manager: clientInfo.manager,
        note: clientInfo.note,
        is_customer: clientInfo.is_customer,
        is_supplier: clientInfo.is_supplier,
      },
      due_date: quotationData.due_date,
      products,
    };
  }, [factoryId, quotationData]);

  useEffect(() => {
    if (Number.isNaN(projectId)) {
      setIsProjectStatusLoading(false);
      return;
    }

    let isMounted = true;

    const fetchProjectStatus = async () => {
      setIsProjectStatusLoading(true);
      try {
        const result = await getProjectStatus(projectId);

        if (isMounted && result.success && result.data) {
          setProjectStatus(result.data);
        }
      } finally {
        if (isMounted) {
          setIsProjectStatusLoading(false);
        }
      }
    };

    fetchProjectStatus();

    return () => {
      isMounted = false;
    };
  }, [getProjectStatus, projectId]);

  const handleOrderConfirm = useCallback(async () => {
    if (!productionData) {
      return;
    }

    try {
      await startProduction(productionData);
      orderConfirmModalRef.current?.close();
      queryClient.invalidateQueries({
        queryKey: ['stale-confirmed-projects', factoryId],
      });
      router.replace('/alarm?tab=confirmation-required');
      router.refresh();
    } catch {
      // 에러 처리
    }
  }, [factoryId, productionData, queryClient, router, startProduction]);

  return (
    <>
      <div className="pb-6">
        <Topbar title="확정 필요 주문" />
        {isProjectStatusLoading ? null : (
          <>
            <ClientInfo clientInfo={quotationData?.client_info} />
            <div className="h-2 bg-bg" />
            <OrderInfo products={quotationData?.products} />
            <div className="h-2 bg-bg" />
            <DeliveryInfo
              isOrderPage={true}
              address={quotationData?.client_info?.address}
              dueDate={projectStatus?.due_date}
            />
            <div className="h-2 bg-bg" />
            <div className="px-7 py-8">
              <MoBtn
                text="주문 확정하기"
                variant="primary"
                width="w-full"
                big
                onClick={() => {
                  setIsOrderConfirmModalOpen(true);
                }}
              />
            </div>
          </>
        )}
      </div>
      {isOrderConfirmModalOpen && (
        <OrderConfirmModal
          ref={orderConfirmModalRef}
          onClose={() => setIsOrderConfirmModalOpen(false)}
          onConfirm={handleOrderConfirm}
          isConfirming={isStartProductionLoading}
        />
      )}
    </>
  );
};

export default OrderPage;
