import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import Toast from 'react-native-toast-message';
import { AuthApi } from '.';

import { LocalStorageItems } from '@/constants/config';
import { useUserStore } from '@/store/UserStore';
import { Platform } from 'react-native';
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
            if (Platform.OS === 'web') {
                router.replace('/dashboard' as any);
            } else {
                router.replace('/(dashboard)' as any);
            }
        } catch (error) {
            console.log('LOGIN ERROR:', error);
            Toast.show({ type: 'error', text1: errorHandler(error) });
        } finally {
            setLoading(false);
        }
    }

    async function logout() {
        useUserStore.setState({ user: undefined, isAuthenticated: false });
        await AsyncStorage.clear();
        router.replace('/login');
    }

    async function register(email: string, password: string, payload: RegisterRequest) {
        setLoading(true);
        try {
            const { data: { data: res } } = await AuthApi.register(payload);
            await AsyncStorage.setItem(LocalStorageItems.TOKEN, res.token);
            setUser({ email: payload.email, type: 'user' });
            router.replace('/(dashboard)' as any);
        } catch (error) {
            Toast.show({ type: 'error', text1: errorHandler(error) });
        } finally {
            setLoading(false);
        }
    }

    return { loading, login, register, logout };
}