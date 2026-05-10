import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';


import CustomSplash from '@/components/CustomeSplash';
import { LocalStorageItems } from '../constants/config';
import '../global.css';
import { useUserStore } from '../store/UserStore';
import { Utility } from '../utils/Utility';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const colorScheme = useColorScheme();

    const { setUser, setHydrated } = useUserStore();

    const [showSplash, setShowSplash] = useState(true);

    const [fontsLoaded] = useFonts({
        Inter: require('../assets/fonts/Inter.ttf'),
    });

    useEffect(() => {
        async function hydrateAuth() {
            try {
                const token = await AsyncStorage.getItem(LocalStorageItems.TOKEN);

                const userRaw = await AsyncStorage.getItem(LocalStorageItems.USER);

                if (token && userRaw) {
                    const user = JSON.parse(userRaw);
                    setUser(user);
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
        async function prepare() {
            if (fontsLoaded) {
                await SplashScreen.hideAsync();
            }
        }

        prepare();
    }, [fontsLoaded]);

    if (!fontsLoaded) return null;

    if (showSplash) {
        return (
            <CustomSplash onFinish={() => setShowSplash(false)} />
        );
    }

    return (
        <>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
            <SafeAreaView className="flex-1 bg-[#e8ecf4] dark:bg-black">
                <Stack screenOptions={{ headerShown: false, animation: 'ios_from_right', }}>
                    <Stack.Screen name="index" />
                    <Stack.Screen name="login" />
                    <Stack.Screen name="register" />
                    <Stack.Screen name="(dashboard)" />
                    <Stack.Screen name="(create)" />
                    <Stack.Screen name="(view)" />
                </Stack>
                <Toast config={Utility.toastConfig} />
            </SafeAreaView>
        </>
    );
}