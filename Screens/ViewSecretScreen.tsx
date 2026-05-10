import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSecretsApi } from '../api/Secrets/hook';
import { Colors } from '../utils/colors';
import { ToastType } from '../utils/const';
import { moderateScale } from '../utils/Responsive';
import { Utility } from '../utils/Utility';

export default function ViewSecretScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        id?: string;
        name?: string;
        secret?: string;
        description?: string;
    }>();

    const { updateSecret, loading } = useSecretsApi();

    const [name, setName] = useState(params.name ?? '');
    const [description, setDescription] = useState(params.description ?? '');
    const [secret, setSecret] = useState(params.secret ?? '');
    const [secretVisible, setSecretVisible] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');

    const isDirty =
        name !== (params.name ?? '') ||
        description !== (params.description ?? '') ||
        secret !== (params.secret ?? '');

    const handleCopy = async () => {
        await Clipboard.setStringAsync(secret);
        setCopied(true);
        Utility.showToast(ToastType.success, 'Copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSave = async () => {
        if (!name.trim()) { setError('Secret name is required'); return; }
        if (!description.trim()) { setError('Description is required'); return; }
        if (!secret.trim()) { setError('Secret value is required'); return; }
        setError('');
        await updateSecret({ id: params.id!, name, secret, description });
        router.back();
    };

    return (
        <View className="flex-1 bg-[#e8ecf4] dark:bg-black">

            <View className="flex-row items-center justify-between px-5 py-4 bg-[#e8ecf4] dark:bg-black">
                <TouchableOpacity
                    onPress={() => router.back()}
                    activeOpacity={0.8}
                    className="w-11 h-11 rounded-full bg-[#dce1ec] dark:bg-zinc-900 items-center justify-center"
                >
                    <Ionicons name="arrow-back" size={moderateScale(20)} color="#4a6fa5" />
                </TouchableOpacity>

                <Text className="text-[16px] font-semibold text-black dark:text-white">
                    View Secret
                </Text>

                <View className="w-11" />
            </View>

            <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                >
                    <View className="px-5 py-8">
                        <View className="bg-[#dce1ec] dark:bg-zinc-900 rounded-[24px] px-5 py-6 gap-5">

                            <View className="gap-1.5">
                                <Text className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">
                                    Name
                                </Text>
                                <View className="flex-row items-center bg-[#e8ecf4] dark:bg-black rounded-2xl px-4 gap-3">
                                    <Ionicons name="pencil-outline" size={moderateScale(16)} color="#8a93a6" />
                                    <TextInput
                                        value={name}
                                        onChangeText={(t) => { setName(t); setError(''); }}
                                        placeholder="Secret name"
                                        placeholderTextColor="#8a93a6"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        className="flex-1 text-sm text-black dark:text-white py-4 p-0"
                                    />
                                </View>
                            </View>

                            <View className="gap-1.5">
                                <Text className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">
                                    Description
                                </Text>
                                <View className="flex-row items-center bg-[#e8ecf4] dark:bg-black rounded-2xl px-4 gap-3">
                                    <Ionicons name="document-text-outline" size={moderateScale(16)} color="#8a93a6" />
                                    <TextInput
                                        value={description}
                                        onChangeText={(t) => { setDescription(t); setError(''); }}
                                        placeholder="Short description"
                                        placeholderTextColor="#8a93a6"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        className="flex-1 text-sm text-black dark:text-white py-4 p-0"
                                    />
                                </View>
                            </View>

                            <View className="gap-1.5">
                                <Text className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">
                                    Secret
                                </Text>
                                <View className="flex-row items-start bg-[#e8ecf4] dark:bg-black rounded-2xl px-4 gap-3">
                                    <Ionicons name="lock-closed-outline" size={moderateScale(16)} color="#8a93a6" style={{ marginTop: 16 }} />

                                    <TextInput
                                        value={secret}
                                        onChangeText={(t) => { setSecret(t); setError(''); }}
                                        placeholder="Secret value"
                                        placeholderTextColor="#8a93a6"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        secureTextEntry={!secretVisible}
                                        className="flex-1 text-sm text-black dark:text-white py-4 p-0"
                                    />

                                    <TouchableOpacity onPress={() => setSecretVisible((v) => !v)} hitSlop={8} style={{ marginTop: 16 }}>
                                        <Ionicons name={secretVisible ? 'eye-off-outline' : 'eye-outline'} size={moderateScale(16)} color="#8a93a6" />
                                    </TouchableOpacity>

                                    <TouchableOpacity onPress={handleCopy} hitSlop={8} style={{ marginTop: 16 }}>
                                        <Ionicons name={copied ? 'checkmark-done-outline' : 'copy-outline'} size={moderateScale(16)} color={copied ? '#4a6fa5' : '#8a93a6'} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {error ? (
                                <View className="flex-row items-center gap-2 bg-red-100 dark:bg-red-950 rounded-xl px-4 py-3">
                                    <Ionicons name="alert-circle-outline" size={moderateScale(15)} color={Colors.error} />
                                    <Text className="text-xs text-red-600 dark:text-red-400 flex-1">{error}</Text>
                                </View>
                            ) : null}

                            {isDirty && (
                                <TouchableOpacity
                                    onPress={handleSave}
                                    disabled={loading}
                                    activeOpacity={0.85}
                                    className={`rounded-2xl py-4 items-center bg-[#4a6fa5] ${loading ? 'opacity-60' : 'opacity-100'}`}
                                >
                                    <Text className="text-sm font-semibold text-white tracking-wide">
                                        {loading ? 'Saving...' : 'Save Changes'}
                                    </Text>
                                </TouchableOpacity>
                            )}

                        </View>

                        <Text className="text-xs text-gray-400 text-center mt-4 px-6 leading-5">
                            Your secret is encrypted and stored securely.
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}