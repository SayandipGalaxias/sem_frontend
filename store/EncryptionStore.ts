import { create } from 'zustand';


interface EncryptionStore {
    randomString: string;
    updateRandomString: (randomString: string) => void;
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
    removeItem: (key: string) => void;
}

export const useEncryptionStore = create<EncryptionStore>((set) => ({
    randomString: '',
    updateRandomString: (randomString) => set({ randomString }),
    getItem: (key: string) => {
        try {
            const value = localStorage.getItem(key);
            return value;
        } catch (e) {
            console.warn('Failed to get item from localStorage', e);
            return null;
        }
    },
    setItem: (key: string, value: string) => {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.warn('Failed to set item in localStorage', e);
        }
    },
    removeItem: (key: string) => {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.warn('Failed to remove item from localStorage', e);
        }
    },
}));