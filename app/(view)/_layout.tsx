import { Stack } from 'expo-router';

export default function ViewLayout() {
    return (
        <Stack screenOptions={{ headerShown: false, animation: 'ios_from_right' }} />
    );
}