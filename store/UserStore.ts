import { User } from '@/api/User/types';
import { create } from 'zustand';
import { useEncryptionStore } from './EncryptionStore';

interface UserStore {
    user: User | undefined;
    isAuthenticated: boolean;
    hydrated: boolean;
    setUser: (user: User) => void;
    clearUser: () => void;
    setHydrated: (value: boolean) => void;
}

export const useUserStore = create<UserStore>((set) => ({
    user: undefined,
    isAuthenticated: false,
    hydrated: false,
    setUser: (user) => set({ user, isAuthenticated: true }),
    clearUser: () => set({ user: undefined, isAuthenticated: false }),
    setHydrated: (value) => set({ hydrated: value }),
}));

export const revertAll = async () => {
    // await SecretsApi.clearAll();
    const email = useUserStore.getState().user?.email ?? '';
    // await useEncryptionStore.getState().clearRandomString(email);
    useEncryptionStore.setState({ randomString: '' });
    useUserStore.setState({ user: undefined, isAuthenticated: false });
};