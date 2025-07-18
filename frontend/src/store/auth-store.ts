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
}

const useAuthStore = create<AuthStateProps>((set) => ({
  userInfo: null,
  isLoading: true,
  isAuthenticated: false,

  setUserInfo: (userInfo) =>
    set({
      userInfo,
      isAuthenticated: !!userInfo,
      isLoading: false,
    }),

  setLoading: (isLoading) => set({ isLoading }),

  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

  clearAuth: () =>
    set({
      userInfo: null,
      isAuthenticated: false,
      isLoading: false,
    }),

  fetchUserInfo: async () => {
    // 쿠키에서 access 토큰 추출
    const cookies = document.cookie.split(';').reduce(
      (acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      },
      {} as Record<string, string>
    );

    const accessToken = cookies['access'];

    if (!accessToken) {
      set({ userInfo: null, isAuthenticated: false, isLoading: false });
      return false;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/auth/me`,
        {
          method: 'GET',
          credentials: 'include', // 쿠키 자동 전송
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
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
        return true;
      } else {
        set({
          userInfo: null,
          isAuthenticated: false,
          isLoading: false,
        });
        return false;
      }
    } catch {
      set({
        userInfo: null,
        isAuthenticated: false,
        isLoading: false,
      });
      return false;
    }
  },
}));

export default useAuthStore;
