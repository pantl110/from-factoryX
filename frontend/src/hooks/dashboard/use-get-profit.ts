'use client';

import { useCallback } from 'react';
import useMemberStore from '@/store/member-store';
import {
  ProfitSummaryResponseModel,
  ProfitTrendResponseModel,
  ProfitListResponseModel,
  ProfitListScopeType,
} from '@/types/data-model';

const BASE = `${process.env.NEXT_PUBLIC_API_URL}/v1/project-plan/profit`;

interface ListParamsModel {
  scope: ProfitListScopeType;
  from?: string;
  to?: string;
  parentId?: string;
  page: number;
  pageSize: number;
  sort?: string;
  order?: string;
  search?: string;
}

const useGetProfit = () => {
  const { factoryId } = useMemberStore();

  const fetchJson = useCallback(
    async (
      path: string,
      params: Record<string, string | undefined>
    ): Promise<{ success: boolean; data?: unknown }> => {
      if (!factoryId) {
        return { success: false };
      }

      const qs = new URLSearchParams();
      qs.append('factory_id', factoryId.toString());
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          qs.append(key, value);
        }
      });

      try {
        const response = await fetch(`${BASE}/${path}?${qs}`, {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (response.ok) {
          return { success: true, data: await response.json() };
        }
        return { success: false };
      } catch {
        return { success: false };
      }
    },
    [factoryId]
  );

  const getProfitSummary = useCallback(
    async (params: { from?: string; to?: string; clientId?: string }) => {
      const result = await fetchJson('summary', {
        start: params.from,
        end: params.to,
        client_id: params.clientId,
      });
      return {
        success: result.success,
        data: result.data as ProfitSummaryResponseModel | undefined,
      };
    },
    [fetchJson]
  );

  const getProfitTrend = useCallback(
    async (params: { from?: string; to?: string; clientId?: string }) => {
      const result = await fetchJson('trend', {
        start: params.from,
        end: params.to,
        client_id: params.clientId,
      });
      return {
        success: result.success,
        data: result.data as ProfitTrendResponseModel | undefined,
      };
    },
    [fetchJson]
  );

  const getProfitList = useCallback(
    async <T>(params: ListParamsModel) => {
      const result = await fetchJson('list', {
        scope: params.scope,
        start: params.from,
        end: params.to,
        parent_id: params.parentId,
        page: String(params.page),
        page_size: String(params.pageSize),
        sort: params.sort,
        order: params.order,
        search: params.search,
      });
      return {
        success: result.success,
        data: result.data as ProfitListResponseModel<T> | undefined,
      };
    },
    [fetchJson]
  );

  return { getProfitSummary, getProfitTrend, getProfitList };
};

export default useGetProfit;
