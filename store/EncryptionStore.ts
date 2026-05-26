// import * as SecureStore from 'expo-secure-store';
// import { create } from 'zustand';

// const makeKey = (email: string) =>
//     `encryption_random_string_${email.replace(/[^a-zA-Z0-9_]/g, '_')}`;

// interface EncryptionStore {
//     randomString: string;
//     loadRandomString: (email: string) => Promise<void>;
//     saveRandomString: (email: string, randomString: string) => Promise<void>;
//     clearRandomString: (email: string) => Promise<void>;
// }

// export const useEncryptionStore = create<EncryptionStore>((set) => ({
//     randomString: '',

//     loadRandomString: async (email: string) => {
//         try {
//             const key = makeKey(email);
//             const stored = await SecureStore.getItemAsync(key);
//             if (stored) {
//                 set({ randomString: stored });
//             } else {
//                 set({ randomString: '' });
//             }
//         } catch (e) {
//             console.warn('Failed to load randomString from SecureStore', e);
//         }
//     },

//     saveRandomString: async (email: string, randomString: string) => {
//         try {
//             const key = makeKey(email);
//             await SecureStore.setItemAsync(key, randomString);
//             set({ randomString });
//         } catch (e) {
//             console.warn('Failed to save randomString to SecureStore', e);
//         }
//     },

//     clearRandomString: async (email: string) => {
//         try {
//             const key = makeKey(email);
//             await SecureStore.deleteItemAsync(key);
//             set({ randomString: '' });
//         } catch (e) {
//             console.warn('Failed to clear randomString from SecureStore', e);
//         }
//     },
// }));

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { create } from 'zustand';

const makeKey = (email: string) =>
    `encryption_random_string_${email.replace(/[^a-zA-Z0-9_]/g, '_')}`;

const storage = {
    async get(key: string): Promise<string | null> {
        if (Platform.OS === 'web') {
            return AsyncStorage.getItem(key);
        }
        return SecureStore.getItemAsync(key);
    },
    async set(key: string, value: string): Promise<void> {
        if (Platform.OS === 'web') {
            await AsyncStorage.setItem(key, value);
        } else {
            await SecureStore.setItemAsync(key, value);
        }
    },
    async delete(key: string): Promise<void> {
        if (Platform.OS === 'web') {
            await AsyncStorage.removeItem(key);
        } else {
            await SecureStore.deleteItemAsync(key);
        }
    },
};

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
            const stored = await storage.get(makeKey(email));
            set({ randomString: stored ?? '' });
        } catch (e) {
            console.warn('Failed to load randomString', e);
            set({ randomString: '' });
        }
    },
    saveRandomString: async (email: string, randomString: string) => {
        try {
            await storage.set(makeKey(email), randomString);
            set({ randomString });
        } catch (e) {
            console.warn('Failed to save randomString', e);
        }
    },
    clearRandomString: async (email: string) => {
        try {
            await storage.delete(makeKey(email));
            set({ randomString: '' });
        } catch (e) {
            console.warn('Failed to clear randomString', e);
        }
    },
}));