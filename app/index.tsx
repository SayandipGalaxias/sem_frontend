import { useUserStore } from '@/store/UserStore';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Colors } from '../constants/theme';

export default function Index() {
    const { isAuthenticated, hydrated } = useUserStore();
    const router = useRouter();

    useEffect(() => {
        if (!hydrated) return;

        if (isAuthenticated) {
            router.replace('/(dashboard)');
        } else {
            router.replace('/login');
        }
    }, [hydrated, isAuthenticated]);

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.dark.background }}>
            <ActivityIndicator color={Colors.dark.background} />
        </View>
    );
}