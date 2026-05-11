import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native';
import { useSecretsApi } from '../api/Secrets/hook';
import { Colors } from '../utils/colors';
import { moderateScale } from '../utils/Responsive';

const TABLET_WIDTH = 768;
const DESKTOP_WIDTH = 1100;

export default function CreateSecretScreen() {
    const router = useRouter();
    const { width } = useWindowDimensions();
    const params = useLocalSearchParams<{ id?: string; name?: string; secret?: string; description?: string }>();

    const isEditing = !!params.id;

    const [secretName, setSecretName] = useState(params.name ?? '');
    const [secret, setSecret] = useState(params.secret ?? '');
    const [secretDescription, setSecretDescription] = useState(params.description ?? '');
    const [error, setError] = useState('');

    const { addSecret, updateSecret, loading } = useSecretsApi();

    const isTablet = width >= TABLET_WIDTH;
    const isDesktop = width >= DESKTOP_WIDTH;

    const handleSubmit = async () => {
        if (!secretName.trim()) { setError('Secret name is required'); return; }
        if (!secretDescription.trim()) { setError('Note is required'); return; }
        if (!secret.trim()) { setError('Secret value is required'); return; }
        setError('');

        if (isEditing) {
            await updateSecret({ id: params.id!, name: secretName, secret, description: secretDescription });
        } else {
            await addSecret({ name: secretName, secret, description: secretDescription });
        }
        router.back();
    };

    return (
        <View className="flex-1 bg-[#e8ecf4] dark:bg-black">
            <View className="flex-1 bg-[#e8ecf4] dark:bg-black w-full max-w-7xl mx-auto">

                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingHorizontal: isDesktop ? 48 : isTablet ? 32 : 20,
                        paddingVertical: isTablet ? 20 : 16,
                        backgroundColor: 'transparent',
                        borderBottomWidth: isTablet ? 1 : 0,
                        borderBottomColor: 'rgba(74,111,165,0.10)',
                    }}
                >
                    <TouchableOpacity
                        onPress={() => router.back()}
                        activeOpacity={0.8}
                        style={{
                            width: isTablet ? 44 : 44,
                            height: isTablet ? 44 : 44,
                            borderRadius: 22,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                        className="bg-[#dce1ec] dark:bg-zinc-900"
                    >
                        <Ionicons name="arrow-back" size={22} color="#4a6fa5" />
                    </TouchableOpacity>

                    <View style={{ alignItems: 'center', gap: 2 }}>
                        <Text
                            style={{ fontSize: isTablet ? 18 : 16, fontWeight: '600' }}
                            className="text-black dark:text-white"
                        >
                            {isEditing ? 'Update Secret' : 'New Secret'}
                        </Text>
                        {isTablet && (
                            <Text style={{ fontSize: 12, color: '#8a93a6' }}>
                                {isEditing ? 'Modify your stored secret' : 'Store a new encrypted secret'}
                            </Text>
                        )}
                    </View>

                    {isTablet ? (
                        <View
                            style={{
                                width: 44,
                                height: 44,
                                borderRadius: 22,
                                backgroundColor: '#4a6fa5',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Ionicons name="shield-checkmark-outline" size={20} color="#fff" />
                        </View>
                    ) : (
                        <View style={{ width: 44 }} />
                    )}
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView
                        contentContainerStyle={{
                            flexGrow: 1,
                            justifyContent: isTablet ? 'flex-start' : 'center',
                            paddingBottom: 40,
                        }}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                        bounces={false}
                    >
                        {isDesktop ? (
                            <View
                                style={{
                                    flexDirection: 'row',
                                    paddingHorizontal: 48,
                                    paddingTop: 40,
                                    gap: 32,
                                    alignItems: 'flex-start',
                                }}
                            >
                                <View style={{ flex: 1, paddingTop: 8 }}>
                                    <InfoPanel isEditing={isEditing} />
                                </View>

                                <View style={{ flex: 2, maxWidth: 600 }}>
                                    <FormCard
                                        secretName={secretName}
                                        setSecretName={setSecretName}
                                        secretDescription={secretDescription}
                                        setSecretDescription={setSecretDescription}
                                        secret={secret}
                                        setSecret={setSecret}
                                        error={error}
                                        setError={setError}
                                        loading={loading}
                                        isEditing={isEditing}
                                        isTablet={isTablet}
                                        handleSubmit={handleSubmit}
                                    />
                                </View>
                            </View>
                        ) : (
                            <View
                                style={{
                                    paddingHorizontal: isTablet ? 48 : 32,
                                    paddingTop: isTablet ? 32 : 24,
                                    width: '100%',
                                    maxWidth: isTablet ? 640 : undefined,
                                    alignSelf: 'center',
                                }}
                            >
                                {isTablet && <InfoBanner isEditing={isEditing} />}
                                <FormCard
                                    secretName={secretName}
                                    setSecretName={setSecretName}
                                    secretDescription={secretDescription}
                                    setSecretDescription={setSecretDescription}
                                    secret={secret}
                                    setSecret={setSecret}
                                    error={error}
                                    setError={setError}
                                    loading={loading}
                                    isEditing={isEditing}
                                    isTablet={isTablet}
                                    handleSubmit={handleSubmit}
                                />
                            </View>
                        )}
                    </ScrollView>
                </KeyboardAvoidingView>

            </View>
        </View>
    );
}

function InfoPanel({ isEditing }: { isEditing: boolean }) {
    const features = [
        { icon: 'lock-closed-outline' as const, label: 'AES-256 encryption at rest' },
        { icon: 'cloud-done-outline' as const, label: 'Synced across your devices' },
    ];

    return (
        <View style={{ gap: 32 }}>
            <View
                style={{
                    width: 72,
                    height: 72,
                    borderRadius: 24,
                    backgroundColor: '#4a6fa5',
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#4a6fa5',
                    shadowOpacity: 0.4,
                    shadowRadius: 20,
                    shadowOffset: { width: 0, height: 8 },
                }}
            >
                <Ionicons name={isEditing ? 'create-outline' : 'key-outline'} size={34} color="#fff" />
            </View>

            <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 28, fontWeight: '700', color: '#1a1a2e', lineHeight: 34 }}
                    className="dark:text-white">
                    {isEditing ? 'Update your\nsecret' : 'Store a new\nsecret'}
                </Text>
                <Text style={{ fontSize: 15, color: '#8a93a6', lineHeight: 22 }}>
                    Your credentials are encrypted before leaving your device and stored with bank-grade security.
                </Text>
            </View>

            <View style={{ gap: 16 }}>
                {features.map(({ icon, label }) => (
                    <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(74,111,165,0.12)', alignItems: 'center', justifyContent: 'center', }}>
                            <Ionicons name={icon} size={18} color="#4a6fa5" />
                        </View>
                        <Text style={{ fontSize: 14, color: '#4a5568', fontWeight: '500' }} className="dark:text-gray-300">{label}
                        </Text>
                    </View>
                ))}
            </View>
        </View>
    );
}

