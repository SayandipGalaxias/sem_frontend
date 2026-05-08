import { Stack } from 'expo-router';

export default function DashboardLayout() {
    return (
        <Stack screenOptions={{ headerShown: false, animation: 'ios_from_right' }} />
    );
}