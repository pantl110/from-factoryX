import { create } from 'zustand';
import { UserInfoModel } from '@/types/data-model';

interface AuthStateProps {
  userInfo: UserInfoModel | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUserInfo: (userInfo: UserInfoModel | null) => void;
  setLoading: (loading: boolean) => void;
  setAuthenticated: (authenticated: boolean) => void;
  clearAuth: () => void;
  fetchUserInfo: () => Promise<boolean>;
  initializeAuth: () => void;
}

const useAuthStore = create<AuthStateProps>((set) => ({
  userInfo: null,
  isLoading: true,
  isAuthenticated: false,

  setUserInfo: (userInfo) => {
    set({
      userInfo,
      isAuthenticated: !!userInfo,
      isLoading: false,
    });
    // localStorage에 사용자 정보 저장
    if (userInfo) {
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
    } else {
      localStorage.removeItem('userInfo');
    }
  },

  setLoading: (isLoading) => set({ isLoading }),

  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

  clearAuth: () => {
    set({
      userInfo: null,
      isAuthenticated: false,
      isLoading: false,
    });
    // localStorage에서 사용자 정보 제거
    localStorage.removeItem('userInfo');
  },

  initializeAuth: () => {
    try {
      const storedUserInfo = localStorage.getItem('userInfo');
      if (storedUserInfo) {
        const userInfo: UserInfoModel = JSON.parse(storedUserInfo);
        set({
          userInfo,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({
          userInfo: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch {
      localStorage.removeItem('userInfo');
      set({
        userInfo: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  fetchUserInfo: async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/auth/me`,
        {
          method: 'GET',
          credentials: 'include', // 쿠키 자동 전송
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const userData: UserInfoModel = await response.json();
        set({
          userInfo: userData,
          isAuthenticated: true,
          isLoading: false,
        });
        // localStorage에 사용자 정보 저장
        localStorage.setItem('userInfo', JSON.stringify(userData));
        return true;
      } else {
        set({
          userInfo: null,
          isAuthenticated: false,
          isLoading: false,
        });
        localStorage.removeItem('userInfo');
        return false;
      }
    } catch {
      set({
        userInfo: null,
        isAuthenticated: false,
        isLoading: false,
      });
      localStorage.removeItem('userInfo');
      return false;
    }
  },
}));

export default useAuthStore;
