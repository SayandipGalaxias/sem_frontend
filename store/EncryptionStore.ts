// import { create } from 'zustand';


// interface EncryptionStore {
//     randomString: string;
//     updateRandomString: (randomString: string) => void;
//     getItem: (key: string) => string | null;
//     setItem: (key: string, value: string) => void;
//     removeItem: (key: string) => void;
// }

// export const useEncryptionStore = create<EncryptionStore>((set) => ({
//     randomString: '',
//     updateRandomString: (randomString) => set({ randomString }),
//     getItem: (key: string) => {
//         try {
//             const value = localStorage.getItem(key);
//             return value;
//         } catch (e) {
//             console.warn('Failed to get item from localStorage', e);
//             return null;
//         }
//     },
//     setItem: (key: string, value: string) => {
//         try {
//             localStorage.setItem(key, value);
//         } catch (e) {
//             console.warn('Failed to set item in localStorage', e);
//         }
//     },
//     removeItem: (key: string) => {
//         try {
//             localStorage.removeItem(key);
//         } catch (e) {
//             console.warn('Failed to remove item from localStorage', e);
//         }
//     },
// }));

import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

const RANDOM_STRING_KEY = 'encryption_random_string';

interface EncryptionStore {
    randomString: string;
    loadRandomString: () => Promise<void>;
    saveRandomString: (randomString: string) => Promise<void>;
    clearRandomString: () => Promise<void>;
}

export const useEncryptionStore = create<EncryptionStore>((set) => ({
    randomString: '',

    loadRandomString: async () => {
        try {
            const stored = await SecureStore.getItemAsync(RANDOM_STRING_KEY);
            if (stored) {
                set({ randomString: stored });
            }
        } catch (e) {
            console.warn('Failed to load randomString from SecureStore', e);
        }
    },

    saveRandomString: async (randomString: string) => {
        try {
            await SecureStore.setItemAsync(RANDOM_STRING_KEY, randomString);
            set({ randomString });
        } catch (e) {
            console.warn('Failed to save randomString to SecureStore', e);
        }
    },

    clearRandomString: async () => {
        try {
            await SecureStore.deleteItemAsync(RANDOM_STRING_KEY);
            set({ randomString: '' });
        } catch (e) {
            console.warn('Failed to clear randomString from SecureStore', e);
        }
    },
}));