import { Stack } from 'expo-router';
import React from 'react';

export default function BackupLayout() {
    return (
        <Stack screenOptions={{ headerShown: false, animation: 'ios_from_right' }} />
    );
}