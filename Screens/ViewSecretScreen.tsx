import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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
import { ToastType } from '../utils/const';
import { moderateScale } from '../utils/Responsive';
import { Utility } from '../utils/Utility';

const TABLET_WIDTH = 768;
const DESKTOP_WIDTH = 1100;

export default function ViewSecretScreen() {
    const router = useRouter();
    const { width } = useWindowDimensions();
    const params = useLocalSearchParams<{
        id?: string;
        name?: string;
        secret?: string;
        description?: string;
    }>();

    const { updateSecret, loading } = useSecretsApi();

    const [name, setName] = useState(params.name ?? '');
    const [description, setDescription] = useState(params.description ?? '');
    const [secret, setSecret] = useState('');
    const [secretVisible, setSecretVisible] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');
    const [decryptedSecret, setDecryptedSecret] = useState('');

    const isTablet = width >= TABLET_WIDTH;
    const isDesktop = width >= DESKTOP_WIDTH;

    const isDirty =
        name !== (params.name ?? '') ||
        description !== (params.description ?? '') ||
        decryptedSecret !== (secret ?? '');

    const handleCopy = async () => {
        await Clipboard.setStringAsync(decryptedSecret);
        setCopied(true);
        Utility.showToast(ToastType.success, 'Copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSave = async () => {
        if (!name.trim()) { setError('Secret name is required'); return; }
        if (!description.trim()) { setError('Description is required'); return; }
        if (!decryptedSecret.trim()) { setError('Secret value is required'); return; }
        setError('');
        await updateSecret({ id: params.id!, name, secret: decryptedSecret, description });
        router.back();
    };

    useEffect(() => {
        if (params.secret) {
            Promise.resolve(params.secret).then((res) => {
                setDecryptedSecret(res);
                setSecret(res);
            });
        }
    }, [params.secret]);

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
                        borderBottomWidth: isTablet ? 1 : 0,
                        borderBottomColor: 'rgba(74,111,165,0.10)',
                    }}
                >
                    <TouchableOpacity
                        onPress={() => router.back()}
                        activeOpacity={0.8}
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: 22,
                            // backgroundColor: '#dce1ec',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                        className="bg-[#dce1ec] dark:bg-zinc-900"
                    >
                        <Ionicons name="arrow-back" size={moderateScale(20)} color="#4a6fa5" />
                    </TouchableOpacity>

                    <View style={{ alignItems: 'center', gap: 2 }}>
                        <Text
                            style={{ fontSize: isTablet ? 18 : 16, fontWeight: '600' }}
                            className="text-black dark:text-white"
                        >
                            View Secret
                        </Text>
                        {isTablet && (
                            <Text style={{ fontSize: 12, color: '#8a93a6' }}>
                                Decrypted · Edit in place · Save on change
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
                                    <InfoPanel secretName={params.name} isDirty={isDirty} />
                                </View>
                                <View style={{ flex: 2, maxWidth: 600 }}>
                                    <FormCard
                                        name={name} setName={setName}
                                        description={description} setDescription={setDescription}
                                        decryptedSecret={decryptedSecret} setDecryptedSecret={setDecryptedSecret}
                                        secretVisible={secretVisible} setSecretVisible={setSecretVisible}
                                        copied={copied} handleCopy={handleCopy}
                                        error={error} setError={setError}
                                        loading={loading} isDirty={isDirty}
                                        isTablet={isTablet} handleSave={handleSave}
                                    />
                                </View>
                            </View>
                        ) : (
                            <View
                                style={{
                                    paddingHorizontal: isTablet ? 48 : 20,
                                    paddingTop: isTablet ? 32 : 0,
                                    paddingBottom: isTablet ? 0 : 32,
                                    width: '100%',
                                    maxWidth: isTablet ? 640 : undefined,
                                    alignSelf: 'center',
                                }}
                            >
                                {isTablet && <InfoBanner secretName={params.name} isDirty={isDirty} />}
                                <FormCard
                                    name={name} setName={setName}
                                    description={description} setDescription={setDescription}
                                    decryptedSecret={decryptedSecret} setDecryptedSecret={setDecryptedSecret}
                                    secretVisible={secretVisible} setSecretVisible={setSecretVisible}
                                    copied={copied} handleCopy={handleCopy}
                                    error={error} setError={setError}
                                    loading={loading} isDirty={isDirty}
                                    isTablet={isTablet} handleSave={handleSave}
                                />
                            </View>
                        )}
                    </ScrollView>
                </KeyboardAvoidingView>

            </View>
        </View>
    );
}

