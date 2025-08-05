import { create } from 'zustand';

interface FactoryStoreModel {
  factoryId: number | null;
  setFactoryId: (id: number) => void;
  initializeFactoryId: () => Promise<void>;
  clearFactoryId: () => void;
  getFactoryIdFromLocal: () => number | null;
}

// 로컬스토리지에서 factoryId를 안전하게 가져오는 함수
const getStoredFactoryId = (): number | null => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('factoryId');
    return stored ? parseInt(stored, 10) : null;
  } catch {
    return null;
  }
};

// 로컬스토리지에 factoryId를 안전하게 저장하는 함수
const setStoredFactoryId = (id: number): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('factoryId', id.toString());
  } catch {
    // 로컬스토리지 저장 실패 시 무시
  }
};

// 로컬스토리지에서 factoryId를 안전하게 삭제하는 함수
const clearStoredFactoryId = (): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('factoryId');
  } catch {
    // 로컬스토리지 삭제 실패 시 무시
  }
};

const useFactoryStore = create<FactoryStoreModel>((set, get) => ({
  factoryId: getStoredFactoryId(), // 초기값을 로컬스토리지에서 가져옴
  setFactoryId: (id) => {
    set({ factoryId: id });
    setStoredFactoryId(id); // 로컬스토리지에도 저장
  },
  initializeFactoryId: async () => {
    const currentFactoryId = get().factoryId;

    // 이미 설정되어 있으면 스킵
    if (currentFactoryId !== null) return;

    // 로컬스토리지에서 먼저 확인
    const localFactoryId = getStoredFactoryId();
    if (localFactoryId !== null) {
      set({ factoryId: localFactoryId });
      return;
    }

    // 로컬스토리지에도 없으면 API에서 가져오기
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/factory`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        const factories = result.data;

        if (factories.length > 0) {
          const firstFactoryId = factories[0].id;
          set({ factoryId: firstFactoryId });
          setStoredFactoryId(firstFactoryId); // 로컬스토리지에도 저장
        } else {
          // set({ factoryId: 2 });
          // setStoredFactoryId(2);
        }
      } else {
        // set({ factoryId: 2 });
        // setStoredFactoryId(2);
      }
    } catch {
      // set({ factoryId: 2 });
      // setStoredFactoryId(2);
    }
  },
  clearFactoryId: () => {
    set({ factoryId: null });
    clearStoredFactoryId();
  },
  getFactoryIdFromLocal: () => {
    return getStoredFactoryId();
  },
}));

export default useFactoryStore;
