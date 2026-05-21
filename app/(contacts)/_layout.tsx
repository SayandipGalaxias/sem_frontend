import { Stack } from 'expo-router';

export default function ContactsLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: 'ios_from_right',
            }}
        />
    );
}