function InfoPanel({ secretName, isDirty }: { secretName?: string; isDirty: boolean }) {
    const features = [
        { icon: 'pencil-outline' as const, label: 'Edit fields directly in place' },
        { icon: 'save-outline' as const, label: 'Changes saved with encryption' },
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
                <Ionicons name="key-outline" size={34} color="#fff" />
            </View>

            <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 28, fontWeight: '700', color: '#1a1a2e', lineHeight: 34 }}
                    className="dark:text-white">
                    {secretName ? `"${secretName}"` : 'Your secret'}
                </Text>
                <Text style={{ fontSize: 15, color: '#8a93a6', lineHeight: 22 }}>
                    This secret has been decrypted locally. You can view, copy, or edit it below.
                </Text>
            </View>

            {isDirty && (
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                        backgroundColor: 'rgba(74,111,165,0.10)',
                        borderRadius: 14,
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        borderWidth: 1,
                        borderColor: 'rgba(74,111,165,0.20)',
                    }}
                >
                    <Ionicons name="alert-circle-outline" size={18} color="#4a6fa5" />
                    <Text style={{ fontSize: 13, color: '#4a6fa5', fontWeight: '500', flex: 1 }}>
                        You have unsaved changes
                    </Text>
                </View>
            )}

            <View style={{ gap: 16 }}>
                {features.map(({ icon, label }) => (
                    <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                        <View
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: 10,
                                backgroundColor: 'rgba(74,111,165,0.12)',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Ionicons name={icon} size={18} color="#4a6fa5" />
                        </View>
                        <Text style={{ fontSize: 14, color: '#4a5568', fontWeight: '500' }}
                            className="dark:text-gray-300">
                            {label}
                        </Text>
                    </View>
                ))}
            </View>
        </View>
    );
}

function InfoBanner({ secretName, isDirty }: { secretName?: string; isDirty: boolean }) {
    return (
        <View style={{ gap: 10, marginBottom: 20 }}>
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 14,
                    backgroundColor: 'rgba(74,111,165,0.10)',
                    borderRadius: 16,
                    paddingHorizontal: 20,
                    paddingVertical: 16,
                    borderWidth: 1,
                    borderColor: 'rgba(74,111,165,0.15)',
                }}
            >
                <View
                    style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: '#4a6fa5', alignItems: 'center', justifyContent: 'center', }}>
                    <Ionicons name="key-outline" size={22} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#4a6fa5', marginBottom: 2 }}>
                        {secretName ?? 'Secret'}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#8a93a6', lineHeight: 18 }}>
                        Decrypted locally · Edit in place · Saves with encryption
                    </Text>
                </View>
            </View>

            {isDirty && (
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                        backgroundColor: 'rgba(74,111,165,0.08)',
                        borderRadius: 12,
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderWidth: 1,
                        borderColor: 'rgba(74,111,165,0.15)',
                    }}
                >
                    <Ionicons name="alert-circle-outline" size={15} color="#4a6fa5" />
                    <Text style={{ fontSize: 12, color: '#4a6fa5', fontWeight: '500' }}>
                        You have unsaved changes
                    </Text>
                </View>
            )}
        </View>
    );
}

interface FormCardProps {
    name: string; setName: (v: string) => void;
    description: string; setDescription: (v: string) => void;
    decryptedSecret: string; setDecryptedSecret: (v: string) => void;
    secretVisible: boolean; setSecretVisible: (v: (prev: boolean) => boolean) => void;
    copied: boolean; handleCopy: () => void;
    error: string; setError: (v: string) => void;
    loading: boolean; isDirty: boolean;
    isTablet: boolean; handleSave: () => void;
}

