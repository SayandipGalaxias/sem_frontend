import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';
import Toast from 'react-native-toast-message';

export async function registerWebAuthnCredential(): Promise<boolean> {
    try {
        if (!window.PublicKeyCredential) return false;

        const challenge = crypto.getRandomValues(new Uint8Array(32));
        const userId = crypto.getRandomValues(new Uint8Array(16));

        const credential = await navigator.credentials.create({
            publicKey: {
                challenge,
                rp: {
                    name: 'iSmart Manager',
                    id: window.location.hostname,
                },
                user: {
                    id: userId,
                    name: 'ismartappuser',
                    displayName: 'iSmart App User',
                },
                pubKeyCredParams: [
                    { type: 'public-key', alg: -7 },
                    { type: 'public-key', alg: -257 },
                ],
                authenticatorSelection: {
                    authenticatorAttachment: 'platform',
                    userVerification: 'required',
                },
                timeout: 60000,
            },
        });

        if (!credential) return false;

        const credId = (credential as PublicKeyCredential).rawId;
        const credIdBase64 = btoa(String.fromCharCode(...new Uint8Array(credId)));
        localStorage.setItem('webauthn_cred_id', credIdBase64);

        Toast.show({ type: 'success', text1: 'Biometrics registered successfully' });
        return true;
    } catch (err: any) {
        Toast.show({ type: 'error', text1: 'Registration failed', text2: err.message });
        return false;
    }
}

async function authenticateWithWebAuthn(reason: string): Promise<boolean> {
    try {
        if (!window.PublicKeyCredential) return false;

        const credIdBase64 = localStorage.getItem('webauthn_cred_id');
        if (!credIdBase64) {
            Toast.show({ type: 'info', text1: 'Setting up biometrics...', text2: 'Please authenticate once to register' });
            return await registerWebAuthnCredential();
        }

        const credIdBytes = Uint8Array.from(atob(credIdBase64), c => c.charCodeAt(0));

        const challenge = crypto.getRandomValues(new Uint8Array(32));

        const credential = await navigator.credentials.get({
            publicKey: {
                challenge,
                timeout: 60000,
                userVerification: 'required',
                rpId: window.location.hostname,
                allowCredentials: [
                    {
                        type: 'public-key',
                        id: credIdBytes,
                        transports: ['internal'],
                    },
                ],
            },
        });

        return !!credential;
    } catch (err: any) {
        if (err.name !== 'NotAllowedError') {
            Toast.show({ type: 'error', text1: 'Authentication failed', text2: err.message });
        }
        return false;
    }
}

async function authenticateNative(reason: string): Promise<boolean> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) {
        Toast.show({ type: 'error', text1: 'Biometrics not supported on this device' });
        return false;
    }

    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!isEnrolled) {
        Toast.show({
            type: 'error',
            text1: 'No biometrics enrolled',
            text2: 'Please set up fingerprint or Face ID in device settings',
        });
        return false;
    }

    const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        fallbackLabel: 'Use Device Passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
    });

    return result.success;
}

export async function authenticateWithBiometrics(
    reason = 'Authenticate to view secret'
): Promise<boolean> {
    if (Platform.OS === 'web') {
        return authenticateWithWebAuthn(reason);
    }
    return authenticateNative(reason);
}