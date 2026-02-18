import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import Cookies from 'js-cookie';

interface MenuItem {
  id: number;
  name: string;
  routeUrl: string;
  fontIcon: string;
  type: string;
  SubMenu?: MenuItem[];
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  employeeCode?: string;
  roleId: number;
  roleName?: string;
  organizationId: number;
  baseCurrency?: string;
  baseCurrencyId?: number;
  photo?: string;
  permissions: string[];
  menus?: { data: MenuItem[] };
  loginFlag?: string;
  consentFormSign?: number;
  monthDays?: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  requires2FA: boolean;
  qrCode?: string;
  secretKey?: string;
  tempUserData?: Partial<User> & { token?: string };
  
  // Actions
  login: (user: User, token: string) => void;
  setAuth: (user: User, token: string) => void;
  setRequires2FA: (requires: boolean, qrCode?: string, secretKey?: string, tempData?: Partial<User> & { token?: string }) => void;
  complete2FA: () => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  getMenus: () => MenuItem[];
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      requires2FA: false,
      qrCode: undefined,
      secretKey: undefined,
      tempUserData: undefined,

      login: (user, token) => {
        Cookies.set('token', token, { expires: 1, sameSite: 'lax' }); // Expires in 1 day
        Cookies.set('user', JSON.stringify({ id: user.id, roleId: user.roleId }), { expires: 1, sameSite: 'lax' });
        set({ user, token, isAuthenticated: true, requires2FA: false, tempUserData: undefined });
      },

      setAuth: (user, token) => {
        Cookies.set('token', token, { expires: 1, sameSite: 'lax' }); // Expires in 1 day
        Cookies.set('user', JSON.stringify({ id: user.id, roleId: user.roleId }), { expires: 1, sameSite: 'lax' });
        set({ user, token, isAuthenticated: true, requires2FA: false, tempUserData: undefined });
      },

      setRequires2FA: (requires, qrCode, secretKey, tempData) => {
        set({ requires2FA: requires, qrCode, secretKey, tempUserData: tempData });
      },

      complete2FA: () => {
        const { tempUserData } = get();
        if (tempUserData && tempUserData.token) {
          const { token, ...userData } = tempUserData;
          Cookies.set('token', token, { expires: 1, sameSite: 'lax' });
          Cookies.set('user', JSON.stringify({ id: userData.id, roleId: userData.roleId }), { expires: 1, sameSite: 'lax' });
          set({ 
            user: userData as User, 
            token, 
            isAuthenticated: true, 
            requires2FA: false,
            tempUserData: undefined,
            qrCode: undefined,
            secretKey: undefined
          });
        }
      },

      logout: () => {
        Cookies.remove('token');
        Cookies.remove('user');
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false, 
          requires2FA: false,
          qrCode: undefined,
          secretKey: undefined,
          tempUserData: undefined
        });
      },

      hasPermission: (permission) => {
        const { user } = get();
        if (!user?.permissions) return false;
        return user.permissions.includes(permission);
      },

      getMenus: () => {
        const { user } = get();
        return user?.menus?.data || [];
      },

      isAdmin: () => {
        const { user } = get();
        // Role IDs: 1 = Super Admin, 2 = HR
        return user?.roleId === 1 || user?.roleId === 2;
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