function FormCard({
    name, setName,
    description, setDescription,
    decryptedSecret, setDecryptedSecret,
    secretVisible, setSecretVisible,
    copied, handleCopy,
    error, setError,
    loading, isDirty, isTablet,
    handleSave,
}: FormCardProps) {
    const padding = isTablet ? 32 : 20;
    const gap = isTablet ? 20 : 20;

    return (
        <View>
            <View
                style={{
                    // backgroundColor: '#dce1ec',
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
                <FieldGroup label="Name" icon="pencil-outline" isTablet={isTablet}>
                    <TextInput
                        value={name}
                        onChangeText={(t) => { setName(t); setError(''); }}
                        placeholder="Secret name"
                        // placeholderTextColor="#8a93a6"
                        autoCapitalize="none"
                        autoCorrect={false}
                        style={{
                            flex: 1,
                            fontSize: isTablet ? 15 : 14,
                            // color: '#000',
                            paddingVertical: isTablet ? 16 : 14,
                        }}
                        className="text-black dark:text-white p-0 focus:outline-none placeholder:text-gray-500 dark:placeholder:text-gray-400"
                    />
                </FieldGroup>

                <FieldGroup label="Note" icon="document-text-outline" isTablet={isTablet}>
                    <TextInput
                        value={description}
                        onChangeText={(t) => { setDescription(t); setError(''); }}
                        placeholder="Short note about this secret"
                        // placeholderTextColor="#8a93a6"
                        autoCapitalize="none"
                        autoCorrect={false}
                        multiline
                        style={{
                            flex: 1,
                            fontSize: isTablet ? 15 : 14,
                            // color: '#000',
                            paddingVertical: isTablet ? 16 : 14,
                            minHeight: isTablet ? 80 : 56,
                            textAlignVertical: 'top',
                        }}
                        className="text-black dark:text-white p-0 focus:outline-none placeholder:text-gray-500 dark:placeholder:text-gray-400"
                    />
                </FieldGroup>

                <View style={{ gap: 6 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginLeft: 4 }}>
                        <Text
                            style={{ fontSize: 11, fontWeight: '600', color: '#8a93a6', textTransform: 'uppercase', letterSpacing: 1.2, }}>
                            Secret
                        </Text>
                        {isTablet && (
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                <TouchableOpacity
                                    onPress={() => setSecretVisible((v) => !v)}
                                    activeOpacity={0.75}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 5,
                                        backgroundColor: 'rgba(74,111,165,0.10)',
                                        borderRadius: 20,
                                        paddingHorizontal: 12,
                                        paddingVertical: 5,
                                    }}
                                >
                                    <Ionicons
                                        name={secretVisible ? 'eye-off-outline' : 'eye-outline'}
                                        size={13}
                                        color="#4a6fa5"
                                    />
                                    <Text style={{ fontSize: 12, color: '#4a6fa5', fontWeight: '500' }}>
                                        {secretVisible ? 'Hide' : 'Reveal'}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={handleCopy}
                                    activeOpacity={0.75}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 5,
                                        backgroundColor: copied ? 'rgba(74,111,165,0.18)' : 'rgba(74,111,165,0.10)',
                                        borderRadius: 20,
                                        paddingHorizontal: 12,
                                        paddingVertical: 5,
                                    }}
                                >
                                    <Ionicons name={copied ? 'checkmark-done-outline' : 'copy-outline'} size={13} color="#4a6fa5" />
                                    <Text style={{ fontSize: 12, color: '#4a6fa5', fontWeight: '500' }}>
                                        {copied ? 'Copied!' : 'Copy'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
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
                            <Ionicons name="lock-closed-outline" size={moderateScale(16)} color="#8a93a6" />
                        </View>

                        <TextInput
                            value={decryptedSecret}
                            onChangeText={(t) => { setDecryptedSecret(t); setError(''); }}
                            placeholder="Secret value"
                            placeholderTextColor="#8a93a6"
                            autoCapitalize="none"
                            autoCorrect={false}
                            secureTextEntry={!secretVisible}
                            style={{
                                flex: 1,
                                fontSize: isTablet ? 15 : 14,
                                // color: '#000',
                                paddingVertical: isTablet ? 16 : 14,
                                fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                            }}
                            className="text-black dark:text-white p-0 focus:outline-none"
                        />

                        {!isTablet && (
                            <>
                                <TouchableOpacity onPress={() => setSecretVisible((v) => !v)} hitSlop={8} style={{ paddingTop: 16 }}>
                                    <Ionicons name={secretVisible ? 'eye-off-outline' : 'eye-outline'} size={moderateScale(16)} color="#8a93a6" />
                                </TouchableOpacity>

                                <TouchableOpacity onPress={handleCopy} hitSlop={8} style={{ paddingTop: 16 }}>
                                    <Ionicons name={copied ? 'checkmark-done-outline' : 'copy-outline'} size={moderateScale(16)} color={copied ? '#4a6fa5' : '#8a93a6'} />
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>

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

                {isDirty && (
                    <>
                        {isTablet && (
                            <View style={{ height: 1, backgroundColor: 'rgba(74,111,165,0.10)', marginVertical: 2 }} />
                        )}
                        <TouchableOpacity
                            onPress={handleSave}
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
                            <Ionicons name={loading ? 'hourglass-outline' : 'save-outline'} size={isTablet ? 20 : 18} color="#fff" />
                            <Text style={{ fontSize: isTablet ? 15 : 14, fontWeight: '600', color: '#fff', letterSpacing: 0.5 }}>
                                {loading ? 'Saving…' : 'Save Changes'}
                            </Text>
                        </TouchableOpacity>
                    </>
                )}
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
                🔒 Your secret is encrypted and stored securely.
            </Text>
        </View>
    );
}

interface FieldGroupProps {
    label: string;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    isTablet: boolean;
    children: React.ReactNode;
}

function FieldGroup({ label, icon, isTablet, children }: FieldGroupProps) {
    return (
        <View style={{ gap: 6 }}>
            <Text
                style={{ fontSize: 11, fontWeight: '600', color: '#8a93a6', textTransform: 'uppercase', letterSpacing: 1.2, marginLeft: 4, }} >
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
                {children}
            </View>
        </View>
    );
}