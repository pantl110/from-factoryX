'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useLocation, useGetMaterial } from '@/hooks';
import { LocationListResponseModel, LocationModel } from '@/types/data-model';
import Topbar from '../../topbar';
import MaterialInfo from '../material-info';
import StockInfo from '../stock-info';

const MaterialPage = () => {
  const params = useParams<{ id?: string }>();
  const materialId = params?.id ? Number(params.id) : null;

  const { material, getMaterialDetail, isLoading } = useGetMaterial();
  const { listLocations, isLoading: isLocationLoading } = useLocation();

  const [locations, setLocations] = useState<LocationModel[]>([]);

  useEffect(() => {
    if (!materialId || Number.isNaN(materialId)) {
      return;
    }
    getMaterialDetail(materialId);
  }, [materialId, getMaterialDetail]);

  useEffect(() => {
    let isMounted = true;

    const fetchLocations = async () => {
      if (!materialId || Number.isNaN(materialId)) {
        setLocations([]);
        return;
      }

      const response = await listLocations('material', materialId);
      if (!isMounted) return;

      if (response.success) {
        const { data } = response;
        const locationList = Array.isArray(
          (data as LocationListResponseModel)?.locations
        )
          ? (data as LocationListResponseModel).locations
          : [];
        setLocations(locationList);
      } else {
        setLocations([]);
      }
    };

    fetchLocations();

    return () => {
      isMounted = false;
    };
  }, [materialId, listLocations]);

  return (
    <div className="pb-6">
      <Topbar title={material?.name ?? '-'} />
      <MaterialInfo material={material} isLoading={isLoading} />
      <div className="h-2 bg-bg" />
      <StockInfo locations={locations} isLoading={isLocationLoading} />
    </div>
  );
};

export default MaterialPage;
