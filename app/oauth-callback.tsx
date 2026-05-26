import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_WEB_CLIENT_ID;
const WEB_CLIENT_SECRET = process.env.EXPO_PUBLIC_WEB_CLIENT_SECRET;

const ASYNC_KEY_ACCESS_TOKEN = '@ismart/drive_access_token';
const ASYNC_KEY_DRIVE_USER = '@ismart/drive_user';

export default function OAuthCallbackScreen() {
    const router = useRouter();
    const [error, setError] = useState('');

    useEffect(() => {
        (async () => {
            try {
                const params = Object.fromEntries(
                    new URLSearchParams(window.location.search)
                );

                if (params.error) throw new Error(params.error);
                if (!params.code) throw new Error('No code returned');

                const savedState = sessionStorage.getItem('oauth_state');
                if (params.state !== savedState) throw new Error('State mismatch');

                const redirectUri = sessionStorage.getItem('oauth_redirect_uri')!;

                const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: [
                        `code=${encodeURIComponent(params.code)}`,
                        `client_id=${encodeURIComponent(WEB_CLIENT_ID!)}`,
                        `client_secret=${encodeURIComponent(WEB_CLIENT_SECRET!)}`,
                        `redirect_uri=${encodeURIComponent(redirectUri)}`,
                        `grant_type=authorization_code`,
                    ].join('&'),
                });

                const tokenJson = await tokenRes.json();
                if (!tokenJson.access_token) {
                    throw new Error(`Token exchange failed: ${JSON.stringify(tokenJson)}`);
                }

                const accessToken = tokenJson.access_token;

                const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });
                const profile = await profileRes.json();

                const driveUser = {
                    email: profile.email ?? 'unknown',
                    name: profile.name ?? profile.given_name ?? undefined,
                };

                await AsyncStorage.setItem(ASYNC_KEY_ACCESS_TOKEN, accessToken);
                await AsyncStorage.setItem(ASYNC_KEY_DRIVE_USER, JSON.stringify(driveUser));

                sessionStorage.removeItem('oauth_state');
                sessionStorage.removeItem('oauth_redirect_uri');

                router.replace('/(backup)' as any);
            } catch (e: any) {
                setError(e.message ?? 'OAuth failed');
            }
        })();
    }, []);

    if (error) {
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: 'red' }}>{error}</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <ActivityIndicator size="large" color="#4a6fa5" />
            <Text style={{ color: '#8a93a6', fontSize: 14 }}>Completing sign-in…</Text>
        </View>
    );
}