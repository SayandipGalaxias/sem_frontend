import { useAuthApi } from '@/api/Auth/hook';
import CommonButton from '@/components/CommonButton';
import { Colors } from '@/utils/colors';
import { CommonStylesFn } from '@/utils/CommonStyles';
import { Fonts } from '@/utils/Fonts';
import { moderateScale, scale, verticalScale, widthPx } from '@/utils/Responsive';
import { Utility } from '@/utils/Utility';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';

const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { register, loading } = useAuthApi();
    const router = useRouter();

    const handleSignUp = async () => {
        if (!Utility.isEmailValid(email)) {
            setError('Invalid email format');
            return;
        }
        if (!email.trim()) {
            setError('Email is required');
            return;
        }
        if (!password.trim()) {
            setError('Password is required');
            return;
        }
        setError('');
        await register(email, password, { email, password });
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.formContainer}>
                <View style={styles.card}>
                    <View style={styles.headerContainer}>
                        <Text style={CommonStylesFn.text(4, Colors.white, Fonts.bold)}>{'Sign up to'}</Text>
                        <Text style={CommonStylesFn.text(8, Colors.primary, Fonts.bold)}>
                            {'Secret Manager'}
                        </Text>
                    </View>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder={'Enter email'}
                            placeholderTextColor={Colors.textMuted}
                            value={email}
                            onChangeText={(text) => {
                                setEmail(text);
                                setError('');
                            }}
                            autoCapitalize={'none'}
                            autoCorrect={false}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder={'Enter password'}
                            placeholderTextColor={Colors.textMuted}
                            value={password}
                            onChangeText={(text) => {
                                setPassword(text);
                                setError('');
                            }}
                            autoCapitalize={'none'}
                            autoCorrect={false}
                        />
                    </View>
                    {error ? <Text style={styles.errorText}>{error}</Text> : null}
                    <CommonButton label={'Sign Up'} onPress={handleSignUp} containerStyle={styles.button} />
                    <Text style={styles.signUpText} onPress={() => router.replace('/login')}>Already have an account?</Text>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};

export default Signup;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        alignItems: 'center',
    },
    formContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: verticalScale(40),
    },
    headerContainer: {
        gap: verticalScale(10),
        alignItems: 'center',
        marginBottom: verticalScale(20),
    },
    card: {
        width: widthPx(85),
        backgroundColor: Colors.cardBackground,
        borderRadius: moderateScale(16),
        paddingHorizontal: scale(24),
        paddingVertical: verticalScale(24),
    },
    label: {
        marginBottom: verticalScale(8),
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    inputContainer: {
        gap: verticalScale(20),
        marginBottom: verticalScale(20),
    },
    signUpText: {
        ...CommonStylesFn.text(3.5, Colors.textMuted, Fonts.regular),
        marginBottom: verticalScale(10),
        textAlign: 'center',
    },
    button: {
        marginBottom: verticalScale(20),
    },
    input: {
        borderWidth: moderateScale(1),
        borderColor: Colors.borderColor,
        borderRadius: moderateScale(12),
        paddingHorizontal: scale(16),
        paddingVertical: verticalScale(16),
        backgroundColor: Colors.surface,
        ...CommonStylesFn.text(3.5, Colors.textPrimary, Fonts.regular),
    },
    errorText: {
        ...CommonStylesFn.text(3.5, Colors.error, Fonts.regular),
        marginBottom: verticalScale(20),
        textAlign: 'center',
    },
});