function InfoBanner({ isEditing }: { isEditing: boolean }) {
    return (
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                backgroundColor: 'rgba(74,111,165,0.10)',
                borderRadius: 16,
                paddingHorizontal: 20,
                paddingVertical: 16,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: 'rgba(74,111,165,0.15)',
            }}
        >
            <View
                style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: '#4a6fa5', alignItems: 'center', justifyContent: 'center', }}>
                <Ionicons name={isEditing ? 'create-outline' : 'key-outline'} size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#4a6fa5', marginBottom: 2 }}>
                    {isEditing ? 'Editing existing secret' : 'Creating a new secret'}
                </Text>
                <Text style={{ fontSize: 12, color: '#8a93a6', lineHeight: 18 }}>
                    Encrypted end-to-end · Stored securely
                </Text>
            </View>
        </View>
    );
}

interface FormCardProps {
    secretName: string;
    setSecretName: (v: string) => void;
    secretDescription: string;
    setSecretDescription: (v: string) => void;
    secret: string;
    setSecret: (v: string) => void;
    error: string;
    setError: (v: string) => void;
    loading: boolean;
    isEditing: boolean;
    isTablet: boolean;
    handleSubmit: () => void;
}

function FormCard({
    secretName, setSecretName,
    secretDescription, setSecretDescription,
    secret, setSecret,
    error, setError,
    loading, isEditing, isTablet,
    handleSubmit,
}: FormCardProps) {
    const padding = isTablet ? 32 : 24;
    const gap = isTablet ? 20 : 16;

    return (
        <View>
            <View
                style={{
                    borderRadius: 28,
                    padding,
                    gap,
                    shadowColor: '#000',
                    shadowOpacity: isTablet ? 0.08 : 0,
                    shadowRadius: isTablet ? 24 : 0,
                    shadowOffset: { width: 0, height: 8 },
                    elevation: isTablet ? 4 : 0,
                }}
                className="bg-[#dce1ec] dark:bg-zinc-900"
            >
                <FieldGroup
                    label="Name"
                    icon="pencil-outline"
                    isTablet={isTablet}
                    input={
                        <TextInput
                            value={secretName}
                            onChangeText={(t) => { setSecretName(t); setError(''); }}
                            placeholder="Enter secret name"
                            placeholderTextColor="#8a93a6"
                            autoCapitalize="none"
                            autoCorrect={false}
                            style={{
                                flex: 1,
                                fontSize: isTablet ? 15 : 14,
                                color: '#000',
                                paddingVertical: isTablet ? 16 : 14,
                            }}
                            className="dark:text-white p-0 focus:outline-none"
                        />
                    }
                />

                <FieldGroup
                    label="Note"
                    icon="document-text-outline"
                    isTablet={isTablet}
                    input={
                        <TextInput
                            value={secretDescription}
                            onChangeText={(t) => { setSecretDescription(t); setError(''); }}
                            placeholder="Enter a short note about this secret"
                            placeholderTextColor="#8a93a6"
                            autoCapitalize="none"
                            autoCorrect={false}
                            multiline
                            style={{
                                flex: 1,
                                fontSize: isTablet ? 15 : 14,
                                color: '#000',
                                paddingVertical: isTablet ? 16 : 14,
                                minHeight: isTablet ? 96 : 80,
                                textAlignVertical: 'top',
                            }}
                            className="dark:text-white p-0 focus:outline-none"
                        />
                    }
                />

                <FieldGroup
                    label="Secret"
                    icon="lock-closed-outline"
                    isTablet={isTablet}
                    input={
                        <TextInput
                            value={secret}
                            onChangeText={(t) => { setSecret(t); setError(''); }}
                            placeholder="Enter secret value"
                            placeholderTextColor="#8a93a6"
                            autoCapitalize="none"
                            autoCorrect={false}
                            multiline
                            style={{
                                flex: 1,
                                fontSize: isTablet ? 15 : 14,
                                color: '#000',
                                paddingVertical: isTablet ? 16 : 14,
                                minHeight: isTablet ? 96 : 80,
                                textAlignVertical: 'top',
                                fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                            }}
                            className="dark:text-white p-0 focus:outline-none"
                        />
                    }
                />

                {error ? (
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 10,
                            backgroundColor: 'rgba(239,68,68,0.08)',
                            borderRadius: 14,
                            paddingHorizontal: 16,
                            paddingVertical: 12,
                            borderWidth: 1,
                            borderColor: 'rgba(239,68,68,0.20)',
                        }}
                    >
                        <Ionicons name="alert-circle-outline" size={moderateScale(15)} color={Colors.error} />
                        <Text style={{ fontSize: 13, flex: 1 }} className="text-red-600 dark:text-red-400">{error}</Text>
                    </View>
                ) : null}

                {isTablet && (
                    <View style={{ height: 1, backgroundColor: 'rgba(74,111,165,0.10)', marginVertical: 4 }} />
                )}

                <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={loading}
                    activeOpacity={0.85}
                    style={{
                        borderRadius: 18,
                        paddingVertical: isTablet ? 18 : 16,
                        alignItems: 'center',
                        backgroundColor: '#4a6fa5',
                        opacity: loading ? 0.6 : 1,
                        flexDirection: 'row',
                        justifyContent: 'center',
                        gap: 10,
                        shadowColor: '#4a6fa5',
                        shadowOpacity: isTablet ? 0.35 : 0,
                        shadowRadius: 12,
                        shadowOffset: { width: 0, height: 6 },
                        elevation: isTablet ? 4 : 0,
                    }}
                >
                    {loading ? (
                        <Text style={{ fontSize: isTablet ? 15 : 14, fontWeight: '600', color: '#fff', letterSpacing: 0.5 }}>
                            Saving…
                        </Text>
                    ) : (
                        <>
                            <Ionicons
                                name={isEditing ? 'checkmark-circle-outline' : 'add-circle-outline'}
                                size={isTablet ? 20 : 18}
                                color="#fff"
                            />
                            <Text style={{ fontSize: isTablet ? 15 : 14, fontWeight: '600', color: '#fff', letterSpacing: 0.5 }}>
                                {isEditing ? 'Update Secret' : 'Create Secret'}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            <Text
                style={{
                    fontSize: 12,
                    color: '#8a93a6',
                    textAlign: 'center',
                    marginTop: 16,
                    paddingHorizontal: 24,
                    lineHeight: 18,
                }}
            >
                🔒 Your secret is encrypted before leaving this device.
            </Text>
        </View>
    );
}

interface FieldGroupProps {
    label: string;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    input: React.ReactNode;
    isTablet: boolean;
}

function FieldGroup({ label, icon, input, isTablet }: FieldGroupProps) {
    return (
        <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.2, marginLeft: 4, color: '#4a6fa5' }} className="dark:text-[#63b3ed]">
                {label}
            </Text>
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    // backgroundColor: '#e8ecf4',
                    borderRadius: 16,
                    paddingHorizontal: 16,
                    gap: 12,
                    borderWidth: isTablet ? 1 : 0,
                    borderColor: 'rgba(74,111,165,0.08)',
                }}
                className="bg-white dark:bg-black"
            >
                <View style={{ paddingTop: isTablet ? 18 : 16 }}>
                    <Ionicons name={icon} size={moderateScale(16)} color="#8a93a6" />
                </View>
                {input}
            </View>
        </View>
    );
}