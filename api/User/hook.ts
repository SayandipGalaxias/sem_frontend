import { useState } from 'react';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { UserApi } from '.';
import { errorHandler } from '../utils/handlers';
import type { RegisterRequest } from './types';

export function useUserApi() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function register(payload: RegisterRequest) {
        setLoading(true);
        try {
            await UserApi.register(payload);
            router.replace('/');
        } catch (error) {
            Toast.show({ type: 'error', text1: errorHandler(error) });
        } finally {
            setLoading(false);
        }
    }

    return { loading, register };
}