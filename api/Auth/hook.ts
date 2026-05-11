// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useRouter } from 'expo-router';
// import { useState } from 'react';
// import Toast from 'react-native-toast-message';
// import { AuthApi } from '.';

// import { LocalStorageItems } from '@/constants/config';
// import { useUserStore } from '@/store/UserStore';
// import { Platform } from 'react-native';
// import { errorHandler } from '../utils/handlers';
// import { LoginRequest, RegisterRequest } from './types';

// export function useAuthApi() {
//     const [loading, setLoading] = useState(false);
//     const setUser = useUserStore((store) => store.setUser);
//     const router = useRouter();

//     async function login(payload: LoginRequest) {
//         setLoading(true);
//         try {
//             const { data: { data: res } } = await AuthApi.login(payload);
//             const user = { email: payload.email, type: 'user' };
//             await AsyncStorage.setItem(LocalStorageItems.TOKEN, res.token);
//             await AsyncStorage.setItem(LocalStorageItems.USER, JSON.stringify(user));
//             setUser(user);
//             if (Platform.OS === 'web') {
//                 router.replace('/dashboard' as any);
//             } else {
//                 router.replace('/(dashboard)' as any);
//             }
//         } catch (error) {
//             Toast.show({ type: 'error', text1: errorHandler(error) });
//         } finally {
//             setLoading(false);
//         }
//     }

//     async function logout() {
//         useUserStore.setState({ user: undefined, isAuthenticated: false });
//         await AsyncStorage.clear();
//         router.replace('/login');
//     }

//     async function register(email: string, password: string, payload: RegisterRequest) {
//         setLoading(true);
//         try {
//             const response = await AuthApi.register(payload);

//             if (!response.data?.success) {
//                 Toast.show({ type: 'error', text1: 'Registration failed' });
//                 return;
//             }

//             await login({ email: payload.email, password: payload.password });

//         } catch (error: any) {
//             const status = error?.response?.status;
//             const serverMessage = error?.response?.data?.message ?? error?.response?.data?.error;

//             const friendlyMessage =
//                 status === 409 ? 'An account with this email already exists' :
//                     status === 500 ? (serverMessage ?? 'Server error, please try again later') :
//                         status === 400 ? (serverMessage ?? 'Invalid email or password') :
//                             serverMessage ?? 'Something went wrong';

//             Toast.show({ type: 'error', text1: friendlyMessage });
//         } finally {
//             setLoading(false);
//         }
//     }

//     return { loading, login, register, logout };
// }

import { LocalStorageItems } from '@/constants/config';
import { useEncryptionStore } from '@/store/EncryptionStore';
import { useUserStore } from '@/store/UserStore';
import { generateRandomString } from '@/utils/Utility';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import { AuthApi } from '.';
import { errorHandler } from '../utils/handlers';
import { LoginRequest, RegisterRequest } from './types';

export function useAuthApi() {
    const [loading, setLoading] = useState(false);
    const setUser = useUserStore((store) => store.setUser);
    const router = useRouter();

    async function login(payload: LoginRequest) {
        setLoading(true);
        try {
            const { data: { data: res } } = await AuthApi.login(payload);
            const user = { email: payload.email, type: 'user' };

            await AsyncStorage.setItem(LocalStorageItems.TOKEN, res.token);
            await AsyncStorage.setItem(LocalStorageItems.USER, JSON.stringify(user));
            setUser(user);

            await useEncryptionStore.getState().loadRandomString();

            if (!useEncryptionStore.getState().randomString) {
                const newRandomString = generateRandomString(10);
                await useEncryptionStore.getState().saveRandomString(newRandomString);
            }

            if (Platform.OS === 'web') {
                router.replace('/dashboard' as any);
            } else {
                router.replace('/(dashboard)' as any);
            }
        } catch (error) {
            Toast.show({ type: 'error', text1: errorHandler(error) });
        } finally {
            setLoading(false);
        }
    }

    async function logout() {
        await useEncryptionStore.getState().clearRandomString();
        useUserStore.setState({ user: undefined, isAuthenticated: false });
        await AsyncStorage.clear();
        router.replace('/login');
    }

    async function register(email: string, password: string, payload: RegisterRequest) {
        setLoading(true);
        try {
            const response = await AuthApi.register(payload);
            if (!response.data?.success) {
                Toast.show({ type: 'error', text1: 'Registration failed' });
                return;
            }
            const newRandomString = generateRandomString(10);
            await useEncryptionStore.getState().saveRandomString(newRandomString);

            await login({ email: payload.email, password: payload.password });
        } catch (error: any) {
            const status = error?.response?.status;
            const serverMessage = error?.response?.data?.message ?? error?.response?.data?.error;
            const friendlyMessage =
                status === 409 ? 'An account with this email already exists' :
                    status === 500 ? (serverMessage ?? 'Server error, please try again later') :
                        status === 400 ? (serverMessage ?? 'Invalid email or password') :
                            serverMessage ?? 'Something went wrong';
            Toast.show({ type: 'error', text1: friendlyMessage });
        } finally {
            setLoading(false);
        }
    }

    return { loading, login, register, logout };
}