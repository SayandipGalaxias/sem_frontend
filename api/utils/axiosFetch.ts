import axios from 'axios';
import { Platform } from 'react-native';

function getBaseURL(): string {
    if (Platform.OS === 'web') {
        return process.env.EXPO_PUBLIC_WEB_BASE_API_URL!;
    }

    if (process.env.EXPO_PUBLIC_IS_PHYSICAL_DEVICE === 'true') {
        return process.env.EXPO_PUBLIC_LAN_BASE_API_URL!;
    }

    if (Platform.OS === 'ios') {
        return process.env.EXPO_PUBLIC_WEB_BASE_API_URL!;
    }

    return process.env.EXPO_PUBLIC_ANDROID_EMULATOR_BASE_API_URL!;
}

const axiosInstance = axios.create({
    baseURL: getBaseURL(),
});

// axiosInstance.interceptors.request.use(async (config) => {
//     const token = await AsyncStorage.getItem(LocalStorageItems.TOKEN);
//     if (token) config.headers.Authorization = `Bearer ${token}`;
//     return config;
// });

export default axiosInstance;