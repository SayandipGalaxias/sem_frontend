import { LocalStorageItems } from '@/constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform } from 'react-native';

const axiosInstance = axios.create({
    baseURL: Platform.OS === 'web'
        ? process.env.EXPO_PUBLIC_WEB_BASE_API_URL
        : process.env.EXPO_PUBLIC_ANDROID_BASE_API_URL,
});

axiosInstance.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem(LocalStorageItems.TOKEN);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export default axiosInstance;