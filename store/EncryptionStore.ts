import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

const makeKey = (email: string) =>
    `encryption_random_string_${email.replace(/[^a-zA-Z0-9_]/g, '_')}`;

interface EncryptionStore {
    randomString: string;
    loadRandomString: (email: string) => Promise<void>;
    saveRandomString: (email: string, randomString: string) => Promise<void>;
    clearRandomString: (email: string) => Promise<void>;
}

export const useEncryptionStore = create<EncryptionStore>((set) => ({
    randomString: '',

    loadRandomString: async (email: string) => {
        try {
            const key = makeKey(email);
            const stored = await SecureStore.getItemAsync(key);
            if (stored) {
                set({ randomString: stored });
            } else {
                set({ randomString: '' });
            }
        } catch (e) {
            console.warn('Failed to load randomString from SecureStore', e);
        }
    },

    saveRandomString: async (email: string, randomString: string) => {
        try {
            const key = makeKey(email);
            await SecureStore.setItemAsync(key, randomString);
            set({ randomString });
        } catch (e) {
            console.warn('Failed to save randomString to SecureStore', e);
        }
    },

    clearRandomString: async (email: string) => {
        try {
            const key = makeKey(email);
            await SecureStore.deleteItemAsync(key);
            set({ randomString: '' });
        } catch (e) {
            console.warn('Failed to clear randomString from SecureStore', e);
        }
    },
}));