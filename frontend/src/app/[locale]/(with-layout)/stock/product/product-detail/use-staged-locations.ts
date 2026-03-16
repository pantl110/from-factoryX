import { useState, useCallback } from 'react';
import { useLocation } from '@/hooks';

export interface StagedLocationModel {
  tempId: string;
  location: string;
  detail_location?: string;
  memo?: string;
  images: string[];
}

export const useStagedLocations = () => {
  const [stagedLocations, setStagedLocations] = useState<StagedLocationModel[]>(
    []
  );
  const { createLocation } = useLocation();

  const addStagedLocation = useCallback(
    (data: Omit<StagedLocationModel, 'tempId'>) => {
      setStagedLocations((prev) => [
        ...prev,
        { ...data, tempId: crypto.randomUUID() },
      ]);
    },
    []
  );

  const removeStagedLocation = useCallback((tempId: string) => {
    setStagedLocations((prev) => prev.filter((l) => l.tempId !== tempId));
  }, []);

  const persistStagedLocations = useCallback(
    async (productId: number) => {
      for (const loc of stagedLocations) {
        await createLocation({
          type: 'product',
          id: productId,
          location: loc.location,
          detail_location: loc.detail_location,
          memo: loc.memo,
          images: loc.images,
        });
      }
      setStagedLocations([]);
    },
    [stagedLocations, createLocation]
  );

  return {
    stagedLocations,
    addStagedLocation,
    removeStagedLocation,
    persistStagedLocations,
  };
};
