import { StyleSheet, Text, View, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSecretsApi } from '../api/Secrets/hook';
import { moderateScale, scale, verticalScale, widthPx } from '../utils/Responsive';
import { Colors } from '../utils/colors';
import { Fonts } from '../utils/Fonts';
import { CommonStylesFn } from '../utils/CommonStyles';

export default function CreateSecretScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ id?: string; name?: string; secret?: string; description?: string }>();

    const isEditing = !!params.id;

    const [secretName, setSecretName] = useState(params.name ?? '');
    const [secret, setSecret] = useState(params.secret ?? '');
    const [secretDescription, setSecretDescription] = useState(params.description ?? '');
    const [error, setError] = useState('');

    const { addSecret, updateSecret, loading } = useSecretsApi();

    const handleSubmit = async () => {
        if (!secretName.trim()) { setError('Secret name is required'); return; }
        if (!secretDescription.trim()) { setError('Secret description is required'); return; }
        if (!secret.trim()) { setError('Secret is required'); return; }
        setError('');

        if (isEditing) {
            await updateSecret({ id: params.id!, name: secretName, secret, description: secretDescription });
        } else {
            await addSecret({ name: secretName, secret, description: secretDescription });
        }
        router.back();
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={moderateScale(24)} color={Colors.white} />
                </TouchableOpacity>
                <Text style={CommonStylesFn.text(5, Colors.white, Fonts.bold)}>
                    {isEditing ? 'Update Secret' : 'Create Secret'}
                </Text>
                <View style={{ width: moderateScale(24) }} />
            </View>

            <View style={styles.formContainer}>
                <View style={styles.card}>
                    <View style={styles.inputContainer}>
                        <View style={styles.textInputContainer}>
                            <Text style={styles.label}>Name</Text>
                            <TextInput style={styles.input} placeholder="Enter secret name" placeholderTextColor={Colors.textMuted} value={secretName} onChangeText={(t) => { setSecretName(t); setError(''); }} autoCapitalize="none" autoCorrect={false} />
                        </View>
                        <View style={styles.textInputContainer}>
                            <Text style={styles.label}>Description</Text>
                            <TextInput style={styles.input} placeholder="Enter secret description" placeholderTextColor={Colors.textMuted} value={secretDescription} onChangeText={(t) => { setSecretDescription(t); setError(''); }} autoCapitalize="none" autoCorrect={false} />
                        </View>
                        <View style={styles.textInputContainer}>
                            <Text style={styles.label}>Secret</Text>
                            <TextInput multiline style={[styles.input, { minHeight: verticalScale(80) }]} placeholder="Enter secret" placeholderTextColor={Colors.textMuted} value={secret} onChangeText={(t) => { setSecret(t); setError(''); }} autoCapitalize="none" autoCorrect={false} />
                        </View>
                        {error ? (
                            <Text style={[CommonStylesFn.text(3, Colors.error, Fonts.regular), styles.errorText]}>
                                {error}
                            </Text>
                        ) : null}
                    </View>

                    <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSubmit} disabled={loading}>
                        <Text style={CommonStylesFn.text(4, Colors.white, Fonts.bold)}>
                            {loading ? 'Saving...' : isEditing ? 'Update' : 'Create'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: scale(20),
        paddingVertical: verticalScale(16),
        backgroundColor: Colors.cardBackground,
    },
    formContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        width: widthPx(85),
        backgroundColor: Colors.cardBackground,
        borderRadius: moderateScale(16),
        paddingHorizontal: scale(24),
        paddingVertical: verticalScale(24),
    },
    inputContainer: {
        gap: verticalScale(20),
        marginBottom: verticalScale(20),
    },
    textInputContainer: {
        gap: verticalScale(8),
    },
    label: {
        ...CommonStylesFn.text(3.5, Colors.textPrimary, Fonts.regular),
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
    button: {
        backgroundColor: Colors.primary,
        borderRadius: moderateScale(12),
        paddingVertical: verticalScale(16),
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    errorText: {
        marginTop: verticalScale(8),
    },
});