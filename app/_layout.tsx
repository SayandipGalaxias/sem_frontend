import { useEncryptionStore } from '@/store/EncryptionStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { LocalStorageItems } from '../constants/config';
import '../global.css';
import { useUserStore } from '../store/UserStore';
import { Utility } from '../utils/Utility';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const colorScheme = useColorScheme();
    const { setUser, setHydrated } = useUserStore();
    const { loadRandomString } = useEncryptionStore();

    const [fontsLoaded] = useFonts({
        Inter: require('../assets/fonts/Inter.ttf'),
    });

    useEffect(() => {
        async function hydrateAuth() {
            try {
                const userRaw = await AsyncStorage.getItem(LocalStorageItems.USER);
                if (userRaw) {
                    const user = JSON.parse(userRaw);
                    setUser(user);
                    await loadRandomString(user.email);
                }
            } catch (e) {
                console.warn('Failed to hydrate auth', e);
            } finally {
                setHydrated(true);
            }
        }
        hydrateAuth();
    }, []);

    useEffect(() => {
        if (fontsLoaded) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded]);

    if (!fontsLoaded) return null;

    return (
        <>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
            <SafeAreaView className="flex-1 bg-[#e8ecf4] dark:bg-black">
                <Stack screenOptions={{ headerShown: false, animation: 'ios_from_right' }}>
                    <Stack.Screen name="index" />
                    <Stack.Screen name="login" />
                    <Stack.Screen name="register" />
                    <Stack.Screen name="(dashboard)" />
                    <Stack.Screen name="(create)" />
                    <Stack.Screen name="(view)" />
                    <Stack.Screen name="(connect)" />
                    <Stack.Screen name="(contacts)" />
                    <Stack.Screen name="(pricing)" />
                </Stack>
                <Toast config={Utility.toastConfig} />
            </SafeAreaView>
        </>
    );
}