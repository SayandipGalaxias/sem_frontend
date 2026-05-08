import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';
import Toast from 'react-native-toast-message';

export async function authenticateWithBiometrics(reason = 'Authenticate to view secret'): Promise<boolean> {
    if (Platform.OS === 'web') return true;

    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) {
        Toast.show({ type: 'error', text1: 'Biometrics not supported on this device' });
        return false;
    }

    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!isEnrolled) {
        Toast.show({ type: 'error', text1: 'No biometrics enrolled', text2: 'Please set up fingerprint or face ID in device settings' });
        return false;
    }

    const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        fallbackLabel: 'Use Passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
    });

    return result.success;
}